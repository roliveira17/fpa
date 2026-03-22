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
