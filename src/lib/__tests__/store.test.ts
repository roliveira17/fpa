import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore, useKnowledgeStore, useAppStore, useSettingsStore } from "../store";

describe("ChatStore", () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], is_loading: false, loading_step: null });
  });

  it("adds a message", () => {
    const msg = { id: "1", role: "user" as const, content: "test", timestamp: new Date() };
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].content).toBe("test");
  });

  it("sets loading state", () => {
    useChatStore.getState().setLoading(true);
    expect(useChatStore.getState().is_loading).toBe(true);
  });

  it("clears loading_step when setLoading(false)", () => {
    useChatStore.getState().setLoadingStep("analyzing");
    useChatStore.getState().setLoading(false);
    expect(useChatStore.getState().loading_step).toBeNull();
  });

  it("sets loading step", () => {
    useChatStore.getState().setLoadingStep("executing_query");
    expect(useChatStore.getState().loading_step).toBe("executing_query");
  });

  it("clears messages", () => {
    const msg = { id: "1", role: "user" as const, content: "test", timestamp: new Date() };
    useChatStore.getState().addMessage(msg);
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});

describe("KnowledgeStore", () => {
  beforeEach(() => {
    useKnowledgeStore.getState().reset();
  });

  it("sets step", () => {
    useKnowledgeStore.getState().setStep(3);
    expect(useKnowledgeStore.getState().step).toBe(3);
  });

  it("sets group squads and active squad", () => {
    useKnowledgeStore.getState().setGroupSquads(["DADOS", "DEVOPS", "ENGENHARIA"]);
    expect(useKnowledgeStore.getState().group_squads).toHaveLength(3);
    expect(useKnowledgeStore.getState().active_squad).toBe("DADOS");
  });

  it("sets empty group squads", () => {
    useKnowledgeStore.getState().setGroupSquads([]);
    expect(useKnowledgeStore.getState().active_squad).toBe("");
  });

  it("resets to initial state", () => {
    useKnowledgeStore.getState().setStep(4);
    useKnowledgeStore.getState().setDiretoria("ENGENHARIA");
    useKnowledgeStore.getState().reset();
    expect(useKnowledgeStore.getState().step).toBe(1);
    expect(useKnowledgeStore.getState().diretoria).toBe("");
  });

  it("sets save result", () => {
    const result = { created: 2, merged: 1, skipped: 0, conflicts: [] };
    useKnowledgeStore.getState().setSaveResult(result);
    expect(useKnowledgeStore.getState().save_result).toEqual(result);
  });

  it("sets conflicts", () => {
    const conflicts = [
      { entry_id: "abc", existing_text: "old", new_text: "new", reason: "contradiction" },
    ];
    useKnowledgeStore.getState().setConflicts(conflicts);
    expect(useKnowledgeStore.getState().conflicts).toHaveLength(1);
  });

  it("resolves a conflict by removing it from the list", () => {
    const conflicts = [
      { entry_id: "abc", existing_text: "old", new_text: "new", reason: "contradiction" },
      { entry_id: "def", existing_text: "old2", new_text: "new2", reason: "duplicate" },
    ];
    useKnowledgeStore.getState().setConflicts(conflicts);
    useKnowledgeStore.getState().resolveConflict("abc");
    expect(useKnowledgeStore.getState().conflicts).toHaveLength(1);
    expect(useKnowledgeStore.getState().conflicts[0].entry_id).toBe("def");
  });

  it("reset clears save_result and conflicts", () => {
    useKnowledgeStore.getState().setSaveResult({ created: 1, merged: 0, skipped: 0, conflicts: [] });
    useKnowledgeStore.getState().setConflicts([{ entry_id: "x", existing_text: "", new_text: "", reason: "" }]);
    useKnowledgeStore.getState().reset();
    expect(useKnowledgeStore.getState().save_result).toBeNull();
    expect(useKnowledgeStore.getState().conflicts).toEqual([]);
  });
});

describe("AppStore", () => {
  it("sets active tab", () => {
    useAppStore.getState().setActiveTab("knowledge");
    expect(useAppStore.getState().active_tab).toBe("knowledge");
  });

  it("toggles right panel", () => {
    const initial = useAppStore.getState().right_panel_open;
    useAppStore.getState().toggleRightPanel();
    expect(useAppStore.getState().right_panel_open).toBe(!initial);
  });

  it("toggles left panel", () => {
    const initial = useAppStore.getState().left_panel_open;
    useAppStore.getState().toggleLeftPanel();
    expect(useAppStore.getState().left_panel_open).toBe(!initial);
  });
});

describe("SettingsStore", () => {
  it("updates a setting", () => {
    useSettingsStore.getState().updateSetting("llm_model", "gpt-5.4");
    expect(useSettingsStore.getState().llm_model).toBe("gpt-5.4");
  });

  it("toggles open state", () => {
    useSettingsStore.getState().setOpen(true);
    expect(useSettingsStore.getState().is_open).toBe(true);
    useSettingsStore.getState().setOpen(false);
    expect(useSettingsStore.getState().is_open).toBe(false);
  });
});
