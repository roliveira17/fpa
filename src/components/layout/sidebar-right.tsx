"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENTS_ROADMAP } from "@/lib/constants";
import { useAppStore } from "@/lib/store";

export function SidebarRight() {
  const { right_panel_open } = useAppStore();

  if (!right_panel_open) return null;

  return (
    <aside className="flex w-60 flex-col border-l border-border bg-sidebar overflow-y-auto">
      <div className="p-3">
        <p className="mb-3 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Roadmap de Agentes
        </p>
        <div className="space-y-2">
          {AGENTS_ROADMAP.map((agent) => (
            <Card
              key={agent.id}
              className={`p-3 transition-colors ${
                agent.status === "active"
                  ? "border-primary/30 bg-primary/5"
                  : agent.status === "wip"
                  ? "border-warning/20 bg-warning/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base">{agent.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">
                      {agent.name}
                    </span>
                    <Badge
                      variant={
                        agent.status === "active"
                          ? "default"
                          : "outline"
                      }
                      className={`text-[9px] px-1 py-0 ${
                        agent.status === "active"
                          ? "bg-success text-success-foreground"
                          : agent.status === "wip"
                          ? "border-warning/50 text-warning"
                          : ""
                      }`}
                    >
                      {agent.status === "active"
                        ? "Ativo"
                        : agent.status === "wip"
                        ? "WIP"
                        : "Planejado"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                    {agent.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </aside>
  );
}
