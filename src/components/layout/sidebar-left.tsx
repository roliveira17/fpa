"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { REPORTS } from "@/lib/constants";
import { useChatStore, useAppStore } from "@/lib/store";
import { useState } from "react";

interface SidebarLeftProps {
  onReportClick: (report_id: string) => void;
}

export function SidebarLeft({ onReportClick }: SidebarLeftProps) {
  const { clearMessages } = useChatStore();
  const { setActiveTab, left_panel_open, setLeftPanel } = useAppStore();
  const [about_open, setAboutOpen] = useState(false);

  function handleReportClick(report_id: string) {
    setActiveTab("chat");
    onReportClick(report_id);
  }

  const content = (
    <>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Relatórios
        </p>
        <div className="space-y-1">
          {REPORTS.map((report) => (
            <Button
              key={report.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs font-normal text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => handleReportClick(report.id)}
            >
              <span>{report.icon}</span>
              <span className="truncate">{report.label}</span>
            </Button>
          ))}
        </div>

        <Separator className="my-3" />

        <a
          href="#"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          <span>📊</span>
          <span>Análise de Folha</span>
          <Badge variant="outline" className="ml-auto text-[9px] px-1">
            ext
          </Badge>
        </a>

        <Separator className="my-3" />

        <Collapsible open={about_open} onOpenChange={setAboutOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span>Sobre o Agente</span>
            <span className="text-[10px]">{about_open ? "▾" : "▸"}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pt-2 space-y-2 text-[11px] text-muted-foreground">
            <div>
              <span className="text-foreground/60">Fonte:</span>{" "}
              financial_planning.fpa_combined
            </div>
            <div>
              <span className="text-foreground/60">Tipos:</span> Realizado +
              Orçado
            </div>
            <div>
              <span className="text-foreground/60">Atualizado:</span>{" "}
              22/03/2025 08:30
            </div>
            <div>
              <span className="text-foreground/60">Modelo:</span> Claude Sonnet
              4.6
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-destructive"
          onClick={clearMessages}
        >
          Limpar Conversa
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-border bg-sidebar">
        {content}
      </aside>
      {/* Mobile/Tablet */}
      {left_panel_open && (
        <Sheet open={left_panel_open} onOpenChange={setLeftPanel}>
          <SheetContent side="left" className="w-56 p-0 bg-sidebar border-border">
            {content}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
