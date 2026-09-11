# worker-matches-external-provider

Codex task package for Goalstery `worker:matches`.

Read in this order:

1. `CODEX_TASK.md` — implementation task and acceptance requirements.
2. `MATCH_WORKER_SPEC.md` — Goalstery behavioral/architectural specification.
3. `FOOTBALL_DATA_ORG_API.md` — concrete football-data.org v4 integration contract, official documentation links, endpoints, fields, status mapping, business-day handling, batching and rate limiting.
4. `LAUNCH_PROMPT.md` — short Codex launch prompt.


## Runtime model

`worker:matches` is a separate autonomous long-running process. It is not part of the Next.js/UI lifecycle and must be independently startable, restartable, and deployable. See **Runtime & Deployment Contract** in `CODEX_TASK.md` and `MATCH_WORKER_SPEC.md`.
