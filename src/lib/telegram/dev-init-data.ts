import { signTelegramInitData } from "./init-data-signing";

export const DEV_TELEGRAM_USER = {
  id: 900000001,
  first_name: "Dev",
  last_name: "User",
  username: "dev_user",
  language_code: "en",
} as const;

export interface GenerateTelegramDevInitDataOptions {
  botToken: string;
  now: Date;
  queryId?: string;
}

export interface GeneratedTelegramDevInitData {
  initData: string;
  authDate: number;
  user: typeof DEV_TELEGRAM_USER;
  generatedAt: string;
}

export function assertTelegramDevInitDataCanRun(nodeEnv: string | undefined): void {
  if (nodeEnv === "production") {
    throw new Error("Refusing to generate Telegram development initData with NODE_ENV=production.");
  }
}

export function generateTelegramDevInitData(
  options: GenerateTelegramDevInitDataOptions,
): GeneratedTelegramDevInitData {
  if (!options.botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is required to generate development initData.");
  }

  if (Number.isNaN(options.now.getTime())) {
    throw new Error("A valid current time is required to generate development initData.");
  }

  const authDate = Math.floor(options.now.getTime() / 1000);
  const user = DEV_TELEGRAM_USER;
  const initData = signTelegramInitData(
    {
      auth_date: String(authDate),
      query_id: options.queryId ?? `dev-${authDate}`,
      user: JSON.stringify(user),
    },
    options.botToken,
  );

  return {
    initData,
    authDate,
    user,
    generatedAt: options.now.toISOString(),
  };
}
