# Cup Leaderboard — UX / Functional Specification

## 1. Цель

Сделать leaderboard пригодным для Cup с десятками, сотнями и тысячами участников.

Главная проблема текущего подхода: если пользователь занимает, например, 800-е место,
он не должен прокручивать 799 строк, чтобы увидеть собственную позицию.

Решение: leaderboard имеет три представления:

- `Top 50`
- `Around Me`
- `All Players`

## 2. Общая структура экрана Cup

Порядок блоков:

1. Заголовок `Cup`
2. Subtitle
3. Переключатель `Current Cup / History`
4. Current Cup hero card
5. Participants summary
6. `Your position`
7. Leaderboard mode switch
8. Leaderboard content
9. Fixed bottom navigation

Экран имеет один вертикальный scroll.

### Scroll rules

- `BottomNavigation` — fixed/sticky bottom, не участвует в scroll.
- Все остальные блоки находятся в одном page scroll.
- У `Leaderboard` НЕ должно быть собственного `overflow-y: auto`.
- Последний контент должен иметь bottom padding не меньше высоты bottom navigation + safe-area.
- `Current Cup / History` может быть sticky при достижении top viewport, если это уже согласуется с текущей архитектурой экрана.

## 3. Your Position

Карточка отображает агрегированное состояние текущего пользователя:

- Rank
- Points
- Total picks / predictions
- Correct
- Wrong

Пример:

`Rank #800`
`12 Points · 22 picks · 6 correct · 16 wrong`

Эта карточка:
- всегда показывает текущего пользователя независимо от выбранного leaderboard mode;
- не sticky;
- не используется как заменитель строки пользователя в leaderboard.

## 4. Leaderboard Mode Switch

Под блоком `Your position` разместить segmented control:

`Top 50 | Around Me | All Players`

Начальный режим:
- по умолчанию `Top 50`.

Если текущий пользователь входит в Top 50:
- `Around Me` все равно доступен;
- его строка должна быть выделена в Top 50.

Переключение режима не должно перезагружать весь экран Cup.

## 5. Top 50

Назначение:
быстро показать лидеров соревнования.

Данные:
- места 1–50;
- backend возвращает только необходимые записи;
- не загружать весь leaderboard ради Top 50.

Колонки:
- Rank
- Player
- Correct / Wrong
- Points

Top 3 можно визуально выделять существующими средствами UI, но не требуется менять дизайн,
если это не предусмотрено текущими компонентами.

Если текущий пользователь входит в Top 50:
- его строка выделяется как current user row.

## 6. Around Me

Назначение:
показать пользователю его позицию в локальном контексте.

Рекомендуемый диапазон:
- 4 пользователя выше;
- текущий пользователь;
- 4 пользователя ниже.

Итого обычно до 9 строк.

Пример для rank #800:

- 796
- 797
- 798
- 799
- 800 — You
- 801
- 802
- 803
- 804

На границах рейтинга диапазон корректируется:
- rank #1 → показать, например, 1–9;
- rank #999 при 1000 участниках → показать 992–1000 или другой симметричный доступный диапазон.

Текущая строка пользователя:
- визуально выделяется;
- вместо displayName можно дополнительно показывать `You`, но имя пользователя терять не обязательно;
- rank и points остаются видимыми.

## 7. All Players

Назначение:
полный рейтинг.

Требования:
- server-side pagination или cursor pagination;
- infinite loading;
- не запрашивать всех участников одним response;
- для длинного списка использовать virtualization, если это оправдано текущим frontend stack.

Пример page size:
- 50.

Важно:
`All Players` не создает отдельный внутренний scroll.
Новые страницы добавляются в общий document/page scroll.

Состояния:
- initial loading;
- next page loading;
- end of list;
- error with retry.

## 8. API / Data Contract

Предпочтительный API — не один endpoint, возвращающий весь рейтинг.

Допустимый вариант:

### Top

