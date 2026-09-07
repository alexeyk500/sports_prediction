# Cup Leaderboard — implementation package

Этот пакет содержит спецификацию поведения leaderboard на экране Cup,
визуальные референсы и готовое задание для Codex.

## Файлы

- `current-cup-screen.png` — текущий экран Cup.
- `leaderboard-concept.png` — целевой UX-концепт Top 50 / Around Me / All Players.
- `LEADERBOARD_SPEC.md` — функциональная и UX-спецификация.
- `CODEX_TASK.md` — готовое задание для Codex.

## Основная идея

Leaderboard не должен заставлять пользователя с rank #800 скроллить сотни строк.

Основные режимы:
1. `Top 50` — лидеры турнира.
2. `Around Me` — небольшой диапазон вокруг текущего пользователя.
3. `All Players` — полный рейтинг с серверной пагинацией/infinite loading и виртуализацией.

На экране остается один вертикальный scroll. Bottom navigation фиксирован.
Внутри leaderboard отдельного вертикального scroll-контейнера быть не должно.
