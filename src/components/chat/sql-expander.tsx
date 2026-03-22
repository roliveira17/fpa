"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface SqlExpanderProps {
  sql: string;
}

export function SqlExpander({ sql }: SqlExpanderProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="my-2">
      <CollapsibleTrigger className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
        <span className="text-[10px]">{open ? "▾" : "▸"}</span>
        <span className="font-mono">Ver SQL executado</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <pre className="rounded-md bg-[#0D0D18] border border-border p-3 text-[11px] font-mono text-green-400/80 overflow-x-auto leading-relaxed">
          {sql}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
