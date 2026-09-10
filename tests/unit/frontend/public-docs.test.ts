import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/locales";
import {
  additionalHelpSections,
  helpCategories,
  popularHelpQuestions,
} from "@/content/public-docs/help-support";
import { privacyPolicy } from "@/content/public-docs/privacy-policy";
import {
  publicDocsByLocale,
  resolvePublicDocsLocaleContent,
} from "@/content/public-docs/public-docs-registry";
import { supportDestination } from "@/content/public-docs/support-destination";
import { termsOfUse } from "@/content/public-docs/terms-of-use";

describe("public support and legal content", () => {
  it("defines public legal documents with section anchors", () => {
    for (const document of [privacyPolicy, termsOfUse]) {
      expect(document.version).toBe("Version 1.0");
      expect(document.lastUpdatedLabel).toBe("Last updated Sep 9, 2026");
      expect(document.intro.length).toBeGreaterThan(0);
      expect(document.sections.length).toBeGreaterThan(0);
      expect(new Set(document.sections.map((section) => section.id)).size).toBe(
        document.sections.length,
      );
      expect(
        document.sections.every((section) => section.blocks.length > 0),
      ).toBe(true);
    }
  });

  it("keeps required privacy and terms safety statements", () => {
    const privacyText = JSON.stringify(privacyPolicy);
    const termsText = JSON.stringify(termsOfUse);

    expect(privacyText).toContain(
      "Goalstery does not request access to your Telegram messages, contacts, or phone number.",
    );
    expect(privacyText).toContain(
      "Goalstery will never ask for your seed phrase, private key, wallet password, or similar secret credentials.",
    );
    expect(termsText).toContain("You must be at least 18 years old");
    expect(termsText).toContain("does not require an entry fee");
    expect(termsText).toContain("USDT or GRAM");
    expect(termsText).toContain(
      "English version of these Terms is the authoritative version",
    );
  });

  it("defines Help categories, popular questions and no fabricated support URL", () => {
    expect(helpCategories.map((category) => category.title)).toEqual([
      "Predictions",
      "Cups",
      "Leaderboard",
      "Account",
    ]);
    expect(popularHelpQuestions.map((question) => question.question)).toEqual([
      "How do predictions work?",
      "When does a prediction lock?",
      "How are Cups calculated?",
      "What happens if a match is postponed?",
      "Can I win real prizes?",
      "How do I contact support?",
    ]);
    expect(additionalHelpSections.map((section) => section.title)).toEqual([
      "Fair Play",
      "Match Data",
      "Privacy & Security",
      "Troubleshooting",
    ]);
    expect(supportDestination.telegramUrl).toBeNull();
  });

  it("defines localized public docs for every supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const content = publicDocsByLocale[locale];

      expect(content.help.title.length).toBeGreaterThan(0);
      expect(content.help.categories.length).toBe(helpCategories.length);
      expect(content.help.additionalSections.length).toBe(
        additionalHelpSections.length,
      );
      expect(content.help.popularQuestions.length).toBe(
        popularHelpQuestions.length,
      );
      expect(content.privacy.sections.length).toBe(
        privacyPolicy.sections.length,
      );
      expect(content.terms.sections.length).toBe(termsOfUse.sections.length);
      expect(content.termsSummary.facts).toHaveLength(5);
      expect(content.termsSummary.positiveRules).toHaveLength(3);
      expect(content.termsSummary.negativeRules).toHaveLength(4);
    }
  });

  it("keeps public document anchors stable across locales", () => {
    const privacyAnchors = privacyPolicy.sections.map((section) => section.id);
    const termsAnchors = termsOfUse.sections.map((section) => section.id);
    const categoryAnchors = [...helpCategories, ...additionalHelpSections].map(
      (category) => category.id,
    );

    for (const locale of SUPPORTED_LOCALES) {
      const content = publicDocsByLocale[locale];

      expect(content.privacy.sections.map((section) => section.id)).toEqual(
        privacyAnchors,
      );
      expect(content.terms.sections.map((section) => section.id)).toEqual(
        termsAnchors,
      );
      expect(
        [...content.help.categories, ...content.help.additionalSections].map(
          (category) => category.id,
        ),
      ).toEqual(categoryAnchors);
    }
  });

  it("falls back to English when selected locale content is unavailable", () => {
    const fallbackRegistry = {
      en: publicDocsByLocale.en,
    } satisfies Partial<Record<SupportedLocale, typeof publicDocsByLocale.en>>;

    expect(resolvePublicDocsLocaleContent("ar", fallbackRegistry)).toBe(
      publicDocsByLocale.en,
    );
    expect(
      resolvePublicDocsLocaleContent("unsupported", fallbackRegistry),
    ).toBe(publicDocsByLocale.en);
  });

  it("localizes translated document chrome and keeps English authoritative notices", () => {
    for (const locale of ["ru", "de", "es", "ar"] satisfies SupportedLocale[]) {
      const content = publicDocsByLocale[locale];

      expect(content.help.title).not.toBe(publicDocsByLocale.en.help.title);
      expect(content.help.popularQuestionsTitle).not.toBe(
        publicDocsByLocale.en.help.popularQuestionsTitle,
      );
      expect(content.privacy.title).not.toBe(
        publicDocsByLocale.en.privacy.title,
      );
      expect(content.privacy.contentsLabel).not.toBe(
        publicDocsByLocale.en.privacy.contentsLabel,
      );
      expect(content.privacy.authoritativeNotice).toBeTruthy();
      expect(content.terms.title).not.toBe(publicDocsByLocale.en.terms.title);
      expect(content.terms.contentsLabel).not.toBe(
        publicDocsByLocale.en.terms.contentsLabel,
      );
      expect(content.terms.authoritativeNotice).toBeTruthy();
    }
  });

  it("defines Arabic RTL content with required mixed Latin product tokens", () => {
    const content = publicDocsByLocale.ar;
    const serialized = JSON.stringify(content);

    expect(content.help.title).toContain("المساعدة");
    expect(content.privacy.title).toContain("الخصوصية");
    expect(content.terms.title).toContain("الاستخدام");
    expect(serialized).toContain("Goalstery");
    expect(serialized).toContain("Telegram");
    expect(serialized).toContain("USDT");
    expect(serialized).toContain("GRAM");
    expect(serialized).toContain("football-data.org");
  });
});
