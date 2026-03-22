import { test, expect } from "@playwright/test";

test.describe("Knowledge Input", () => {
  test("completes wizard happy path", async ({ page }) => {
    await page.goto("/");

    // Navigate to Knowledge tab
    await page.getByRole("tab", { name: "Knowledge Input" }).click();

    // Step 1: Fill analyst name
    await page.getByPlaceholder("Seu nome completo").fill("Test User");

    // Select diretoria — Radix Select trigger is role=combobox
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /PRODUTO/ }).click();

    // Select month — second combobox
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "2025-01" }).click();

    // Advance to step 2
    await page.getByRole("button", { name: "Buscar Variações" }).click();

    // Step 2: Diagnostic — MetricCard "Delta Total" and variance table row
    await expect(page.getByText("Delta Total")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Despesas com Pessoal" })).toBeVisible();

    // Fill BP notes so YAML passes validation (requires variances: or notes:)
    await page
      .getByPlaceholder("Contexto adicional sobre o mês...")
      .fill("Notas de teste para validação do YAML.");

    // Advance to step 3
    await page.getByRole("button", { name: "Gerar Preview YAML" }).click();

    // Step 3: YAML preview heading is visible
    await expect(page.getByText("Preview do YAML")).toBeVisible();

    // Save — button enabled because notes: field present
    await page.getByRole("button", { name: "Salvar" }).click();

    // Step 4: Success
    await expect(page.getByText("Conhecimento salvo!")).toBeVisible();
  });

  test("shows group mode for Engenharia squad", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Knowledge Input" }).click();

    // Fill name
    await page.getByPlaceholder("Seu nome completo").fill("Test User");

    // Select DADOS — member of DIRETORIA_GROUPS.Engenharia
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /^DADOS/ }).click();

    // Group alert appears: "Modo grupo ativo"
    await expect(page.getByText("Modo grupo ativo")).toBeVisible();

    // Select month
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "2025-01" }).click();

    // Advance
    await page.getByRole("button", { name: "Buscar Variações" }).click();

    // Squad tabs should appear (Engenharia group = DADOS, DEVOPS, ENGENHARIA, CYBERSECURITY)
    await expect(page.getByRole("tab", { name: "DADOS" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "DEVOPS" })).toBeVisible();
  });
});
