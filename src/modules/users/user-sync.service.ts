import type { PrismaClient, User } from "@prisma/client";
import type { TelegramInitDataUser } from "@/lib/telegram/init-data";

export interface UserSyncDependencies {
  prisma: PrismaClient;
}

export async function syncTelegramUser(
  { prisma }: UserSyncDependencies,
  telegramUser: TelegramInitDataUser,
): Promise<User> {
  return prisma.user.upsert({
    where: {
      telegramUserId: telegramUser.id,
    },
    update: {
      username: telegramUser.username ?? null,
      firstName: telegramUser.firstName ?? null,
      lastName: telegramUser.lastName ?? null,
      languageCode: telegramUser.languageCode ?? null,
    },
    create: {
      telegramUserId: telegramUser.id,
      username: telegramUser.username ?? null,
      firstName: telegramUser.firstName ?? null,
      lastName: telegramUser.lastName ?? null,
      languageCode: telegramUser.languageCode ?? null,
    },
  });
}
