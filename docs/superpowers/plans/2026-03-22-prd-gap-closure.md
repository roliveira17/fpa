# PRD Gap Closure — Agente FP&A Cora

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 6 remaining gaps between the current frontend and the PRD spec, bringing coverage from ~85% to 100%.

**Architecture:** All changes are frontend-only with mock data. The store, types, and mock data modules are extended as needed; no backend or API routes required.

**Dependency note:** Tasks 3 and 4 both modify `step-preview.tsx` — execute Task 3 before Task 4 to avoid merge conflicts. All other tasks are independent.

**Tech Stack:** Next.js 16.2, React 19, TypeScript, Tailwind 4, shadcn/ui, zustand, recharts

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/types.ts` | Modify | Add `LoadingStep`, `SettingsState`, `PreviousMonthKnowledge` types |
| `src/lib/store.ts` | Modify | Add `loading_step` to ChatStore, add `SettingsStore` |
| `src/lib/mock/financial-data.ts` | Modify | Add `getMockPreviousMonthKnowledge()`, extend `getMockDiagnosticData()` |
| `src/lib/constants.ts` | Modify | Add `LOADING_STEPS` constant, `DEFAULT_SETTINGS` |
| `src/components/chat/chat-view.tsx` | Modify | Replace dots animation with `LoadingSteps` component |
| `src/components/chat/loading-steps.tsx` | Create | Multi-step loading indicator ("Gerando SQL...", "Executando...", "Analisando...") |
| `src/components/knowledge/step-diagnostic.tsx` | Modify | Add previous month knowledge to `VarianceExpander`, add group mode processing |
| `src/components/knowledge/step-preview.tsx` | Modify | Add group mode (one expander per squad, "Salvar todos" button) |
| `src/components/knowledge/step-success.tsx` | Modify | Add group mode (one follow-up suggestion per squad) |
| `src/components/knowledge/yaml-editor.tsx` | Create | Syntax-highlighted YAML editor with line numbers |
| `src/components/layout/settings-panel.tsx` | Create | Settings sheet (LLM model, data source, language, theme) |
| `src/components/layout/header.tsx` | Modify | Add settings button that opens settings panel |
| `src/app/globals.css` | Modify | Add responsive breakpoints, tablet adaptations |
| `src/app/page.tsx` | Modify | Add responsive classes, mobile sidebar handling |
| `src/components/layout/sidebar-left.tsx` | Modify | Collapsible on tablet via Sheet |
| `src/components/knowledge/step-selection.tsx` | Modify | Add group resolution on "Buscar Variações" click |
| `src/components/layout/sidebar-right.tsx` | Modify | Hidden by default on tablet, Sheet on mobile |

---

## Task 1: Streaming Loading Steps

Replace the simple "Analisando..." dots with a multi-step progress indicator that simulates the real agent pipeline.

**Files:**
- Create: `src/components/chat/loading-steps.tsx`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/store.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/components/chat/chat-view.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add types and constants**

In `src/lib/types.ts`, add at the end:

```typescript
export type LoadingStep = "generating_sql" | "executing_query" | "analyzing" | "rendering";
```

In `src/lib/constants.ts`, add at the end:

```typescript
export const LOADING_STEPS: { id: LoadingStep; label: string }[] = [
  { id: "generating_sql", label: "Gerando SQL..." },
  { id: "executing_query", label: "Executando query..." },
  { id: "analyzing", label: "Analisando resultados..." },
  { id: "rendering", label: "Renderizando resposta..." },
];
```

- [ ] **Step 2: Extend ChatStore**

In `src/lib/store.ts`, add `loading_step` to the `ChatStore` interface and implementation:

```typescript
interface ChatStore {
  messages: ChatMessage[];
  is_loading: boolean;
  loading_step: LoadingStep | null;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (v: boolean) => void;
  setLoadingStep: (step: LoadingStep | null) => void;
  clearMessages: () => void;
}
```

Add to the create call:
```typescript
loading_step: null,
setLoadingStep: (step) => set({ loading_step: step }),
```

Also update `setLoading` so it clears `loading_step` when loading is set to false:
```typescript
setLoading: (v) => set({ is_loading: v, ...(v ? {} : { loading_step: null }) }),
```

- [ ] **Step 3: Create LoadingSteps component**

Create `src/components/chat/loading-steps.tsx`:

```tsx
"use client";

