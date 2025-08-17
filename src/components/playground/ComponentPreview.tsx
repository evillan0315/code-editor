import React from 'react'
import { CodeBlock } from '@/components/playground/CodeBlock' // Alias

interface ComponentPreviewProps {
  title: string
  description?: string
  children: React.ReactNode
  code: string
}

export const ComponentPreview: React.FC<ComponentPreviewProps> = ({
  title,
  description,
  children,
  code,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="p-6 border-b border-zinc-200">
        <h3 className="text-xl font-bold text-zinc-800">{title}</h3>
        {description && <p className="mt-2 text-zinc-600">{description}</p>}
      </div>

      <div className="p-6 flex items-center justify-center min-h-[150px] bg-zinc-50 border-b border-zinc-200">
        {children}
      </div>

      <div className="p-4 bg-zinc-800">
        <h4 className="text-white text-sm font-mono mb-2">Code Example</h4>
        <CodeBlock code={code} language="tsx" />
      </div>
    </div>
  )
}

