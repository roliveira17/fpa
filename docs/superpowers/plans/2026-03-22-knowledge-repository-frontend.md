# Knowledge Repository Frontend Refactor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the YAML-based knowledge capture flow with an API-backed system using preview cards, ingestion counters, and conflict resolution UI. All API calls are mocked until the backend is ready.

**Architecture:** Frontend-only changes. The API client (`src/lib/api.ts`) switches between mock and real implementations via `NEXT_PUBLIC_USE_MOCK_API` env var (defaults to `true`). No backend or database changes in this repo.

**Tech Stack:** Next.js 16.2, React 19, TypeScript, Tailwind 4, shadcn/ui (@base-ui/react), zustand, vitest, playwright

**Dependency chain:** Tasks must execute in order 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12. Tasks 5 and 6 are independent of each other and can run in parallel. Task 7 depends on 4. Tasks 8-10 depend on their respective component dependencies being complete.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/types.ts` | Modify | Add `KnowledgeEntry`, `IngestionResult`, `ConflictInfo`, `CatalogEntry`. Remove `KnowledgeYaml`. |
| `src/lib/store.ts` | Modify | Replace `yaml_text`/`saved_path` with `save_result`/`conflicts` in KnowledgeStore |
| `src/lib/mock/financial-data.ts` | Modify | Add `mockSaveKnowledge()`, `mockProcessContext()`, `mockResolveConflict()`. Update `getMockContextCheck()`. |
| `src/lib/api.ts` | Create | API client with mock/real switch |
| `src/components/knowledge/knowledge-preview-card.tsx` | Create | Formatted card replacing YAML editor |
| `src/components/knowledge/ingestion-summary.tsx` | Create | Counters display (created/merged/skipped) |
| `src/components/knowledge/conflict-resolution-modal.tsx` | Create | Dialog with keep/use_new/custom options |
| `src/components/knowledge/step-preview.tsx` | Modify | Replace YAML editor with preview card + API call |
| `src/components/knowledge/step-success.tsx` | Modify | Replace file paths with ingestion summary |
| `src/components/context/context-view.tsx` | Modify | Replace markdown preview with fragmentation summary |
| `src/components/knowledge/yaml-editor.tsx` | Delete | No longer needed |
| `src/lib/__tests__/store.test.ts` | Modify | Update KnowledgeStore tests |
| `src/lib/__tests__/mock-data.test.ts` | Modify | Add tests for new mock functions |
| `e2e/knowledge.spec.ts` | Modify | Update wizard happy path for cards + counters |
| `e2e/context.spec.ts` | Modify | Update to expect fragmentation summary |

---

## Task 1: Add New Types

Add the API-facing types and remove the YAML type.

**Files:** `src/lib/types.ts`
**Test:** `npm run build` (type-check only — no runtime tests needed for pure types)

- [ ] **Step 1: Add new interfaces to `src/lib/types.ts`**

After the existing `KnowledgeExplanation` interface (line 78), add:

```typescript
export interface KnowledgeEntry {
  id: string;
  diretoria: string;
  mes_ref: string;
  conta_pl: string | null;
  entry_type: 'variance_explanation' | 'context_gerencial' | 'bp_note';
  explanation: string;
  variance_type: 'one-off' | 'recurring' | 'seasonal' | 'reclassification' | null;
  expect_next: boolean;
  analyst: string;
  sources: string[];
  created_at: string;
  updated_at: string;
}

export interface IngestionResult {
  created: number;
  merged: number;
  skipped: number;
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  entry_id: string;
  existing_text: string;
  new_text: string;
  reason: string;
}

export interface ContextProcessResult {
  fragments_total: number;
  created: number;
  merged: number;
  skipped: number;
  conflicts: ConflictInfo[];
}

