"use client";

import { useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/store";
import { getMockChatResponse } from "@/lib/mock/financial-data";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import { LoadingSteps } from "./loading-steps";
import { SUGGESTION_QUERIES } from "@/lib/constants";
import { ChatMessage } from "@/lib/types";

export function ChatView() {
  const { messages, is_loading, loading_step, addMessage, setLoading, setLoadingStep } = useChatStore();
  const scroll_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scroll_ref.current?.querySelector("[data-slot='scroll-area-viewport']");
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback((text: string) => {
    const user_msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    addMessage(user_msg);
    setLoading(true);
    setLoadingStep("generating_sql");
    setTimeout(() => setLoadingStep("executing_query"), 400);
    setTimeout(() => setLoadingStep("analyzing"), 900);
    setTimeout(() => setLoadingStep("rendering"), 1300);
    setTimeout(() => {
      const response = getMockChatResponse(text);
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

  const is_empty = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {is_empty ? (
        <WelcomeState on_query={handleSend} />
      ) : (
        <ScrollArea className="flex-1 min-h-0" ref={scroll_ref}>
          <div className="mx-auto max-w-3xl space-y-6 p-4 pb-4">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}
            {is_loading && <LoadingSteps current_step={loading_step} />}
          </div>
        </ScrollArea>
      )}
      <ChatInput on_send={handleSend} is_loading={is_loading} />
    </div>
  );
}

function WelcomeState({ on_query }: { on_query: (q: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-3xl font-bold text-primary">C</span>
        </div>
        <h2 className="text-xl font-semibold">Agente de FP&A da Cora</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Análise de P&L conversacional com IA
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {SUGGESTION_QUERIES.map((sq) => (
          <Button
            key={sq.report_id}
            variant="outline"
            className="h-auto max-w-[240px] whitespace-normal px-4 py-3 text-left text-xs leading-relaxed border-border/50 hover:border-primary/30 hover:bg-primary/5"
            onClick={() => on_query(sq.label)}
          >
            {sq.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