import { LOADING_STEPS } from "@/lib/constants";
import { LoadingStep } from "@/lib/types";

interface LoadingStepsProps {
  current_step: LoadingStep | null;
}

export function LoadingSteps({ current_step }: LoadingStepsProps) {
  const current_idx = LOADING_STEPS.findIndex((s) => s.id === current_step);

  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
        C
      </div>
      <div className="space-y-1.5 py-1">
        {LOADING_STEPS.map((step, i) => {
          const is_done = i < current_idx;
          const is_active = i === current_idx;
          const is_pending = i > current_idx;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${
                is_done ? "bg-success" :
                is_active ? "bg-primary animate-pulse" :
                "bg-muted-foreground/30"
              }`} />
              <span className={`text-xs ${
                is_done ? "text-success" :
                is_active ? "text-foreground" :
                is_pending ? "text-muted-foreground/40" :
                ""
              }`}>
                {is_done ? step.label.replace("...", " ✓") : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire loading steps into chat-view.tsx**

In `src/components/chat/chat-view.tsx`:

Replace the `is_loading` dots block (lines ~60-72) with:

```tsx
import { LoadingSteps } from "./loading-steps";
// in component:
const { messages, is_loading, loading_step, addMessage, setLoading } = useChatStore();
// replace the is_loading block:
{is_loading && <LoadingSteps current_step={loading_step} />}
```

- [ ] **Step 5: Simulate step progression in page.tsx and chat-view.tsx**

In `src/app/page.tsx`, add `setLoadingStep` to the **existing** destructuring on line 26:
```typescript
const { addMessage, setLoading, setLoadingStep } = useChatStore();
```

In `src/components/chat/chat-view.tsx`, add `setLoadingStep` to the **existing** destructuring on line 14:
```typescript
const { messages, is_loading, loading_step, addMessage, setLoading, setLoadingStep } = useChatStore();
```

In both files, replace the single `setTimeout` block with a stepped simulation:

```typescript
// Replace the setTimeout block with:
setLoading(true);
setLoadingStep("generating_sql");

setTimeout(() => setLoadingStep("executing_query"), 400);
setTimeout(() => setLoadingStep("analyzing"), 900);
setTimeout(() => setLoadingStep("rendering"), 1300);
setTimeout(() => {
  const response = getMockChatResponse(text);
  const assistant_msg: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: response.text,
    response,
    timestamp: new Date(),
  };
  addMessage(assistant_msg);
  setLoading(false);
}, 1700);
```

- [ ] **Step 6: Build and verify**

Run: `npx next build`
Expected: Build passes, no TS errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/store.ts src/lib/constants.ts src/components/chat/loading-steps.tsx src/components/chat/chat-view.tsx src/app/page.tsx
git commit -m "feat: add multi-step loading indicator to chat"
```

---

## Task 2: Previous Month Knowledge in Diagnostic Expanders

Show knowledge from the previous month inside each variance expander, so BPs can see what was explained last time.

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/mock/financial-data.ts`
- Modify: `src/components/knowledge/step-diagnostic.tsx`

- [ ] **Step 1: Add mock function for previous month knowledge**

In `src/lib/types.ts`, add:

```typescript
export interface PreviousMonthKnowledge {
  conta_pl: string;
  explanation: string;
  type: KnowledgeExplanation["type"];
  mes_ref: string;
}
```

In `src/lib/mock/financial-data.ts`, add at the end:

```typescript
export function getMockPreviousMonthKnowledge(diretoria: string): Record<string, PreviousMonthKnowledge> {
  return {
    "Despesas com Pessoal": {
      conta_pl: "Despesas com Pessoal",
      explanation: "Aumento de 12 novas posições em Engenharia aprovadas no board de dezembro. Impacto de R$ 1.2M no mês, tendência de estabilização em março.",
      type: "recurring",
      mes_ref: "2024-12",
    },
    "Serviços de Terceiros": {
      conta_pl: "Serviços de Terceiros",
      explanation: "Projeto de migração cloud com Accenture — fase 2 iniciada em novembro. Previsto encerramento em fevereiro.",
      type: "one-off",
      mes_ref: "2024-12",
    },
  };
}
```

- [ ] **Step 2: Show previous month knowledge in VarianceExpander**

In `src/components/knowledge/step-diagnostic.tsx`:

Add import:
```typescript
import { getMockPreviousMonthKnowledge } from "@/lib/mock/financial-data";
import { PreviousMonthKnowledge } from "@/lib/types";
```

Inside `StepDiagnostic`, fetch previous knowledge:
```typescript
const prev_knowledge = getMockPreviousMonthKnowledge(diretoria);
```

Pass to each `VarianceExpander`:
```tsx
<VarianceExpander
  key={v.conta_pl}
  variance={v}
  diagnostic={data}
  explanation={explanations[v.conta_pl]}
  previous={prev_knowledge[v.conta_pl]}
  on_explain={(exp) => setExplanation(v.conta_pl, exp)}
/>
```

Update `VarianceExpander` props type (around line 167-173 of step-diagnostic.tsx). Change the existing props type from:
```typescript
{
  variance: { conta_pl: string; trend: number[] };
  diagnostic: DiagnosticData;
  explanation?: KnowledgeExplanation;
  on_explain: (exp: KnowledgeExplanation) => void;
}
```
To:
```typescript
{
  variance: { conta_pl: string; trend: number[] };
  diagnostic: DiagnosticData;
  explanation?: KnowledgeExplanation;
  previous?: PreviousMonthKnowledge;
  on_explain: (exp: KnowledgeExplanation) => void;
}
```

Add `previous` to the function destructuring. Then render before the explanation textarea:

```tsx
{/* Previous month knowledge */}
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
```

Add `Badge` to imports from `@/components/ui/badge`.

- [ ] **Step 3: Build and verify**

Run: `npx next build`
Expected: Build passes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/mock/financial-data.ts src/components/knowledge/step-diagnostic.tsx
git commit -m "feat: add previous month knowledge to variance expanders"
```

---

## Task 3: Full Group Mode (Engenharia → 4 Squads)

Currently the wizard shows an alert when Engenharia is selected, but doesn't actually process squads separately. Implement full group mode: diagnostic shows tabs per squad, preview shows one YAML per squad, success shows per-squad follow-ups.

**Files:**
- Modify: `src/lib/store.ts`
- Modify: `src/lib/constants.ts`
- Modify: `src/components/knowledge/step-diagnostic.tsx`
- Modify: `src/components/knowledge/step-preview.tsx`
- Modify: `src/components/knowledge/step-success.tsx`

- [ ] **Step 1: Add group-aware state to KnowledgeStore**

In `src/lib/store.ts`, modify `KnowledgeStore`:

Add to interface:
```typescript
group_squads: string[];
active_squad: string;
setGroupSquads: (squads: string[]) => void;
setActiveSquad: (squad: string) => void;
```

Add to `KNOWLEDGE_INITIAL`:
```typescript
group_squads: [],
active_squad: "",
```

Add to create:
```typescript
setGroupSquads: (squads) => set({ group_squads: squads, active_squad: squads[0] ?? "" }),
setActiveSquad: (squad) => set({ active_squad: squad }),
```

Extend `reset` to also clear `group_squads` and `active_squad`.

- [ ] **Step 2: Populate group squads on selection**

Verify `DIRETORIA_GROUPS` already exists in `src/lib/constants.ts:22-24` with the correct mapping: `Engenharia: ["DADOS", "DEVOPS", "ENGENHARIA", "CYBERSECURITY"]`. No changes needed there.

In `src/components/knowledge/step-selection.tsx`, when clicking "Buscar Variações", resolve group:

```tsx
import { DIRETORIA_GROUPS } from "@/lib/constants";
import { useKnowledgeStore } from "@/lib/store";

// inside component:
const { setGroupSquads } = useKnowledgeStore();

function handleNext() {
  const group = Object.entries(DIRETORIA_GROUPS).find(([, dirs]) =>
    dirs.includes(diretoria)
  );
  if (group) {
    setGroupSquads(group[1]);
  } else {
    setGroupSquads([]);
  }
  on_next();
}
```

Change `<Button onClick={on_next}` to `<Button onClick={handleNext}`.

- [ ] **Step 3: Add squad tabs to StepDiagnostic**

In `src/components/knowledge/step-diagnostic.tsx`:

Import Tabs:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
```

Add to store destructuring:
```typescript
const { group_squads, active_squad, setActiveSquad } = useKnowledgeStore();
const is_group = group_squads.length > 0;
const effective_diretoria = is_group ? active_squad : diretoria;
const data = getMockDiagnosticData(effective_diretoria);
```

Wrap the variance table and expanders in a group-aware container:

```tsx
{is_group ? (
  <Tabs value={active_squad} onValueChange={setActiveSquad}>
    <TabsList className="h-8 bg-secondary/30 mb-3">
      {group_squads.map((squad) => (
        <TabsTrigger key={squad} value={squad} className="text-xs h-6 px-3">
          {squad}
        </TabsTrigger>
      ))}
    </TabsList>
    {/* Variance table and expanders render using effective_diretoria */}
  </Tabs>
) : null}
```

The metric cards, variance table, and expanders already use `data` which now comes from `effective_diretoria`.

- [ ] **Step 4: Add "Salvar todos" to StepPreview for group mode**

In `src/components/knowledge/step-preview.tsx`:

Add group awareness:
```typescript
const { group_squads } = useKnowledgeStore();
const is_group = group_squads.length > 0;
```

For group mode, render one collapsible YAML editor per squad with a "Salvar Todos" button:

```tsx
{is_group ? (
  <div className="space-y-3">
    {group_squads.map((squad) => (
      <Collapsible key={squad} defaultOpen={true}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs font-medium">
          {squad}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          {/* YAML textarea for this squad */}
        </CollapsibleContent>
      </Collapsible>
    ))}
    <Button onClick={handleSaveAll} className="w-full bg-primary hover:bg-primary/90">
      Salvar Todos
    </Button>
  </div>
) : (
  /* existing single-squad preview */
)}
```

First, update `saved_path` type in `src/lib/store.ts` to support multiple paths:
```typescript
// In KnowledgeStore interface, change:
saved_path: string | string[] | null;
setSavedPath: (v: string | string[] | null) => void;
```

Add `handleSaveAll`:
```typescript
function handleSaveAll() {
  const paths = group_squads.map(
    (squad) => `knowledge/variances/${squad.toLowerCase()}/${store.mes_ref}.yaml`
  );
  store.setSavedPath(paths);
  on_next();
}
```

- [ ] **Step 5: Add per-squad follow-ups to StepSuccess**

In `src/components/knowledge/step-success.tsx`, update `saved_path` rendering to handle `string[]`, and show one follow-up button per squad:

```tsx
const { group_squads } = useKnowledgeStore();
const is_group = group_squads.length > 0;

// Update saved_path rendering to handle arrays:
{saved_path && (
  <div className="rounded-md bg-secondary/30 p-3">
    <p className="text-[11px] text-muted-foreground">Arquivos salvos em:</p>
    {(Array.isArray(saved_path) ? saved_path : [saved_path]).map((p) => (
      <p key={p} className="font-mono text-xs text-foreground mt-0.5">{p}</p>
    ))}
  </div>
)}

// In the suggestions section:
{is_group ? (
  <div className="space-y-2">
    <p className="text-xs text-muted-foreground">Sugestões por squad:</p>
    {group_squads.map((squad) => (
      <Button
        key={squad}
        variant="outline"
        size="sm"
        className="text-xs mr-2"
        onClick={() => handleFollowUp(`Analise ${squad} ${mes_ref}`)}
      >
        Analise {squad} {mes_ref}
      </Button>
    ))}
  </div>
) : (
  /* existing single follow-up */
)}
```

- [ ] **Step 6: Build and verify**

Run: `npx next build`
Expected: Build passes.

- [ ] **Step 7: Commit**

```bash
git add src/lib/store.ts src/lib/constants.ts src/components/knowledge/step-selection.tsx src/components/knowledge/step-diagnostic.tsx src/components/knowledge/step-preview.tsx src/components/knowledge/step-success.tsx
git commit -m "feat: implement full group mode for knowledge wizard"
```

---

## Task 4: YAML Editor with Syntax Highlighting

Replace the plain textarea in step-preview with a proper syntax-highlighted editor with line numbers.

**Files:**
- Create: `src/components/knowledge/yaml-editor.tsx`
- Modify: `src/components/knowledge/step-preview.tsx`

- [ ] **Step 1: Create YamlEditor component**

Create `src/components/knowledge/yaml-editor.tsx`:

```tsx
"use client";

import { useRef, useCallback } from "react";

interface YamlEditorProps {
  value: string;
  on_change: (value: string) => void;
  height?: string;
}

function highlightYaml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      // Comments
      if (line.trimStart().startsWith("#")) {
        return `<span class="text-muted-foreground/60">${escapeHtml(line)}</span>`;
      }
      // Key: value pairs
      const match = line.match(/^(\s*)([\w-]+)(:)(.*)/);
      if (match) {
        const [, indent, key, colon, rest] = match;
        return `${indent}<span class="text-primary">${escapeHtml(key)}</span><span class="text-muted-foreground">${colon}</span>${highlightValue(rest)}`;
      }
      // List items
      const list_match = line.match(/^(\s*)(- )(.*)/);
      if (list_match) {
        const [, indent, dash, rest] = list_match;
        return `${indent}<span class="text-warning">${dash}</span>${highlightValue(rest)}`;
      }
      return escapeHtml(line);
    })
    .join("\n");
}

