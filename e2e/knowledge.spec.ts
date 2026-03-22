import { test, expect } from "@playwright/test";

test.describe("Knowledge Input", () => {
  test("completes wizard happy path", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Knowledge Input" }).click();

    await page.getByPlaceholder("Seu nome completo").fill("Test User");

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /PRODUTO/ }).click();

    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "2025-01" }).click();

    await page.getByRole("button", { name: "Buscar Variações" }).click();

    await expect(page.getByText("Delta Total")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Despesas com Pessoal" })).toBeVisible();

    await page
      .getByPlaceholder("Contexto adicional sobre o mês...")
      .fill("Notas de teste para validação.");

    await page.getByRole("button", { name: "Gerar Preview" }).click();

    await expect(page.getByText("Preview do Conhecimento")).toBeVisible();

    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Conhecimento salvo!")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Criados")).toBeVisible();
    await expect(page.getByText("Mesclados")).toBeVisible();
  });

  test("shows group mode for Engenharia squad", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Knowledge Input" }).click();

    await page.getByPlaceholder("Seu nome completo").fill("Test User");

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /^DADOS/ }).click();

    await expect(page.getByText("Modo grupo ativo")).toBeVisible();

    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "2025-01" }).click();

    await page.getByRole("button", { name: "Buscar Variações" }).click();

    await expect(page.getByRole("tab", { name: "DADOS" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "DEVOPS" })).toBeVisible();
  });
});
