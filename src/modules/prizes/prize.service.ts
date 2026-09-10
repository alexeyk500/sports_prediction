import { Prisma, type PrismaClient } from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  buildTronTransactionUrl,
  isValidTrc20Address,
  maskWalletAddress,
  normalizeTrc20Address,
} from "@/lib/prizes/tron-address";
import type { Clock } from "@/lib/time/clock";

export type PrizePayoutStatus =
  "READY_TO_CLAIM" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "PAID" | "REJECTED";

export interface PrizePayoutCardDto {
  entitlementId: string;
  claimId: string | null;
  cupId: string;
  cupNumber: number;
  finalPlacement: number;
  amount: string;
  asset: "USDT";
  network: "TRC20";
  status: PrizePayoutStatus;
  walletAddress: string | null;
  maskedWalletAddress: string | null;
  transactionHash: string | null;
  transactionUrl: string | null;
  actionRequiredMessage: string | null;
  rejectionReason: string | null;
  settledAt: string;
  claimedAt: string | null;
  paidAt: string | null;
  updatedAt: string;
}

export interface PrizePayoutSummaryDto {
  totalWon: string;
  pending: string;
  paid: string;
  asset: "USDT";
}

export interface PrizePayoutsDto {
  summary: PrizePayoutSummaryDto;
  items: PrizePayoutCardDto[];
}

export interface PrizeServiceDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

export type PrizeTransactionClient = Pick<
  Prisma.TransactionClient,
  | "prizeDistributionTier"
  | "tournamentParticipant"
  | "prizeEntitlement"
  | "prizeClaim"
  | "prizeWalletRevision"
  | "$queryRaw"
>;

const STATUS_ORDER: Record<PrizePayoutStatus, number> = {
  ACTION_REQUIRED: 0,
  READY_TO_CLAIM: 1,
  UNDER_REVIEW: 2,
  PAID: 3,
  REJECTED: 4,
};

export async function generatePrizeEntitlementsForFinalSettlement(
  dependencies: PrizeServiceDependencies,
  tournamentId: string,
): Promise<{ created: number }> {
  const now = dependencies.clock.now();

  return dependencies.prisma.$transaction((tx) =>
    createPrizeEntitlementsFromFinalRanks(tx, tournamentId, now),
  );
}

export async function createPrizeEntitlementsFromFinalRanks(
  tx: PrizeTransactionClient,
  tournamentId: string,
  settledAt: Date,
): Promise<{ created: number }> {
  const tiers = await tx.prizeDistributionTier.findMany({
    where: { tournamentId },
    orderBy: { sortOrder: "asc" },
  });

  if (tiers.length === 0) {
    return { created: 0 };
  }

  const maxRank = Math.max(...tiers.map((tier) => tier.toRank));
  const participants = await tx.tournamentParticipant.findMany({
    where: {
      tournamentId,
      finalRank: {
        not: null,
        lte: maxRank,
      },
    },
    select: {
      userId: true,
      finalRank: true,
    },
    orderBy: [{ finalRank: "asc" }, { id: "asc" }],
  });
  let created = 0;

  for (const participant of participants) {
    const finalRank = participant.finalRank;

    if (!finalRank) {
      continue;
    }

    const tier = tiers.find(
      (candidate) =>
        candidate.fromRank <= finalRank && candidate.toRank >= finalRank,
    );

    if (!tier) {
      continue;
    }

    const result = await tx.prizeEntitlement.createMany({
      data: [
        {
          tournamentId,
          userId: participant.userId,
          finalPlacement: finalRank,
          amount: tier.amount,
          asset: "USDT",
          network: "TRC20",
          settledAt,
        },
      ],
      skipDuplicates: true,
    });

    created += result.count;
  }

  return { created };
}

export async function getCurrentUserPrizePayouts(
  dependencies: Pick<PrizeServiceDependencies, "prisma">,
  userId: string,
): Promise<PrizePayoutsDto> {
  const entitlements = await dependencies.prisma.prizeEntitlement.findMany({
    where: { userId },
    include: {
      tournament: {
        select: { id: true, number: true },
      },
      claim: true,
    },
  });
  const items = entitlements.map(toPrizePayoutCardDto).sort(comparePrizeCards);
  const summary = calculateSummary(items);

  return {
    summary,
    items,
  };
}

