"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useCallback } from "react";

interface ChatInputProps {
  on_send: (message: string) => void;
  is_loading: boolean;
}

export function ChatInput({ on_send, is_loading }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || is_loading) return;
    on_send(trimmed);
    setValue("");
  }, [value, is_loading, on_send]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-border bg-card p-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Faça uma pergunta sobre o P&L..."
          className="min-h-[40px] max-h-[120px] resize-none bg-secondary/30 border-border/50 text-sm placeholder:text-muted-foreground/50"
          rows={1}
          disabled={is_loading}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!value.trim() || is_loading}
          className="h-10 px-4 bg-primary hover:bg-primary/90"
        >
          {is_loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            "Enviar"
          )}
        </Button>
      </div>
    </div>
  );
}
