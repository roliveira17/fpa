"use client";

import { AgentResponse } from "@/lib/types";
import { MOCK_DRE_ROWS, MOCK_WATERFALL_DATA } from "@/lib/mock/financial-data";
import { MarkdownRenderer } from "./markdown-renderer";
import { SqlExpander } from "./sql-expander";
import { DataTable } from "./data-table";
import { ActionBar } from "./action-bar";
import { ChartRenderer } from "@/components/charts/chart-renderer";
import { DreTable } from "@/components/charts/dre-table";

interface AgentResponseCardProps {
  response: AgentResponse;
}

export function AgentResponseCard({ response }: AgentResponseCardProps) {
  const is_dre = response.chart_config?.type === "waterfall";
  const chart_data = is_dre ? MOCK_WATERFALL_DATA : (response.data ?? []);

  // Build full markdown for copy/download
  const full_content = [
    response.text,
    response.analysis,
  ].filter(Boolean).join("\n\n");

  return (
    <div className="space-y-1">
      {/* Main analysis text */}
      {response.text && <MarkdownRenderer content={response.text} />}

      {/* SQL expander */}
      {response.sql && <SqlExpander sql={response.sql} />}

      {/* DRE table for waterfall responses */}
      {is_dre && <DreTable rows={MOCK_DRE_ROWS} />}

      {/* Data table for non-DRE responses */}
      {!is_dre && response.data && response.data.length > 0 && (
        <DataTable data={response.data} />
      )}

      {/* Chart */}
      {response.chart_config && chart_data.length > 0 && (
        <ChartRenderer data={chart_data} config={response.chart_config} />
      )}

      {/* Additional analysis */}
      {response.analysis && (
        <div className="mt-2 rounded-md bg-secondary/20 p-3 border-l-2 border-primary/40">
          <MarkdownRenderer content={response.analysis} />
        </div>
      )}

      {/* Action bar */}
      <ActionBar content={full_content} />
    </div>
  );
}
