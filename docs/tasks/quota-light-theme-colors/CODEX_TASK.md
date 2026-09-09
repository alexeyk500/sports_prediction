# Task: Fix Quota colors in light theme on Matches screen

Нужно исправить цветовую палитру компонента `Quota` на экране `Matches` для светлой темы.

## Проблема

`Quota` расположен поверх тёмного stadium background, но в light theme текстовые элементы получают слишком тёмные/приглушённые цвета и практически не читаются.

См. `reference-light-theme.png`.

Проблемные элементы:

- `Today's predictions`
- `1 / 8`
- `Free (1 / 3)`
- `Rewarded (0 / 5)`
- иконка заголовка
- при необходимости inactive dots и divider

Dark theme визуально работает лучше — используй её как ориентир по контрасту.

## Перед изменениями

Сначала найди и изучи:

1. React-компонент `Quota` на экране `Matches`;
2. его CSS Module/styles;
3. используемые theme variables/tokens;
4. light/dark theme overrides;
5. текущую палитру компонента в dark theme.

Коротко классифицируй причину проблемы и перечисли файлы, которые собираешься менять.

Не делай global replace.

## Что изменить

Background `Quota` остаётся тёмным независимо от глобальной темы приложения, поэтому foreground поверх него не должен слепо наследовать обычные light-theme text tokens, рассчитанные на светлую поверхность.

Исправь палитру так, чтобы:

- `Today's predictions` и `1 / 8` использовали хорошо читаемый светлый primary foreground;
- `Free (...)` и `Rewarded (...)` использовали более мягкий, но достаточно контрастный secondary foreground;
- иконка заголовка была хорошо видна и согласована с primary text;
- inactive dots и divider оставались различимыми на stadium background;
- active/free/rewarded семантика dots сохранилась.

Предпочтительно использовать существующие semantic/theme tokens проекта. Если подходящих токенов нет, добавь минимальные локальные CSS variables для `Quota`.

Не создавай отдельную hardcoded dark-theme реализацию компонента. Если тёмный background одинаков в обеих темах, допустимо сделать foreground palette самого `Quota` независимой от глобальных page text colors.

Если неоднородный background всё ещё мешает читаемости, можно аккуратно скорректировать существующий overlay/gradient, но только если изменения foreground недостаточно. Сам background image не менять.

## Не менять

Не менять:

- quota calculation;
- free/rewarded limits;
- progress logic;
- prediction mechanics;
- Matches business logic/API;
- routing;
- layout, размеры и spacing компонента;
- typography;
- количество dots;
- Cup / History / leaderboard;
- background image.

## Проверка

Проверь компонент:

- light theme;
- dark theme;
- mobile width;
- `0 / 8`;
- частично заполненный quota;
- полностью заполненный quota;
- free exhausted;
- rewarded partially/full.

Dark theme не должна визуально деградировать.

Если есть релевантные component/unit/snapshot tests — обнови только необходимые проверки.

Запусти релевантные lint/typecheck/tests.

## Acceptance criteria

1. `Today's predictions` хорошо читается в light theme.
2. `1 / 8` хорошо читается в light theme.
3. `Free (...)` и `Rewarded (...)` хорошо читаются в light theme.
4. Иконка заголовка не теряется на фоне.
5. Dots и divider хорошо различимы.
6. Dark theme не ухудшилась.
7. Layout не изменился.
8. Quota/prediction mechanics не изменились.
9. Решение соответствует существующей theme architecture проекта и не содержит ненужных hardcoded цветов.
