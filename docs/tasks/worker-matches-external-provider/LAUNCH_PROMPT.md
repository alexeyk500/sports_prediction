Реализуй задачу из `docs/tasks/worker-matches-external-provider/CODEX_TASK.md`.

Сначала проведи repository audit. Затем обязательно прочитай `MATCH_WORKER_SPEC.md` и `FOOTBALL_DATA_ORG_API.md` из этой же папки и реализуй `worker:matches` строго по ним.

Критично: `worker:matches` — отдельный автономный long-running runtime process с собственным entry point/командой запуска. Он не должен запускаться из Next.js/UI, зависеть от HTTP-трафика или быть реализован как API/cron route. Web и worker должны запускаться, останавливаться, перезапускаться и деплоиться независимо.

Для football-data.org используй официальный API v4 и правила из `FOOTBALL_DATA_ORG_API.md`; не угадывай provider behavior. Не создавай параллельные модели/абстракции, если в проекте уже есть authoritative equivalents. Не выходи за границы `worker:matches`: prediction settlement и `worker:events` consumer logic не входят в эту задачу.

После реализации запусти все применимые проверки и дай completion report по требованиям задачи.
