import { test, expect } from "@playwright/test";

test.describe("Context", () => {
  test("processes context with transcript", async ({ page }) => {
    await page.goto("/");

    // Navigate to Context tab
    await page.getByRole("tab", { name: "Contexto Gerencial" }).click();

    // Select month — single combobox on this view
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "2025-01" }).click();

    // Badge for existing file (getMockContextCheck("2025-01").exists === true)
    await expect(
      page.getByText("Arquivo existente — será atualizado")
    ).toBeVisible();

    // Fill transcript
    await page
      .getByPlaceholder("Cole aqui a transcrição da reunião gerencial...")
      .fill("Reunião de fechamento do mês com discussão sobre resultados");

    // Process
    await page.getByRole("button", { name: "Processar Contexto" }).click();

    // Wait for processing (2s setTimeout in handleProcess)
    await expect(
      page.getByText("Contexto gerencial processado com sucesso!")
    ).toBeVisible({ timeout: 5000 });

    // Expand the collapsible preview
    await page.getByText("Preview do markdown gerado").click();

    // MOCK_GENERATED_MARKDOWN starts with "## Resumo Executivo"
    await expect(page.getByText("Resumo Executivo")).toBeVisible();
  });
});
