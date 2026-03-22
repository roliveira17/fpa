"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSettingsStore } from "@/lib/store";

const LLM_MODELS = [
  { value: "claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4.6", label: "Claude Opus 4.6" },
  { value: "gpt-5.4", label: "GPT-5.4" },
  { value: "gemini-3.1-flash", label: "Gemini 3.1 Flash" },
];

const DATA_SOURCES = [
  { value: "financial_planning.fpa_combined", label: "fpa_combined (Athena)" },
  { value: "financial_planning.fpa_staging", label: "fpa_staging (Athena)" },
];

export function SettingsPanel() {
  const { is_open, setOpen, llm_model, data_source, language, theme, updateSetting } = useSettingsStore();

  return (
    <Sheet open={is_open} onOpenChange={setOpen}>
      <SheetContent className="bg-card border-border w-80">
        <SheetHeader>
          <SheetTitle className="text-base">Configurações</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Modelo LLM</Label>
            <Select value={llm_model} onValueChange={(v) => updateSetting("llm_model", v ?? llm_model)}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLM_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fonte de Dados</Label>
            <Select value={data_source} onValueChange={(v) => updateSetting("data_source", v ?? data_source)}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCES.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Idioma</Label>
            <Select value={language} onValueChange={(v) => updateSetting("language", v as "pt-BR" | "en")}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR" className="text-xs">Português (BR)</SelectItem>
                <SelectItem value="en" className="text-xs">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tema</Label>
            <Select value={theme} onValueChange={(v) => updateSetting("theme", v as "dark" | "light")}>
              <SelectTrigger className="bg-secondary/30 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark" className="text-xs">Dark</SelectItem>
                <SelectItem value="light" className="text-xs">Light (preview)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">Versão</p>
            <p className="text-xs font-mono">v0.1.0 — Frontend Mock</p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">Última atualização dos dados</p>
            <p className="text-xs font-mono">22/03/2025 08:30</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