function highlightValue(text: string): string {
  // Strings in quotes
  const quoted = text.replace(/"([^"]*)"/g, '<span class="text-success">"$1"</span>');
  // Booleans
  const bools = quoted.replace(/\b(true|false)\b/g, '<span class="text-chart-5">$1</span>');
  return bools;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function YamlEditor({ value, on_change, height = "400px" }: YamlEditorProps) {
  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const highlight_ref = useRef<HTMLPreElement>(null);
  const lines_ref = useRef<HTMLDivElement>(null);
  const lines = value.split("\n");

  const handleScroll = useCallback(() => {
    const textarea = textarea_ref.current;
    const highlight = highlight_ref.current;
    const line_nums = lines_ref.current;
    if (textarea && highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
    if (textarea && line_nums) {
      line_nums.scrollTop = textarea.scrollTop;
    }
  }, []);

  return (
    <div className="relative rounded-md border border-border overflow-hidden" style={{ height }}>
      {/* Line numbers */}
      <div
        ref={lines_ref}
        className="absolute left-0 top-0 bottom-0 w-10 bg-[#0A0A15] border-r border-border/50 overflow-hidden select-none"
      >
        <div className="py-3 px-1">
          {lines.map((_, i) => (
            <div key={i} className="text-[10px] text-muted-foreground/40 text-right leading-[1.65] h-[1.65em]">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      {/* Syntax highlight layer */}
      <pre
        ref={highlight_ref}
        className="absolute left-10 top-0 right-0 bottom-0 p-3 font-mono text-xs leading-[1.65] overflow-hidden pointer-events-none whitespace-pre"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlightYaml(value) }}
      />
      {/* Editable textarea (transparent text) */}
      <textarea
        ref={textarea_ref}
        value={value}
        onChange={(e) => on_change(e.target.value)}
        onScroll={handleScroll}
        className="absolute left-10 top-0 right-0 bottom-0 p-3 font-mono text-xs leading-[1.65] bg-[#0D0D18] text-transparent caret-green-400 resize-none focus:outline-none selection:bg-primary/30"
        spellCheck={false}
      />
    </div>
  );
}
```

- [ ] **Step 2: Replace textarea in step-preview.tsx**

In `src/components/knowledge/step-preview.tsx`:

Replace the raw `<textarea>` with:

```tsx
import { YamlEditor } from "./yaml-editor";

// Replace the textarea element:
<YamlEditor value={yaml_text} on_change={handleChange} height="400px" />
```

Remove the old `<textarea>` element.

- [ ] **Step 3: Build and verify**

Run: `npx next build`
Expected: Build passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/knowledge/yaml-editor.tsx src/components/knowledge/step-preview.tsx
git commit -m "feat: add syntax-highlighted YAML editor"
```

---

## Task 5: Settings Panel

Add a settings sheet accessible from the header, showing LLM model, data source, theme, and language options (all mock/display-only for now).

**Files:**
- Create: `src/components/layout/settings-panel.tsx`
- Modify: `src/lib/store.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Add settings types and store**

In `src/lib/types.ts`, add:

```typescript
export interface SettingsState {
  llm_model: string;
  data_source: string;
  language: "pt-BR" | "en";
  theme: "dark" | "light";
}
```

In `src/lib/store.ts`, add a new store:

```typescript
import { SettingsState } from "./types";

interface SettingsStore extends SettingsState {
  is_open: boolean;
  setOpen: (v: boolean) => void;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  llm_model: "claude-sonnet-4.6",
  data_source: "financial_planning.fpa_combined",
  language: "pt-BR",
  theme: "dark",
  is_open: false,
  setOpen: (v) => set({ is_open: v }),
  updateSetting: (key, value) => set({ [key]: value }),
}));
```

- [ ] **Step 2: Create SettingsPanel component**

Create `src/components/layout/settings-panel.tsx`:

```tsx
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSettingsStore } from "@/lib/store";

