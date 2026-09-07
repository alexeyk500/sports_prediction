import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/lib/errors/domain-error";
import { TelegramAuthError } from "@/lib/telegram/init-data";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

export function toApiErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof DomainError) {
    return jsonError(
      error.code,
      error.message,
      statusForDomainError(error.code),
      error.details,
    );
  }

  if (error instanceof TelegramAuthError) {
    return jsonError(error.code, error.message, 401, error.details);
  }

  if (error instanceof ZodError) {
    return jsonError("VALIDATION_ERROR", "Request validation failed.", 400, {
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
  }

  if (error instanceof SyntaxError) {
    return jsonError("VALIDATION_ERROR", "Request body is malformed.", 400);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return jsonError("DATABASE_ERROR", "Database operation failed.", 500);
  }

  console.error("Unexpected API error", error);

  return jsonError("INTERNAL_SERVER_ERROR", "Internal server error.", 500);
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details: Record<string, unknown> = {},
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function statusForDomainError(code: string): number {
  switch (code) {
    case "FIXTURE_NOT_FOUND":
    case "PREDICTION_NOT_FOUND":
      return 404;
    case "PREDICTION_ALREADY_EXISTS":
    case "IDEMPOTENCY_CONFLICT":
      return 409;
    case "PREDICTION_LOCKED":
      return 423;
    case "FREE_PREDICTION_LIMIT_REACHED":
    case "DAILY_PREDICTION_LIMIT_REACHED":
    case "REWARDED_AD_REQUIRED":
      return 429;
    case "NO_ACTIVE_TOURNAMENT":
    case "TOURNAMENT_NOT_ACTIVE":
    case "FIXTURE_NOT_OPEN":
    case "FIXTURE_NOT_IN_DAILY_POOL":
    case "FIXTURE_SCORING_SNAPSHOT_MISSING":
    case "COMPETITION_NOT_SUPPORTED":
    case "COMPETITION_INACTIVE":
    case "INVALID_AD_REWARD":
    case "AD_REWARD_ALREADY_CONSUMED":
    case "INVALID_ODDS":
    case "INVALID_PROBABILITY":
    case "OUTCOME_SNAPSHOT_NOT_PUBLISHABLE":
      return 400;
    default:
      return 400;
  }
}
