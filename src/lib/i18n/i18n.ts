import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "./locales";
import { ar } from "./translations/ar";
import { de } from "./translations/de";
import { en } from "./translations/en";
import { es } from "./translations/es";
import { ru } from "./translations/ru";

export type TranslationResources = typeof en;
export type TranslationShape = WidenStrings<TranslationResources>;
export type TranslationKey = LeafPaths<TranslationResources>;
export type TranslationValues = Record<string, string | number>;

export const translationResources = {
  en,
  ru,
  de,
  es,
  ar,
} satisfies Record<SupportedLocale, TranslationShape>;

export function createTranslator(locale: SupportedLocale) {
  return (key: TranslationKey, values?: TranslationValues): string => translate(locale, key, values);
}

export function translate(locale: SupportedLocale, key: TranslationKey, values: TranslationValues = {}): string {
  const value = readPath(translationResources[locale], key);

  if (typeof value === "string") {
    return interpolate(value, values);
  }

  const fallback = readPath(translationResources[DEFAULT_LOCALE], key);

  return fallback ? interpolate(fallback, values) : key;
}

export function coerceLocale(value: unknown): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

function readPath(resources: TranslationShape, key: string): string | null {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, resources);

  return typeof value === "string" ? value : null;
}

function interpolate(template: string, values: TranslationValues): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (placeholder, name: string) => {
    const value = values[name];

    return value === undefined ? placeholder : String(value);
  });
}

type LeafPaths<TObject> = {
  [TKey in keyof TObject & string]: TObject[TKey] extends string
    ? TKey
    : `${TKey}.${LeafPaths<TObject[TKey]>}`;
}[keyof TObject & string];

type WidenStrings<TObject> = {
  readonly [TKey in keyof TObject]: TObject[TKey] extends string ? string : WidenStrings<TObject[TKey]>;
};
