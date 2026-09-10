export interface ISupportDestination {
  username: string | null;
  displayUsername: string | null;
  telegramUrl: string | null;
}

const telegramUsernamePattern = /^[a-zA-Z0-9_]{5,32}$/;

export function buildSupportDestination(
  configuredUsername: string | null | undefined,
): ISupportDestination {
  const normalizedUsername =
    configuredUsername?.trim().replace(/^@+/, "") ?? "";

  if (!telegramUsernamePattern.test(normalizedUsername)) {
    return {
      username: null,
      displayUsername: null,
      telegramUrl: null,
    };
  }

  return {
    username: normalizedUsername,
    displayUsername: `@${normalizedUsername}`,
    telegramUrl: `https://t.me/${normalizedUsername}`,
  };
}

export const supportDestination = buildSupportDestination(
  process.env.NEXT_PUBLIC_GOALSTERY_SUPPORT_USERNAME,
);
