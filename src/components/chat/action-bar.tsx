"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ActionBarProps {
  content: string;
}

export function ActionBar({ content }: ActionBarProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analise-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/50">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
      >
        {copied ? "✓ Copiado" : "Copiar"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
        onClick={handleDownload}
      >
        Download .md
      </Button>
    </div>
  );
}
