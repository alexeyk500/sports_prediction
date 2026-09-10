import { afterAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { FixedClock } from "@/lib/time/clock";
import {
  generatePrizeEntitlementsForFinalSettlement,
  getCurrentUserPrizePayouts,
  submitPrizeClaim,
} from "@/modules/prizes/prize.service";
import { finalizeTournamentSettlement } from "@/modules/tournaments/tournament.service";
import { createTestPrismaClient } from "../helpers/prisma-test-client";
import { createTestUser, uniqueTournamentNumber } from "../helpers/factories";

const prisma = createTestPrismaClient();
const clock = new FixedClock("2026-09-10T10:00:00.000Z");
const validWallet = `T${"A".repeat(33)}`;
const secondValidWallet = `T${"B".repeat(33)}`;

describe("prize payouts service", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("generates USDT TRC-20 entitlements from final ranks and existing distribution idempotently", async () => {
    const tournament = await createFinishedTournament();
    const first = await createTestUser(prisma);
    const second = await createTestUser(prisma);
    const third = await createTestUser(prisma);

    await prisma.prizeDistributionTier.createMany({
      data: [
        {
          tournamentId: tournament.id,
          sortOrder: 1,
          fromRank: 1,
          toRank: 1,
          amount: "100.12345678",
        },
        {
          tournamentId: tournament.id,
          sortOrder: 2,
          fromRank: 2,
          toRank: 2,
          amount: "50",
        },
      ],
    });
    await prisma.tournamentParticipant.createMany({
      data: [
        { tournamentId: tournament.id, userId: first.id, finalRank: 1 },
        { tournamentId: tournament.id, userId: second.id, finalRank: 2 },
        { tournamentId: tournament.id, userId: third.id, finalRank: 3 },
      ],
    });

    await expect(
      generatePrizeEntitlementsForFinalSettlement(
        { prisma, clock },
        tournament.id,
      ),
    ).resolves.toEqual({ created: 2 });
    await expect(
      generatePrizeEntitlementsForFinalSettlement(
        { prisma, clock },
        tournament.id,
      ),
    ).resolves.toEqual({ created: 0 });

    const entitlements = await prisma.prizeEntitlement.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { finalPlacement: "asc" },
    });

    expect(entitlements).toHaveLength(2);
    expect(entitlements[0]).toMatchObject({
      userId: first.id,
      finalPlacement: 1,
      asset: "USDT",
      network: "TRC20",
    });
    expect(entitlements[0].amount.toString()).toBe("100.12345678");
    expect(entitlements[1]).toMatchObject({
      userId: second.id,
      finalPlacement: 2,
    });
  });

  it("finalizes tournament ranks and hooks entitlement generation into settlement finalization", async () => {
    const tournament = await prisma.tournament.create({
      data: {
        number: uniqueTournamentNumber(),
        status: "FINALIZING",
        startsAt: new Date("2026-09-01T00:00:00.000Z"),
        endsAt: new Date("2026-09-08T00:00:00.000Z"),
        prizePoolNanoTon: 0n,
        prizeCurrency: "USDT",
      },
    });
    const first = await createTestUser(prisma);
    const second = await createTestUser(prisma);
    const third = await createTestUser(prisma);

    await prisma.prizeDistributionTier.createMany({
      data: [
        {
          tournamentId: tournament.id,
          sortOrder: 1,
          fromRank: 1,
          toRank: 2,
          amount: "7.5",
        },
      ],
    });
    await prisma.tournamentParticipant.createMany({
      data: [
        {
          tournamentId: tournament.id,
          userId: second.id,
          tournamentPoints: 20,
        },
        { tournamentId: tournament.id, userId: first.id, tournamentPoints: 30 },
        { tournamentId: tournament.id, userId: third.id, tournamentPoints: 10 },
      ],
    });

    await expect(
      finalizeTournamentSettlement({ prisma, clock }, tournament.id),
    ).resolves.toEqual({
      tournamentId: tournament.id,
      prizeEntitlementsCreated: 2,
    });
    await expect(
      finalizeTournamentSettlement({ prisma, clock }, tournament.id),
    ).resolves.toEqual({
      tournamentId: tournament.id,
      prizeEntitlementsCreated: 0,
    });

    await expect(
      prisma.tournament.findUniqueOrThrow({ where: { id: tournament.id } }),
    ).resolves.toMatchObject({ status: "FINISHED" });

    const entitlements = await prisma.prizeEntitlement.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { finalPlacement: "asc" },
    });

    expect(entitlements.map((entitlement) => entitlement.userId)).toEqual([
      first.id,
      second.id,
    ]);
  });

  it("submits only owned ready claims, blocks duplicates, and preserves address history on action required update", async () => {
    const owner = await createTestUser(prisma);
    const other = await createTestUser(prisma);
    const entitlement = await createEntitlement(owner.id, "25");

    await expect(
      submitPrizeClaim(
        { prisma, clock },
        {
          userId: other.id,
          entitlementId: entitlement.id,
          walletAddress: validWallet,
        },
      ),
    ).rejects.toMatchObject({ code: "PRIZE_ENTITLEMENT_NOT_FOUND" });

    await expect(
      submitPrizeClaim(
        { prisma, clock },
        {
          userId: owner.id,
          entitlementId: entitlement.id,
          walletAddress: "bad",
        },
      ),
    ).rejects.toMatchObject({ code: "INVALID_TRC20_ADDRESS" });

    const submitted = await submitPrizeClaim(
      { prisma, clock },
      {
        userId: owner.id,
        entitlementId: entitlement.id,
        walletAddress: validWallet,
      },
    );

    expect(submitted).toMatchObject({
      status: "UNDER_REVIEW",
      amount: "25",
      asset: "USDT",
      network: "TRC20",
      walletAddress: validWallet,
      maskedWalletAddress: "TAAA...AAAA",
    });

    await expect(
      submitPrizeClaim(
        { prisma, clock },
        {
          userId: owner.id,
          entitlementId: entitlement.id,
          walletAddress: validWallet,
        },
      ),
    ).rejects.toMatchObject({ code: "PRIZE_CLAIM_ALREADY_EXISTS" });

    await prisma.prizeClaim.update({
      where: { id: submitted.claimId ?? "" },
      data: {
        status: "ACTION_REQUIRED",
        actionRequiredMessage: "Use a TRC-20 address.",
      },
    });

    const updated = await submitPrizeClaim(
      { prisma, clock },
      {
        userId: owner.id,
        entitlementId: entitlement.id,
        walletAddress: secondValidWallet,
      },
    );

    expect(updated.status).toBe("UNDER_REVIEW");
    expect(updated.walletAddress).toBe(secondValidWallet);
    expect(await prisma.prizeWalletRevision.count()).toBeGreaterThanOrEqual(1);
    await expect(
      prisma.prizeWalletRevision.findFirstOrThrow({
        where: { claimId: submitted.claimId ?? "" },
      }),
    ).resolves.toMatchObject({
      previousWalletAddress: validWallet,
      nextWalletAddress: secondValidWallet,
    });
  });

  it("prevents racing duplicate claim submissions for the same entitlement", async () => {
    const owner = await createTestUser(prisma);
    const entitlement = await createEntitlement(owner.id, "15");
    const submissions = await Promise.allSettled([
      submitPrizeClaim(
        { prisma, clock },
        {
          userId: owner.id,
          entitlementId: entitlement.id,
          walletAddress: validWallet,
        },
      ),
      submitPrizeClaim(
        { prisma, clock },
        {
          userId: owner.id,
          entitlementId: entitlement.id,
          walletAddress: validWallet,
        },
      ),
    ]);

    expect(
      submissions.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      await prisma.prizeClaim.count({
        where: { entitlementId: entitlement.id },
      }),
    ).toBe(1);
  });

  it("calculates summary and sort order while excluding rejected prizes", async () => {
    const user = await createTestUser(prisma);
    const ready = await createEntitlement(user.id, "10");
    const review = await createEntitlement(user.id, "20");
    const paid = await createEntitlement(user.id, "30");
    const rejected = await createEntitlement(user.id, "40");

    await prisma.prizeClaim.createMany({
      data: [
        {
          entitlementId: review.id,
          userId: user.id,
          walletAddress: validWallet,
          status: "UNDER_REVIEW",
          claimedAt: new Date("2026-09-10T09:00:00.000Z"),
        },
        {
          entitlementId: paid.id,
          userId: user.id,
          walletAddress: validWallet,
          status: "PAID",
          claimedAt: new Date("2026-09-10T08:00:00.000Z"),
          paidAt: new Date("2026-09-10T09:00:00.000Z"),
          transactionHash: "a".repeat(64),
        },
        {
          entitlementId: rejected.id,
          userId: user.id,
          walletAddress: validWallet,
          status: "REJECTED",
          claimedAt: new Date("2026-09-10T07:00:00.000Z"),
          rejectionReason: "Not eligible.",
        },
      ],
    });

    const payouts = await getCurrentUserPrizePayouts({ prisma }, user.id);

    expect(payouts.summary).toEqual({
      totalWon: "60",
      pending: "30",
      paid: "30",
      asset: "USDT",
    });
    expect(payouts.items.map((item) => item.entitlementId)).toEqual([
      ready.id,
      review.id,
      paid.id,
      rejected.id,
    ]);
    expect(
      payouts.items.find((item) => item.entitlementId === paid.id)
        ?.transactionUrl,
    ).toBe(`https://tronscan.org/#/transaction/${"a".repeat(64)}`);
  });

  it("enforces database invariants for manual admin payout states", async () => {
    const user = await createTestUser(prisma);
    const actionRequired = await createEntitlement(user.id, "1");
    const rejected = await createEntitlement(user.id, "2");
    const paid = await createEntitlement(user.id, "3");

    await expect(
      prisma.prizeClaim.create({
        data: {
          entitlementId: actionRequired.id,
          userId: user.id,
          walletAddress: validWallet,
          status: "ACTION_REQUIRED",
          claimedAt: new Date("2026-09-10T07:00:00.000Z"),
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.prizeClaim.create({
        data: {
          entitlementId: rejected.id,
          userId: user.id,
          walletAddress: validWallet,
          status: "REJECTED",
          claimedAt: new Date("2026-09-10T07:00:00.000Z"),
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.prizeClaim.create({
        data: {
          entitlementId: paid.id,
          userId: user.id,
          walletAddress: validWallet,
          status: "PAID",
          claimedAt: new Date("2026-09-10T07:00:00.000Z"),
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.prizeClaim.create({
        data: {
          entitlementId: paid.id,
          userId: user.id,
          walletAddress: validWallet,
          status: "PAID",
          claimedAt: new Date("2026-09-10T07:00:00.000Z"),
          paidAt: new Date("2026-09-10T08:00:00.000Z"),
        },
      }),
    ).resolves.toMatchObject({ status: "PAID", transactionHash: null });
  });
});

async function createFinishedTournament() {
  return prisma.tournament.create({
    data: {
      number: uniqueTournamentNumber(),
      status: "FINISHED",
      startsAt: new Date("2026-09-01T00:00:00.000Z"),
      endsAt: new Date("2026-09-08T00:00:00.000Z"),
      prizePoolNanoTon: 0n,
      prizeCurrency: "USDT",
    },
  });
}

async function createEntitlement(userId: string, amount: string) {
  const tournament = await createFinishedTournament();

  return prisma.prizeEntitlement.create({
    data: {
      tournamentId: tournament.id,
      userId,
      finalPlacement: 1,
      amount: new Prisma.Decimal(amount),
      asset: "USDT",
      network: "TRC20",
      settledAt: new Date("2026-09-10T10:00:00.000Z"),
    },
  });
}