export interface CatalogEntry {
  id: string;
  table_name: string;
  description: string;
  granularity: string;
  columns: { name: string; type: string; description: string }[];
  use_cases: string[];
  sample_queries: { description: string; sql: string }[];
  is_active: boolean;
}
```

- [ ] **Step 2: Remove `KnowledgeYaml` interface**

Delete lines 80-88 (the `KnowledgeYaml` interface). It is not imported anywhere except `types.ts` itself — verify with a grep for `KnowledgeYaml` before deleting.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Commit: `refactor(types): add KnowledgeEntry, IngestionResult, ConflictInfo; remove KnowledgeYaml`

---

## Task 2: Update KnowledgeStore

Replace YAML-related state with API result state.

**Files:** `src/lib/store.ts`, `src/lib/__tests__/store.test.ts`

- [ ] **Step 1: Write failing tests in `src/lib/__tests__/store.test.ts`**

Add inside the existing `describe("KnowledgeStore")` block:

```typescript
it("sets save result", () => {
  const result = { created: 2, merged: 1, skipped: 0, conflicts: [] };
  useKnowledgeStore.getState().setSaveResult(result);
  expect(useKnowledgeStore.getState().save_result).toEqual(result);
});

it("sets conflicts", () => {
  const conflicts = [
    { entry_id: "abc", existing_text: "old", new_text: "new", reason: "contradiction" },
  ];
  useKnowledgeStore.getState().setConflicts(conflicts);
  expect(useKnowledgeStore.getState().conflicts).toHaveLength(1);
});

it("resolves a conflict by removing it from the list", () => {
  const conflicts = [
    { entry_id: "abc", existing_text: "old", new_text: "new", reason: "contradiction" },
    { entry_id: "def", existing_text: "old2", new_text: "new2", reason: "duplicate" },
  ];
  useKnowledgeStore.getState().setConflicts(conflicts);
  useKnowledgeStore.getState().resolveConflict("abc");
  expect(useKnowledgeStore.getState().conflicts).toHaveLength(1);
  expect(useKnowledgeStore.getState().conflicts[0].entry_id).toBe("def");
});

it("reset clears save_result and conflicts", () => {
  useKnowledgeStore.getState().setSaveResult({ created: 1, merged: 0, skipped: 0, conflicts: [] });
  useKnowledgeStore.getState().setConflicts([{ entry_id: "x", existing_text: "", new_text: "", reason: "" }]);
  useKnowledgeStore.getState().reset();
  expect(useKnowledgeStore.getState().save_result).toBeNull();
  expect(useKnowledgeStore.getState().conflicts).toEqual([]);
});
```

Run: `npm run test -- src/lib/__tests__/store.test.ts` — expect 4 new tests to **FAIL**.

- [ ] **Step 2: Update the store interface and initial state in `src/lib/store.ts`**

In the import line (line 2), add `IngestionResult, ConflictInfo`:

```typescript
import { ChatMessage, KnowledgeExplanation, LoadingStep, SettingsState, IngestionResult, ConflictInfo } from "./types";
```

In the `KnowledgeStore` interface, **remove**:
```typescript
yaml_text: string;
saved_path: string | string[] | null;
setYamlText: (v: string) => void;
setSavedPath: (v: string | string[] | null) => void;
```

**Add**:
```typescript
save_result: IngestionResult | null;
conflicts: ConflictInfo[];
setSaveResult: (r: IngestionResult | null) => void;
setConflicts: (c: ConflictInfo[]) => void;
resolveConflict: (entry_id: string) => void;
```

In `KNOWLEDGE_INITIAL`, **remove** `yaml_text: ""` and `saved_path: null`. **Add**:
```typescript
save_result: null,
conflicts: [],
```

In the `create<KnowledgeStore>` call, **remove** `setYamlText` and `setSavedPath`. **Add**:
```typescript
setSaveResult: (r) => set({ save_result: r }),
setConflicts: (c) => set({ conflicts: c }),
resolveConflict: (entry_id) =>
  set((s) => ({ conflicts: s.conflicts.filter((c) => c.entry_id !== entry_id) })),
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- src/lib/__tests__/store.test.ts
```

All tests should pass now. Run full suite to verify nothing else broke:

```bash
npm run test
```

Commit: `refactor(store): replace yaml_text/saved_path with save_result/conflicts in KnowledgeStore`

---

## Task 3: Add Mock API Functions

Add mock implementations that simulate the backend responses.

**Files:** `src/lib/mock/financial-data.ts`, `src/lib/__tests__/mock-data.test.ts`

- [ ] **Step 1: Write failing tests in `src/lib/__tests__/mock-data.test.ts`**

Add new describe blocks:

```typescript
import {
  getMockChatResponse,
  getMockDiagnosticData,
  getMockContextCheck,
  getMockVariances,
  mockSaveKnowledge,
  mockProcessContext,
  mockResolveConflict,
} from "../mock/financial-data";

