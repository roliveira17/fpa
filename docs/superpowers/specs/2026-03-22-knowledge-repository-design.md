# Knowledge Repository — Design Spec

## Context

The FP&A Agent currently stores qualitative knowledge (BP variance explanations, management meeting context) as YAML and Markdown files on the local filesystem. The `KnowledgeManager` loads these files and injects them into the LLM context window via the 3-layer prompt architecture in `fpa_analyst.py`.

**Problems this solves:**
1. **Broken retrieval** — YTD queries failed to pull January knowledge because file-loading logic only loaded the current month
2. **Scale** — as months accumulate, loading all files into the prompt is not viable
3. **Production readiness** — files in a dev codespace cannot serve a shared corporate environment
4. **Format mismatch** — YAML is not a natural format for BP explanations; BPs should never see/edit YAML

**Target environment:** AWS corporate infrastructure (Athena/Coralake for financial data, RDS for knowledge, S3 for raw backups). Deploy on AWS.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Frontend    │────▶│  Backend Python   │────▶│  RDS Postgres │
│  (Next.js)  │     │  (API existente)  │     │  (knowledge)  │
└─────────────┘     │                   │────▶│  Athena       │
                    │                   │     │  (dados fin.) │
                    │                   │────▶│  S3            │
                    └──────────────────┘     │  (raw backups) │
                                             └──────────────┘
```

Frontend does NOT talk directly to Postgres. Everything goes through the Python backend.

---

## 1. Database Schema

### Table: `knowledge_entries`

The core of the repository. Each row is one qualitative insight with structured metadata.

```sql
CREATE TABLE knowledge_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diretoria       VARCHAR(100)    NOT NULL,
    mes_ref         VARCHAR(7)      NOT NULL,       -- 'YYYY-MM'
    conta_pl        VARCHAR(200),                    -- NULL = general note / cross-account
    entry_type      VARCHAR(50)     NOT NULL,        -- 'variance_explanation' | 'context_gerencial' | 'bp_note'
    explanation     TEXT            NOT NULL,
    variance_type   VARCHAR(30),                     -- 'one-off' | 'recurring' | 'seasonal' | 'reclassification'
    expect_next     BOOLEAN         DEFAULT false,
    analyst         VARCHAR(200)    NOT NULL,
    sources         VARCHAR(50)[]   NOT NULL,        -- ['wizard', 'transcription', 'pdf']
    merged_at       TIMESTAMPTZ,
    merge_history   JSONB           DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ     DEFAULT now(),
    updated_at      TIMESTAMPTZ     DEFAULT now(),
    search_vector   TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('portuguese', coalesce(explanation, ''))
    ) STORED
);

-- Dedup constraint: one entry per (diretoria, mes_ref, conta_pl, entry_type)
CREATE UNIQUE INDEX uq_knowledge_entry
    ON knowledge_entries (diretoria, mes_ref, coalesce(conta_pl, '__NULL__'), entry_type);

-- Full-text search
CREATE INDEX idx_knowledge_search ON knowledge_entries USING GIN (search_vector);

