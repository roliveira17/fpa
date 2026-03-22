"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKnowledgeStore } from "@/lib/store";
import { DIRETORIAS, DIRETORIA_GROUPS, AVAILABLE_MONTHS, BP_MAPPING } from "@/lib/constants";

interface StepSelectionProps {
  on_next: () => void;
}

export function StepSelection({ on_next }: StepSelectionProps) {
  const {
    analyst_name, diretoria, mes_ref, show_all,
    setAnalystName, setDiretoria, setMesRef, setShowAll,
  } = useKnowledgeStore();

  const is_group = Object.keys(DIRETORIA_GROUPS).some((g) =>
    DIRETORIA_GROUPS[g].includes(diretoria)
  );
  const group_name = Object.entries(DIRETORIA_GROUPS).find(([, dirs]) =>
    dirs.includes(diretoria)
  )?.[0];

  const can_proceed = analyst_name.trim() && diretoria && mes_ref;

  return (
    <div className="mx-auto max-w-lg space-y-5 p-6">
      <div className="space-y-2">
        <Label className="text-xs">Nome do Analista</Label>
        <Input
          value={analyst_name}
          onChange={(e) => setAnalystName(e.target.value)}
          placeholder="Seu nome completo"
          className="bg-secondary/30"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Diretoria</Label>
        <Select value={diretoria} onValueChange={(v) => setDiretoria(v ?? "")}>
          <SelectTrigger className="bg-secondary/30">
            <SelectValue placeholder="Selecione a diretoria" />
          </SelectTrigger>
          <SelectContent>
            {DIRETORIAS.map((d) => (
              <SelectItem key={d} value={d}>
                {d} — {BP_MAPPING[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {is_group && group_name && (
          <div className="rounded-md bg-warning/10 border border-warning/20 px-3 py-2 text-xs text-warning">
            Modo grupo ativo: {group_name} processa{" "}
            {DIRETORIA_GROUPS[group_name].join(", ")} juntas
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Mês de Referência</Label>
        <Select value={mes_ref} onValueChange={(v) => setMesRef(v ?? "")}>
          <SelectTrigger className="bg-secondary/30">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MONTHS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="show_all"
          checked={show_all}
          onCheckedChange={(v) => setShowAll(v === true)}
        />
        <Label htmlFor="show_all" className="text-xs text-muted-foreground cursor-pointer">
          Mostrar variações &lt;10%
        </Label>
      </div>

      <Button
        onClick={on_next}
        disabled={!can_proceed}
        className="w-full bg-primary hover:bg-primary/90"
      >
        Buscar Variações
      </Button>
    </div>
  );
}
