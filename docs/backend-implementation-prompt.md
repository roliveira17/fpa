# Backend Implementation Prompt — Knowledge Repository

> **Instructions:** Copy this entire document into a new session with the LLM that has access to the Python backend repo. It contains everything needed to implement the backend changes.

---

## Your Task

Implement the backend changes for the Knowledge Repository. The frontend is already done and expects these exact API endpoints and response shapes. Do NOT deviate from the spec.

## Context

The FP&A Agent is a Python backend that:
- Runs SQL on Athena/Coralake to get financial data
- Uses an LLM (Anthropic/Gemini) for analysis via `src/llm_client.py`
- Currently stores knowledge as YAML/MD files on the filesystem via `src/knowledge_manager.py`
- Uses a 3-layer prompt architecture in `src/fpa_analyst.py` that loads knowledge files into the LLM context

**What needs to change:**
1. Replace filesystem storage with Postgres (RDS)
2. Replace file-loading in prompts with tool-calling
3. Add new API endpoints for the frontend
4. Add transcript/PDF fragmentation pipeline

## Files You Need to Touch

| File | What to do |
|------|-----------|
| `src/knowledge_manager.py` | Rewrite from file-based to DB-based (see Migration table below) |
| `src/fpa_analyst.py` | Change from file-loading to tool-calling (see Prompt Architecture below) |
| New: migration SQL file | Create `migrations/001_knowledge_repository.sql` with full schema |
| New: API endpoints | Add Flask/FastAPI routes for the endpoints below |
| `requirements.txt` | Add `psycopg2-binary` (or `asyncpg`), `boto3` (for S3) |

## Database Schema

Run this SQL on the RDS Postgres instance to create the tables:

```sql
-- Table 1: knowledge_entries
CREATE TABLE knowledge_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diretoria       VARCHAR(100)    NOT NULL,
    mes_ref         VARCHAR(7)      NOT NULL,
    conta_pl        VARCHAR(200),
    entry_type      VARCHAR(50)     NOT NULL,
    explanation     TEXT            NOT NULL,
    variance_type   VARCHAR(30),
    expect_next     BOOLEAN         DEFAULT false,
    analyst         VARCHAR(200)    NOT NULL,
    sources         VARCHAR(50)[]   NOT NULL,
    merged_at       TIMESTAMPTZ,
    merge_history   JSONB           DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ     DEFAULT now(),
    updated_at      TIMESTAMPTZ     DEFAULT now(),
    search_vector   TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('portuguese', coalesce(explanation, ''))
    ) STORED
);

CREATE UNIQUE INDEX uq_knowledge_entry_with_conta
    ON knowledge_entries (diretoria, mes_ref, conta_pl, entry_type)
    WHERE conta_pl IS NOT NULL;
CREATE UNIQUE INDEX uq_knowledge_entry_no_conta
    ON knowledge_entries (diretoria, mes_ref, entry_type)
    WHERE conta_pl IS NULL;

ALTER TABLE knowledge_entries ADD CONSTRAINT chk_mes_ref
    CHECK (mes_ref ~ '^\d{4}-(0[1-9]|1[0-2])$');
ALTER TABLE knowledge_entries ADD CONSTRAINT chk_variance_type
    CHECK (variance_type IS NULL OR variance_type IN ('one-off', 'recurring', 'seasonal', 'reclassification'));
ALTER TABLE knowledge_entries ADD CONSTRAINT chk_entry_type
    CHECK (entry_type IN ('variance_explanation', 'context_gerencial', 'bp_note'));

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_knowledge_updated_at
    BEFORE UPDATE ON knowledge_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_knowledge_search ON knowledge_entries USING GIN (search_vector);
CREATE INDEX idx_knowledge_mes ON knowledge_entries (mes_ref);
CREATE INDEX idx_knowledge_dir_mes ON knowledge_entries (diretoria, mes_ref);

-- Table 2: data_catalog
CREATE TABLE data_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name      VARCHAR(200)    NOT NULL UNIQUE,
    description     TEXT            NOT NULL,
    granularity     VARCHAR(100)    NOT NULL,
    columns         JSONB           NOT NULL,
    use_cases       TEXT[]          NOT NULL,
    relationships   JSONB,
    sample_queries  JSONB,
    is_active       BOOLEAN         DEFAULT true,
    updated_at      TIMESTAMPTZ     DEFAULT now()
);

-- Table 3: ingestion_log
CREATE TABLE ingestion_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     VARCHAR(50)     NOT NULL,
    source_ref      VARCHAR(500),
    mes_ref         VARCHAR(7)      NOT NULL,
    entries_created INT             DEFAULT 0,
    entries_merged  INT             DEFAULT 0,
    entries_skipped INT             DEFAULT 0,
    raw_content_s3  VARCHAR(500),
    processed_at    TIMESTAMPTZ     DEFAULT now(),
    analyst         VARCHAR(200)    NOT NULL
);

-- Seed data_catalog
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
```

## API Endpoints (EXACT contract — frontend already expects these)

### POST /api/knowledge/save

