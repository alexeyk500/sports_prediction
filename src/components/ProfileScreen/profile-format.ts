import type { BootstrapResponse } from "@/lib/api/types";

type ProfileUser = BootstrapResponse["user"];
type ProfileFallbackTranslator = (
  key: "common.userFallback",
  values: { id: string },
) => string;

export function formatProfileDisplayName(
  user: ProfileUser,
  t: ProfileFallbackTranslator,
): string {
  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  if (user.username) {
    return user.username;
  }

  return t("common.userFallback", { id: user.telegramUserId });
}

export function formatTelegramUsername(username: string | null): string | null {
  if (!username) {
    return null;
  }

  return username.startsWith("@") ? username : `@${username}`;
}

export function initialsForProfileName(name: string): string {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "G";
}
