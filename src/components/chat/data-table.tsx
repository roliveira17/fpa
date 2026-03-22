"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBrl, formatPct } from "@/lib/formatters";

interface DataTableProps {
  data: Record<string, unknown>[];
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (key.includes("pct") || key.includes("var")) return formatPct(value);
    if (Math.abs(value) > 1000) return formatBrl(value);
    return value.toLocaleString("pt-BR");
  }
  return String(value);
}

function cellColor(key: string, value: unknown): string {
  if (typeof value !== "number") return "";
  if (key === "delta" || key.includes("delta")) {
    if (value > 0) return "text-success";
    if (value < 0) return "text-destructive";
  }
  if (key.includes("var") || key.includes("pct")) {
    if (typeof value === "number" && !key.includes("variance_pct")) {
      if (value > 0.05) return "text-success";
      if (value < -0.05) return "text-destructive";
    }
  }
  return "";
}

export function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto my-3 rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 hover:bg-secondary/30">
            {columns.map((col) => (
              <TableHead
                key={col}
                className="text-[11px] font-medium text-muted-foreground h-8 px-3"
              >
                {col.replace(/_/g, " ").toUpperCase()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} className="hover:bg-accent/30">
              {columns.map((col) => (
                <TableCell
                  key={col}
                  className={`text-xs px-3 py-1.5 font-mono ${cellColor(col, row[col])}`}
                >
                  {formatValue(col, row[col])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
