"use client";

import createAdHandler from "monetag-tg-sdk";
import type { MonetagRewardSessionDto } from "@/lib/api/types";

interface MonetagAdHandlerOptions {
  type?: "preload";
  timeout?: number;
  ymid: string;
  requestVar: string;
}

type MonetagAdHandler = (
  options?: string | MonetagAdHandlerOptions | Record<string, unknown>,
) => Promise<void>;

const handlersByZone = new Map<string, MonetagAdHandler>();

export async function preloadMonetagRewardedInterstitial(
  session: MonetagRewardSessionDto,
): Promise<void> {
  const handler = getAdHandler(session.zoneId);

  await handler({
    type: "preload",
    timeout: 5,
    ymid: session.ymid,
    requestVar: session.requestVar,
  });
}

export async function showMonetagRewardedInterstitial(
  session: MonetagRewardSessionDto,
): Promise<void> {
  const handler = getAdHandler(session.zoneId);

  await handler({
    ymid: session.ymid,
    requestVar: session.requestVar,
  });
}

function getAdHandler(zoneId: string): MonetagAdHandler {
  const existing = handlersByZone.get(zoneId);

  if (existing) {
    return existing;
  }

  const parsedZoneId = Number(zoneId);

  if (!Number.isInteger(parsedZoneId) || parsedZoneId <= 0) {
    throw new Error("Monetag rewarded interstitial zone is invalid.");
  }

  const handler = createAdHandler(parsedZoneId) as unknown as MonetagAdHandler;

  handlersByZone.set(zoneId, handler);

  return handler;
}
