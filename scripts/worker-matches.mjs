import { runMatchesWorker } from "../src/workers/matches-worker.ts";

runMatchesWorker().catch((error) => {
  console.error(
    JSON.stringify({
      level: "error",
      workerName: "worker:matches",
      message: "worker startup failed",
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
