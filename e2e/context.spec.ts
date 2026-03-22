import { test, expect } from "@playwright/test";

test.describe("Context", () => {
  test("processes context with transcript", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Contexto Gerencial" }).click();

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "2025-01" }).click();

    await expect(
      page.getByText(/Conhecimento existente/)
    ).toBeVisible();

    await page
      .getByPlaceholder("Cole aqui a transcrição da reunião gerencial...")
      .fill("Reunião de fechamento do mês com discussão sobre resultados");

    await page.getByRole("button", { name: "Processar Contexto" }).click();

    await expect(
      page.getByText("Contexto gerencial processado com sucesso!")
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Fragmentos extraídos")).toBeVisible();
    await expect(page.getByText("Criados")).toBeVisible();
    await expect(page.getByText("Mesclados")).toBeVisible();
  });
});
