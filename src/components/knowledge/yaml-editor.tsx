"use client";

import { useRef, useCallback } from "react";

interface YamlEditorProps {
  value: string;
  on_change: (value: string) => void;
  height?: string;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightValue(text: string): string {
  const quoted = text.replace(/"([^"]*)"/g, '<span class="text-success">"$1"</span>');
  const bools = quoted.replace(/\b(true|false)\b/g, '<span class="text-chart-5">$1</span>');
  return bools;
}

function highlightYaml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.trimStart().startsWith("#")) {
        return `<span class="text-muted-foreground/60">${escapeHtml(line)}</span>`;
      }
      const match = line.match(/^(\s*)([\w-]+)(:)(.*)/);
      if (match) {
        const [, indent, key, colon, rest] = match;
        return `${indent}<span class="text-primary">${escapeHtml(key)}</span><span class="text-muted-foreground">${colon}</span>${highlightValue(rest)}`;
      }
      const list_match = line.match(/^(\s*)(- )(.*)/);
      if (list_match) {
        const [, indent, dash, rest] = list_match;
        return `${indent}<span class="text-warning">${dash}</span>${highlightValue(rest)}`;
      }
      return escapeHtml(line);
    })
    .join("\n");
}

export function YamlEditor({ value, on_change, height = "400px" }: YamlEditorProps) {
  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const highlight_ref = useRef<HTMLPreElement>(null);
  const lines_ref = useRef<HTMLDivElement>(null);
  const lines = value.split("\n");

  const handleScroll = useCallback(() => {
    const textarea = textarea_ref.current;
    const highlight = highlight_ref.current;
    const line_nums = lines_ref.current;
    if (textarea && highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
    if (textarea && line_nums) {
      line_nums.scrollTop = textarea.scrollTop;
    }
  }, []);

  return (
    <div className="relative rounded-md border border-border overflow-hidden" style={{ height }}>
      <div
        ref={lines_ref}
        className="absolute left-0 top-0 bottom-0 w-10 bg-secondary border-r border-border/50 overflow-hidden select-none"
      >
        <div className="py-3 px-1">
          {lines.map((_, i) => (
            <div key={i} className="text-[10px] text-muted-foreground/40 text-right leading-[1.65] h-[1.65em]">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <pre
        ref={highlight_ref}
        className="absolute left-10 top-0 right-0 bottom-0 p-3 font-mono text-xs leading-[1.65] overflow-hidden pointer-events-none whitespace-pre"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlightYaml(value) }}
      />
      <textarea
        ref={textarea_ref}
        value={value}
        onChange={(e) => on_change(e.target.value)}
        onScroll={handleScroll}
        className="absolute left-10 top-0 right-0 bottom-0 p-3 font-mono text-xs leading-[1.65] bg-card text-transparent caret-primary resize-none focus:outline-none selection:bg-primary/30"
        spellCheck={false}
      />
    </div>
  );
}
