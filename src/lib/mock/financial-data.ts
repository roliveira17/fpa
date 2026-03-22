import { AgentResponse, DreRow, Variance, DiagnosticData, SupplierBreakdown, BuBreakdown, PreviousMonthKnowledge } from "../types";

export const MOCK_DRE_ROWS: DreRow[] = [
  { label: "Receita Bruta", type: "header", indent: 0, actual: 425_800_000, budget: 410_000_000, delta: 15_800_000, variance_pct: 0.0385 },
  { label: "Impostos e Deduções", type: "line", indent: 1, actual: -59_212_000, budget: -57_400_000, delta: -1_812_000, variance_pct: -0.0316 },
  { label: "Receita Líquida", type: "subtotal", indent: 0, actual: 366_588_000, budget: 352_600_000, delta: 13_988_000, variance_pct: 0.0397 },
  { label: "Margem Bruta %", type: "pct", indent: 0, actual: 0.861, budget: 0.860, delta: 0.001, variance_pct: null },
  { label: "Custo de Serviços", type: "line", indent: 1, actual: -98_450_000, budget: -95_200_000, delta: -3_250_000, variance_pct: -0.0341 },
  { label: "Lucro Bruto", type: "subtotal", indent: 0, actual: 268_138_000, budget: 257_400_000, delta: 10_738_000, variance_pct: 0.0417 },
  { label: "Despesas com Pessoal", type: "line", indent: 1, actual: -125_600_000, budget: -120_000_000, delta: -5_600_000, variance_pct: -0.0467 },
  { label: "G&A", type: "line", indent: 1, actual: -42_300_000, budget: -38_500_000, delta: -3_800_000, variance_pct: -0.0987 },
  { label: "Marketing", type: "line", indent: 1, actual: -28_750_000, budget: -30_000_000, delta: 1_250_000, variance_pct: 0.0417 },
  { label: "Tecnologia", type: "line", indent: 1, actual: -35_200_000, budget: -33_000_000, delta: -2_200_000, variance_pct: -0.0667 },
  { label: "EBITDA", type: "total", indent: 0, actual: 36_288_000, budget: 35_900_000, delta: 388_000, variance_pct: 0.0108 },
  { label: "Margem EBITDA %", type: "pct", indent: 0, actual: 0.099, budget: 0.102, delta: -0.003, variance_pct: null },
  { label: "D&A", type: "line", indent: 1, actual: -8_500_000, budget: -8_200_000, delta: -300_000, variance_pct: -0.0366 },
  { label: "Resultado Financeiro", type: "line", indent: 1, actual: -12_300_000, budget: -11_800_000, delta: -500_000, variance_pct: -0.0424 },
  { label: "Lucro Líquido", type: "total", indent: 0, actual: 15_488_000, budget: 15_900_000, delta: -412_000, variance_pct: -0.0259 },
];

export const MOCK_WATERFALL_DATA = [
  { name: "Receita Líquida", value: 366_588_000, type: "total" },
  { name: "Custo de Serviços", value: -98_450_000, type: "decrease" },
  { name: "Lucro Bruto", value: 268_138_000, type: "total" },
  { name: "Pessoal", value: -125_600_000, type: "decrease" },
  { name: "G&A", value: -42_300_000, type: "decrease" },
  { name: "Marketing", value: -28_750_000, type: "decrease" },
  { name: "Tecnologia", value: -35_200_000, type: "decrease" },
  { name: "EBITDA", value: 36_288_000, type: "total" },
  { name: "D&A", value: -8_500_000, type: "decrease" },
  { name: "Res. Financeiro", value: -12_300_000, type: "decrease" },
  { name: "Lucro Líquido", value: 15_488_000, type: "total" },
];

export const MOCK_TREND_DATA = [
  { mes_ref: "2024-08", actual: 340_200_000, budget: 335_000_000 },
  { mes_ref: "2024-09", actual: 348_500_000, budget: 340_000_000 },
  { mes_ref: "2024-10", actual: 355_100_000, budget: 345_000_000 },
  { mes_ref: "2024-11", actual: 358_900_000, budget: 348_000_000 },
  { mes_ref: "2024-12", actual: 362_400_000, budget: 350_000_000 },
  { mes_ref: "2025-01", actual: 366_588_000, budget: 352_600_000 },
  { mes_ref: "2025-02", actual: 371_200_000, budget: 355_000_000 },
];

