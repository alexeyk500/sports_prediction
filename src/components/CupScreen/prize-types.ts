export type PrizeCurrency = "USDT" | "TON";

export interface PrizeDistributionTier {
  fromRank: number;
  toRank: number;
  amount: string;
}