// ... existing tests ...

describe("mockSaveKnowledge", () => {
  it("returns ingestion result with counters", async () => {
    const result = await mockSaveKnowledge({
      diretoria: "PRODUTO",
      mes_ref: "2025-01",
      analyst: "Test User",
      entry_type: "variance_explanation",
      entries: [
        { conta_pl: "G&A", explanation: "Test", variance_type: "one-off", expect_next: false },
        { conta_pl: "Pessoal", explanation: "Test 2", variance_type: "recurring", expect_next: true },
      ],
    });
    expect(result.created).toBeGreaterThanOrEqual(0);
    expect(result.merged).toBeGreaterThanOrEqual(0);
    expect(result.skipped).toBeGreaterThanOrEqual(0);
    expect(result.created + result.merged + result.skipped + result.conflicts.length).toBe(2);
  });

  it("returns a conflict when entry count is >= 3", async () => {
    const result = await mockSaveKnowledge({
      diretoria: "ENGENHARIA",
      mes_ref: "2025-01",
      analyst: "Test User",
      entry_type: "variance_explanation",
      entries: [
        { conta_pl: "A", explanation: "x", variance_type: "one-off", expect_next: false },
        { conta_pl: "B", explanation: "y", variance_type: "recurring", expect_next: false },
        { conta_pl: "C", explanation: "z", variance_type: "seasonal", expect_next: false },
      ],
    });
    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    expect(result.conflicts[0]).toHaveProperty("entry_id");
    expect(result.conflicts[0]).toHaveProperty("existing_text");
    expect(result.conflicts[0]).toHaveProperty("new_text");
    expect(result.conflicts[0]).toHaveProperty("reason");
  });
});

describe("mockProcessContext", () => {
  it("returns fragmentation summary", async () => {
    const result = await mockProcessContext({
      mes_ref: "2025-01",
      analyst: "Test User",
      transcript: "Reunião de fechamento...",
    });
    expect(result).toHaveProperty("fragments_total");
    expect(result).toHaveProperty("created");
    expect(result).toHaveProperty("merged");
    expect(result).toHaveProperty("skipped");
    expect(result.fragments_total).toBeGreaterThan(0);
  });
});

