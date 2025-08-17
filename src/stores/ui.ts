// src/stores/ui.ts
import { atom } from "nanostores";
import { persistentAtom } from "@/utils/persistentAtom";
import { CONV_ID_KEY } from "@/constants";
/**
 * A nanostore atom that holds the visibility state of the configuration panel.
 * Initial state is `false` (hidden).
 */
export const isConfigPanelOpen = atom<boolean>(false);

/**
 * Toggles the visibility state of the configuration panel.
 * If open, it closes; if closed, it opens.
 */
export function toggleConfigPanel() {
  isConfigPanelOpen.set(!isConfigPanelOpen.get());
}
export const aiConversationIdStore = persistentAtom<string>(
  `${CONV_ID_KEY}`,
  "",
);
export const persona = persistentAtom<string>("persona", "react");
export const isLoading = atom<boolean>(false);
export function setIsLoading(loading: boolean) {
  isLoading.set(loading);
}
export function setActiveConversationId(id: string) {
  aiConversationIdStore.set(id);
}
