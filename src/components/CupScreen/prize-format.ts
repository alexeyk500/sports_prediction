import type { PrizeDistributionTier } from "./prize-types";

interface DecimalParts {
  units: bigint;
  scale: number;
}

export function calculatePrizePool(
  distribution: readonly PrizeDistributionTier[],
): string {
  const total = distribution.reduce<DecimalParts>(
    (sum, tier) =>
      addDecimals(
        sum,
        multiplyDecimal(
          parseDecimal(tier.amount),
          BigInt(tier.toRank - tier.fromRank + 1),
        ),
      ),
    { units: 0n, scale: 0 },
  );

  return formatDecimal(total);
}

export function getMaxRewardedRank(
  distribution: readonly PrizeDistributionTier[],
): number | null {
  if (distribution.length === 0) {
    return null;
  }

  return distribution.reduce(
    (maxRank, tier) => Math.max(maxRank, tier.toRank),
    distribution[0].toRank,
  );
}

export function findPrizeTierForRank(
  distribution: readonly PrizeDistributionTier[],
  rank: number,
): PrizeDistributionTier | undefined {
  return distribution.find(
    (tier) => tier.fromRank <= rank && tier.toRank >= rank,
  );
}

export function getOtherPrizeTiers(
  distribution: readonly PrizeDistributionTier[],
): PrizeDistributionTier[] {
  const podiumTiers = [1, 2, 3].map((rank) =>
    findPrizeTierForRank(distribution, rank),
  );

  return distribution.filter((tier) => !podiumTiers.includes(tier));
}

export function formatPrizeAmount(amount: string, currency: string): string {
  return formatDecimal(parseDecimal(amount)) + " " + currency;
}

export function formatPrizeRange(
  tier: PrizeDistributionTier,
  format: (key: "single" | "range", values: Record<string, number>) => string,
): string {
  if (tier.fromRank === tier.toRank) {
    return format("single", { rank: tier.fromRank });
  }

  return format("range", {
    fromRank: tier.fromRank,
    toRank: tier.toRank,
  });
}

function parseDecimal(value: string): DecimalParts {
  const normalized = value.trim();
  const sign = normalized.startsWith("-") ? -1n : 1n;
  const unsigned = normalized.replace(/^[+-]/, "");
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const fraction = fractionPart.replace(/0+$/, "");

  return {
    units: sign * BigInt((integerPart || "0") + (fraction || "")),
    scale: fraction.length,
  };
}

function multiplyDecimal(
  value: DecimalParts,
  multiplier: bigint,
): DecimalParts {
  return { units: value.units * multiplier, scale: value.scale };
}

function addDecimals(left: DecimalParts, right: DecimalParts): DecimalParts {
  const scale = Math.max(left.scale, right.scale);

  return {
    units:
      left.units * 10n ** BigInt(scale - left.scale) +
      right.units * 10n ** BigInt(scale - right.scale),
    scale,
  };
}

function formatDecimal(value: DecimalParts): string {
  if (value.units === 0n) {
    return "0";
  }

  const sign = value.units < 0n ? "-" : "";
  const absolute = value.units < 0n ? -value.units : value.units;

  if (value.scale === 0) {
    return sign + absolute.toString();
  }

  const digits = absolute.toString().padStart(value.scale + 1, "0");
  const integerPart = digits.slice(0, -value.scale) || "0";
  const fractionPart = digits.slice(-value.scale).replace(/0+$/, "");

  return sign + integerPart + (fractionPart ? "." + fractionPart : "");
}
