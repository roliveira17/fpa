"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AVAILABLE_MONTHS } from "@/lib/constants";
import { getMockContextCheck } from "@/lib/mock/financial-data";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";

export function ContextView() {
  const [mes_ref, setMesRef] = useState("");
  const [transcript, setTranscript] = useState("");
  const [pdf_name, setPdfName] = useState("");
  const [is_processing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ content: string; path: string } | null>(null);
  const [preview_open, setPreviewOpen] = useState(false);

  const context_check = mes_ref ? getMockContextCheck(mes_ref) : null;
  const can_process = mes_ref && (transcript.trim() || pdf_name);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPdfName(file.name);
  }

  function handleProcess() {
    if (!can_process) return;
    setIsProcessing(true);

    setTimeout(() => {
      setResult({
        content: MOCK_GENERATED_MARKDOWN,
        path: `knowledge/fechamento-gerencial/${mes_ref}.md`,
      });
      setIsProcessing(false);
    }, 2000);
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 overflow-y-auto p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">Contexto Gerencial</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ingestão de transcrições e PDFs para enriquecer a base de conhecimento
        </p>
      </div>

      {/* Mês de referência */}
      <div className="space-y-2">
        <Label className="text-xs">Mês de Referência</Label>
        <Select value={mes_ref} onValueChange={(v) => setMesRef(v ?? "")}>
          <SelectTrigger className="bg-secondary/30">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MONTHS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {context_check && (
          <Badge
            variant={context_check.exists ? "default" : "outline"}
            className={`text-[10px] ${context_check.exists ? "bg-success/20 text-success border-success/30" : ""}`}
          >
            {context_check.exists ? "Arquivo existente — será atualizado" : "Novo arquivo será criado"}
          </Badge>
        )}
      </div>

      {/* Transcrição */}
      <div className="space-y-2">
        <Label className="text-xs">Transcrição de Reunião (opcional)</Label>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Cole aqui a transcrição da reunião gerencial..."
          className="bg-secondary/30 text-xs h-32 resize-none"
        />
      </div>

      {/* PDF Upload */}
      <div className="space-y-2">
        <Label className="text-xs">Upload PDF (opcional)</Label>
        <Card className="p-4 border-dashed border-2 border-border/50 bg-secondary/10">
          <div className="text-center">
            {pdf_name ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm">📄</span>
                <span className="text-xs">{pdf_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] text-muted-foreground"
                  onClick={() => setPdfName("")}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  Arraste ou clique para enviar apresentação, OKRs, etc.
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:text-primary cursor-pointer"
                />
              </>
            )}
          </div>
        </Card>
      </div>

      {!can_process && mes_ref && (
        <p className="text-xs text-warning">
          Pelo menos uma transcrição ou PDF é obrigatório.
        </p>
      )}

      {/* Process button */}
      <Button
        onClick={handleProcess}
        disabled={!can_process || is_processing}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {is_processing ? "Processando..." : "Processar Contexto"}
      </Button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="rounded-md bg-success/10 border border-success/20 p-3">
            <p className="text-sm text-success font-medium">
              Contexto gerencial processado com sucesso!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Salvo em: <span className="font-mono">{result.path}</span>
            </p>
          </div>

          <Collapsible open={preview_open} onOpenChange={setPreviewOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-[10px]">{preview_open ? "▾" : "▸"}</span>
              Preview do markdown gerado
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md border border-border bg-card p-4">
              <MarkdownRenderer content={result.content} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

const MOCK_GENERATED_MARKDOWN = `## Resumo Executivo — Janeiro 2025

| KPI | Valor | vs Budget | vs Mês Anterior |
|-----|-------|-----------|-----------------|
| Receita Líquida | R\\$ 366,6M | +4,0% | +1,2% |
| EBITDA | R\\$ 36,3M | +1,1% | +2,8% |
| Margem EBITDA | 9,9% | -0,3pp | +0,1pp |
| Lucro Líquido | R\\$ 15,5M | -2,6% | +3,1% |
| Base de Clientes | 4,2M | +5,0% | +1,8% |

## Narrativa do Mês

Janeiro marcou o início do ano fiscal com resultados mistos. O **crescimento top-line** continuou robusto, com receita líquida de R\\$ 366,6M (+4,0% vs budget), puxada principalmente pelo aumento na base de clientes e maior penetração de produtos de crédito.

No entanto, as **linhas de despesa** mostraram pressão, especialmente em G&A (+9,9% vs budget) e Pessoal (+4,7% vs budget), comprimindo a margem EBITDA para 9,9% vs os 10,2% orçados.

## Bridge de EBITDA

- Budget EBITDA: R\\$ 35,9M
- (+) Receita acima do budget: +R\\$ 14,0M
- (-) Custo de Serviços: -R\\$ 3,3M
- (-) Pessoal: -R\\$ 5,6M
- (-) G&A: -R\\$ 3,8M
- (+) Marketing savings: +R\\$ 1,3M
- (-) Tecnologia: -R\\$ 2,2M
- **= EBITDA Realizado: R\\$ 36,3M (+1,1%)**

## Riscos e Pontos de Atenção

- **G&A**: Consultoria jurídica concentra 87% do estouro — monitorar processos regulatórios
- **Pessoal**: Hiring acelerado em Engenharia pode pressionar Q1 inteiro
- **Provisões**: Crédito shows early signs of deterioration in newer vintages`;
