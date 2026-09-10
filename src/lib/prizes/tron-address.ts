const tronAddressPattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const tronTransactionHashPattern = /^[A-Fa-f0-9]{64}$/;

export function isValidTrc20Address(value: string): boolean {
  return tronAddressPattern.test(value.trim());
}

export function normalizeTrc20Address(value: string): string {
  return value.trim();
}

export function maskWalletAddress(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.length <= 8
    ? value
    : `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function buildTronTransactionUrl(hash: string | null): string | null {
  if (!hash || !tronTransactionHashPattern.test(hash)) {
    return null;
  }

  return `https://tronscan.org/#/transaction/${hash}`;
}