export const MOCK_DESVIOS_DATA = [
  { conta_pl: "G&A", actual: 42_300_000, budget: 38_500_000, delta: -3_800_000, variance_pct: -0.0987 },
  { conta_pl: "Despesas com Pessoal", actual: 125_600_000, budget: 120_000_000, delta: -5_600_000, variance_pct: -0.0467 },
  { conta_pl: "Tecnologia", actual: 35_200_000, budget: 33_000_000, delta: -2_200_000, variance_pct: -0.0667 },
  { conta_pl: "Custo de Serviços", actual: 98_450_000, budget: 95_200_000, delta: -3_250_000, variance_pct: -0.0341 },
  { conta_pl: "Receita Bruta", actual: 425_800_000, budget: 410_000_000, delta: 15_800_000, variance_pct: 0.0385 },
];

export function getMockChatResponse(message: string): AgentResponse {
  const lower = message.toLowerCase();

  if (lower.includes("p&l") || lower.includes("fechamento")) {
    return {
      text: "## Fechamento Mensal — Janeiro 2025\n\nO resultado do mês apresentou **Receita Líquida de R\\$ 366,6M**, superando o budget em **+4,0%**. O EBITDA ficou em **R\\$ 36,3M** (margem de 9,9%), ligeiramente acima do orçado.\n\n### Destaques positivos:\n- Receita Bruta acima do budget em R\\$ 15,8M (+3,9%)\n- Marketing abaixo do budget em R\\$ 1,3M (economia de 4,2%)\n\n### Pontos de atenção:\n- G&A estourou o budget em R\\$ 3,8M (-9,9%) — concentrado em consultoria jurídica\n- Pessoal acima do budget em R\\$ 5,6M (-4,7%) — hiring acelerado em Engenharia",
      sql: "SELECT mes_ref, conta_pl, input, SUM(valor) as valor\nFROM financial_planning.fpa_combined\nWHERE mes_ref = '2025-01'\nGROUP BY mes_ref, conta_pl, input\nORDER BY conta_pl",
      data: MOCK_DRE_ROWS.map(r => ({
        conta_pl: r.label,
        real: r.actual,
        budget: r.budget,
        delta: r.delta,
        var_pct: r.variance_pct,
      })),
      analysis: "O mês de janeiro mostra uma tendência de **crescimento top-line saudável** (receita +4,0% vs budget), mas com **pressão nas linhas de custo** — especialmente G&A e Pessoal. A margem EBITDA de 9,9% ficou ligeiramente abaixo do orçado (10,2%), indicando que o crescimento de despesas precisa ser monitorado nos próximos meses para não comprometer a rentabilidade.",
      chart_config: { type: "waterfall", x: "name", y: "value" },
      error: null,
    };
  }

  if (lower.includes("desvio") || lower.includes("variação") || lower.includes("top")) {
    return {
      text: "## Top 5 Desvios vs Orçado — Janeiro 2025\n\nAnalisei as contas com maiores desvios absolutos em relação ao budget:",
      sql: "SELECT conta_pl,\n  SUM(CASE WHEN input='actual' THEN valor END) as real,\n  SUM(CASE WHEN input='bgt' THEN valor END) as budget\nFROM financial_planning.fpa_combined\nWHERE mes_ref = '2025-01'\nGROUP BY conta_pl\nHAVING ABS(real - budget) / NULLIF(budget, 0) > 0.03\nORDER BY ABS(real - budget) DESC\nLIMIT 5",
      data: MOCK_DESVIOS_DATA,
      analysis: "O maior desvio absoluto é em **Despesas com Pessoal** (R\\$ -5,6M), seguido por **G&A** (R\\$ -3,8M). Juntos, esses dois centros representam **85% do estouro total** de despesas. A Receita Bruta compensou parcialmente com R\\$ +15,8M acima do budget.",
      chart_config: { type: "horizontal_bar", x: "delta", y: "conta_pl" },
      error: null,
    };
  }

  if (lower.includes("g&a") || lower.includes("drill") || lower.includes("deep")) {
    return {
      text: "## Deep-Dive: G&A — Janeiro 2025\n\nG&A fechou em **R\\$ 42,3M** vs budget de **R\\$ 38,5M** (desvio de -9,9%). Vamos decompor:",
      sql: "SELECT conta_pl, diretoria,\n  SUM(CASE WHEN input='actual' THEN valor END) as real,\n  SUM(CASE WHEN input='bgt' THEN valor END) as budget\nFROM financial_planning.fpa_combined\nWHERE mes_ref = '2025-01'\n  AND conta_pl LIKE '%G&A%'\nGROUP BY conta_pl, diretoria\nORDER BY ABS(real - budget) DESC",
      data: [
        { conta_pl: "G&A - Consultoria", diretoria: "LEGAL", real: 8_500_000, budget: 5_200_000, delta: -3_300_000 },
        { conta_pl: "G&A - Facilities", diretoria: "FINANCEIRO", real: 12_100_000, budget: 12_000_000, delta: -100_000 },
        { conta_pl: "G&A - Seguros", diretoria: "FINANCEIRO", real: 4_200_000, budget: 4_300_000, delta: 100_000 },
        { conta_pl: "G&A - Licenças SW", diretoria: "ENGENHARIA", real: 9_800_000, budget: 9_500_000, delta: -300_000 },
        { conta_pl: "G&A - Outros", diretoria: "FINANCEIRO", real: 7_700_000, budget: 7_500_000, delta: -200_000 },
      ],
      analysis: "O **principal driver** do estouro de G&A é a conta de **Consultoria Jurídica** (R\\$ -3,3M, ou 87% do desvio total de G&A). Isso está relacionado a processos regulatórios em andamento. As demais contas de G&A estão próximas do budget, com variações marginais.",
      chart_config: { type: "grouped_bar", x: "conta_pl", y: ["real", "budget"] },
      error: null,
    };
  }

  // Default response for any other query
  return {
    text: `## Análise Solicitada\n\nProcessando sua pergunta: "${message}"\n\nBaseado nos dados disponíveis, aqui está uma visão geral do P&L consolidado de Janeiro 2025:`,
    sql: `SELECT mes_ref, conta_pl, input, SUM(valor) as valor\nFROM financial_planning.fpa_combined\nWHERE mes_ref = '2025-01'\nGROUP BY mes_ref, conta_pl, input`,
    data: MOCK_DESVIOS_DATA,
    analysis: "A análise do período mostra resultados dentro da faixa esperada para a maioria das contas. Recomendo focar nos itens com variação acima de 5% para investigação mais detalhada.",
    chart_config: { type: "grouped_bar", x: "conta_pl", y: ["actual", "budget"] },
    error: null,
  };
}

