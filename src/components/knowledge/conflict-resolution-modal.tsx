"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ConflictInfo } from "@/lib/types";
import { resolveConflict } from "@/lib/api";

interface ConflictResolutionModalProps {
  conflict: ConflictInfo | null;
  open: boolean;
  on_resolved: (entry_id: string) => void;
  on_close: () => void;
}

type Resolution = "keep_existing" | "use_new" | "custom";

export function ConflictResolutionModal({
  conflict, open, on_resolved, on_close,
}: ConflictResolutionModalProps) {
  const [selected, setSelected] = useState<Resolution | null>(null);
  const [custom_text, setCustomText] = useState("");
  const [is_saving, setIsSaving] = useState(false);

  if (!conflict) return null;

  async function handleResolve() {
    if (!selected || !conflict) return;
    setIsSaving(true);
    try {
      await resolveConflict({
        entry_id: conflict.entry_id,
        resolution: selected,
        custom_text: selected === "custom" ? custom_text : undefined,
      });
      on_resolved(conflict.entry_id);
    } finally {
      setIsSaving(false);
      setSelected(null);
      setCustomText("");
    }
  }

  const options: { value: Resolution; label: string; description: string }[] = [
    { value: "keep_existing", label: "Manter existente", description: conflict.existing_text },
    { value: "use_new", label: "Usar nova", description: conflict.new_text },
    { value: "custom", label: "Editar manualmente", description: "Escreva o texto final abaixo" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && on_close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conflito detectado</DialogTitle>
          <DialogDescription className="text-xs">
            {conflict.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`w-full rounded-md border p-3 text-left text-xs transition-colors ${
                selected === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/10"
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="mt-1 text-muted-foreground">{opt.description}</p>
            </button>
          ))}
        </div>

        {selected === "custom" && (
          <Textarea
            value={custom_text}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Escreva a explicação final..."
            className="text-xs h-24 resize-none"
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={on_close} disabled={is_saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selected || (selected === "custom" && !custom_text.trim()) || is_saving}
            className="bg-primary hover:bg-primary/90"
          >
            {is_saving ? "Salvando..." : "Resolver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
