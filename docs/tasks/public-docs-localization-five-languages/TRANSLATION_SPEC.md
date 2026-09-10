# Translation Specification — Public Support & Legal Pages

## Supported locales

Goalstery currently supports these five application languages:

- `en` — English
- `ru` — Russian
- `de` — German
- `es` — Spanish
- `ar` — Arabic

The public pages `/help`, `/privacy`, and `/terms` must render in the user's selected Goalstery language.

## Source language and authority

The English documents are the canonical source text:

- `HELP_SUPPORT_V1.md`
- `PRIVACY_POLICY_V1.md`
- `TERMS_OF_USE_V1.md`

For legal documents:

- English remains the authoritative version.
- Russian, German, Spanish, and Arabic are translations for user convenience.
- Translations must preserve legal meaning and structure as closely as possible.
- Do not introduce new legal claims, jurisdictions, legal entities, providers, payment mechanics, or product behavior.

## Translation style

### Help & Support

Translate naturally and clearly for product UX.

Prefer concise, idiomatic product language rather than literal word-for-word translation when the meaning is preserved.

Keep established product/domain terms consistent:

- Goalstery — never translate
- Cups — keep the product term `Cups` unless the existing application locale already has an established localized convention
- Prize Cups — keep terminology consistent with the existing product translation model
- Telegram — never translate
- USDT — never translate
- GRAM — never translate
- football-data.org — never translate

### Privacy Policy and Terms of Use

Use formal, clear legal/product language appropriate for each locale.

Do not paraphrase away important restrictions or qualifiers.

Preserve:

- age 18+ requirement;
- free participation;
- no entry fee;
- no wagering;
- Cups have no monetary value;
- Cups cannot be purchased, sold, withdrawn, transferred, or exchanged;
- some Prize Cups may offer USDT / GRAM;
- geographic restrictions may apply;
- English Terms are authoritative;
- no seed phrase / private key / wallet password requests;
- account deletion via official Telegram support;
- no current dedicated behavioral analytics/user-tracking system;
- advertising may exist without inventing a provider;
- Goalstery's final settlement determination;
- unresolved matches can remain pending;
- Fair Play rules.

## Locale-specific requirements

### Russian (`ru`)

- Use natural Russian product/legal language.
- Avoid awkward calques.
- Preserve Goalstery, Cups, Telegram, USDT, GRAM as product/proper terms unless an already-established project translation says otherwise.
- Use standard Russian punctuation and date formatting where the existing app does so.

### German (`de`)

- Use clear formal German.
- Prefer consistent legal terminology across Privacy and Terms.
- Avoid overly bureaucratic phrasing where simpler accurate language works.

### Spanish (`es`)

- Use neutral international Spanish.
- Avoid region-specific slang.
- Keep product terminology consistent across all three pages.

### Arabic (`ar`)

- Use Modern Standard Arabic.
- The page must render with correct RTL directionality.
- Text alignment, inline icons, disclosure arrows, metadata, lists, and two-column/row arrangements must work correctly in RTL.
- Do not mirror brand marks or icon artwork that should retain its semantic orientation.
- Numbers, version values, URLs, Latin product names, USDT/GRAM, and football-data.org must remain readable.
- Mixed Arabic/Latin text must not cause broken ordering.

## Fallback

If a locale-specific public document is missing or cannot be resolved, fall back to English.

Do not render an empty page.

## Language switching

The pages must react to the same selected application language as the rest of Goalstery.

Do not introduce a separate public-doc language setting that can drift from the application's selected locale.

If the user changes the Goalstery language and revisits or rerenders the page, the public document must use that locale.

## Metadata

Page metadata/title should also use the selected locale where the current Next.js architecture permits this cleanly.

At minimum localize:

- Help & Support
- Privacy Policy
- Terms of Use

Do not block implementation on advanced dynamic metadata if it conflicts with the existing application architecture; prioritize correct in-page locale rendering.

## English-authoritative notice

Privacy Policy and Terms should visibly communicate that English is the authoritative version.

For translated Terms, include a concise localized notice near version/date metadata or document footer.

For translated Privacy Policy, include a similar localized notice if the current visual architecture supports it without clutter.

Do not show this notice on the English page.

## Content structure

Keep section IDs/semantic keys stable across locales so that:

- contents navigation still works;
- section anchors remain predictable;
- Help category navigation still works;
- tests can map the same semantic section across locales.

Do not derive anchor IDs from translated headings if that would make them unstable.

Prefer stable semantic IDs such as:

- `eligibility`
- `telegram-account`
- `cups`
- `prize-cups`
- `fair-play`
- `contact`
- etc.

## Accessibility

- Set the appropriate `lang` on the rendered document/page.
- Set `dir="rtl"` for Arabic and `dir="ltr"` for the other locales.
- Preserve heading hierarchy.
- Ensure collapsible Contents / FAQ controls remain keyboard accessible.
- Ensure screen readers announce translated labels rather than English UI chrome.

## Testing expectations

Verify all 15 page/locale combinations:

- `/help` × `en`, `ru`, `de`, `es`, `ar`
- `/privacy` × `en`, `ru`, `de`, `es`, `ar`
- `/terms` × `en`, `ru`, `de`, `es`, `ar`

Test Arabic RTL explicitly.

Check that English fallback works when a locale entry is unavailable in a controlled test.
