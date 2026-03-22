const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const brlCompactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

const pctFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "always",
});

export function formatBrl(value: number): string {
  return brlFormatter.format(value);
}

export function formatBrlCompact(value: number): string {
  return brlCompactFormatter.format(value);
}

export function formatPct(value: number): string {
  return pctFormatter.format(value);
}

export function trendArrow(values: number[]): string {
  if (values.length < 2) return "➖";
  return values
    .slice(1)
    .map((v, i) => {
      const prev = values[i];
      if (v > prev) return "↑";
      if (v < prev) return "↓";
      return "→";
    })
    .join("");
}

export function budgetStatus(delta: number): string {
  if (delta > 0) return "🟢";
  if (delta < 0) return "🔴";
  return "➖";
}

export function formatDelta(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + brlCompactFormatter.format(value);
}
