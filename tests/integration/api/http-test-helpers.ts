import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

export const testTelegramBotToken = "123456:test_bot_token";

export function signTelegramInitData(
  fields: Record<string, string>,
  botToken = testTelegramBotToken,
): string {
  const dataCheckString = Object.entries(fields)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const params = new URLSearchParams(fields);

  params.set("hash", hash);

  return params.toString();
}

export function createApiRequest(
  pathname: string,
  initData: string,
  init: {
    method?: string;
    body?: unknown;
    idempotencyKey?: string;
  } = {},
): NextRequest {
  const headers = new Headers({
    "x-telegram-init-data": initData,
  });

  if (init.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  if (init.idempotencyKey) {
    headers.set("idempotency-key", init.idempotencyKey);
  }

  return new NextRequest(`http://localhost${pathname}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

export async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}
