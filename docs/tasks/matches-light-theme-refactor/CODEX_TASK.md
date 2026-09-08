# Task: Refactor Matches light theme for stronger visual hierarchy and contrast

Нужно системно отрефакторить светлую тему экрана `Matches`, чтобы экран перестал выглядеть блеклым, слишком белым и визуально плоским, при этом сохранив текущую структуру, UX и бизнес-логику.

## Визуальный референс текущего состояния

Используй приложенный файл:

- `reference-current-light-theme.png`

Это текущий вид экрана `Matches` в light theme. Проблема не в layout, а в недостаточной визуальной иерархии между page background, cards, controls, secondary surfaces, borders и secondary text.

## Цель

Сделать light theme:

- более контрастной;
- более собранной визуально;
- менее выцветшей;
- с понятной иерархией поверхностей;
- при этом сохранить ощущение именно светлой темы, а не превращать экран в dark/light hybrid.

Основной принцип:

`page background → card surface → secondary/control surface → accent state`

Эти уровни должны визуально различаться.

## Перед изменениями

Сначала изучи и кратко перечисли:

1. какие файлы отвечают за экран `Matches` и его light-theme styles;
2. какие global/theme tokens используются для:
   - page background;
   - card background;
   - border;
   - primary text;
   - secondary text;
   - muted text;
   - accent;
   - active navigation;
   - control surfaces;
3. какие из этих tokens используются также на других экранах;
4. какие изменения можно сделать через общие semantic tokens, а какие должны остаться локальными для `Matches`.

Не делай blind global replace.

## Что нужно изменить

### 1. Page background

Текущий фон страницы слишком близок к белым карточкам, из-за чего весь экран выглядит как одна светлая плоскость.

Нужно:

- сделать page background немного темнее текущего;
- сохранить холодный нейтральный оттенок;
- не использовать серый настолько тёмный, чтобы light theme потеряла лёгкость.

Цель: белые/near-white cards должны визуально отделяться от страницы без тяжёлых теней.

### 2. Card surfaces

Карточки матчей должны остаться светлыми, преимущественно white / near-white.

Нужно:

- сохранить clean card surface;
- улучшить separation через комбинацию background + border + subtle shadow;
- не использовать тяжёлые Material-style shadows;
- не менять border-radius и layout без необходимости.

### 3. Borders

Текущие светло-серо-голубые borders слишком слабые.

Нужно:

- слегка поднять контраст card/control borders;
- сохранить neutral/cool tone;
- не делать borders визуально доминирующими.

Особенно проверь:

- match cards;
- prediction buttons `1 / X / 2`;
- segmented control `Available / My Picks`;
- bottom navigation container;
- badges/chips.

### 4. Primary typography

Основной dark navy/ink foreground подходит визуально.

Проверь, что primary text имеет единый сильный semantic token.

Это касается:

- `Matches`;
- team names;
- prediction values `1`, `X`, `2`;
- важного numeric content;
- активных control labels.

Не нужно делать текст чисто `#000`, если проект уже использует хороший dark foreground token.

### 5. Secondary typography

Это одна из главных проблем текущего light theme.

Сейчас слишком бледно выглядят:

- `Make your picks for today`;
- league names;
- match time/date;
- `8 matches`;
- `vs`;
- `Settled`;
- inactive navigation labels;
- прочие secondary labels.

Нужно сделать secondary foreground заметно темнее и контрастнее.

Не превращай secondary text в primary text: визуальная иерархия должна сохраниться.

### 6. Prediction controls `1 / X / 2`

Сейчас эти controls слишком близки по цвету к самой карточке.

Нужно:

- добавить очень лёгкий secondary surface tint;
- допустим холодный neutral или subtle teal-tinted surface, если это соответствует палитре проекта;
- сделать border чуть заметнее;
- сохранить текущую механику и размеры;
- trophies/reward values должны хорошо читаться.

Не делай prediction buttons ярко-зелёными в обычном состоянии.

Accent должен оставаться reserved для selected/active/interactable states.

### 7. Segmented control `Available / My Picks`

Активный `Available` уже имеет хорошую semantic роль.