export function getMockVariances(diretoria: string): Variance[] {
  const base: Variance[] = [
    { conta_pl: "Despesas com Pessoal", real: 18_500_000, budget: 16_800_000, delta: -1_700_000, variance_pct: -0.1012, trend: [15_200_000, 16_100_000, 18_500_000], budget_status: "over" },
    { conta_pl: "Serviços de Terceiros", real: 5_200_000, budget: 4_100_000, delta: -1_100_000, variance_pct: -0.2683, trend: [3_800_000, 4_500_000, 5_200_000], budget_status: "over" },
    { conta_pl: "Licenças e Software", real: 3_800_000, budget: 3_500_000, delta: -300_000, variance_pct: -0.0857, trend: [3_400_000, 3_600_000, 3_800_000], budget_status: "over" },
    { conta_pl: "Viagens e Representação", real: 850_000, budget: 1_200_000, delta: 350_000, variance_pct: 0.2917, trend: [1_100_000, 950_000, 850_000], budget_status: "under" },
    { conta_pl: "Treinamento e Desenvolvimento", real: 620_000, budget: 500_000, delta: -120_000, variance_pct: -0.2400, trend: [450_000, 380_000, 620_000], budget_status: "over" },
    { conta_pl: "Infraestrutura Cloud", real: 4_100_000, budget: 3_900_000, delta: -200_000, variance_pct: -0.0513, trend: [3_700_000, 3_800_000, 4_100_000], budget_status: "on_track" },
  ];

  // Add some variation based on diretoria
  const multiplier = diretoria === "ENGENHARIA" ? 1.5 : diretoria === "MARKETING" ? 0.8 : 1.0;
  return base.map(v => ({
    ...v,
    real: Math.round(v.real * multiplier),
    budget: Math.round(v.budget * multiplier),
    delta: Math.round(v.delta * multiplier),
    trend: v.trend.map(t => Math.round(t * multiplier)),
  }));
}