```
Body: {
    "diretoria": "ENGENHARIA",
    "mes_ref": "2025-01",
    "analyst": "João Silva",
    "entry_type": "variance_explanation",
    "entries": [
        {
            "conta_pl": "G&A",
            "explanation": "Consultoria jurídica extraordinária do caso X",
            "variance_type": "one-off",
            "expect_next": false
        },
        {
            "conta_pl": null,
            "explanation": "Notas gerais do BP sobre o mês",
            "variance_type": "one-off",
            "expect_next": false
        }
    ]
}

Response: {
    "created": 1,
    "merged": 0,
    "skipped": 0,
    "conflicts": [
        {
            "entry_id": "uuid-here",
            "existing_text": "Explicação anterior...",
            "new_text": "Nova explicação...",
            "reason": "Contradição detectada: ..."
        }
    ]
}
```

**Dedup logic per entry:**
1. `SELECT * FROM knowledge_entries WHERE diretoria = $1 AND mes_ref = $2 AND conta_pl = $3 AND entry_type = $4`
2. If no match → INSERT, source = ['wizard'], increment `created`
3. If match → Call LLM to compare existing.explanation vs new explanation:
   - Prompt: "Compare these two explanations for the same financial variance. Are they: (a) saying the same thing (redundant), (b) adding new information (complementary), or (c) contradicting each other?"
   - Redundant → skip, increment `skipped`
   - Complementary → UPDATE explanation (merge texts), append to merge_history, add 'wizard' to sources, increment `merged`
   - Contradictory → add to conflicts array (do NOT update the entry yet)

### POST /api/knowledge/resolve-conflict

```
Body: {
    "entry_id": "uuid",
    "resolution": "keep_existing" | "use_new" | "custom",
    "custom_text": "Optional custom text"
}

Response: { "ok": true }
```

- `keep_existing`: no change to entry, append `{ action: "conflict_kept_existing", ... }` to merge_history
- `use_new`: overwrite explanation, update sources/merged_at, append merge_history
- `custom`: set explanation to custom_text, same metadata updates as use_new

### POST /api/knowledge/search

```
Body: {
    "diretoria": "ENGENHARIA",       // optional
    "mes_ref_start": "2025-01",      // optional
    "mes_ref_end": "2025-03",        // optional
    "conta_pl": "G&A",              // optional
    "entry_type": "variance_explanation",  // optional
    "text_search": "consultoria",    // optional — full-text search
    "limit": 20                      // optional, default 20
}

Response: {
    "entries": [
        {
            "id": "uuid",
            "diretoria": "ENGENHARIA",
            "mes_ref": "2025-01",
            "conta_pl": "G&A",
            "entry_type": "variance_explanation",
            "explanation": "Consultoria jurídica...",
            "variance_type": "one-off",
            "expect_next": false,
            "analyst": "João Silva",
            "sources": ["wizard", "transcription"],
            "created_at": "2025-01-15T10:00:00Z",
            "updated_at": "2025-01-20T14:30:00Z"
        }
    ]
}
```

**SQL pattern:**
```sql
SELECT id, diretoria, mes_ref, conta_pl, entry_type, explanation,
       variance_type, expect_next, analyst, sources, created_at, updated_at
FROM knowledge_entries
WHERE ($1 IS NULL OR diretoria = $1)
  AND ($2 IS NULL OR mes_ref >= $2)
  AND ($3 IS NULL OR mes_ref <= $3)
  AND ($4 IS NULL OR conta_pl = $4)
  AND ($5 IS NULL OR entry_type = $5)
  AND ($6 IS NULL OR search_vector @@ plainto_tsquery('portuguese', $6))
ORDER BY
  CASE WHEN $6 IS NOT NULL THEN ts_rank(search_vector, plainto_tsquery('portuguese', $6)) END DESC NULLS LAST,
  mes_ref DESC, diretoria
LIMIT $7
```

Note: Do NOT return `merge_history` or `merged_at` — these are internal audit fields.

### POST /api/context/process

```
Body: FormData {
    "mes_ref": "2025-01",
    "analyst": "Maria Santos",
    "transcript": "Reunião de fechamento...",  // optional
    "pdf": <file>                               // optional
}

Response: {
    "fragments_total": 7,
    "created": 4,
    "merged": 2,
    "skipped": 1,
    "conflicts": []
}
```

**Pipeline:**
1. If PDF → extract text (use PyPDF2 or pdfplumber)
2. Save raw content to S3: `s3://bucket/knowledge-raw/{mes_ref}/{timestamp}.txt`
3. Call LLM to fragment:
   ```
   Prompt: "Extract each financially relevant insight from this transcript.
   For each, return a JSON object with:
   - diretoria: string (the department discussed, UPPER CASE, must match one of: PRODUTO, CRÉDITO, DESIGN, MARKETING, ENGENHARIA, DADOS, DEVOPS, CYBERSECURITY, PEOPLE, FINANCEIRO, LEGAL, CX, SEGURANÇA DO CLIENTE, RISCO E COMPLIANCE, CORA CASES, DPO)
   - conta_pl: string or null (the P&L account if identifiable)
   - explanation: string (1-3 sentence summary)
   - variance_type: one of 'one-off', 'recurring', 'seasonal', 'reclassification'

   Return a JSON array."
   ```
