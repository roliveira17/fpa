"use client";

import { LOADING_STEPS } from "@/lib/constants";
import { LoadingStep } from "@/lib/types";

interface LoadingStepsProps {
  current_step: LoadingStep | null;
}

export function LoadingSteps({ current_step }: LoadingStepsProps) {
  const current_idx = LOADING_STEPS.findIndex((s) => s.id === current_step);

  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
        C
      </div>
      <div className="space-y-1.5 py-1">
        {LOADING_STEPS.map((step, i) => {
          const is_done = i < current_idx;
          const is_active = i === current_idx;
          const is_pending = i > current_idx;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${
                is_done ? "bg-success" :
                is_active ? "bg-primary animate-pulse" :
                "bg-muted-foreground/30"
              }`} />
              <span className={`text-xs ${
                is_done ? "text-success" :
                is_active ? "text-foreground" :
                is_pending ? "text-muted-foreground/40" : ""
              }`}>
                {is_done ? step.label.replace("...", " ✓") : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
