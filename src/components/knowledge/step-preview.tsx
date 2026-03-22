"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useKnowledgeStore } from "@/lib/store";
import { BP_MAPPING } from "@/lib/constants";
import { YamlEditor } from "./yaml-editor";

interface StepPreviewProps {
  on_next: () => void;
  on_back: () => void;
}

function generateYaml(store: {
  diretoria: string;
  mes_ref: string;
  analyst_name: string;
  explanations: Record<string, { conta_pl: string; explanation: string; type: string; expect_next_month: boolean }>;
  bp_notes: string;
}): string {
  const bp = BP_MAPPING[store.diretoria] ?? "N/A";
  const variances = Object.values(store.explanations);

  let yaml = `diretoria: "${store.diretoria}"\n`;
  yaml += `bp: "${bp}"\n`;
  yaml += `mes_ref: "${store.mes_ref}"\n`;
  yaml += `source: "streamlit"\n`;
  yaml += `approved_at: "${new Date().toISOString()}"\n`;
  yaml += `analyst: "${store.analyst_name}"\n`;

  if (variances.length > 0) {
    yaml += `variances:\n`;
    for (const v of variances) {
      yaml += `  - conta_pl: "${v.conta_pl}"\n`;
      yaml += `    explanation: "${v.explanation}"\n`;
      yaml += `    type: "${v.type}"\n`;
      yaml += `    expect_next_month: ${v.expect_next_month}\n`;
    }
  }

  if (store.bp_notes) {
    yaml += `notes: "${store.bp_notes}"\n`;
  }

  return yaml;
}

function validateYaml(text: string): string[] {
  const errors: string[] = [];
  if (!text.includes("diretoria:")) errors.push("Campo 'diretoria' obrigatório");
  if (!text.includes("mes_ref:")) errors.push("Campo 'mes_ref' obrigatório");
  if (!text.includes("variances:") && !text.includes("notes:")) {
    errors.push("Pelo menos 'variances' ou 'notes' é obrigatório");
  }
  return errors;
}

export function StepPreview({ on_next, on_back }: StepPreviewProps) {
  const store = useKnowledgeStore();
  const { group_squads } = store;
  const is_group = group_squads.length > 0;
  const [yaml_text, setYamlText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const generated = generateYaml(store);
    setYamlText(generated);
    store.setYamlText(generated);
    setErrors(validateYaml(generated));
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(text: string) {
    setYamlText(text);
    store.setYamlText(text);
    setErrors(validateYaml(text));
  }

  function handleSave() {
    store.setSavedPath(`knowledge/variances/${store.diretoria.toLowerCase()}/${store.mes_ref}.yaml`);
    on_next();
  }

  function handleSaveAll() {
    const paths = group_squads.map(
      (squad) => `knowledge/variances/${squad.toLowerCase()}/${store.mes_ref}.yaml`
    );
    store.setSavedPath(paths);
    on_next();
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
                <YamlEditor value={yaml_text} on_change={handleChange} height="200px" />
              </CollapsibleContent>
            </Collapsible>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={on_back}>Voltar</Button>
            <Button onClick={handleSaveAll} disabled={errors.length > 0} className="bg-primary hover:bg-primary/90">
              Salvar Todos
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-medium mb-2">Preview do YAML</p>
            <YamlEditor value={yaml_text} on_change={handleChange} height="400px" />
          </div>

          {errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-xs font-medium text-destructive mb-1">
                Erros de validação:
              </p>
              <ul className="space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i} className="text-xs text-destructive/80">
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={on_back}>
              Voltar
            </Button>
            <Button
              onClick={handleSave}
              disabled={errors.length > 0}
              className="bg-primary hover:bg-primary/90"
            >
              Salvar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
