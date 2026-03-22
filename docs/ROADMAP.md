# Roadmap — Agente FP&A Cora

## Concluído

- [x] Frontend completo com mock data (chat, knowledge wizard, contexto gerencial)
- [x] 4 tipos de gráfico (waterfall, line, grouped_bar, horizontal_bar)
- [x] DRE table estilizada com formatação condicional
- [x] Knowledge Input wizard 4 etapas + modo grupo (Engenharia → 4 squads)
- [x] Previous month knowledge nos expanders
- [x] Multi-step loading indicator no chat
- [x] YAML editor com syntax highlight
- [x] Settings panel (modelo LLM, fonte dados, idioma, tema)
- [x] Light mode + dark mode com toggle funcional
- [x] Layout responsivo tablet (sidebars colapsáveis)
- [x] Design system Cora alinhado com spec (tokens, cores, tipografia)
- [x] 47 testes (37 unit + 10 E2E)
- [x] Design spec do Knowledge Repository (Postgres + SQL retrieval + dedup/merge)

## Próximos Passos

### Novas Features (a definir)
- [ ] Dashboard executivo com KPIs no topo (receita, EBITDA, margem, base clientes)
- [ ] Comparação MoM / YoY em gráficos
- [ ] Drill-down clicável nos gráficos (clicar barra → ver detalhe)
- [ ] Export para PowerPoint / Excel (além do .md atual)
- [ ] Variance aging — há quanto tempo uma variação persiste
- [ ] Alertas/notificações para thresholds de variação
- [ ] Comparação cross-diretorias
- [ ] Histórico de conversas salvas / pinned analyses
- [ ] Annotations em gráficos

### Relatórios Padrão (a criar)
- [ ] Relatório de Fechamento Mensal — template estruturado com DRE + waterfall + narrativa
- [ ] Relatório de Centro de Custo — breakdown por diretoria com ranking
- [ ] DRE Anual Consolidada — 12 meses + acumulado + YoY
- [ ] Top Desvios vs Orçado — top N com drill-down automático
- [ ] Deep-Dive por Conta — decomposição fornecedor + BU + tendência
- [ ] Earnings Release — compilação executiva para diretoria/board
- [ ] Relatório de Folha de Pagamento — headcount, custo médio, turnover
- [ ] Forecast Rolling — projeções de cenários (base, otimista, pessimista)

### Knowledge Repository para o Agente (prioridade alta)
Arquitetura definida — spec em `docs/superpowers/specs/2026-03-22-knowledge-repository-design.md`.
Decisão: Postgres (RDS) com tabelas estruturadas, retrieval via SQL + full-text search, dedup com merge na ingestão.

**Frontend (este repo):**
- [ ] Substituir YamlEditor por KnowledgePreviewCard (card resumo formatado)
- [ ] Refatorar StepPreview para POST API em vez de gerar YAML
- [ ] Refatorar StepSuccess para mostrar contadores (criados/merged/skipped)
- [ ] Criar ConflictResolutionModal para contradições na ingestão
- [ ] Refatorar ContextView para mostrar resumo de fragmentação
- [ ] Criar API client layer (src/lib/api.ts) com funções typed
- [ ] Atualizar types (KnowledgeEntry, IngestionResult, ConflictInfo, CatalogEntry)
- [ ] Atualizar KnowledgeStore (remover yaml_text/saved_path, adicionar save_result/conflicts)
- [ ] Atualizar mock layer para simular novos endpoints
- [ ] Remover YamlEditor e código YAML associado

**Backend (repo separado — spec fornecido para outra equipe/LLM):**
- [ ] Criar tabelas no RDS: knowledge_entries, data_catalog, ingestion_log
- [ ] Implementar endpoints: /api/knowledge/save, /search, /resolve-conflict
- [ ] Implementar /api/context/process com fragmentação LLM + dedup
- [ ] Implementar /api/catalog/list, /search, /register
- [ ] Seed do data_catalog com tabelas conhecidas (fpa_combined, margem de contribuição)
- [ ] Migrar KnowledgeManager de file-based para DB-based
- [ ] Migrar fpa_analyst.py de file-loading para tool-calling (search_knowledge, query_data_catalog)
- [ ] Setup S3 bucket para backup de transcrições/PDFs raw

### Integração Backend (futuro)
- [ ] Conectar ao backend Python existente via API REST
- [ ] Substituir mocks por dados reais (Athena/Coralake)
- [ ] Streaming de respostas do LLM (SSE)
- [ ] Autenticação (TBD — Clerk, Auth0, ou interno)
- [ ] Persistência de conversas e knowledge em banco