export function getMockDiagnosticData(diretoria: string): DiagnosticData {
  const variances = getMockVariances(diretoria);
  return {
    variances,
    suppliers: {
      "Despesas com Pessoal": [
        { supplier: "Folha CLT", value: 12_500_000, pct_of_delta: 0.65 },
        { supplier: "PJ / Contractors", value: 3_200_000, pct_of_delta: 0.22 },
        { supplier: "Benefícios", value: 1_800_000, pct_of_delta: 0.08 },
        { supplier: "PLR / Bônus", value: 600_000, pct_of_delta: 0.03 },
        { supplier: "Outros", value: 400_000, pct_of_delta: 0.02 },
      ],
      "Serviços de Terceiros": [
        { supplier: "Accenture", value: 2_100_000, pct_of_delta: 0.45 },
        { supplier: "McKinsey", value: 1_500_000, pct_of_delta: 0.30 },
        { supplier: "Deloitte", value: 800_000, pct_of_delta: 0.15 },
        { supplier: "EY", value: 500_000, pct_of_delta: 0.07 },
        { supplier: "Outros", value: 300_000, pct_of_delta: 0.03 },
      ],
    },
    bu_breakdown: {
      "Despesas com Pessoal": [
        { bu: "Backend", real: 5_200_000, budget: 4_800_000, delta: -400_000 },
        { bu: "Frontend", real: 4_100_000, budget: 3_600_000, delta: -500_000 },
        { bu: "Mobile", real: 3_800_000, budget: 3_400_000, delta: -400_000 },
        { bu: "Platform", real: 5_400_000, budget: 5_000_000, delta: -400_000 },
      ],
    },
    trends: {
      "Despesas com Pessoal": [15_200_000, 16_100_000, 18_500_000],
      "Serviços de Terceiros": [3_800_000, 4_500_000, 5_200_000],
    },
    totals: {
      real: variances.reduce((s, v) => s + v.real, 0),
      budget: variances.reduce((s, v) => s + v.budget, 0),
      delta: variances.reduce((s, v) => s + v.delta, 0),
    },
    probing_questions: [
      `O aumento em Despesas com Pessoal de ${diretoria} é por novas contratações ou reajuste?`,
      "Os contratos de Serviços de Terceiros foram renegociados recentemente?",
      "Existe previsão de normalização nos próximos meses?",
      "O estouro em Treinamento está ligado a algum programa específico?",
      "A economia em Viagens é sustentável ou há demanda reprimida?",
    ],
  };
}

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

export function getMockContextCheck(mes_ref: string): { exists: boolean; content?: string } {
  if (mes_ref === "2025-01") {
    return {
      exists: true,
      content: "## Resumo Executivo — Janeiro 2025\n\n| KPI | Valor | vs Budget |\n|-----|-------|----------|\n| Receita Líquida | R$ 366,6M | +4,0% |\n| EBITDA | R$ 36,3M | +1,1% |\n| Margem EBITDA | 9,9% | -0,3pp |\n| Lucro Líquido | R$ 15,5M | -2,6% |\n\n### Narrativa do Mês\nJaneiro apresentou forte crescimento top-line...",
    };
  }
  return { exists: false };
}