-- Common query patterns
CREATE INDEX idx_knowledge_mes ON knowledge_entries (mes_ref);
CREATE INDEX idx_knowledge_dir_mes ON knowledge_entries (diretoria, mes_ref);
```

### Table: `data_catalog`

The agent queries this to decide which Athena tables to use. Replaces hardcoded prompt text.

```sql
CREATE TABLE data_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name      VARCHAR(200)    NOT NULL UNIQUE,
    description     TEXT            NOT NULL,
    granularity     VARCHAR(100)    NOT NULL,        -- 'diretoria/conta_pl/mes' or 'bid/produto/mes'
    columns         JSONB           NOT NULL,        -- [{ "name": "...", "type": "...", "description": "..." }]
    use_cases       TEXT[]          NOT NULL,
    relationships   JSONB,                           -- logical FKs to other tables
    sample_queries  JSONB,                           -- example SQL
    is_active       BOOLEAN         DEFAULT true,
    updated_at      TIMESTAMPTZ     DEFAULT now()
);
```

### Table: `ingestion_log`

Traceability for every ingestion event.

```sql
CREATE TABLE ingestion_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     VARCHAR(50)     NOT NULL,        -- 'wizard' | 'transcription' | 'pdf'
    source_ref      VARCHAR(500),                    -- filename, URL, etc.
    mes_ref         VARCHAR(7)      NOT NULL,
    entries_created INT             DEFAULT 0,
    entries_merged  INT             DEFAULT 0,
    entries_skipped INT             DEFAULT 0,
    raw_content_s3  VARCHAR(500),                    -- S3 ref for raw transcript/PDF
    processed_at    TIMESTAMPTZ     DEFAULT now(),
    analyst         VARCHAR(200)    NOT NULL
);
```

---

## 2. Ingestion Flows

### Flow 1: Knowledge Wizard (BP explanations)

1. Analyst fills steps 1-2 (no UX change — selection + diagnostic/explanation)
2. Step 3 shows a formatted card summary (NOT YAML) with all entries
3. On "Save" → `POST /api/knowledge/save`
4. Backend, for each `(diretoria, mes_ref, conta_pl)`:
   - `SELECT` existing entry
   - If none → `INSERT`
   - If exists → LLM compares texts:
     - **Redundant** → skip, increment `entries_skipped`
     - **Complementary** → `UPDATE` explanation (merge), append to `merge_history`, add source to `sources` array
     - **Contradictory** → return conflict flag for analyst resolution
5. `INSERT` into `ingestion_log`
6. Step 4 shows counters: created / merged / skipped / conflicts

### Flow 2: Transcription / PDF Processing

1. Analyst pastes transcript and/or uploads PDF
2. `POST /api/context/process` (FormData)
3. Backend:
   a. Extract text from PDF if present
   b. Save raw to S3 (backup/audit trail)
   c. LLM fragments the transcript into structured entries:
      ```
      Prompt: "Extract each financially relevant insight from this transcript.
               For each, identify: diretoria, conta_pl (if applicable),
               and summarize the explanation in 1-3 sentences.
               Classify as one-off, recurring, seasonal, or reclassification."
      → returns array of { diretoria, conta_pl, explanation, variance_type }
      ```
   d. For each fragment → same dedup flow as wizard
   e. `INSERT` into `ingestion_log` with counters
4. Response: `{ fragments_total, created, merged, skipped, conflicts }`

### Flow 3: Conflict Resolution

When merge detects contradiction:
- API returns `{ conflicts: [{ entry_id, existing_text, new_text, reason }] }`
- Frontend shows resolution modal with options:
  - Keep existing
  - Use new
  - Merge manually (custom text)
- `POST /api/knowledge/resolve-conflict` with resolution

### Dedup Logic (merge_history format)

```json
[
  { "source": "wizard", "analyst": "João", "at": "2025-01-15T10:00:00Z", "action": "created" },
  { "source": "transcription", "analyst": "Maria", "at": "2025-01-20T14:30:00Z", "action": "merged", "added": "CFO confirmed recurring pattern for Q1" }
]
```

---

## 3. Retrieval — Agent Tools

### Tool: `search_knowledge`

Replaces file-loading in the prompt. The agent calls this as a tool.

```
Input:
  - diretoria: string | null       -- exact filter, null for cross-diretoria
  - mes_ref_start: string | null   -- range start (inclusive)
  - mes_ref_end: string | null     -- range end (inclusive)
  - conta_pl: string | null        -- exact filter, null for all
  - entry_type: string | null      -- filter by type
  - text_search: string | null     -- full-text search on explanations
  - limit: int (default 20)

Output:
  - entries: KnowledgeEntry[]

