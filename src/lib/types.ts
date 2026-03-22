export interface ChartConfig {
  type: "line" | "grouped_bar" | "horizontal_bar" | "waterfall";
  x: string;
  y: string | string[];
  color?: string;
}

export interface AgentResponse {
  text: string;
  sql: string | null;
  data: Record<string, unknown>[] | null;
  analysis: string | null;
  chart_config: ChartConfig | null;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AgentResponse;
  timestamp: Date;
}

export interface Report {
  id: string;
  label: string;
  icon: string;
  type: "hybrid" | "prompt";
  description: string;
}

export interface AgentRoadmap {
  id: string;
  name: string;
  icon: string;
  status: "active" | "wip" | "planned";
  description: string;
}

export interface Variance {
  conta_pl: string;
  real: number;
  budget: number;
  delta: number;
  variance_pct: number;
  trend: number[];
  budget_status: "over" | "under" | "on_track";
}

export interface SupplierBreakdown {
  supplier: string;
  value: number;
  pct_of_delta: number;
}

export interface BuBreakdown {
  bu: string;
  real: number;
  budget: number;
  delta: number;
}

export interface DiagnosticData {
  variances: Variance[];
  suppliers: Record<string, SupplierBreakdown[]>;
  bu_breakdown: Record<string, BuBreakdown[]>;
  trends: Record<string, number[]>;
  totals: { real: number; budget: number; delta: number };
  probing_questions: string[];
}

export interface KnowledgeExplanation {
  conta_pl: string;
  explanation: string;
  type: "one-off" | "recurring" | "seasonal" | "reclassification";
  expect_next_month: boolean;
}

export interface KnowledgeYaml {
  diretoria: string;
  bp: string;
  mes_ref: string;
  source: string;
  approved_at: string;
  variances: KnowledgeExplanation[];
  notes: string;
}

export interface DreRow {
  label: string;
  type: "header" | "line" | "subtotal" | "pct" | "total";
  indent: number;
  actual: number | null;
  budget: number | null;
  delta: number | null;
  variance_pct: number | null;
}

export type LoadingStep = "generating_sql" | "executing_query" | "analyzing" | "rendering";

export interface PreviousMonthKnowledge {
  conta_pl: string;
  explanation: string;
  type: KnowledgeExplanation["type"];
  mes_ref: string;
}

export interface SettingsState {
  llm_model: string;
  data_source: string;
  language: "pt-BR" | "en";
  theme: "dark" | "light";
}
