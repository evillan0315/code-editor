// src/hooks/useSearch.ts
import { useCallback, useState } from 'react';
import { editorFilesMap } from '@/stores/editorContent';

export interface SearchResult {
  path: string;
  line: number;
  match: string;
  lineContent: string;
}
export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const searchFiles = useCallback((searchText: string) => {
    setQuery(searchText);
    const files = editorFilesMap.get();
    const newResults: SearchResult[] = [];

    Object.entries(files).forEach(([path, file]) => {
      if (!file?.content) return;

      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        const matchIndex = line.toLowerCase().indexOf(searchText.toLowerCase());
        if (matchIndex !== -1) {
          newResults.push({
            path,
            line: index + 1,
            match: line.substring(matchIndex, matchIndex + searchText.length),
            lineContent: line.trim(),
          });
        }
      });
    });

    setResults(newResults);
  }, []);

  return {
    query,
    results,
    searchFiles,
    setQuery,
  };
}
