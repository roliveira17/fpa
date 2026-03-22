import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("switches between tabs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Agente de FP&A da Cora")).toBeVisible();

    await page.getByRole("tab", { name: "Knowledge Input" }).click();
    await expect(page.getByPlaceholder("Seu nome completo")).toBeVisible();

    await page.getByRole("tab", { name: "Contexto Gerencial" }).click();
    await expect(page.getByText("Ingestão de transcrições")).toBeVisible();

    await page.getByRole("tab", { name: "Chat" }).click();
    await expect(page.getByText("Agente de FP&A da Cora")).toBeVisible();
  });

  test("opens and closes settings panel", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Settings" }).click();

    await expect(page.getByText("Configurações")).toBeVisible();
    await expect(page.getByText("Modelo LLM")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText("Modelo LLM")).not.toBeVisible({ timeout: 3000 });
  });

  test("hamburger menu works on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Desktop left aside is hidden on mobile (class="hidden lg:flex")
    await expect(page.locator("aside").first()).not.toBeVisible();

    // Click hamburger
    await page.getByRole("button", { name: "☰" }).click();

    // Sheet opens with sidebar content — scope to sheet portal to avoid hidden aside
    await expect(
      page.locator("[data-slot='sheet-content']").getByText("Relatórios")
    ).toBeVisible();
  });
});
