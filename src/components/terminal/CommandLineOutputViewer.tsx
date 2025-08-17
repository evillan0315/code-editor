import React from 'react';
import useTypewriter from '@/hooks/useTypewriter';
import { cleanTerminalOutput } from '@/utils/textProcessors'; // NEW: Import the modified cleaner
import { parseAnsi } from '@/utils/ansiParser.tsx'; // NEW: Import the ANSI parser

interface CommandLineOutputProps {
  output: string;
  lineHeight?: number;
  lineWidth?: number | string;
  tabSpaces?: number;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  lineClassName?: string;
  lineStyle?: React.CSSProperties;
  typewriterEffect?: boolean;
  typewriterSpeed?: number;
  onContentChange?: () => void;
}

const CommandLineOutputViewer: React.FC<CommandLineOutputProps> = ({
  output,
  lineHeight = 15,
  lineWidth = 1046,
  tabSpaces = 8,
  containerClassName = 'terminal-rows',
  containerStyle,
  lineClassName,
  lineStyle,
  typewriterEffect = false,
  typewriterSpeed = 20,
  onContentChange,
}) => {
  // NEW: First, apply basic cleaning (removes \r and non-printable non-ANSI chars)
  const cleansedOutput = cleanTerminalOutput(output);

  // Apply typewriter effect to the cleansed (but still ANSI-encoded) string
  const displayedOutput = useTypewriter(cleansedOutput, typewriterEffect, {
    speed: typewriterSpeed,
    onType: onContentChange,
    onComplete: onContentChange,
  });

  const lines = displayedOutput.split(/\n/).filter((line) => line !== null);

  const defaultContainerStyle: React.CSSProperties = {
    lineHeight: 'normal',
    letterSpacing: '-0.0049569px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap', // Changed to pre-wrap to allow line breaks
    wordBreak: 'break-all', // Allow long words to break
    overflow: 'hidden',
  };

  const mergedContainerStyle = { ...defaultContainerStyle, ...containerStyle };

  const getLineStyles = (): React.CSSProperties => {
    return {
      // width: typeof lineWidth === 'number' ? `${lineWidth}px` : lineWidth, // Removed fixed width, let content flow
      minHeight: `${lineHeight}px`, // Changed height to minHeight to allow content to wrap
      lineHeight: `${lineHeight}px`,
      overflow: 'hidden',
      ...lineStyle,
    };
  };

  const processLineContent = (line: string): React.ReactNode => {
    if (typeof line !== 'string') {
      console.warn('CommandLineOutputViewer: Received non-string line content:', line);
      return '';
    }
    if (line === 'undefined') {
      return '';
    }

    // NEW: Parse ANSI codes for each line
    const ansiParsedNodes = parseAnsi(line);

    // Handle tabs and then render parsed segments
    const finalRenderedParts: React.ReactNode[] = [];

    ansiParsedNodes.forEach((node, idx) => {
      let currentOffset = 0;
      if (typeof node === 'string') {
        // This is plain text, process tabs here
        let processedString = '';
        currentOffset = 0;
        for (let i = 0; i < node.length; i++) {
          const char = node[i];
          if (char === '\t') {
            const nextTabStop = Math.ceil((currentOffset + 1) / tabSpaces) * tabSpaces;
            const spacesToAdd = nextTabStop - currentOffset;
            processedString += ' '.repeat(spacesToAdd);
            currentOffset += spacesToAdd;
          } else {
            processedString += char;
            currentOffset += 1;
          }
        }
        finalRenderedParts.push(
          <React.Fragment key={`part-${idx}`}>{processedString}</React.Fragment>,
        );
      } else {
        // This is a React element (e.g., <span> from parseAnsi), push directly
        finalRenderedParts.push(
          React.cloneElement(node as React.ReactElement, { key: `part-${idx}` }),
        );
        // Note: Accurately tracking `currentOffset` for mixed strings/React elements is complex
        // if precise tab alignment is needed across styled spans. For simplicity, this assumes
        // character width for non-tab content within spans is 1 for subsequent tab calculations.
        const textContent = (
          node as React.ReactElement<any, string | React.JSXElementConstructor<any>>
        ).props.children;
        if (typeof textContent === 'string') {
          currentOffset += textContent.length;
        } else if (Array.isArray(textContent)) {
          textContent.forEach((child) => {
            if (typeof child === 'string') currentOffset += child.length;
          });
        }
      }
    });
    return finalRenderedParts;
  };

  return (
    <div className={containerClassName} style={mergedContainerStyle}>
      {lines.map((line, index) => (
        <div key={index} className={lineClassName} style={getLineStyles()}>
          {processLineContent(line)}
        </div>
      ))}
    </div>
  );
};

export default CommandLineOutputViewer;