describe("mockResolveConflict", () => {
  it("resolves without error", async () => {
    const result = await mockResolveConflict({
      entry_id: "abc-123",
      resolution: "keep_existing",
    });
    expect(result).toEqual({ ok: true });
  });
});
```

Run: `npm run test -- src/lib/__tests__/mock-data.test.ts` — expect 4 new tests to **FAIL**.

- [ ] **Step 2: Add mock functions to `src/lib/mock/financial-data.ts`**

Add imports at top:

```typescript
import { AgentResponse, DreRow, Variance, DiagnosticData, SupplierBreakdown, BuBreakdown, PreviousMonthKnowledge, IngestionResult, ConflictInfo, ContextProcessResult } from "../types";
```

Add these functions at the end of the file:

```typescript
interface SaveKnowledgeInput {
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

export async function mockSaveKnowledge(input: SaveKnowledgeInput): Promise<IngestionResult> {
  await new Promise((r) => setTimeout(r, 800));

  const total = input.entries.length;
  const has_conflict = total >= 3;

  if (has_conflict) {
    const conflict_entry = input.entries[total - 1];
    return {
      created: total - 2,
      merged: 1,
      skipped: 0,
      conflicts: [
        {
          entry_id: crypto.randomUUID(),
          existing_text: `Explicação anterior para ${conflict_entry.conta_pl}: tendência de estabilização prevista para março.`,
          new_text: conflict_entry.explanation,
          reason: "Contradição detectada: a explicação anterior indica estabilização, mas a nova indica continuidade.",
        },
      ],
    };
  }

  const created = Math.max(1, total - 1);
  const merged = total - created;
  return { created, merged, skipped: 0, conflicts: [] };
}

interface ProcessContextInput {
  mes_ref: string;
  analyst: string;
  transcript?: string;
  pdf?: File;
}

export async function mockProcessContext(input: ProcessContextInput): Promise<ContextProcessResult> {
  await new Promise((r) => setTimeout(r, 2000));

  return {
    fragments_total: 7,
    created: 4,
    merged: 2,
    skipped: 1,
    conflicts: [],
  };
}

interface ResolveConflictInput {
  entry_id: string;
  resolution: 'keep_existing' | 'use_new' | 'custom';
  custom_text?: string;
}

export async function mockResolveConflict(input: ResolveConflictInput): Promise<{ ok: true }> {
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true };
}
```

Also update `getMockContextCheck` to return the new shape while staying backward-compatible (old `content` field kept until Task 10 rewrites ContextView):

```typescript
export function getMockContextCheck(mes_ref: string): { exists: boolean; entry_count?: number; content?: string } {
  if (mes_ref === "2025-01") {
    return { exists: true, entry_count: 12, content: "Resumo executivo placeholder" };
  }
  return { exists: false };
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- src/lib/__tests__/mock-data.test.ts
```

All tests pass. Then full suite:

```bash
npm run test
```

Commit: `feat(mock): add mockSaveKnowledge, mockProcessContext, mockResolveConflict`

---

## Task 4: Create API Client

The API client abstracts over mock/real implementations.

**Files:** `src/lib/api.ts`

- [ ] **Step 1: Create `src/lib/api.ts`**

```typescript
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Commit: `feat(api): add API client with mock/real switch for knowledge endpoints`

---

## Task 5: Create KnowledgePreviewCard Component

Formatted card showing explanations grouped by conta_pl, replacing the YAML editor.

**Files:** `src/components/knowledge/knowledge-preview-card.tsx`

- [ ] **Step 1: Create `src/components/knowledge/knowledge-preview-card.tsx`**

```typescript
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
  diretoria,
  mes_ref,
  analyst,
  explanations,
  bp_notes,
}: KnowledgePreviewCardProps) {
  const entries = Object.values(explanations);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {diretoria} — {mes_ref}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Analista: {analyst}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 && !bp_notes && (
          <p className="text-xs text-muted-foreground">
            Nenhuma explicação preenchida. Adicione pelo menos uma variância ou nota.
          </p>
        )}

        {entries.map((entry) => (
          <div
            key={entry.conta_pl}
            className="rounded-md border border-border bg-secondary/20 p-3 space-y-1"
          >
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
            <p className="text-[10px] font-medium text-muted-foreground mb-1">
              Notas adicionais
            </p>
            <p className="text-xs">{bp_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Commit: `feat(ui): add KnowledgePreviewCard component`

---

## Task 6: Create IngestionSummary Component

Displays created/merged/skipped counters.

**Files:** `src/components/knowledge/ingestion-summary.tsx`

- [ ] **Step 1: Create `src/components/knowledge/ingestion-summary.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Commit: `feat(ui): add IngestionSummary component`

---

## Task 7: Create ConflictResolutionModal

Dialog for resolving contradictions.

**Files:** `src/components/knowledge/conflict-resolution-modal.tsx`

- [ ] **Step 1: Create `src/components/knowledge/conflict-resolution-modal.tsx`**

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ConflictInfo } from "@/lib/types";
import { resolveConflict } from "@/lib/api";

interface ConflictResolutionModalProps {
  conflict: ConflictInfo | null;
  open: boolean;
  on_resolved: (entry_id: string) => void;
  on_close: () => void;
}

type Resolution = "keep_existing" | "use_new" | "custom";

