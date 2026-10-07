import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MermaidBlock } from './MermaidBlock';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  // LaTeX等の数式記法や矢印がそのまま生テキストで文字化けして見えないよう綺麗に整形
  const cleanContent = React.useMemo(() => {
    return content
      .replace(/\$\\rightarrow\$/g, '→')
      .replace(/\\rightarrow/g, '→')
      .replace(/\\leftarrow/g, '←')
      .replace(/\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g, '$1/$2')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\mathbf\{([^}]+)\}/g, '**$1**')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\$\$([\s\S]*?)\$\$/g, (_match, p1) => `\n> ${p1.trim()}\n`)
      .replace(/\$([0-9a-zA-Z\s+\-*/%./=]+)\$/g, '$1');
  }, [content]);

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (lang === 'mermaid') {
              return <MermaidBlock code={codeString} />;
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="table-responsive">
                <table {...props}>{children}</table>
              </div>
            );
          },
          details({ children, ...props }) {
            return (
              <details className="custom-details" {...props}>
                {children}
              </details>
            );
          },
          summary({ children, ...props }) {
            return (
              <summary className="custom-summary" {...props}>
                {children}
              </summary>
            );
          },
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
};
