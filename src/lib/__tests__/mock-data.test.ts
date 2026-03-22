import { describe, it, expect } from "vitest";
import {
  getMockChatResponse,
  getMockDiagnosticData,
  getMockContextCheck,
  getMockVariances,
  mockSaveKnowledge,
  mockProcessContext,
  mockResolveConflict,
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

describe("mockSaveKnowledge", () => {
  it("returns ingestion result with counters", async () => {
    const result = await mockSaveKnowledge({
      diretoria: "PRODUTO",
      mes_ref: "2025-01",
      analyst: "Test User",
      entry_type: "variance_explanation",
      entries: [
        { conta_pl: "G&A", explanation: "Test", variance_type: "one-off", expect_next: false },
        { conta_pl: "Pessoal", explanation: "Test 2", variance_type: "recurring", expect_next: true },
      ],
    });
    expect(result.created).toBeGreaterThanOrEqual(0);
    expect(result.merged).toBeGreaterThanOrEqual(0);
    expect(result.skipped).toBeGreaterThanOrEqual(0);
    expect(result.created + result.merged + result.skipped + result.conflicts.length).toBe(2);
  });

  it("returns a conflict when entry count is >= 3", async () => {
    const result = await mockSaveKnowledge({
      diretoria: "ENGENHARIA",
      mes_ref: "2025-01",
      analyst: "Test User",
      entry_type: "variance_explanation",
      entries: [
        { conta_pl: "A", explanation: "x", variance_type: "one-off", expect_next: false },
        { conta_pl: "B", explanation: "y", variance_type: "recurring", expect_next: false },
        { conta_pl: "C", explanation: "z", variance_type: "seasonal", expect_next: false },
      ],
    });
    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    expect(result.conflicts[0]).toHaveProperty("entry_id");
    expect(result.conflicts[0]).toHaveProperty("existing_text");
    expect(result.conflicts[0]).toHaveProperty("new_text");
    expect(result.conflicts[0]).toHaveProperty("reason");
  });
});

describe("mockProcessContext", () => {
  it("returns fragmentation summary", async () => {
    const result = await mockProcessContext({
      mes_ref: "2025-01",
      analyst: "Test User",
      transcript: "Reunião de fechamento...",
    });
    expect(result).toHaveProperty("fragments_total");
    expect(result).toHaveProperty("created");
    expect(result).toHaveProperty("merged");
    expect(result).toHaveProperty("skipped");
    expect(result.fragments_total).toBeGreaterThan(0);
  });
});

describe("mockResolveConflict", () => {
  it("resolves without error", async () => {
    const result = await mockResolveConflict({
      entry_id: "abc-123",
      resolution: "keep_existing",
    });
    expect(result).toEqual({ ok: true });
  });
});
