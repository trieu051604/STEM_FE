import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-lg font-black text-foreground mt-4 mb-2 pb-1 border-b border-border/50" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-base font-extrabold text-foreground mt-3.5 mb-1.5 pb-1 border-b border-border/40" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm font-bold text-foreground mt-3 mb-1 flex items-center gap-1.5" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-bold text-foreground mt-2 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-foreground/90 leading-relaxed my-1.5" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-foreground" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-foreground/90" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-border/60" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 my-2 pl-1 text-foreground/90" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 pl-1 text-foreground/90" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground/90 leading-relaxed" {...props} />
          ),
          code: ({ node, inline, className: codeClassName, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const isCodeBlock = !inline && (match || String(children).includes('\n'));

            if (!isCodeBlock) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded bg-muted/80 text-amber-500 dark:text-amber-400 font-mono text-[11px] sm:text-xs font-semibold border border-border/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeText = String(children).replace(/\n$/, '');
            const lang = match?.[1] || 'code';

            return (
              <div className="my-2.5 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden font-mono text-xs">
                <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-semibold uppercase text-zinc-300">{lang}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(codeText)}
                    className="hover:text-white transition-colors px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px]"
                  >
                    Sao chép
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-emerald-400 bg-zinc-950/90 whitespace-pre leading-relaxed">
                  <code>{codeText}</code>
                </pre>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
