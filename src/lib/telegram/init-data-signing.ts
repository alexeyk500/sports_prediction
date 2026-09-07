import { createHmac } from "node:crypto";

export type TelegramInitDataFieldMap = Record<string, string>;

export function serializeTelegramInitDataFields(
  fields: TelegramInitDataFieldMap,
): string {
  return serializeTelegramInitDataEntries(Object.entries(fields));
}

export function serializeTelegramInitDataEntries(
  entries: Array<[string, string]>,
): string {
  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function createTelegramInitDataHash(
  fields: TelegramInitDataFieldMap,
  botToken: string,
): string {
  return createTelegramInitDataHashFromEntries(
    Object.entries(fields),
    botToken,
  );
}

export function createTelegramInitDataHashFromEntries(
  entries: Array<[string, string]>,
  botToken: string,
): string {
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  return createHmac("sha256", secretKey)
    .update(serializeTelegramInitDataEntries(entries))
    .digest("hex");
}

export function signTelegramInitData(
  fields: TelegramInitDataFieldMap,
  botToken: string,
): string {
  const params = new URLSearchParams(fields);

  params.set("hash", createTelegramInitDataHash(fields, botToken));

  return params.toString();
}
