import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Noto Sans JP, sans-serif',
});

interface MermaidBlockProps {
  code: string;
}

let mermaidCounter = 0;

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const id = `mermaid-svg-${++mermaidCounter}`;

    const renderChart = async () => {
      try {
        const cleanCode = code.trim();
        const { svg } = await mermaid.render(id, cleanCode);
        if (isMounted) {
          setSvg(svg);
          setError(false);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
      // Cleanup temporary elements created by mermaid if any
      const tempEl = document.getElementById(id);
      if (tempEl) tempEl.remove();
    };
  }, [code]);

  if (error || !svg) {
    return (
      <div className="mermaid-fallback" style={{ overflowX: 'auto', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
        <pre style={{ margin: 0, fontSize: '0.85rem' }}><code>{code}</code></pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container"
      style={{
        overflowX: 'auto',
        margin: '16px 0',
        padding: '16px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '2px solid #0f172a',
        boxShadow: '3px 3px 0 #0f172a',
        textAlign: 'center',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