Нужно улучшить inactive часть:

- дать ей немного более выраженный secondary surface;
- сохранить единый control container;
- улучшить border/background separation;
- badge `1` должен иметь читаемый neutral surface.

Не меняй механику tabs.

### 8. Status `Settled`

Сейчас `Settled` визуально выглядит как случайный muted text.

Сделай его компактным нейтральным status badge/chip:

- subtle neutral background;
- readable secondary foreground;
- без яркого accent;
- без изменения business logic/status behavior.

Если в проекте уже есть reusable badge/status component или tokenized pattern — используй его.

### 9. Bottom navigation

Bottom navigation сейчас воспринимается как большая белая плоскость, слабо отделённая от страницы.

Нужно:

- улучшить separation через top border и/или subtle shadow;
- inactive icons/labels сделать контрастнее;
- active `Matches` state сделать cleaner;
- не использовать тяжёлую зелёную outline-рамку, если её можно заменить более аккуратной accent surface;
- сохранить существующую навигацию, размеры hit-area и sticky/fixed behavior.

### 10. Accent usage

Accent green/teal должен использоваться точечно:

- active segmented control;
- selected navigation item;
- активные quota/progress states;
- interactive selected states.

Не нужно красить accent-цветом большие части экрана.

Цель — stronger hierarchy, а не больше зелёного.

## Quota

Учитывай уже существующую отдельную задачу по контрасту `Quota` на dark stadium background.

В этой задаче:

- не меняй background image Quota;
- не ломай его foreground palette;
- убедись, что окружающая light-theme palette хорошо сочетается с Quota как с сильным тёмным hero-block.

## Theme architecture

Предпочтительный порядок решений:

1. использовать существующие semantic theme tokens;
2. при необходимости аккуратно скорректировать light-theme token values;
3. если global token изменение ухудшает другие экраны — использовать более узкий semantic token;
4. локальные hardcoded colors использовать только если архитектура проекта не даёт разумной альтернативы.

Не создавай дублирующую параллельную palette-систему только для Matches без необходимости.

## Dark theme

Dark theme не должна деградировать.

Обязательно проверь, что изменения:

- либо затрагивают только light theme;
- либо являются semantic улучшением для обеих тем.

Не меняй dark theme только ради симметрии.

## Не менять

Не менять:

- layout экрана;
- размеры cards;
- spacing без явной необходимости;
- typography scale;
- match/prediction business logic;
- quota calculation;
- API;
- routing;
- Cup;
- History;
- Profile;
- leaderboard;
- settlement logic;
- match data;
- number/order of prediction controls.

## Проверка

Проверь минимум:

- Matches light theme на mobile viewport;
- Matches dark theme;
- cards с разными league logos;
- длинные league/team names;
- разные reward values;
- `Settled` status;
- active/inactive `Available / My Picks`;
- bottom navigation active/inactive items;
- quota block рядом с новой light palette.

## Accessibility

Проверь разумный contrast для:

- primary text;
- secondary text;
- inactive controls;
- badges;
- navigation;
- borders ключевых interactive controls.

Не нужно визуально утяжелять интерфейс ради формального максимального contrast ratio, но текст не должен выглядеть выцветшим.

## Acceptance criteria

После реализации:

1. page background визуально отделяется от cards;
2. cards остаются светлыми и чистыми;
3. secondary text читается заметно лучше;
4. prediction buttons не сливаются с card surface;
5. segmented control имеет понятные active/inactive surfaces;
6. `Settled` выглядит как status badge, а не случайный текст;
7. bottom navigation лучше отделена от content;
8. accent используется точечно;
9. экран остаётся светлым, но больше не выглядит блеклым;
10. dark theme не ухудшилась;
11. layout и бизнес-логика не изменились;
12. theme architecture остаётся последовательной и не обрастает лишними hardcoded colors.

## Финальный отчёт

После реализации кратко перечисли:

- какие theme tokens были изменены;
- какие изменения были сделаны локально в Matches;
- какие файлы затронуты;
- почему эти изменения не должны ухудшить другие экраны;
- какие lint/typecheck/tests были запущены и их результат.