const LLM_MODELS = [
  { value: "claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4.6", label: "Claude Opus 4.6" },
  { value: "gpt-5.4", label: "GPT-5.4" },
  { value: "gemini-3.1-flash", label: "Gemini 3.1 Flash" },
];

const DATA_SOURCES = [
  { value: "financial_planning.fpa_combined", label: "fpa_combined (Athena)" },
  { value: "financial_planning.fpa_staging", label: "fpa_staging (Athena)" },
];

export function SettingsPanel() {
  const { is_open, setOpen, llm_model, data_source, language, theme, updateSetting } = useSettingsStore();

  return (
    <Sheet open={is_open} onOpenChange={setOpen}>
      <SheetContent className="bg-card border-border w-80">
        <SheetHeader>
          <SheetTitle className="text-base">Configurações</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Modelo LLM</Label>
            <Select value={llm_model} onValueChange={(v) => updateSetting("llm_model", v ?? llm_model)}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLM_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fonte de Dados</Label>
            <Select value={data_source} onValueChange={(v) => updateSetting("data_source", v ?? data_source)}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCES.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Idioma</Label>
            <Select value={language} onValueChange={(v) => updateSetting("language", v as "pt-BR" | "en")}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR" className="text-xs">Português (BR)</SelectItem>
                <SelectItem value="en" className="text-xs">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tema</Label>
            <Select value={theme} onValueChange={(v) => updateSetting("theme", v as "dark" | "light")}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark" className="text-xs">Dark</SelectItem>
                <SelectItem value="light" className="text-xs">Light (preview)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">Versão</p>
            <p className="text-xs font-mono">v0.1.0 — Frontend Mock</p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">Última atualização dos dados</p>
            <p className="text-xs font-mono">22/03/2025 08:30</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Add settings button to header and mount panel**

In `src/components/layout/header.tsx`:

```tsx
import { useSettingsStore } from "@/lib/store";
import { SettingsPanel } from "./settings-panel";

// Inside Header:
const { setOpen: openSettings } = useSettingsStore();

// Add before the Roadmap button:
<Button
  variant="ghost"
  size="sm"
  className="text-xs text-muted-foreground"
  onClick={() => openSettings(true)}
>
  Settings
</Button>

// Add at the end of the header, before closing tag:
<SettingsPanel />
```

- [ ] **Step 4: Build and verify**

Run: `npx next build`
Expected: Build passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/store.ts src/components/layout/settings-panel.tsx src/components/layout/header.tsx
git commit -m "feat: add settings panel with LLM model and data source"
```

---

## Task 6: Responsive Tablet Layout

Make the layout functional on tablet (768px-1024px). Sidebars collapse behind Sheet overlays, main content takes full width.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/sidebar-left.tsx`
- Modify: `src/components/layout/sidebar-right.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/lib/store.ts`

- [ ] **Step 1: Add left panel state to AppStore**

In `src/lib/store.ts`, extend `AppStore`:

```typescript
interface AppStore {
  active_tab: ActiveTab;
  right_panel_open: boolean;
  left_panel_open: boolean;
  setActiveTab: (t: ActiveTab) => void;
  toggleRightPanel: () => void;
  toggleLeftPanel: () => void;
  setLeftPanel: (v: boolean) => void;
}
```

Add:
```typescript
left_panel_open: false,
toggleLeftPanel: () => set((s) => ({ left_panel_open: !s.left_panel_open })),
setLeftPanel: (v) => set({ left_panel_open: v }),
```

- [ ] **Step 2: Wrap SidebarLeft in Sheet for mobile**

In `src/components/layout/sidebar-left.tsx`:

Add a wrapper that renders as `<Sheet>` on mobile, inline `<aside>` on desktop:

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";

interface SidebarLeftProps {
  onReportClick: (report_id: string) => void;
}

export function SidebarLeft({ onReportClick }: SidebarLeftProps) {
  const { clearMessages } = useChatStore();
  const { setActiveTab, left_panel_open, setLeftPanel } = useAppStore();

  // ... existing handlers ...

  const content = (
    <>
      <div className="flex-1 overflow-y-auto p-3">
        {/* ... existing sidebar content ... */}
      </div>
      <div className="border-t border-border p-3">
        {/* ... existing clear button ... */}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-border bg-sidebar">
        {content}
      </aside>
      {/* Mobile/Tablet */}
      <Sheet open={left_panel_open} onOpenChange={setLeftPanel}>
        <SheetContent side="left" className="w-56 p-0 bg-sidebar border-border">
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
```

- [ ] **Step 3: Hide SidebarRight on mobile**

In `src/components/layout/sidebar-right.tsx`:

Refactor to use the same Desktop/Mobile pattern as SidebarLeft. Add imports:

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet";
```

Replace the entire component with:

```tsx
export function SidebarRight() {
  const { right_panel_open, toggleRightPanel } = useAppStore();

  const content = (
    <div className="p-3">
      <p className="mb-3 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Roadmap de Agentes
      </p>
      <div className="space-y-2">
        {AGENTS_ROADMAP.map((agent) => (
          /* ... existing agent cards ... */
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: inline aside, toggle via right_panel_open */}
      {right_panel_open && (
        <aside className="hidden lg:flex w-60 flex-col border-l border-border bg-sidebar overflow-y-auto">
          {content}
        </aside>
      )}
      {/* Mobile/Tablet: Sheet overlay, same toggle */}
      <Sheet
        open={right_panel_open}
        onOpenChange={toggleRightPanel}
      >
        <SheetContent side="right" className="w-60 p-0 bg-sidebar border-border lg:hidden">
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**Note:** On desktop (lg+), the Sheet's `lg:hidden` on SheetContent prevents it from rendering. On mobile, the aside's `hidden lg:flex` hides it. The `right_panel_open` state is shared but the CSS ensures only one version renders at each breakpoint.

- [ ] **Step 4: Add hamburger menu to header on mobile**

In `src/components/layout/header.tsx`:

```tsx
const { toggleLeftPanel, toggleRightPanel } = useAppStore();

// Add at the start of the left flex group, before the logo:
<Button
  variant="ghost"
  size="sm"
  className="lg:hidden h-8 w-8 p-0"
  onClick={toggleLeftPanel}
>
  <span className="text-sm">☰</span>
</Button>
```

- [ ] **Step 5: Add responsive utilities to globals.css**

In `src/app/globals.css`, add at the end:

```css
/* Responsive adaptations */
@media (max-width: 1023px) {
  .chat-input-bar {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
```

- [ ] **Step 6: Build and verify**

Run: `npx next build`
Expected: Build passes.

- [ ] **Step 7: Commit**

```bash
git add src/lib/store.ts src/app/globals.css src/app/page.tsx src/components/layout/sidebar-left.tsx src/components/layout/sidebar-right.tsx src/components/layout/header.tsx
git commit -m "feat: add responsive tablet layout with collapsible sidebars"
```

---

## Execution Order

Tasks 1, 2, 5, 6 are fully independent. **Tasks 3 and 4 both modify `step-preview.tsx` — run 3 before 4.** Recommended serial order by impact:

1. **Task 1** — Loading Steps (most visible UX improvement)
2. **Task 2** — Previous Month Knowledge (core PRD gap)
3. **Task 3** — Group Mode (core PRD gap)
4. **Task 4** — YAML Editor (polish)
5. **Task 5** — Settings Panel (infrastructure)
6. **Task 6** — Responsive (accessibility)

## Verification Checklist

After all tasks are done:

- [ ] Chat: send message → see 4-step loading progression → response renders
- [ ] Knowledge: select Engenharia → see group alert → tabs per squad in diagnostic
- [ ] Knowledge: variance expander → see previous month knowledge + "Reusar" button
- [ ] Knowledge: step 3 → see syntax-highlighted YAML with line numbers
- [ ] Knowledge (group): step 3 → see one collapsible per squad + "Salvar todos"
- [ ] Knowledge (group): step 4 → see per-squad follow-up buttons
- [ ] Header: click Settings → see sheet with model/source/language selectors
- [ ] Resize to 768px → sidebars collapse, hamburger menu appears
- [ ] `npx next build` passes with zero errors