`GET /cups/:cupId/leaderboard?mode=top&limit=50`

Response:

```ts
type LeaderboardEntry = {
  userId: string;
  rank: number;
  displayName: string;
  avatarUrl?: string | null;
  correct: number;
  wrong: number;
  totalPredictions: number;
  points: number;
  isCurrentUser: boolean;
};

type TopLeaderboardResponse = {
  items: LeaderboardEntry[];
  totalParticipants: number;
};
```

### Around me

`GET /cups/:cupId/leaderboard/me?radius=4`

Response:

```ts
type AroundMeLeaderboardResponse = {
  items: LeaderboardEntry[];
  currentUserRank: number;
  totalParticipants: number;
};
```

### All

`GET /cups/:cupId/leaderboard?mode=all&limit=50&cursor=...`

Response:

```ts
type AllLeaderboardResponse = {
  items: LeaderboardEntry[];
  nextCursor: string | null;
  totalParticipants: number;
};
```

Если проект уже имеет другой API contract:
- не ломать его без необходимости;
- расширить существующий подход минимально;
- сохранить naming и conventions проекта.

## 9. Ranking Rules

Frontend НЕ должен вычислять rank самостоятельно.

Rank, points, correct/wrong должны приходить из backend/domain layer.

Порядок сортировки должен использовать существующую бизнес-логику проекта.

Если сейчас нет tie-break rule, не придумывать ее в UI.
При необходимости вынести вопрос отдельно.

## 10. Performance

Для 1000+ участников:

Нельзя:
- загружать все записи на старте;
- рендерить 1000+ DOM rows без необходимости;
- искать current user на frontend после загрузки всего списка.

Нужно:
- отдельный Top query;
- отдельный Around Me query;
- pagination для All Players;
- cache уже загруженных режимов, если используется React Query / SWR / существующий data layer.

## 11. UI / Design Constraints

Визуальный стиль должен продолжать текущий Cup screen.

Сохранить:
- текущую темную navy/teal палитру;
- существующие radius/borders;
- typography;
- spacing;
- BottomNavigation;
- current user highlight в фирменном teal.

Не переносить буквально все детали AI-generated mockup.
`leaderboard-concept.png` — UX/reference, а не pixel-perfect source of truth.

Главный source of truth по визуальному стилю — текущие компоненты проекта и `current-cup-screen.png`.

## 12. Responsive / Telegram Mini App

Приоритет:
- mobile viewport;
- Telegram Mini App;
- safe-area bottom;
- отсутствие горизонтального scroll.

Таблица должна помещаться на узком экране.

Если имя слишком длинное:
- ellipsis;
- rank, stats и points не должны ломать layout.

## 13. Accessibility / Interaction

- segmented control должен быть доступен с клавиатуры там, где это применимо;
- активный mode должен иметь явное состояние;
- loading skeleton не должен менять ширину layout;
- clickable player name использовать только если в проекте реально есть переход на профиль.

## 14. Acceptance Criteria

Сценарий 1:
- 50 участников;
- пользователь rank #12;
- Top 50 показывает его строку.

Сценарий 2:
- 1000 участников;
- пользователь rank #800;
- Top 50 не требует загрузки 1000 игроков;
- Around Me показывает диапазон вокруг #800;
- user row выделена.

Сценарий 3:
- All Players;
- первая страница 50 записей;
- при приближении к низу подгружается следующая;
- scroll остается общим для Cup screen.

Сценарий 4:
- пользователь rank #1;
- Around Me корректно показывает начало leaderboard.

Сценарий 5:
- пользователь последний;
- Around Me корректно показывает конец leaderboard.

## 15. Out of Scope

В рамках этой задачи не нужно:
- перерабатывать весь Cup screen;
- менять scoring model;
- менять механику турниров;
- добавлять отдельный search по игрокам;
- добавлять фильтры по странам/лигам;
- делать новый profile screen.
