"use client";

import type { IngestionResult, ContextProcessResult } from "@/lib/types";

interface IngestionSummaryProps {
  result: IngestionResult | ContextProcessResult;
}

export function IngestionSummary({ result }: IngestionSummaryProps) {
  const has_fragments = "fragments_total" in result;

  return (
    <div className="rounded-md bg-secondary/30 p-4 space-y-2">
      {has_fragments && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Fragmentos extraídos</span>
          <span className="font-medium">{(result as ContextProcessResult).fragments_total}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Criados</span>
        <span className="font-medium text-success">{result.created}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Mesclados</span>
        <span className="font-medium text-chart-5">{result.merged}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Ignorados</span>
        <span className="font-medium text-muted-foreground">{result.skipped}</span>
      </div>
      {result.conflicts.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Conflitos pendentes</span>
          <span className="font-medium text-destructive">{result.conflicts.length}</span>
        </div>
      )}
    </div>
  );
}
