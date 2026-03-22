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
Definir as melhores práticas e arquitetura do repositório de conhecimento que o agente usa para responder perguntas. O objetivo é que o agente consiga buscar informações relevantes de múltiplas fontes para fundamentar suas respostas.

- [ ] Pesquisar padrões de knowledge base para agents (RAG, vector stores, hybrid search)
- [ ] Definir estrutura de armazenamento: YAML knowledge files vs vector DB vs ambos
- [ ] Indexação de explicações de variações dos BPs (output do Knowledge Input wizard)
- [ ] Indexação de contexto gerencial (transcrições, PDFs processados)
- [ ] Indexação de relatórios anteriores (fechamentos mensais, earnings releases)
- [ ] Estratégia de chunking e embedding para documentos financeiros
- [ ] Retrieval strategy: como o agente decide o que buscar (keyword, semantic, hybrid)
- [ ] Freshness policy: priorizar conhecimento recente vs histórico
- [ ] Metadata enrichment: mes_ref, diretoria, conta_pl, tipo de documento como filtros
- [ ] Avaliação de qualidade: como medir se o agente está trazendo contexto relevante
- [ ] Benchmark: comparar respostas com e sem knowledge retrieval

### Integração Backend (futuro)
- [ ] Conectar ao backend Python existente via API REST
- [ ] Substituir mocks por dados reais (Athena/Coralake)
- [ ] Streaming de respostas do LLM (SSE)
- [ ] Autenticação (TBD — Clerk, Auth0, ou interno)
- [ ] Persistência de conversas e knowledge em banco