export async function submitPrizeClaim(
  dependencies: PrizeServiceDependencies,
  input: {
    userId: string;
    entitlementId: string;
    walletAddress: string;
  },
): Promise<PrizePayoutCardDto> {
  const walletAddress = normalizeAndValidateAddress(input.walletAddress);
  const now = dependencies.clock.now();

  return dependencies.prisma.$transaction(
    async (tx) => {
      await lockEntitlement(tx, input.entitlementId);
      const entitlement = await tx.prizeEntitlement.findFirst({
        where: {
          id: input.entitlementId,
          userId: input.userId,
        },
        include: {
          tournament: {
            select: { id: true, number: true },
          },
          claim: true,
        },
      });

      if (!entitlement) {
        throw new DomainError(
          "PRIZE_ENTITLEMENT_NOT_FOUND",
          "Prize entitlement not found.",
        );
      }

      if (!entitlement.claim) {
        await tx.prizeClaim.create({
          data: {
            entitlementId: entitlement.id,
            userId: input.userId,
            walletAddress,
            status: "UNDER_REVIEW",
            claimedAt: now,
          },
        });

        return requirePrizeCard(tx, input.userId, entitlement.id);
      }

      if (entitlement.claim.status !== "ACTION_REQUIRED") {
        throw new DomainError(
          entitlement.claim.status === "UNDER_REVIEW"
            ? "PRIZE_CLAIM_ALREADY_EXISTS"
            : "PRIZE_CLAIM_READ_ONLY",
          "Prize claim cannot be updated in its current state.",
        );
      }

      await tx.prizeWalletRevision.create({
        data: {
          claimId: entitlement.claim.id,
          userId: input.userId,
          previousWalletAddress: entitlement.claim.walletAddress,
          nextWalletAddress: walletAddress,
        },
      });
      await tx.prizeClaim.update({
        where: { id: entitlement.claim.id },
        data: {
          walletAddress,
          status: "UNDER_REVIEW",
          actionRequiredMessage: null,
        },
      });

      return requirePrizeCard(tx, input.userId, entitlement.id);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}

function normalizeAndValidateAddress(value: string): string {
  const normalized = normalizeTrc20Address(value);

  if (!isValidTrc20Address(normalized)) {
    throw new DomainError(
      "INVALID_TRC20_ADDRESS",
      "TRON TRC-20 address format is invalid.",
    );
  }

  return normalized;
}

async function lockEntitlement(
  tx: Pick<Prisma.TransactionClient, "$queryRaw">,
  entitlementId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT id FROM "PrizeEntitlement"
    WHERE id = ${entitlementId}::uuid
    FOR UPDATE
  `;
}

async function requirePrizeCard(
  tx: PrizeTransactionClient,
  userId: string,
  entitlementId: string,
): Promise<PrizePayoutCardDto> {
  const entitlement = await tx.prizeEntitlement.findFirstOrThrow({
    where: { id: entitlementId, userId },
    include: {
      tournament: { select: { id: true, number: true } },
      claim: true,
    },
  });

  return toPrizePayoutCardDto(entitlement);
}

function toPrizePayoutCardDto(
  entitlement: Prisma.PrizeEntitlementGetPayload<{
    include: {
      tournament: { select: { id: true; number: true } };
      claim: true;
    };
  }>,
): PrizePayoutCardDto {
  const claim = entitlement.claim;
  const status = claim?.status ?? "READY_TO_CLAIM";
  const walletAddress = claim?.walletAddress ?? null;
  const updatedAt = claim?.updatedAt ?? entitlement.createdAt;

  return {
    entitlementId: entitlement.id,
    claimId: claim?.id ?? null,
    cupId: entitlement.tournament.id,
    cupNumber: entitlement.tournament.number,
    finalPlacement: entitlement.finalPlacement,
    amount: entitlement.amount.toString(),
    asset: "USDT",
    network: "TRC20",
    status,
    walletAddress,
    maskedWalletAddress: maskWalletAddress(walletAddress),
    transactionHash: claim?.transactionHash ?? null,
    transactionUrl: buildTronTransactionUrl(claim?.transactionHash ?? null),
    actionRequiredMessage: claim?.actionRequiredMessage ?? null,
    rejectionReason: claim?.rejectionReason ?? null,
    settledAt: entitlement.settledAt.toISOString(),
    claimedAt: claim?.claimedAt.toISOString() ?? null,
    paidAt: claim?.paidAt?.toISOString() ?? null,
    updatedAt: updatedAt.toISOString(),
  };
}

function calculateSummary(items: PrizePayoutCardDto[]): PrizePayoutSummaryDto {
  const initial = new Prisma.Decimal(0);
  const pending = items
    .filter((item) =>
      ["READY_TO_CLAIM", "UNDER_REVIEW", "ACTION_REQUIRED"].includes(
        item.status,
      ),
    )
    .reduce((sum, item) => sum.plus(item.amount), initial);
  const paid = items
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum.plus(item.amount), initial);

  return {
    totalWon: pending.plus(paid).toString(),
    pending: pending.toString(),
    paid: paid.toString(),
    asset: "USDT",
  };
}

function comparePrizeCards(
  left: PrizePayoutCardDto,
  right: PrizePayoutCardDto,
): number {
  const statusDelta = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];

  if (statusDelta !== 0) {
    return statusDelta;
  }

  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}
