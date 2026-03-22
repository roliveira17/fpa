"use client";

import { Button } from "@/components/ui/button";
import { useKnowledgeStore, useChatStore, useAppStore } from "@/lib/store";
import { getMockChatResponse } from "@/lib/mock/financial-data";

export function StepSuccess() {
  const { diretoria, mes_ref, saved_path, reset, group_squads } = useKnowledgeStore();
  const is_group = group_squads.length > 0;
  const { addMessage, setLoading } = useChatStore();
  const { setActiveTab } = useAppStore();

  function handleFollowUp(query: string) {
    setActiveTab("chat");

    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    });

    setLoading(true);
    setTimeout(() => {
      const response = getMockChatResponse(query);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.text,
        response,
        timestamp: new Date(),
      });
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8 text-center">
      <div className="text-5xl animate-bounce">🎉</div>
      <div>
        <h3 className="text-lg font-semibold">Conhecimento salvo!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          As explicações foram registradas com sucesso.
        </p>
      </div>

      {saved_path && (
        <div className="rounded-md bg-secondary/30 p-3">
          <p className="text-[11px] text-muted-foreground">
            {Array.isArray(saved_path) ? "Arquivos salvos em:" : "Arquivo salvo em:"}
          </p>
          {(Array.isArray(saved_path) ? saved_path : [saved_path]).map((p) => (
            <p key={p} className="font-mono text-xs text-foreground mt-0.5">{p}</p>
          ))}
        </div>
      )}

      {is_group ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sugestões por squad:</p>
          <div className="flex flex-wrap gap-2">
            {group_squads.map((squad) => (
              <Button
                key={squad}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleFollowUp(`Analise ${squad} ${mes_ref}`)}
              >
                Analise {squad} {mes_ref}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sugestões de follow-up:</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleFollowUp(`Analise ${diretoria} ${mes_ref}`)}
          >
            Analise {diretoria} {mes_ref}
          </Button>
        </div>
      )}

      <Button
        onClick={reset}
        variant="outline"
        className="mt-4"
      >
        Iniciar novo registro
      </Button>
    </div>
  );
}
