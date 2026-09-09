import { describe, expect, it } from "vitest";
import {
  additionalHelpSections,
  helpCategories,
  popularHelpQuestions,
} from "@/content/public-docs/help-support";
import { privacyPolicy } from "@/content/public-docs/privacy-policy";
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
});
