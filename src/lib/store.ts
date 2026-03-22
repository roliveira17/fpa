import { create } from "zustand";
import { ChatMessage, KnowledgeExplanation } from "./types";

interface ChatStore {
  messages: ChatMessage[];
  is_loading: boolean;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (v: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  is_loading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (v) => set({ is_loading: v }),
  clearMessages: () => set({ messages: [] }),
}));

interface KnowledgeStore {
  step: number;
  analyst_name: string;
  diretoria: string;
  mes_ref: string;
  show_all: boolean;
  explanations: Record<string, KnowledgeExplanation>;
  bp_notes: string;
  yaml_text: string;
  saved_path: string | null;
  setStep: (n: number) => void;
  setAnalystName: (v: string) => void;
  setDiretoria: (v: string) => void;
  setMesRef: (v: string) => void;
  setShowAll: (v: boolean) => void;
  setExplanation: (conta: string, exp: KnowledgeExplanation) => void;
  setBpNotes: (v: string) => void;
  setYamlText: (v: string) => void;
  setSavedPath: (v: string | null) => void;
  reset: () => void;
}

const KNOWLEDGE_INITIAL = {
  step: 1,
  analyst_name: "",
  diretoria: "",
  mes_ref: "",
  show_all: false,
  explanations: {},
  bp_notes: "",
  yaml_text: "",
  saved_path: null,
};

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  ...KNOWLEDGE_INITIAL,
  setStep: (n) => set({ step: n }),
  setAnalystName: (v) => set({ analyst_name: v }),
  setDiretoria: (v) => set({ diretoria: v }),
  setMesRef: (v) => set({ mes_ref: v }),
  setShowAll: (v) => set({ show_all: v }),
  setExplanation: (conta, exp) =>
    set((s) => ({ explanations: { ...s.explanations, [conta]: exp } })),
  setBpNotes: (v) => set({ bp_notes: v }),
  setYamlText: (v) => set({ yaml_text: v }),
  setSavedPath: (v) => set({ saved_path: v }),
  reset: () => set(KNOWLEDGE_INITIAL),
}));

type ActiveTab = "chat" | "knowledge" | "context";

interface AppStore {
  active_tab: ActiveTab;
  right_panel_open: boolean;
  setActiveTab: (t: ActiveTab) => void;
  toggleRightPanel: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  active_tab: "chat",
  right_panel_open: true,
  setActiveTab: (t) => set({ active_tab: t }),
  toggleRightPanel: () => set((s) => ({ right_panel_open: !s.right_panel_open })),
}));