SQL generation pattern:
  SELECT * FROM knowledge_entries
  WHERE ($1 IS NULL OR diretoria = $1)
    AND ($2 IS NULL OR mes_ref >= $2)
    AND ($3 IS NULL OR mes_ref <= $3)
    AND ($4 IS NULL OR conta_pl = $4)
    AND ($5 IS NULL OR entry_type = $5)
    AND ($6 IS NULL OR search_vector @@ plainto_tsquery('portuguese', $6))
  ORDER BY mes_ref DESC, diretoria
  LIMIT $7
```

### Tool: `query_data_catalog`

```
Input:
  - intent: string    -- natural language description of what the agent needs

Output:
  - tables: CatalogEntry[]

Retrieval: ILIKE on description, use_cases array elements, and column descriptions.
Future: add pgvector embedding column for semantic search if ILIKE proves insufficient.
```

### Migration of `fpa_analyst.py` Prompt Architecture

**Before (file-loading):**
```
System layer 1: role + instructions
System layer 2: knowledge YAML files loaded into context
System layer 3: data catalog hardcoded in prompt text
→ User message → LLM responds with everything in context
```

**After (tool-calling):**
```
System layer 1: role + instructions
System layer 2: available tools (search_knowledge, query_data_catalog, run_sql)
System layer 3: instructions for when to use each tool
→ User message
→ LLM decides which tools to call
→ search_knowledge returns only relevant entries
→ query_data_catalog returns applicable tables
→ run_sql executes on Athena
→ LLM synthesizes response
```

---

## 4. API Endpoints

### Knowledge CRUD

```
POST /api/knowledge/save
  Body: {
    diretoria: string,
    mes_ref: string,
    analyst: string,
    entries: [{
      conta_pl: string | null,
      explanation: string,
      variance_type: 'one-off' | 'recurring' | 'seasonal' | 'reclassification',
      expect_next: boolean
    }]
  }
  Response: {
    created: number,
    merged: number,
    skipped: number,
    conflicts: [{ entry_id: string, existing_text: string, new_text: string, reason: string }]
  }

POST /api/knowledge/resolve-conflict
  Body: {
    entry_id: string,
    resolution: 'keep_existing' | 'use_new' | 'custom',
    custom_text?: string
  }
  Response: { ok: true }
```

### Knowledge Retrieval

```
POST /api/knowledge/search
  Body: {
    diretoria?: string,
    mes_ref_start?: string,
    mes_ref_end?: string,
    conta_pl?: string,
    entry_type?: string,
    text_search?: string,
    limit?: number
  }
  Response: { entries: KnowledgeEntry[] }
```

### Context Processing

```
POST /api/context/process
  Body: FormData { mes_ref: string, transcript?: string, pdf?: File }
  Response: {
    fragments_total: number,
    created: number,
    merged: number,
    skipped: number,
    conflicts: [{ entry_id, existing_text, new_text, reason }]
  }
```

### Data Catalog

```
GET  /api/catalog/list
  Response: { tables: CatalogEntry[] }

GET  /api/catalog/search?intent=margem+contribuição+bid
  Response: { tables: CatalogEntry[] }

POST /api/catalog/register
  Body: { table_name, description, granularity, columns, use_cases, sample_queries }
  Response: { id: string }
