# matches / Monetag rewarded extra predictions

Codex entry point: `CODEX_TASK.md`.

Read `MONETAG_INTEGRATION_SPEC.md` before implementation. It contains
the official Monetag integration assumptions and links used to prepare
the task.

This task intentionally uses the real Monetag SDK in both development
and production. Development must use a separate Monetag main SDK zone;
only automated tests mock the external provider boundary.
