"use client";

import { useCallback, useEffect, useMemo } from "react";
import { ApiClient, ApiClientError } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";

export function useBootstrap() {
  const { locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const {
    bootstrap,
    bootstrapLoadStatus,
    bootstrapLoadError,
    setBootstrap,
    beginBootstrapLoad,
    failBootstrapLoad,
  } = useBootstrapStore();

  const load = useCallback(async () => {
    if (!beginBootstrapLoad()) {
      return;
    }

    try {
      const nextBootstrap = await apiClient.getBootstrap();
      setBootstrap(nextBootstrap);
    } catch (error: unknown) {
      logBootstrapLoadError(error);
      failBootstrapLoad(error);
    }
  }, [apiClient, beginBootstrapLoad, failBootstrapLoad, setBootstrap]);

  useEffect(() => {
    if (bootstrap || bootstrapLoadStatus !== "idle") {
      return;
    }

    void load();
  }, [bootstrap, bootstrapLoadStatus, load]);

  const errorMessage = useMemo(() => {
    if (!bootstrapLoadError) {
      return null;
    }

    return messageForApiError(bootstrapLoadError, locale);
  }, [bootstrapLoadError, locale]);

  return {
    bootstrap,
    isLoading: !bootstrap && bootstrapLoadStatus === "loading",
    errorMessage,
    apiClient,
  };
}

function logBootstrapLoadError(error: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error instanceof ApiClientError) {
    console.error("Bootstrap load failed", {
      endpoint: error.endpoint,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error(
    "Bootstrap load failed",
    error instanceof Error ? error.message : error,
  );
}
