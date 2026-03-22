import { describe, it, expect } from "vitest";
import {
  getMockChatResponse,
  getMockDiagnosticData,
  getMockContextCheck,
  getMockVariances,
} from "../mock/financial-data";

describe("getMockChatResponse", () => {
  it("returns waterfall for P&L query", () => {
    const r = getMockChatResponse("Como foi o P&L?");
    expect(r.text).toBeTruthy();
    expect(r.sql).toBeTruthy();
    expect(r.data).toBeTruthy();
    expect(r.chart_config?.type).toBe("waterfall");
    expect(r.error).toBeNull();
  });

  it("returns horizontal_bar for desvio query", () => {
    const r = getMockChatResponse("Quais desvios?");
    expect(r.chart_config?.type).toBe("horizontal_bar");
  });

  it("returns default response for unknown query", () => {
    const r = getMockChatResponse("something random");
    expect(r.text).toBeTruthy();
    expect(r.error).toBeNull();
  });
});

describe("getMockDiagnosticData", () => {
  it("returns complete diagnostic data", () => {
    const d = getMockDiagnosticData("PRODUTO");
    expect(d.variances.length).toBeGreaterThan(0);
    expect(d.totals).toHaveProperty("real");
    expect(d.totals).toHaveProperty("budget");
    expect(d.totals).toHaveProperty("delta");
    expect(d.probing_questions.length).toBeGreaterThan(0);
  });
});

describe("getMockVariances", () => {
  it("returns variances with required fields", () => {
    const v = getMockVariances("ENGENHARIA");
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]).toHaveProperty("conta_pl");
    expect(v[0]).toHaveProperty("real");
    expect(v[0]).toHaveProperty("budget");
    expect(v[0]).toHaveProperty("delta");
  });
});

describe("getMockContextCheck", () => {
  it("returns exists=true for known month", () => {
    expect(getMockContextCheck("2025-01").exists).toBe(true);
  });
  it("returns exists=false for unknown month", () => {
    expect(getMockContextCheck("1999-01").exists).toBe(false);
  });
});
