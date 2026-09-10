"use client";

import type React from "react";
import PublicHelpPage from "@/components/PublicHelpPage/PublicHelpPage";
import { resolvePublicDocsLocaleContent } from "@/content/public-docs/public-docs-registry";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/locales";
import { useSettingsStore } from "@/stores/settings-store";

const PublicHelpLocalePage: React.FC = () => {
  const locale = useSettingsStore((state) => state.locale);
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const content = resolvePublicDocsLocaleContent(resolvedLocale);

  return <PublicHelpPage content={content.help} locale={resolvedLocale} />;
};

export default PublicHelpLocalePage;
