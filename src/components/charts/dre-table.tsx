"use client";

import { DreRow } from "@/lib/types";
import { formatBrl, formatPct } from "@/lib/formatters";

interface DreTableProps {
  rows: DreRow[];
}

function rowClasses(type: DreRow["type"]): string {
  switch (type) {
    case "header":
      return "bg-cora-dark text-white font-semibold";
    case "subtotal":
      return "bg-secondary/40 font-semibold";
    case "total":
      return "bg-secondary/60 font-bold";
    case "pct":
      return "bg-secondary/10 italic text-muted-foreground";
    default:
      return "";
  }
}

function deltaColor(value: number | null, type: DreRow["type"]): string {
  if (value === null || type === "header") return "";
  // For revenue lines, positive delta is good. For expense lines, negative delta is bad.
  if (type === "pct") return "";
  if (value > 0) return "text-success";
  if (value < 0) return "text-destructive";
  return "";
}

function formatCell(value: number | null, type: DreRow["type"]): string {
  if (value === null) return "—";
  if (type === "pct") return (value * 100).toFixed(1) + "%";
  return formatBrl(value);
}

export function DreTable({ rows }: DreTableProps) {
  return (
    <div className="my-3 overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-cora-dark text-white">
            <th className="px-3 py-2 text-left text-[11px] font-medium">Conta P&L</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium">Realizado</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium">Budget</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium">Delta</th>
            <th className="px-3 py-2 text-right text-[11px] font-medium">Var %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-border/30 ${rowClasses(row.type)}`}>
              <td
                className="px-3 py-1.5"
                style={{ paddingLeft: `${12 + row.indent * 16}px` }}
              >
                {row.label}
              </td>
              <td className="px-3 py-1.5 text-right font-mono">
                {formatCell(row.actual, row.type)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                {formatCell(row.budget, row.type)}
              </td>
              <td className={`px-3 py-1.5 text-right font-mono ${deltaColor(row.delta, row.type)}`}>
                {formatCell(row.delta, row.type)}
              </td>
              <td className={`px-3 py-1.5 text-right font-mono ${deltaColor(row.variance_pct, row.type)}`}>
                {row.variance_pct !== null ? formatPct(row.variance_pct) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
