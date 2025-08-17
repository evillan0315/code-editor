// src/stores/resumeStore.ts
import { persistentAtom } from "@nanostores/persistent";

// Define the nanostore for resumeConversationId
// It will be stored in localStorage under the key 'resumeConversationId'
// It can be a string or null (if no conversation is active/started)
export const resumeConversationId = persistentAtom<string | null>(
  "resumeConversationId", // The key used in localStorage
  null, // Default value when the store is empty
  {
    encode: JSON.stringify, // How to serialize the value to a string for storage
    decode: JSON.parse, // How to deserialize the string back to a value
  },
);
