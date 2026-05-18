import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  content: string;
  language?: string;
}

export const CodeBlock = ({ content, language }: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    codeToHtml(content.trim(), {
      lang: language || 'text',
      theme: 'github-dark',
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // Fallback: if language isn't supported, try plaintext
        if (!cancelled) {
          codeToHtml(content.trim(), { lang: 'text', theme: 'github-dark' })
            .then((result) => {
              if (!cancelled) setHtml(result);
            })
            .catch(() => {});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-docs-panel-border bg-docs-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-docs-panel-border">
        {language && (
          <span className="text-xs font-medium text-docs-panel-foreground/60 uppercase tracking-wider">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="ml-auto p-1 rounded hover:bg-docs-panel-muted text-docs-panel-foreground/50 hover:text-docs-panel-foreground transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code content */}
      {html ? (
        <div
          className="p-4 overflow-x-auto text-sm [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono text-docs-panel-foreground leading-relaxed whitespace-pre">
            {content.trim()}
          </code>
        </pre>
      )}
    </div>
  );
};
