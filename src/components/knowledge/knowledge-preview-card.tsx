"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeExplanation } from "@/lib/types";

interface KnowledgePreviewCardProps {
  diretoria: string;
  mes_ref: string;
  analyst: string;
  explanations: Record<string, KnowledgeExplanation>;
  bp_notes: string;
}

const VARIANCE_TYPE_LABELS: Record<string, string> = {
  "one-off": "One-off",
  recurring: "Recorrente",
  seasonal: "Sazonal",
  reclassification: "Reclassificação",
};

export function KnowledgePreviewCard({
  diretoria, mes_ref, analyst, explanations, bp_notes,
}: KnowledgePreviewCardProps) {
  const entries = Object.values(explanations);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{diretoria} — {mes_ref}</CardTitle>
        <p className="text-xs text-muted-foreground">Analista: {analyst}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && !bp_notes && (
          <p className="text-xs text-muted-foreground">
            Nenhuma explicação preenchida. Adicione pelo menos uma variância ou nota.
          </p>
        )}
        {entries.map((entry) => (
          <div key={entry.conta_pl} className="rounded-md border border-border bg-secondary/20 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">{entry.conta_pl}</p>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[10px]">
                  {VARIANCE_TYPE_LABELS[entry.type] ?? entry.type}
                </Badge>
                {entry.expect_next_month && (
                  <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                    Esperado próx. mês
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{entry.explanation}</p>
          </div>
        ))}
        {bp_notes && (
          <div className="rounded-md border border-border bg-secondary/20 p-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">Notas adicionais</p>
            <p className="text-xs">{bp_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
