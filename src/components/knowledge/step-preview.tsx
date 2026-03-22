"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useKnowledgeStore } from "@/lib/store";
import { saveKnowledge } from "@/lib/api";
import { KnowledgePreviewCard } from "./knowledge-preview-card";
import { ConflictResolutionModal } from "./conflict-resolution-modal";
import type { ConflictInfo } from "@/lib/types";

interface StepPreviewProps {
  on_next: () => void;
  on_back: () => void;
}

export function StepPreview({ on_next, on_back }: StepPreviewProps) {
  const store = useKnowledgeStore();
  const { group_squads, diretoria, mes_ref, analyst_name, explanations, bp_notes } = store;
  const is_group = group_squads.length > 0;
  const [is_saving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active_conflict, setActiveConflict] = useState<ConflictInfo | null>(null);

  const has_content = Object.keys(explanations).length > 0 || bp_notes.trim().length > 0;

  function buildEntries() {
    const entries = Object.values(explanations).map((exp) => ({
      conta_pl: exp.conta_pl as string | null,
      explanation: exp.explanation,
      variance_type: exp.type as 'one-off' | 'recurring' | 'seasonal' | 'reclassification',
      expect_next: exp.expect_next_month,
    }));
    if (bp_notes.trim()) {
      entries.push({
        conta_pl: null,
        explanation: bp_notes,
        variance_type: "one-off" as const,
        expect_next: false,
      });
    }
    return entries;
  }

  async function handleSave(target_diretoria: string) {
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveKnowledge({
        diretoria: target_diretoria,
        mes_ref,
        analyst: analyst_name,
        entry_type: "variance_explanation",
        entries: buildEntries(),
      });
      store.setSaveResult(result);
      if (result.conflicts.length > 0) {
        store.setConflicts(result.conflicts);
        setActiveConflict(result.conflicts[0]);
      } else {
        on_next();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conhecimento.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAll() {
    setIsSaving(true);
    setError(null);
    try {
      let total_created = 0;
      let total_merged = 0;
      let total_skipped = 0;
      const all_conflicts: ConflictInfo[] = [];

      for (const squad of group_squads) {
        const result = await saveKnowledge({
          diretoria: squad,
          mes_ref,
          analyst: analyst_name,
          entry_type: "variance_explanation",
          entries: buildEntries(),
        });
        total_created += result.created;
        total_merged += result.merged;
        total_skipped += result.skipped;
        all_conflicts.push(...result.conflicts);
      }

      store.setSaveResult({
        created: total_created,
        merged: total_merged,
        skipped: total_skipped,
        conflicts: all_conflicts,
      });

      if (all_conflicts.length > 0) {
        store.setConflicts(all_conflicts);
        setActiveConflict(all_conflicts[0]);
      } else {
        on_next();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conhecimento.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleConflictResolved(entry_id: string) {
    store.resolveConflict(entry_id);
    const remaining = useKnowledgeStore.getState().conflicts;
    if (remaining.length > 0) {
      setActiveConflict(remaining[0]);
    } else {
      setActiveConflict(null);
      on_next();
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      {is_group ? (
        <div className="space-y-3">
          {group_squads.map((squad) => (
            <Collapsible key={squad} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent/20">
                {squad}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <KnowledgePreviewCard
                  diretoria={squad}
                  mes_ref={mes_ref}
                  analyst={analyst_name}
                  explanations={explanations}
                  bp_notes={bp_notes}
                />
              </CollapsibleContent>
            </Collapsible>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={on_back}>Voltar</Button>
            <Button
              onClick={handleSaveAll}
              disabled={!has_content || is_saving}
              className="bg-primary hover:bg-primary/90"
            >
              {is_saving ? "Salvando..." : "Salvar Todos"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium mb-2">Preview do Conhecimento</p>
            <KnowledgePreviewCard
              diretoria={diretoria}
              mes_ref={mes_ref}
              analyst={analyst_name}
              explanations={explanations}
              bp_notes={bp_notes}
            />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={on_back}>Voltar</Button>
            <Button
              onClick={() => handleSave(diretoria)}
              disabled={!has_content || is_saving}
              className="bg-primary hover:bg-primary/90"
            >
              {is_saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <ConflictResolutionModal
        conflict={active_conflict}
        open={active_conflict !== null}
        on_resolved={handleConflictResolved}
        on_close={() => setActiveConflict(null)}
      />
    </div>
  );
}
