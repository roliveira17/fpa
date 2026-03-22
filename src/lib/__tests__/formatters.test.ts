import { describe, it, expect } from "vitest";
import { formatBrl, formatBrlCompact, formatPct, trendArrow, budgetStatus, formatDelta } from "../formatters";

describe("formatBrl", () => {
  it("formats positive value", () => {
    expect(formatBrl(1234.56)).toContain("1.234,56");
  });
  it("formats zero", () => {
    expect(formatBrl(0)).toContain("0,00");
  });
  it("formats negative value", () => {
    const result = formatBrl(-500);
    expect(result).toContain("500,00");
    expect(result).toContain("-");
  });
});

describe("formatBrlCompact", () => {
  it("formats millions", () => {
    const result = formatBrlCompact(42_300_000);
    expect(result).toMatch(/42/);
  });
});

describe("formatPct", () => {
  it("formats positive percentage", () => {
    expect(formatPct(0.0385)).toContain("3,9");
  });
  it("formats negative percentage", () => {
    const result = formatPct(-0.0987);
    expect(result).toContain("9,9");
    expect(result).toContain("-");
  });
});

describe("trendArrow", () => {
  it("returns up arrows for increasing", () => {
    expect(trendArrow([1, 2, 3])).toBe("↑↑");
  });
  it("returns down arrows for decreasing", () => {
    expect(trendArrow([3, 2, 1])).toBe("↓↓");
  });
  it("returns mixed arrows", () => {
    expect(trendArrow([1, 2, 1])).toBe("↑↓");
  });
  it("returns dash for single value", () => {
    expect(trendArrow([5])).toBe("➖");
  });
  it("returns right arrows for equal values", () => {
    expect(trendArrow([3, 3, 3])).toBe("→→");
  });
});

describe("budgetStatus", () => {
  it("returns green for positive", () => {
    expect(budgetStatus(100)).toBe("🟢");
  });
  it("returns red for negative", () => {
    expect(budgetStatus(-100)).toBe("🔴");
  });
  it("returns dash for zero", () => {
    expect(budgetStatus(0)).toBe("➖");
  });
});

describe("formatDelta", () => {
  it("prepends + for positive values", () => {
    expect(formatDelta(1_000_000)).toMatch(/^\+/);
  });
  it("shows negative without +", () => {
    expect(formatDelta(-500_000)).not.toMatch(/^\+/);
  });
});
