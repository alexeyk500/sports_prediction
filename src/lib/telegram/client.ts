"use client";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const DEV_INIT_DATA_STORAGE_KEY = "sports_prediction_dev_init_data";

export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const telegramInitData = window.Telegram?.WebApp?.initData;

  if (telegramInitData) {
    return telegramInitData;
  }

  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA ?? window.localStorage.getItem(DEV_INIT_DATA_STORAGE_KEY);
  }

  return null;
}

export function initializeTelegramWebApp(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.Telegram?.WebApp?.ready?.();
  window.Telegram?.WebApp?.expand?.();
}

export { DEV_INIT_DATA_STORAGE_KEY };
