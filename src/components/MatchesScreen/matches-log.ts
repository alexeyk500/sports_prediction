import { ApiClientError } from "@/lib/api/client";

export function logMatchesLoadError(error: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error instanceof ApiClientError) {
    console.error("Matches bootstrap failed", {
      endpoint: error.endpoint,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error(
    "Matches bootstrap failed",
    error instanceof Error ? error.message : error,
  );
}