4. For each fragment → same dedup logic as /api/knowledge/save (with source='transcription' or 'pdf')
5. INSERT into ingestion_log
6. Return counters

### GET /api/catalog/list

```
Response: {
    "tables": [
        {
            "id": "uuid",
            "table_name": "financial_planning.fpa_combined",
            "description": "DRE consolidada...",
            "granularity": "diretoria/conta_pl/mes",
            "columns": [...],
            "use_cases": [...],
            "sample_queries": [...],
            "is_active": true
        }
    ]
}
```

### GET /api/catalog/search?intent=margem+contribuição

Same response shape as list, filtered by ILIKE on description, use_cases, and column descriptions.

### POST /api/catalog/register

```
Body: {
    "table_name": "analytics.margem_contribuicao",
    "description": "Margem de contribuição por produto e segmento a nível BID",
    "granularity": "bid/produto/segmento/mes",
    "columns": [...],
    "use_cases": ["análise de margem", "mix de segmentação", "saldo médio"],
    "sample_queries": [...]
}

Response: { "id": "uuid" }
```

## KnowledgeManager Migration

| Old method | New implementation |
|---|---|
| `save_from_parsed(data) → path` | `save_entries(entries) → { created, merged, skipped, conflicts }` — INSERT/UPDATE in Postgres with dedup |
| `load_recent_history(area, tier)` | `search_entries(diretoria, mes_ref_range)` — SELECT with filters |
| `get_previous_month_knowledge(area, mes)` | `search_entries(diretoria, mes_ref=previous_month)` |
| `validate_yaml(text)` | DELETE — validation is now DB constraints |
| `is_already_captured(area, mes)` | `SELECT EXISTS(WHERE diretoria=$1 AND mes_ref=$2)` |
| `list_areas()` | `SELECT DISTINCT diretoria FROM knowledge_entries` |

## fpa_analyst.py — Prompt Architecture Migration

**Before (current):**
```python
# Layer 2: Load knowledge files into context
knowledge_files = self.knowledge_manager.load_recent_history(diretoria, tier="all")
system_prompt += f"\n\nKnowledge base:\n{knowledge_files}"

# Layer 3: Hardcoded data catalog
system_prompt += "\n\nAvailable tables: financial_planning.fpa_combined (columns: mes_ref, diretoria, conta_pl, input, valor)"
```

**After (tool-calling):**
```python
# Layer 2: Define tools
tools = [
    {
        "name": "search_knowledge",
        "description": "Search the knowledge repository for BP explanations and context",
        "input_schema": {
            "type": "object",
            "properties": {
                "diretoria": {"type": "string", "description": "Filter by diretoria"},
                "mes_ref_start": {"type": "string", "description": "Start month (YYYY-MM)"},
                "mes_ref_end": {"type": "string", "description": "End month (YYYY-MM)"},
                "conta_pl": {"type": "string", "description": "Filter by P&L account"},
                "text_search": {"type": "string", "description": "Full-text search"},
                "limit": {"type": "integer", "default": 20}
            }
        }
    },
    {
        "name": "query_data_catalog",
        "description": "Find which Athena tables are available for a given analysis need",
        "input_schema": {
            "type": "object",
            "properties": {
                "intent": {"type": "string", "description": "What data you need"}
            },
            "required": ["intent"]
        }
    },
    {
        "name": "run_sql",
        "description": "Execute SQL on Athena and return results",
        "input_schema": {
            "type": "object",
            "properties": {
                "sql": {"type": "string", "description": "SQL query to execute"}
            },
            "required": ["sql"]
        }
    }
]

# Layer 3: Instructions
system_prompt += """
When answering questions:
1. First, search_knowledge to find relevant BP explanations and context
2. Use query_data_catalog to discover which tables have the data you need
3. Use run_sql to execute queries on Athena
4. Combine quantitative data with qualitative knowledge to provide enriched answers
5. For YTD queries, always search knowledge across the full date range
"""
```

## Verification Checklist

After implementing, verify:
- [ ] `POST /api/knowledge/save` with 2 entries → returns `{ created: 2, merged: 0, skipped: 0, conflicts: [] }`
- [ ] Same POST again → returns `{ created: 0, merged: 0, skipped: 2, conflicts: [] }` (redundant)
- [ ] POST with contradictory explanation → returns conflict
- [ ] `POST /api/knowledge/resolve-conflict` resolves it
- [ ] `POST /api/knowledge/search` with `mes_ref_start=2025-01&mes_ref_end=2025-03` returns entries across months (YTD fix)
- [ ] `POST /api/knowledge/search` with `text_search=consultoria` finds entries via full-text
- [ ] `POST /api/context/process` with transcript → fragments, deduplicates, returns counters
- [ ] `GET /api/catalog/list` returns seeded table
- [ ] Agent chat query "Como está o acumulado do ano?" triggers `search_knowledge` tool call with full YTD range
- [ ] Agent query "Por que G&A estourou?" → `search_knowledge` finds BP explanation + `run_sql` gets numbers
