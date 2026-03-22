"use client";

import { useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { SidebarRight } from "@/components/layout/sidebar-right";
import { ChatView } from "@/components/chat/chat-view";
import { KnowledgeView } from "@/components/knowledge/knowledge-view";
import { ContextView } from "@/components/context/context-view";
import { useAppStore, useChatStore } from "@/lib/store";
import { getMockChatResponse } from "@/lib/mock/financial-data";
import { ChatMessage } from "@/lib/types";

const REPORT_PROMPTS: Record<string, string> = {
  fechamento_mensal: "Como foi o P&L do último mês fechado?",
  centro_custo: "Analise os centros de custo do mês atual",
  dre_anual: "Monte a DRE anual consolidada",
  desvios_mensais: "Quais contas tiveram maior desvio vs orçado?",
  deep_dive: "Explica G&A — drill-down passo a passo",
  earnings_release: "Compile o earnings release do trimestre",
};

export default function Home() {
  const { active_tab, setActiveTab } = useAppStore();
  const { addMessage, setLoading, setLoadingStep } = useChatStore();

  const handleReportClick = useCallback((report_id: string) => {
    const prompt = REPORT_PROMPTS[report_id] ?? `Gere o relatório ${report_id}`;

    const user_msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    addMessage(user_msg);
    setLoading(true);
    setLoadingStep("generating_sql");
    setTimeout(() => setLoadingStep("executing_query"), 400);
    setTimeout(() => setLoadingStep("analyzing"), 900);
    setTimeout(() => setLoadingStep("rendering"), 1300);
    setTimeout(() => {
      const response = getMockChatResponse(prompt);
      const assistant_msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.text,
        response,
        timestamp: new Date(),
      };
      addMessage(assistant_msg);
      setLoading(false);
    }, 1700);
  }, [addMessage, setLoading, setLoadingStep]);

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarLeft onReportClick={handleReportClick} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-border bg-card px-4 py-1.5">
            <Tabs
              value={active_tab}
              onValueChange={(v) => setActiveTab(v as "chat" | "knowledge" | "context")}
            >
              <TabsList className="h-8 bg-secondary/30">
                <TabsTrigger value="chat" className="text-xs h-6 px-3">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="text-xs h-6 px-3">
                  Knowledge Input
                </TabsTrigger>
                <TabsTrigger value="context" className="text-xs h-6 px-3">
                  Contexto Gerencial
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab content */}
          {active_tab === "chat" && <ChatView />}
          {active_tab === "knowledge" && <KnowledgeView />}
          {active_tab === "context" && <ContextView />}
        </main>
        <SidebarRight />
      </div>
    </div>
  );
}
