import { describe, expect, it } from "vitest";
import {
  calculatePrizePool,
  findPrizeTierForRank,
  formatPrizeAmount,
  getMaxRewardedRank,
  getOtherPrizeTiers,
} from "@/components/CupScreen/prize-format";

const seededDistribution = [
  { fromRank: 1, toRank: 1, amount: "3" },
  { fromRank: 2, toRank: 2, amount: "2" },
  { fromRank: 3, toRank: 3, amount: "1" },
  { fromRank: 4, toRank: 10, amount: "0.5" },
  { fromRank: 11, toRank: 20, amount: "0.1" },
];

describe("Cup prize distribution", () => {
  it("calculates the seeded pool with decimal-safe arithmetic", () => {
    expect(calculatePrizePool(seededDistribution)).toBe("10.5");
  });

  it("finds the maximum rewarded rank", () => {
    expect(getMaxRewardedRank(seededDistribution)).toBe(20);
    expect(getMaxRewardedRank([])).toBeNull();
  });

  it("maps podium ranks independently of API order", () => {
    const reversed = [...seededDistribution].reverse();

    expect(findPrizeTierForRank(reversed, 1)?.amount).toBe("3");
    expect(findPrizeTierForRank(reversed, 2)?.amount).toBe("2");
    expect(findPrizeTierForRank(reversed, 3)?.amount).toBe("1");
  });

  it("preserves ordinary tier order", () => {
    expect(
      getOtherPrizeTiers(seededDistribution).map((tier) => tier.fromRank),
    ).toEqual([4, 11]);
  });

  it("formats decimal amounts without insignificant zeroes", () => {
    expect(formatPrizeAmount("3.0000", "USDT")).toBe("3 USDT");
    expect(formatPrizeAmount("0.1000", "USDT")).toBe("0.1 USDT");
  });
});
