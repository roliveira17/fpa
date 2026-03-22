"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartConfig } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { formatBrlCompact } from "@/lib/formatters";

interface ChartRendererProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-md border border-border bg-card p-2 shadow-lg">
      <p className="text-[11px] font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[11px]" style={{ color: entry.color }}>
          {entry.name}: {formatBrlCompact(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function ChartRenderer({ data, config }: ChartRendererProps) {
  const y_keys = Array.isArray(config.y) ? config.y : [config.y];
  const chart_colors = [COLORS.actual, COLORS.budget, COLORS.waterfall.total, COLORS.warning];

  if (config.type === "waterfall") {
    return <WaterfallChart data={data} x_key={config.x} />;
  }

  if (config.type === "line") {
    return (
      <div className="my-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey={config.x} tick={{ fontSize: 11, fill: "#9090A8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#9090A8" }} tickFormatter={(v) => formatBrlCompact(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {y_keys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chart_colors[i % chart_colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (config.type === "horizontal_bar") {
    return (
      <div className="my-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#9090A8" }} tickFormatter={(v) => formatBrlCompact(v)} />
            <YAxis type="category" dataKey={config.y as string} tick={{ fontSize: 11, fill: "#9090A8" }} width={75} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={config.x} radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={(entry[config.x] as number) >= 0 ? COLORS.success : COLORS.danger}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // grouped_bar (default)
  return (
    <div className="my-3 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey={config.x} tick={{ fontSize: 10, fill: "#9090A8" }} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11, fill: "#9090A8" }} tickFormatter={(v) => formatBrlCompact(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {y_keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={chart_colors[i % chart_colors.length]}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WaterfallChart({ data, x_key }: { data: Record<string, unknown>[]; x_key: string }) {
  // Build waterfall using stacked bars with invisible base
  let running = 0;
  const waterfall_data = data.map((d) => {
    const value = d.value as number;
    const type = d.type as string;
    const name = d[x_key] as string;

    if (type === "total") {
      const result = { name, base: 0, value: value, fill: COLORS.waterfall.total };
      running = value;
      return result;
    }

    const base = running;
    running += value;
    return {
      name,
      base: value < 0 ? base + value : base,
      value: Math.abs(value),
      fill: value >= 0 ? COLORS.waterfall.increase : COLORS.waterfall.decrease,
    };
  });

  return (
    <div className="my-3 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={waterfall_data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9090A8" }} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: "#9090A8" }} tickFormatter={(v) => formatBrlCompact(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="base" stackId="stack" fill="transparent" />
          <Bar dataKey="value" stackId="stack" radius={[3, 3, 0, 0]}>
            {waterfall_data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
