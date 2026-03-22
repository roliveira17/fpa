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
import { AVAILABLE_MONTHS } from "@/lib/constants";
import { getMockContextCheck } from "@/lib/mock/financial-data";
import { processContext } from "@/lib/api";
import { IngestionSummary } from "@/components/knowledge/ingestion-summary";
import type { ContextProcessResult } from "@/lib/types";

export function ContextView() {
  const [mes_ref, setMesRef] = useState("");
  const [transcript, setTranscript] = useState("");
  const [pdf_name, setPdfName] = useState("");
  const [pdf_file, setPdfFile] = useState<File | null>(null);
  const [is_processing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ContextProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const context_check = mes_ref ? getMockContextCheck(mes_ref) : null;
  const can_process = mes_ref && (transcript.trim() || pdf_name);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPdfName(file.name);
      setPdfFile(file);
    }
  }

  async function handleProcess() {
    if (!can_process) return;
    setIsProcessing(true);
    setError(null);
    try {
      const response = await processContext({
        mes_ref,
        analyst: "Current User", // TODO: get from session
        transcript: transcript || undefined,
        pdf: pdf_file || undefined,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar contexto.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 overflow-y-auto p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">Contexto Gerencial</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ingestão de transcrições e PDFs para enriquecer a base de conhecimento
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Mês de Referência</Label>
        <Select value={mes_ref} onValueChange={(v) => setMesRef(v ?? "")}>
          <SelectTrigger className="bg-secondary/30">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MONTHS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {context_check && (
          <Badge
            variant={context_check.exists ? "default" : "outline"}
            className={`text-[10px] ${context_check.exists ? "bg-success/20 text-success border-success/30" : ""}`}
          >
            {context_check.exists
              ? `Conhecimento existente — ${context_check.entry_count} entradas serão mescladas`
              : "Novo — entradas serão criadas"}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Transcrição de Reunião (opcional)</Label>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Cole aqui a transcrição da reunião gerencial..."
          className="bg-secondary/30 text-xs h-32 resize-none"
        />
      </div>

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
                  onClick={() => { setPdfName(""); setPdfFile(null); }}
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

      <Button
        onClick={handleProcess}
        disabled={!can_process || is_processing}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {is_processing ? "Processando..." : "Processar Contexto"}
      </Button>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="rounded-md bg-success/10 border border-success/20 p-3">
            <p className="text-sm text-success font-medium">
              Contexto gerencial processado com sucesso!
            </p>
          </div>
          <IngestionSummary result={result} />
        </div>
      )}
    </div>
  );
}
