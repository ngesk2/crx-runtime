"use client";

import { useEffect, useRef, memo } from "react";

interface Props {
  content: string;
  streaming?: boolean;
}

function MarkdownRenderer({ content, streaming }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Simple markdown parser for code blocks, bold, italic, and line breaks
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n')
    const result: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // Close code block
          result.push(
            <pre key={`code-${i}`} className="bg-historical-900 rounded-lg p-4 my-3 overflow-x-auto border border-historical-700">
              <code className="text-sm text-historical-100 font-mono">{codeContent.join('\n')}</code>
            </pre>
          )
          codeContent = []
          inCodeBlock = false
        } else {
          // Start code block
          inCodeBlock = true
        }
        continue
      }

      if (inCodeBlock) {
        codeContent.push(line)
        continue
      }

      // Process inline markdown
      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-historical-800 px-1.5 py-0.5 rounded text-runtime-400 text-sm">$1</code>')

      if (processedLine.trim() === '') {
        result.push(<br key={`br-${i}`} />)
      } else {
        result.push(
          <p key={`p-${i}`} className="mb-2 last:mb-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />
        )
      }
    }

    return result
  }

  return (
    <div
      ref={ref}
      className={`md-body${streaming ? " md-body--streaming" : ""}`}
    >
      {parseMarkdown(content)}
    </div>
  );
}

export default memo(MarkdownRenderer);
