// src/types/eslint.ts
export type Severity = 'info' | 'warning' | 'error' | 'hint'; // ADDED 'hint'

export interface DiagnosticAction {
  name: string;
  apply: string; // A string representing the fix logic, to be eval'd or processed by client
}

export interface Diagnostic {
  from: number; // Start character offset
  to: number; // End character offset
  message: string;
  severity: Severity;
  source?: string; // e.g., 'eslint'
  actions?: DiagnosticAction[];
}

// ADDED THIS EXPORTED TYPE
export type DirectoryDiagnostics = Record<string, Diagnostic[]>;
