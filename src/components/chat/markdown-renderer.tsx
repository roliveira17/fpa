"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Escape $ to avoid LaTeX rendering
  const escaped = content.replace(/\$/g, "\\$");

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-secondary/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-1.5 text-left text-[11px] font-medium text-muted-foreground border-b border-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 text-xs border-b border-border/50">
              {children}
            </td>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-4 mb-2 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-foreground/90 my-1.5">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground/90">{children}</li>
          ),
          code: ({ children, className }) => {
            const is_inline = !className;
            if (is_inline) {
              return (
                <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono text-primary">
                  {children}
                </code>
              );
            }
            return (
              <code className="block rounded-md bg-secondary/50 p-3 text-xs font-mono overflow-x-auto">
                {children}
              </code>
            );
          },
        }}
      >
        {escaped}
      </ReactMarkdown>
    </div>
  );
}
