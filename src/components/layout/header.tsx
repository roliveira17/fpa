"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppStore, useSettingsStore } from "@/lib/store";
import { SettingsPanel } from "./settings-panel";

export function Header() {
  const { toggleRightPanel, toggleLeftPanel } = useAppStore();
  const { setOpen: openSettings } = useSettingsStore();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-8 w-8 p-0"
          onClick={toggleLeftPanel}
        >
          <span className="text-sm">☰</span>
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          C
        </div>
        <h1 className="text-base font-semibold tracking-tight">
          Agente FP&A
        </h1>
        <span className="text-xs text-muted-foreground">Cora</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => openSettings(true)}
        >
          Settings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={toggleRightPanel}
        >
          Roadmap
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-xs">
            RA
          </AvatarFallback>
        </Avatar>
      </div>
      <SettingsPanel />
    </header>
  );
}
