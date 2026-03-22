import type { IngestionResult, ContextProcessResult, KnowledgeEntry } from "./types";
import { mockSaveKnowledge, mockProcessContext, mockResolveConflict } from "./mock/financial-data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

interface SaveKnowledgePayload {
  diretoria: string;
  mes_ref: string;
  analyst: string;
  entry_type: 'variance_explanation' | 'bp_note';
  entries: {
    conta_pl: string | null;
    explanation: string;
    variance_type: 'one-off' | 'recurring' | 'seasonal' | 'reclassification';
    expect_next: boolean;
  }[];
}

interface ResolveConflictPayload {
  entry_id: string;
  resolution: 'keep_existing' | 'use_new' | 'custom';
  custom_text?: string;
}

interface ProcessContextPayload {
  mes_ref: string;
  analyst: string;
  transcript?: string;
  pdf?: File;
}

interface SearchKnowledgePayload {
  diretoria?: string;
  mes_ref_start?: string;
  mes_ref_end?: string;
  conta_pl?: string;
  entry_type?: string;
  text_search?: string;
  limit?: number;
}

export async function saveKnowledge(payload: SaveKnowledgePayload): Promise<IngestionResult> {
  if (USE_MOCK) return mockSaveKnowledge(payload);
  const res = await fetch("/api/knowledge/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}

export async function resolveConflict(payload: ResolveConflictPayload): Promise<{ ok: true }> {
  if (USE_MOCK) return mockResolveConflict(payload);
  const res = await fetch("/api/knowledge/resolve-conflict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resolve failed: ${res.status}`);
  return res.json();
}

export async function processContext(payload: ProcessContextPayload): Promise<ContextProcessResult> {
  if (USE_MOCK) return mockProcessContext(payload);
  const form = new FormData();
  form.append("mes_ref", payload.mes_ref);
  form.append("analyst", payload.analyst);
  if (payload.transcript) form.append("transcript", payload.transcript);
  if (payload.pdf) form.append("pdf", payload.pdf);
  const res = await fetch("/api/context/process", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Process failed: ${res.status}`);
  return res.json();
}

export async function searchKnowledge(payload: SearchKnowledgePayload): Promise<KnowledgeEntry[]> {
  if (USE_MOCK) return [];
  const res = await fetch("/api/knowledge/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  return data.entries;
}
