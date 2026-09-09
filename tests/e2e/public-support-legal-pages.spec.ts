import { expect, test } from "@playwright/test";

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

    await page.getByText("Contents").click();
    const firstContentLink = page.getByRole("link", {
      name: "Information We Receive",
    });

    await expect(firstContentLink).toHaveAttribute(
      "href",
      "#information-we-receive",
    );
    await expect(page.locator("#information-we-receive")).toBeVisible();
  });

  test("help FAQ expands and support CTA has no fabricated destination", async ({
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
      page.getByText("Official support account is not configured yet."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Contact Support" }),
    ).toHaveCount(0);
  });
});
