# utc-only-time-semantics-refactor

Target location:

`docs/tasks/utc-only-time-semantics-refactor/`

This task supersedes:

`docs/tasks/worker-matches-london-day-discovery-fix/`

Files:

- `CODEX_TASK.md` — detailed implementation specification
- `LAUNCH_PROMPT.md` — short Codex launch prompt

Main architectural decision:

> Goalstery has no business timezone. UTC is the sole backend/domain time basis. User-local time is presentation-only.