export function ConflictResolutionModal({
  conflict,
  open,
  on_resolved,
  on_close,
}: ConflictResolutionModalProps) {
  const [selected, setSelected] = useState<Resolution | null>(null);
  const [custom_text, setCustomText] = useState("");
  const [is_saving, setIsSaving] = useState(false);

  if (!conflict) return null;

  async function handleResolve() {
    if (!selected || !conflict) return;
    setIsSaving(true);
    try {
      await resolveConflict({
        entry_id: conflict.entry_id,
        resolution: selected,
        custom_text: selected === "custom" ? custom_text : undefined,
      });
      on_resolved(conflict.entry_id);
    } finally {
      setIsSaving(false);
      setSelected(null);
      setCustomText("");
    }
  }

  const options: { value: Resolution; label: string; description: string }[] = [
    { value: "keep_existing", label: "Manter existente", description: conflict.existing_text },
    { value: "use_new", label: "Usar nova", description: conflict.new_text },
    { value: "custom", label: "Editar manualmente", description: "Escreva o texto final abaixo" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && on_close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conflito detectado</DialogTitle>
          <DialogDescription className="text-xs">
            {conflict.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`w-full rounded-md border p-3 text-left text-xs transition-colors ${
                selected === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/10"
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="mt-1 text-muted-foreground">{opt.description}</p>
            </button>
          ))}
        </div>

        {selected === "custom" && (
          <Textarea
            value={custom_text}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Escreva a explicação final..."
            className="text-xs h-24 resize-none"
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={on_close} disabled={is_saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selected || (selected === "custom" && !custom_text.trim()) || is_saving}
            className="bg-primary hover:bg-primary/90"
          >
            {is_saving ? "Salvando..." : "Resolver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Commit: `feat(ui): add ConflictResolutionModal component`

---

## Task 8: Refactor StepPreview

Replace YAML editor with KnowledgePreviewCard and API call.

**Files:** `src/components/knowledge/step-preview.tsx`

- [ ] **Step 1: Rewrite `src/components/knowledge/step-preview.tsx`**

Replace the entire file content:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useKnowledgeStore } from "@/lib/store";
import { saveKnowledge } from "@/lib/api";
import { KnowledgePreviewCard } from "./knowledge-preview-card";
import { ConflictResolutionModal } from "./conflict-resolution-modal";
import type { ConflictInfo } from "@/lib/types";

// Note: useKnowledgeStore is also used as useKnowledgeStore.getState() for fresh reads after mutations

interface StepPreviewProps {
  on_next: () => void;
  on_back: () => void;
}

export function StepPreview({ on_next, on_back }: StepPreviewProps) {
  const store = useKnowledgeStore();
  const { group_squads, diretoria, mes_ref, analyst_name, explanations, bp_notes } = store;
  const is_group = group_squads.length > 0;
  const [is_saving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active_conflict, setActiveConflict] = useState<ConflictInfo | null>(null);

  const has_content = Object.keys(explanations).length > 0 || bp_notes.trim().length > 0;

  function buildEntries() {
    const entries = Object.values(explanations).map((exp) => ({
      conta_pl: exp.conta_pl,
      explanation: exp.explanation,
      variance_type: exp.type,
      expect_next: exp.expect_next_month,
    }));
    if (bp_notes.trim()) {
      entries.push({
        conta_pl: null as unknown as string,
        explanation: bp_notes,
        variance_type: "one-off" as const,
        expect_next: false,
      });
    }
    return entries;
  }

  async function handleSave(target_diretoria: string) {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveKnowledge({
        diretoria: target_diretoria,
        mes_ref,
        analyst: analyst_name,
        entry_type: "variance_explanation",
        entries: buildEntries(),
      });

      store.setSaveResult(result);

      if (result.conflicts.length > 0) {
        store.setConflicts(result.conflicts);
        setActiveConflict(result.conflicts[0]);
      } else {
        on_next();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conhecimento.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAll() {
    setIsSaving(true);
    setError(null);
    try {
      let total_created = 0;
      let total_merged = 0;
      let total_skipped = 0;
      const all_conflicts: ConflictInfo[] = [];

      for (const squad of group_squads) {
        const result = await saveKnowledge({
          diretoria: squad,
          mes_ref,
          analyst: analyst_name,
          entry_type: "variance_explanation",
          entries: buildEntries(),
        });

        total_created += result.created;
        total_merged += result.merged;
        total_skipped += result.skipped;
        all_conflicts.push(...result.conflicts);
      }

      store.setSaveResult({
        created: total_created,
        merged: total_merged,
        skipped: total_skipped,
        conflicts: all_conflicts,
      });

      if (all_conflicts.length > 0) {
        store.setConflicts(all_conflicts);
        setActiveConflict(all_conflicts[0]);
      } else {
        on_next();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conhecimento.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleConflictResolved(entry_id: string) {
    store.resolveConflict(entry_id);
    const remaining = useKnowledgeStore.getState().conflicts;
    if (remaining.length > 0) {
      setActiveConflict(remaining[0]);
    } else {
      setActiveConflict(null);
      on_next();
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      {is_group ? (
        <div className="space-y-3">
          {group_squads.map((squad) => (
            <Collapsible key={squad} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent/20">
                {squad}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <KnowledgePreviewCard
                  diretoria={squad}
                  mes_ref={mes_ref}
                  analyst={analyst_name}
                  explanations={explanations}
                  bp_notes={bp_notes}
                />
              </CollapsibleContent>
            </Collapsible>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={on_back}>Voltar</Button>
            <Button
              onClick={handleSaveAll}
              disabled={!has_content || is_saving}
              className="bg-primary hover:bg-primary/90"
            >
              {is_saving ? "Salvando..." : "Salvar Todos"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium mb-2">Preview do Conhecimento</p>
            <KnowledgePreviewCard
              diretoria={diretoria}
              mes_ref={mes_ref}
              analyst={analyst_name}
              explanations={explanations}
              bp_notes={bp_notes}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={on_back}>
              Voltar
            </Button>
            <Button
              onClick={() => handleSave(diretoria)}
              disabled={!has_content || is_saving}
              className="bg-primary hover:bg-primary/90"
            >
              {is_saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <ConflictResolutionModal
        conflict={active_conflict}
        open={active_conflict !== null}
        on_resolved={handleConflictResolved}
        on_close={() => setActiveConflict(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Commit: `refactor(step-preview): replace YAML editor with KnowledgePreviewCard and API save`

---

## Task 9: Refactor StepSuccess

Replace file path display with IngestionSummary.

**Files:** `src/components/knowledge/step-success.tsx`

- [ ] **Step 1: Rewrite `src/components/knowledge/step-success.tsx`**

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { useKnowledgeStore, useChatStore, useAppStore } from "@/lib/store";
import { getMockChatResponse } from "@/lib/mock/financial-data";
import { IngestionSummary } from "./ingestion-summary";

export function StepSuccess() {
  const { diretoria, mes_ref, save_result, reset, group_squads } = useKnowledgeStore();
  const is_group = group_squads.length > 0;
  const { addMessage, setLoading } = useChatStore();
  const { setActiveTab } = useAppStore();

  function handleFollowUp(query: string) {
    setActiveTab("chat");

    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    });

    setLoading(true);
    setTimeout(() => {
      const response = getMockChatResponse(query);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.text,
        response,
        timestamp: new Date(),
      });
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8 text-center">
      <div className="text-5xl animate-bounce">🎉</div>
      <div>
        <h3 className="text-lg font-semibold">Conhecimento salvo!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          As explicações foram registradas com sucesso.
        </p>
      </div>

      {save_result && <IngestionSummary result={save_result} />}

      {is_group ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sugestões por squad:</p>
          <div className="flex flex-wrap gap-2">
            {group_squads.map((squad) => (
              <Button
                key={squad}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleFollowUp(`Analise ${squad} ${mes_ref}`)}
              >
                Analise {squad} {mes_ref}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sugestões de follow-up:</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleFollowUp(`Analise ${diretoria} ${mes_ref}`)}
          >
            Analise {diretoria} {mes_ref}
          </Button>
        </div>
      )}

      <Button
        onClick={reset}
        variant="outline"
        className="mt-4"
      >
        Iniciar novo registro
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Commit: `refactor(step-success): replace file paths with IngestionSummary counters`

---

## Task 10: Refactor ContextView

Replace markdown preview with fragmentation summary.

**Files:** `src/components/context/context-view.tsx`

- [ ] **Step 1: Rewrite `src/components/context/context-view.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Commit: `refactor(context-view): replace markdown preview with fragmentation summary`

---

## Task 11: Delete YamlEditor

**Files:** `src/components/knowledge/yaml-editor.tsx`

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -r "yaml-editor\|YamlEditor" src/
```

Expected: zero results.

- [ ] **Step 2: Delete the file**

```bash
rm src/components/knowledge/yaml-editor.tsx
```

- [ ] **Step 3: Verify build and tests**

```bash
npm run build && npm run test
```

Commit: `chore: delete yaml-editor.tsx (replaced by KnowledgePreviewCard)`

---

## Task 12: Update E2E Tests

Update Playwright tests for the new UI.

**Files:** `e2e/knowledge.spec.ts`, `e2e/context.spec.ts`, `src/components/knowledge/step-diagnostic.tsx`

- [ ] **Step 1: Update button text in `src/components/knowledge/step-diagnostic.tsx`**

Change "Gerar Preview YAML" to "Gerar Preview" in the button that triggers `on_next()`.

- [ ] **Step 2: Update `e2e/knowledge.spec.ts`**

Replace the file content:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Knowledge Input", () => {
  test("completes wizard happy path", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Knowledge Input" }).click();

    await page.getByPlaceholder("Seu nome completo").fill("Test User");

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /PRODUTO/ }).click();

    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "2025-01" }).click();

    await page.getByRole("button", { name: "Buscar Variações" }).click();

    await expect(page.getByText("Delta Total")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Despesas com Pessoal" })).toBeVisible();

    await page
      .getByPlaceholder("Contexto adicional sobre o mês...")
      .fill("Notas de teste para validação.");

    await page.getByRole("button", { name: "Gerar Preview" }).click();

    await expect(page.getByText("Preview do Conhecimento")).toBeVisible();

    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Conhecimento salvo!")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Criados")).toBeVisible();
    await expect(page.getByText("Mesclados")).toBeVisible();
  });

  test("shows group mode for Engenharia squad", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Knowledge Input" }).click();

    await page.getByPlaceholder("Seu nome completo").fill("Test User");

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /^DADOS/ }).click();

    await expect(page.getByText("Modo grupo ativo")).toBeVisible();

    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "2025-01" }).click();

    await page.getByRole("button", { name: "Buscar Variações" }).click();

    await expect(page.getByRole("tab", { name: "DADOS" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "DEVOPS" })).toBeVisible();
  });
});
```

- [ ] **Step 3: Update `e2e/context.spec.ts`**

Replace the file content:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Context", () => {
  test("processes context with transcript", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name: "Contexto Gerencial" }).click();

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "2025-01" }).click();

    await expect(
      page.getByText(/Conhecimento existente/)
    ).toBeVisible();

    await page
      .getByPlaceholder("Cole aqui a transcrição da reunião gerencial...")
      .fill("Reunião de fechamento do mês com discussão sobre resultados");

    await page.getByRole("button", { name: "Processar Contexto" }).click();

    await expect(
      page.getByText("Contexto gerencial processado com sucesso!")
    ).toBeVisible({ timeout: 5000 });

    await expect(page.getByText("Fragmentos extraídos")).toBeVisible();
    await expect(page.getByText("Criados")).toBeVisible();
    await expect(page.getByText("Mesclados")).toBeVisible();
  });
});
```

- [ ] **Step 4: Run all tests**

```bash
npm run test && npm run test:e2e
```

Commit: `test: update E2E tests for knowledge repository frontend refactor`

---

## Verification Checklist

After all tasks:

- [ ] `npm run build` — zero errors
- [ ] `npm run lint` — zero warnings
- [ ] `npm run test` — all unit tests pass
- [ ] `npm run test:e2e` — all E2E tests pass
- [ ] Knowledge Wizard step 3 shows formatted card, not YAML
- [ ] Save triggers mock API call and shows ingestion counters on step 4
- [ ] Conflict modal appears when mock returns conflicts (3+ entries)
- [ ] Context View shows fragmentation summary instead of markdown preview
- [ ] Group mode (Engenharia → 4 squads) works end-to-end
- [ ] No references to `yaml-editor`, `YamlEditor`, `generateYaml`, `validateYaml`, `KnowledgeYaml`, `yaml_text`, or `saved_path` remain in the codebase
