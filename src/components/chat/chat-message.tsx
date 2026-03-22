"use client";

import { ChatMessage as ChatMessageType } from "@/lib/types";
import { AgentResponseCard } from "./agent-response-card";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary mt-0.5">
        C
      </div>
      <div className="min-w-0 flex-1">
        {message.response ? (
          <AgentResponseCard response={message.response} />
        ) : (
          <p className="text-sm text-foreground/90">{message.content}</p>
        )}
      </div>
    </div>
  );
}
