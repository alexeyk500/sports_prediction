Implement the task from:

`docs/tasks/utc-only-time-semantics-refactor/CODEX_TASK.md`

Refactor Goalstery from `BUSINESS_TIMEZONE="Europe/London"` to a UTC-only backend/domain time model across code, Prisma/database semantics, worker discovery, Matches API, prediction timing, tests, environment configuration, and authoritative documentation.

Do not merely replace London with UTC in configuration. Remove the configurable business-timezone concept, audit all date/time logic, preserve existing absolute timestamps, add any necessary safe migration, and update ADR/spec/docs.

The previous task `docs/tasks/worker-matches-london-day-discovery-fix/` is superseded by this task and must not be implemented as a separate London-specific fix.

Complete the code changes, migrations if actually required, tests, validation, and final report.
