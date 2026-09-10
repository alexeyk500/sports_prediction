import { expect, test } from "@playwright/test";

const localizedExpectations = {
  en: {
    dir: "ltr",
    help: "Help & Support",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    contents: "Contents",
    beforePlay: "Before you play",
  },
  ru: {
    dir: "ltr",
    help: "Помощь и поддержка",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    contents: "Содержание",
    beforePlay: "Перед игрой",
  },
  de: {
    dir: "ltr",
    help: "Hilfe & Support",
    privacy: "Datenschutzerklärung",
    terms: "Nutzungsbedingungen",
    contents: "Inhalt",
    beforePlay: "Bevor du spielst",
  },
  es: {
    dir: "ltr",
    help: "Ayuda y soporte",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    contents: "Contenido",
    beforePlay: "Antes de jugar",
  },
  ar: {
    dir: "rtl",
    help: "المساعدة والدعم",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    contents: "المحتويات",
    beforePlay: "قبل اللعب",
  },
} as const;

test.describe("public support and legal pages", () => {
  test("public routes render directly without bottom navigation", async ({
    page,
  }) => {
    for (const path of ["/help", "/privacy", "/terms"]) {
      await page.goto(path);

      await expect(
        page.getByRole("link", { name: "Goalstery", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator("nav").filter({ hasText: "Matches" }),
      ).toHaveCount(0);
      await expect(
        page.locator('[data-ui="public-scroll-area"]'),
      ).toBeVisible();
    }
  });

  test("legal document contents point to real section anchors", async ({
    page,
  }) => {
    await page.goto("/privacy");

    await page.locator("details summary", { hasText: "Contents" }).click();
    const firstContentLink = page.getByRole("link", {
      name: "Information We Receive",
    });

    await expect(firstContentLink).toHaveAttribute(
      "href",
      "#information-we-receive",
    );
    await expect(page.locator("#information-we-receive")).toBeVisible();
  });

  test("help FAQ expands and support links use the configured destination", async ({
    page,
  }) => {
    await page.goto("/help");

    await page.getByText("How do predictions work?").first().click();
    await expect(
      page
        .getByText(
          "Goalstery lets you make predictions about football matches.",
        )
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Contact Support" }),
    ).toHaveAttribute("href", "https://t.me/goalstery_admin");

    await page.getByText("How do I contact support?").first().click();
    await expect(
      page.getByRole("link", { name: "@goalstery_admin" }).first(),
    ).toHaveAttribute("href", "https://t.me/goalstery_admin");
  });

  test("public pages render in the persisted Goalstery locale", async ({
    baseURL,
    browser,
  }) => {
    const origin = new URL(baseURL ?? "http://127.0.0.1:3000").origin;

    for (const [locale, expectation] of Object.entries(localizedExpectations)) {
      const context = await browser.newContext({
        storageState: {
          cookies: [],
          origins: [
            {
              origin,
              localStorage: [
                {
                  name: "goalstery-settings",
                  value: JSON.stringify({
                    state: { locale, appearance: "system" },
                    version: 0,
                  }),
                },
              ],
            },
          ],
        },
      });
      const page = await context.newPage();

      await page.goto("/help");
      await expect(
        page.getByRole("heading", { level: 1, name: expectation.help }),
      ).toBeVisible();
      await expect(page.locator(`main [lang="${locale}"]`)).toHaveAttribute(
        "dir",
        expectation.dir,
      );

      await page.goto("/privacy");
      await expect(
        page.getByRole("heading", { level: 1, name: expectation.privacy }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "@goalstery_admin" }).first(),
      ).toHaveAttribute("href", "https://t.me/goalstery_admin");
      await page
        .locator("details summary", { hasText: expectation.contents })
        .click();
      await expect(page.locator("#information-we-receive")).toBeVisible();

      await page.goto("/terms");
      await expect(
        page.getByRole("heading", { level: 1, name: expectation.terms }),
      ).toBeVisible();
      await expect(page.getByText(expectation.beforePlay)).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: "Cups" }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "@goalstery_admin" }).first(),
      ).toHaveAttribute("href", "https://t.me/goalstery_admin");

      if (locale === "ar") {
        await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
        await expect(page.locator('main [lang="ar"]')).toContainText(
          "Telegram",
        );
      }

      await context.close();
    }
  });
});
