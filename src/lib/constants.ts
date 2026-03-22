import { Report, AgentRoadmap } from "./types";

export const BP_MAPPING: Record<string, string> = {
  PRODUTO: "Ana Silva",
  "CRÉDITO": "Carlos Mendes",
  DESIGN: "Fernanda Costa",
  MARKETING: "Roberto Alves",
  ENGENHARIA: "Lucas Ferreira",
  DADOS: "Mariana Santos",
  DEVOPS: "Pedro Oliveira",
  CYBERSECURITY: "Julia Lima",
  PEOPLE: "Beatriz Souza",
  FINANCEIRO: "Ricardo Gomes",
  LEGAL: "Patricia Nunes",
  CX: "Thiago Rocha",
  "SEGURANÇA DO CLIENTE": "Amanda Dias",
  "RISCO E COMPLIANCE": "Eduardo Martins",
  "CORA CASES": "Camila Ribeiro",
  DPO: "Daniel Pereira",
};

export const DIRETORIA_GROUPS: Record<string, string[]> = {
  Engenharia: ["DADOS", "DEVOPS", "ENGENHARIA", "CYBERSECURITY"],
};

export const DIRETORIAS = Object.keys(BP_MAPPING);

export const REPORTS: Report[] = [
  {
    id: "fechamento_mensal",
    label: "Fechamento Mensal",
    icon: "📋",
    type: "hybrid",
    description: "Relatório completo de fechamento com DRE, métricas e análise",
  },
  {
    id: "centro_custo",
    label: "Centro de Custo",
    icon: "🏢",
    type: "prompt",
    description: "Análise detalhada por centro de custo",
  },
  {
    id: "dre_anual",
    label: "DRE Anual",
    icon: "📋",
    type: "prompt",
    description: "Parte 1/4 — Demonstração de resultado anual",
  },
  {
    id: "desvios_mensais",
    label: "Desvios Mensais",
    icon: "📈",
    type: "prompt",
    description: "Parte 2/4 — Top 5 desvios vs orçado",
  },
  {
    id: "deep_dive",
    label: "Deep-Dive",
    icon: "🔍",
    type: "prompt",
    description: "Parte 3/4 — Drill-down por fornecedor",
  },
  {
    id: "earnings_release",
    label: "Earnings Release",
    icon: "📊",
    type: "prompt",
    description: "Parte 4/4 — Compilação final para diretoria",
  },
];

export const AGENTS_ROADMAP: AgentRoadmap[] = [
  {
    id: "fpa",
    name: "Agente FP&A",
    icon: "📊",
    status: "active",
    description: "Análise de P&L, real vs orçado, fechamento mensal",
  },
  {
    id: "knowledge",
    name: "Knowledge Capture",
    icon: "🧠",
    status: "active",
    description: "Captura estruturada de explicações dos BPs",
  },
  {
    id: "fopag",
    name: "Análise de Folha",
    icon: "💰",
    status: "wip",
    description: "Dashboard de folha de pagamento e benefícios",
  },
  {
    id: "forecast",
    name: "Forecast Agent",
    icon: "🔮",
    status: "wip",
    description: "Projeções e cenários de forecast rolling",
  },
  {
    id: "procurement",
    name: "Procurement Intel",
    icon: "🛒",
    status: "planned",
    description: "Análise de contratos e oportunidades de saving",
  },
  {
    id: "tax",
    name: "Tax Compliance",
    icon: "📑",
    status: "planned",
    description: "Monitoramento tributário e obrigações acessórias",
  },
  {
    id: "treasury",
    name: "Treasury Agent",
    icon: "🏦",
    status: "planned",
    description: "Gestão de caixa, aplicações e fluxo de caixa",
  },
  {
    id: "audit",
    name: "Internal Audit",
    icon: "🔍",
    status: "planned",
    description: "Detecção de anomalias e compliance contínuo",
  },
];

export const SUGGESTION_QUERIES = [
  {
    label: "Como foi o P&L do último mês fechado?",
    report_id: "fechamento_mensal",
  },
  {
    label: "Quais contas tiveram maior desvio vs orçado?",
    report_id: "top_desvios",
  },
  {
    label: "Explica G&A — drill-down passo a passo",
    report_id: "ga_deep_dive",
  },
];

export const AVAILABLE_MONTHS = [
  "2025-01",
  "2025-02",
  "2024-12",
  "2024-11",
  "2024-10",
  "2024-09",
  "2024-08",
  "2024-07",
];

export const COLORS = {
  pink: "#E91E63",
  dark: "#1A1A2E",
  success: "#4CAF50",
  danger: "#F44336",
  warning: "#FF9800",
  actual: "#E91E63",
  budget: "#9090A8",
  yoy: "#1A1A2E",
  waterfall: {
    increase: "#4CAF50",
    decrease: "#F44336",
    total: "#2196F3",
  },
} as const;