```

### Endpoints that DO NOT change

All chat, reports, metadata, and variance fetching endpoints remain unchanged.

---

## 5. Data Catalog Seed

Initial seed with known tables. Backend team registers new tables via API when they become available in Athena.

```sql
INSERT INTO data_catalog (table_name, description, granularity, columns, use_cases, sample_queries) VALUES
(
  'financial_planning.fpa_combined',
  'DRE consolidada com valores de realizado e orçado por diretoria, conta P&L e mês',
  'diretoria/conta_pl/mes',
  '[{"name":"mes_ref","type":"DATE","description":"Mês de referência"},
    {"name":"diretoria","type":"VARCHAR","description":"Nome da diretoria"},
    {"name":"conta_pl","type":"VARCHAR","description":"Conta do P&L"},
    {"name":"input","type":"VARCHAR","description":"actual ou bgt"},
    {"name":"valor","type":"DOUBLE","description":"Valor em R$"}]'::jsonb,
  ARRAY['fechamento mensal', 'análise real vs budget', 'DRE', 'variações por diretoria', 'YTD'],
  '[{"description":"DRE de um mês","sql":"SELECT conta_pl, input, SUM(valor) FROM financial_planning.fpa_combined WHERE mes_ref = ? GROUP BY conta_pl, input"}]'::jsonb
);
-- Add additional tables (margem de contribuição, etc.) as they become available
```

---

## 6. Frontend Changes

### Components removed

| Component | File | Reason |
|---|---|---|
| `YamlEditor` | `src/components/knowledge/yaml-editor.tsx` | No more YAML generation |
| `generateYaml()` | `src/components/knowledge/step-preview.tsx` | Replaced by POST API |
| `validateYaml()` | `src/components/knowledge/step-preview.tsx` | Validation now in backend |

### Components added

| Component | Purpose |
|---|---|
| `KnowledgePreviewCard` | Formatted summary card replacing YAML editor |
| `ConflictResolutionModal` | Modal for resolving contradictions |
| `IngestionSummary` | Counters display (created/merged/skipped) |

### Components modified

| Component | Change |
|---|---|
| `StepPreview` | Remove YAML editor, render `KnowledgePreviewCard`, POST to API on save |
| `StepSuccess` | Show `IngestionSummary` instead of file path |
| `ContextView` | Show fragmentation summary instead of full markdown preview |

### Types added (`src/lib/types.ts`)

```typescript
interface KnowledgeEntry {
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

interface IngestionResult {
  created: number;
  merged: number;
  skipped: number;
  conflicts: ConflictInfo[];
}

interface ConflictInfo {
  entry_id: string;
  existing_text: string;
  new_text: string;
  reason: string;
}

interface CatalogEntry {
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

### Types removed

| Type | Reason |
|---|---|
| `KnowledgeYaml` | Replaced by `KnowledgeEntry` |

### Store changes (`src/lib/store.ts`)

```
KnowledgeStore:
  Remove: yaml_text, saved_path, setYamlText, setSavedPath
  Add: save_result: IngestionResult | null
       conflicts: ConflictInfo[]
       setSaveResult: (r: IngestionResult | null) => void
       setConflicts: (c: ConflictInfo[]) => void
       resolveConflict: (entry_id: string) => void
```

### API client (`src/lib/api.ts` — new file)

Functions for calling backend endpoints with typed inputs/outputs:
- `saveKnowledge(data) → IngestionResult`
- `resolveConflict(entry_id, resolution) → void`
- `processContext(formData) → IngestionResult`
- `searchKnowledge(filters) → KnowledgeEntry[]`

These call the real backend in production and are backed by mocks in development (until backend is ready).

### Mock layer update

`src/lib/mock/financial-data.ts` gains mock implementations of the new API responses so the frontend can be developed and tested before the backend endpoints exist.

---

## 7. Verification

### Frontend (this repo)
- [ ] Knowledge Wizard step 3 shows formatted card, not YAML
- [ ] Save triggers POST and shows ingestion counters
- [ ] Conflict modal appears when mock returns conflicts
- [ ] Context View shows fragmentation summary
- [ ] All existing tests still pass
- [ ] New components have unit tests
- [ ] E2E: complete wizard flow → success screen with counters

### Backend (separate repo — for other team/LLM)
- [ ] RDS tables created with correct schema and indices
- [ ] `POST /api/knowledge/save` deduplicates correctly
- [ ] `POST /api/context/process` fragments transcript and deduplicates
- [ ] `POST /api/knowledge/search` returns filtered results
- [ ] Full-text search works in Portuguese
- [ ] Conflict detection works for contradictory entries
- [ ] `fpa_analyst.py` uses tool-calling instead of file-loading
- [ ] YTD query retrieves knowledge from all months in range
- [ ] `data_catalog` seed is loaded and queryable
