import { atom } from 'nanostores';

/**
 * Nanostore atom to control the visibility of the conversation list within the chat UI.
 * `true` means the conversation list is open/visible, `false` means it's hidden.
 */
export const showChatConversationList = atom<boolean>(false);

/**
 * Toggles the visibility of the chat conversation list.
 */
export function toggleChatConversationList() {
  showChatConversationList.set(!showChatConversationList.get());
}

/**
 * Nanostore atom used to trigger a 'new chat' event.
 * It's a simple counter that increments each time a new chat is requested,
 * allowing consuming components (like AiChatPanel) to react via `useEffect`.
 */
export const newChatEvent = atom<number>(0);

/**
 * Triggers a 'new chat' event by incrementing the `newChatEvent` atom.
 * Components can subscribe to this atom and react to its changes to initiate a new conversation.
 */
export function triggerNewChat() {
  newChatEvent.set(newChatEvent.get() + 1);
}
