import React, { useState, type JSX } from "react";
import EditorCodeMirror from "@/components/editor/EditorCodeMirror"; // Your editor component
import { CodeMirrorContextMenuRenderer } from "@/components/editor/CodeMirrorContextMenuRenderer"; // New import

import "@/styles/file-manager.css";


const initialCode = `function greet(name) {
  // This is a single-line comment
  console.log(\`Hello, \${name}!\`);
  /*
    This is a
    multi-line comment
  */
  return \`Welcome, \${name}\`;
}

// Call the function
greet("World");

/**
 * Calculates the sum of two numbers.
 * @param a The first number.
 * @param b The second number.
 * @returns The sum of a and b.
 */
function add(a, b) {
  return a + b;
}
`;

export default function Dashboard(): JSX.Element {
  const [code, setCode] = useState(initialCode);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // console.log("Code updated:", newCode.substring(0, 50) + "..."); // Suppress verbose logging
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900">
      <div className="flex-1 p-4">
        <h1 className="text-xl font-bold text-gray-100 mb-4">
          CodeMirror Editor with Context Menu (Nanostores)
        </h1>
        <div className="h-[calc(100vh-100px)] rounded-lg overflow-hidden border border-gray-700">
          {/* Your editor component */}
          <EditorCodeMirror
            value={code}
            onChange={handleCodeChange}
            language="javascript"
          />
        </div>
      </div>
      {/* Render the context menu renderer globally. It listens to nanostore for visibility. */}
      <CodeMirrorContextMenuRenderer />
    </div>
  );
}
