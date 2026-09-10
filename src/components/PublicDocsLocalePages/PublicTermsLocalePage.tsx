"use client";

import type React from "react";
import PublicDocumentPage from "@/components/PublicDocumentPage/PublicDocumentPage";
import { resolvePublicDocsLocaleContent } from "@/content/public-docs/public-docs-registry";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/locales";
import { useSettingsStore } from "@/stores/settings-store";

const PublicTermsLocalePage: React.FC = () => {
  const locale = useSettingsStore((state) => state.locale);
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const content = resolvePublicDocsLocaleContent(resolvedLocale);

  return (
    <PublicDocumentPage
      document={content.terms}
      locale={resolvedLocale}
      termsSummary={content.termsSummary}
    />
  );
};

export default PublicTermsLocalePage;
