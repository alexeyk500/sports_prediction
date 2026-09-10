import { describe, expect, it } from "vitest";
import {
  buildTronTransactionUrl,
  isValidTrc20Address,
  maskWalletAddress,
} from "@/lib/prizes/tron-address";

describe("TRON address helpers", () => {
  it("validates TRC-20 address format without on-chain calls", () => {
    expect(isValidTrc20Address(`T${"A".repeat(33)}`)).toBe(true);
    expect(isValidTrc20Address(`0${"A".repeat(33)}`)).toBe(false);
    expect(isValidTrc20Address(`T${"A".repeat(32)}0`)).toBe(false);
  });

  it("masks wallets and exposes only safe transaction urls", () => {
    expect(maskWalletAddress(`TQ8f${"A".repeat(26)}X92k`)).toBe("TQ8f...X92k");
    expect(buildTronTransactionUrl("a".repeat(64))).toBe(
      `https://tronscan.org/#/transaction/${"a".repeat(64)}`,
    );
    expect(buildTronTransactionUrl("not-a-hash")).toBeNull();
  });
});
