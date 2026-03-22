import { test, expect } from "@playwright/test";

test.describe("Chat", () => {
  test("sends message and receives response", async ({ page }) => {
    await page.goto("/");

    await page
      .getByPlaceholder("Faça uma pergunta sobre o P&L...")
      .fill("Como foi o P&L?");
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByText("Como foi o P&L?")).toBeVisible();
    await expect(page.getByText("Gerando SQL...")).toBeVisible();
    // Response heading is unique: "Fechamento Mensal — Janeiro 2025"
    await expect(
      page.getByRole("heading", { name: /Fechamento Mensal — Janeiro/ })
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicks suggestion button", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Como foi o P&L do último mês fechado?" })
      .click();

    await expect(
      page.getByRole("heading", { name: /Fechamento Mensal — Janeiro/ })
    ).toBeVisible({ timeout: 5000 });
  });

  test("sidebar report triggers chat", async ({ page }) => {
    await page.goto("/");

    await page
      .locator("aside")
      .first()
      .getByRole("button", { name: /Fechamento Mensal/ })
      .click();

    await expect(
      page.getByRole("heading", { name: /Fechamento Mensal — Janeiro/ })
    ).toBeVisible({ timeout: 5000 });
  });

  test("clears conversation", async ({ page }) => {
    await page.goto("/");

    await page
      .getByPlaceholder("Faça uma pergunta sobre o P&L...")
      .fill("teste");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("teste")).toBeVisible();

    await page.waitForTimeout(2000);

    await page
      .locator("aside")
      .first()
      .getByRole("button", { name: "Limpar Conversa" })
      .click();

    await expect(page.getByText("Agente de FP&A da Cora")).toBeVisible();
  });
});
