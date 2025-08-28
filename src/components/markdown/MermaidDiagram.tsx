import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { nanoid } from 'nanoid';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const diagramId = useRef(`mermaid-${nanoid()}`).current;

  useEffect(() => {
    if (mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'forest',
        securityLevel: 'loose',
        fontFamily: 'monospace',
      });
      try {
        mermaid.render(diagramId, chart).then(({ svg, bindFunctions }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
            if (bindFunctions) {
              bindFunctions(mermaidRef.current);
            }
          }
        });
      } catch (error) {
        console.error('Mermaid render error:', error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<pre style="color: red;">Error rendering Mermaid diagram:\n${error.message}</pre>`;
        }
      }
    }
  }, [chart, diagramId]);

  return (
    <div className="mermaid-diagram-container p-4 bg-editor-background-dark text-editor-foreground-light rounded-md border border-editor-border mt-4 mb-4 overflow-auto">
      <div ref={mermaidRef} id={diagramId} className="mermaid" />
    </div>
  );
};

export default MermaidDiagram;
