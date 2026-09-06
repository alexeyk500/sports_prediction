import type { PrismaClient, UserAppearance, UserLocale } from "@prisma/client";

export interface UserSettingsDto {
  locale: UserLocale;
  appearance: UserAppearance;
}

export interface SettingsDependencies {
  prisma: PrismaClient;
}

export interface UpdateUserSettingsInput {
  userId: string;
  locale?: UserLocale;
  appearance?: UserAppearance;
}

export async function getUserSettings(
  dependencies: SettingsDependencies,
  userId: string,
): Promise<UserSettingsDto> {
  const user = await dependencies.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      locale: true,
      appearance: true,
    },
  });

  return {
    locale: user.locale,
    appearance: user.appearance,
  };
}

export async function updateUserSettings(
  dependencies: SettingsDependencies,
  input: UpdateUserSettingsInput,
): Promise<UserSettingsDto> {
  const user = await dependencies.prisma.user.update({
    where: { id: input.userId },
    data: {
      ...(input.locale === undefined ? {} : { locale: input.locale }),
      ...(input.appearance === undefined ? {} : { appearance: input.appearance }),
    },
    select: {
      locale: true,
      appearance: true,
    },
  });

  return {
    locale: user.locale,
    appearance: user.appearance,
  };
}
