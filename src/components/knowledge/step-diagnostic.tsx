"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useKnowledgeStore } from "@/lib/store";
import { getMockDiagnosticData, getMockPreviousMonthKnowledge } from "@/lib/mock/financial-data";
import { formatBrl, formatBrlCompact, formatPct, trendArrow, budgetStatus } from "@/lib/formatters";
import { DiagnosticData, KnowledgeExplanation, PreviousMonthKnowledge } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface StepDiagnosticProps {
  on_next: () => void;
  on_back: () => void;
}

export function StepDiagnostic({ on_next, on_back }: StepDiagnosticProps) {
  const { diretoria, mes_ref, show_all, explanations, bp_notes, setExplanation, setBpNotes } = useKnowledgeStore();
  const data = getMockDiagnosticData(diretoria);
  const prev_knowledge = getMockPreviousMonthKnowledge(diretoria);

  const filtered = show_all
    ? data.variances
    : data.variances.filter((v) => Math.abs(v.variance_pct) >= 0.1);

  const recurrent_count = 2; // mock

  return (
    <div className="space-y-4 p-4">
      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Delta Total"
          value={formatBrlCompact(data.totals.delta)}
          sub={data.totals.delta < 0 ? "Acima do budget" : "Abaixo do budget"}
          color={data.totals.delta < 0 ? "text-destructive" : "text-success"}
        />
        <MetricCard
          label="Linhas com Variação"
          value={String(filtered.length)}
          sub={show_all ? "Todas" : ">10% variação"}
        />
        <MetricCard
          label="Recorrentes"
          value={String(recurrent_count)}
          sub="Apareceram mês anterior"
          color="text-warning"
        />
      </div>

      {/* BP Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs">Notas do BP (opcional)</Label>
        <Textarea
          value={bp_notes}
          onChange={(e) => setBpNotes(e.target.value)}
          placeholder="Contexto adicional sobre o mês..."
          className="bg-secondary/30 text-xs h-16 resize-none"
        />
      </div>

      {/* Probing questions */}
      <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
        <p className="text-[11px] font-medium text-primary mb-2">
          Perguntas norteadoras
        </p>
        <ul className="space-y-1">
          {data.probing_questions.map((q, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              • {q}
            </li>
          ))}
        </ul>
      </div>

      {/* Variance table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary/30">
              <th className="px-3 py-2 text-left text-[11px]">Conta P&L</th>
              <th className="px-3 py-2 text-right text-[11px]">Real</th>
              <th className="px-3 py-2 text-right text-[11px]">Budget</th>
              <th className="px-3 py-2 text-right text-[11px]">Delta</th>
              <th className="px-3 py-2 text-right text-[11px]">Var%</th>
              <th className="px-3 py-2 text-center text-[11px]">Trend</th>
              <th className="px-3 py-2 text-center text-[11px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.conta_pl} className="border-b border-border/30 hover:bg-accent/20">
                <td className="px-3 py-1.5 font-medium">{v.conta_pl}</td>
                <td className="px-3 py-1.5 text-right font-mono">{formatBrl(v.real)}</td>
                <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{formatBrl(v.budget)}</td>
                <td className={`px-3 py-1.5 text-right font-mono ${v.delta < 0 ? "text-destructive" : "text-success"}`}>
                  {formatBrl(v.delta)}
                </td>
                <td className={`px-3 py-1.5 text-right font-mono ${v.variance_pct < -0.05 ? "text-destructive" : v.variance_pct > 0.05 ? "text-success" : ""}`}>
                  {formatPct(v.variance_pct)}
                </td>
                <td className="px-3 py-1.5 text-center">{trendArrow(v.trend)}</td>
                <td className="px-3 py-1.5 text-center">{budgetStatus(v.delta)}</td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="bg-secondary/20 font-semibold">
              <td className="px-3 py-1.5">TOTAL</td>
              <td className="px-3 py-1.5 text-right font-mono">{formatBrl(data.totals.real)}</td>
              <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{formatBrl(data.totals.budget)}</td>
              <td className={`px-3 py-1.5 text-right font-mono ${data.totals.delta < 0 ? "text-destructive" : "text-success"}`}>
                {formatBrl(data.totals.delta)}
              </td>
              <td className="px-3 py-1.5" colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Variance expanders */}
      <div className="space-y-2">
        {filtered.map((v) => (
          <VarianceExpander
            key={v.conta_pl}
            variance={v}
            diagnostic={data}
            explanation={explanations[v.conta_pl]}
            previous={prev_knowledge[v.conta_pl]}
            on_explain={(exp) => setExplanation(v.conta_pl, exp)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={on_back}>
          Voltar
        </Button>
        <Button onClick={on_next} className="bg-primary hover:bg-primary/90">
          Gerar Preview YAML
        </Button>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, sub, color,
}: {
  label: string; value: string; sub: string; color?: string;
}) {
  return (
    <Card className="p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color ?? "text-foreground"}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </Card>
  );
}

function VarianceExpander({
  variance, diagnostic, explanation, previous, on_explain,
}: {
  variance: { conta_pl: string; trend: number[] };
  diagnostic: DiagnosticData;
  explanation?: KnowledgeExplanation;
  previous?: PreviousMonthKnowledge;
  on_explain: (exp: KnowledgeExplanation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(explanation?.explanation ?? "");
  const suppliers = diagnostic.suppliers[variance.conta_pl];
  const bu = diagnostic.bu_breakdown[variance.conta_pl];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs hover:bg-accent/20 transition-colors">
        <span className="font-medium">{variance.conta_pl}</span>
        <div className="flex items-center gap-2">
          {explanation && (
            <span className="text-[10px] text-success">✓ explicado</span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {open ? "▾" : "▸"}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 rounded-md border border-border/50 bg-card/50 p-3 space-y-3">
        {/* Suppliers */}
        {suppliers && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">
              Top Fornecedores
            </p>
            <div className="space-y-1">
              {suppliers.map((s) => (
                <div key={s.supplier} className="flex justify-between text-xs">
                  <span>{s.supplier}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatBrl(s.value)} ({(s.pct_of_delta * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BU breakdown */}
        {bu && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">
              Breakdown por BU
            </p>
            <div className="space-y-1">
              {bu.map((b) => (
                <div key={b.bu} className="flex justify-between text-xs">
                  <span>{b.bu}</span>
                  <span className={`font-mono ${b.delta < 0 ? "text-destructive" : "text-success"}`}>
                    {formatBrl(b.delta)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-month trend */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
            Tendência 3 meses: {trendArrow(variance.trend)}{" "}
            {variance.trend.map(formatBrlCompact).join(" → ")}
          </p>
        </div>

        {previous && (
          <div className="rounded-md bg-primary/5 border border-primary/10 p-2.5">
            <p className="text-[10px] font-medium text-primary mb-1">
              Explicação mês anterior ({previous.mes_ref})
            </p>
            <p className="text-xs text-foreground/80">{previous.explanation}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-[9px] px-1">
                {previous.type}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 text-[10px] text-muted-foreground"
                onClick={() => setText(previous.explanation)}
              >
                Reusar explicação
              </Button>
            </div>
          </div>
        )}

        {/* Explanation textarea */}
        <div className="space-y-1">
          <Label className="text-[11px]">Explicação (max 1000 chars)</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            placeholder="Explique a variação..."
            className="bg-secondary/20 text-xs h-20 resize-none"
          />
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">
              {text.length}/1000
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px]"
              disabled={text.length < 10}
              onClick={() =>
                on_explain({
                  conta_pl: variance.conta_pl,
                  explanation: text,
                  type: "one-off",
                  expect_next_month: false,
                })
              }
            >
              Salvar Explicação
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
