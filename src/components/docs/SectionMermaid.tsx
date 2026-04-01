import { useEffect, useRef, useState, useId } from 'react';
import { useTheme } from 'next-themes';
import { AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SectionMermaidProps {
  content: string;
}

export const SectionMermaid = ({ content }: SectionMermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { resolvedTheme } = useTheme();
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        setLoading(true);
        setError(null);

        const mermaid = (await import('mermaid')).default;

        const isDark = resolvedTheme === 'dark';

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: isDark
            ? {
                primaryColor: '#2d2b55',
                primaryTextColor: '#e2e8f0',
                primaryBorderColor: '#4a4880',
                lineColor: '#64748b',
                secondaryColor: '#1e293b',
                tertiaryColor: '#1a1a2e',
                background: '#0f172a',
                mainBkg: '#1e293b',
                nodeBorder: '#475569',
                clusterBkg: '#1e293b',
                clusterBorder: '#334155',
                titleColor: '#e2e8f0',
                edgeLabelBackground: '#1e293b',
                textColor: '#cbd5e1',
                labelTextColor: '#e2e8f0',
                actorTextColor: '#e2e8f0',
                actorBkg: '#1e293b',
                actorBorder: '#475569',
                actorLineColor: '#475569',
                signalColor: '#cbd5e1',
                signalTextColor: '#e2e8f0',
                noteBkgColor: '#2d2b55',
                noteTextColor: '#e2e8f0',
                noteBorderColor: '#4a4880',
              }
            : {
                primaryColor: '#f0e6ff',
                primaryTextColor: '#1e1b4b',
                primaryBorderColor: '#c4b5fd',
                lineColor: '#6b7280',
                secondaryColor: '#f8fafc',
                tertiaryColor: '#f1f5f9',
                background: '#ffffff',
                mainBkg: '#f8f6ff',
                nodeBorder: '#c4b5fd',
                clusterBkg: '#f8fafc',
                clusterBorder: '#e2e8f0',
                titleColor: '#1e1b4b',
                edgeLabelBackground: '#ffffff',
                textColor: '#374151',
                labelTextColor: '#1e1b4b',
              },
          securityLevel: 'strict',
          fontFamily: 'inherit',
        });

        const { svg: renderedSvg } = await mermaid.render(
          `mermaid${uniqueId}`,
          content.trim(),
        );

        if (!cancelled) {
          setSvg(renderedSvg);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setLoading(false);
        }
      }
    };

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [content, resolvedTheme, uniqueId]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);

  const handleOpenModal = () => {
    setZoom(1);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="h-48 rounded-lg border bg-muted/50 animate-pulse flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading diagram…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-foreground leading-relaxed">
          Diagram could not be rendered.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Inline diagram — clickable */}
      <div
        ref={containerRef}
        onClick={handleOpenModal}
        className="overflow-x-auto rounded-lg border bg-card p-4 cursor-zoom-in hover:border-primary/40 transition-colors [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {/* Fullscreen modal with zoom */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
          <DialogTitle className="sr-only">Diagram viewer</DialogTitle>

          {/* Zoom toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={zoom <= 0.25}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground w-14 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 ml-1 text-xs" onClick={handleZoomReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          {/* Zoomable diagram */}
          <div className="flex-1 overflow-auto bg-card">
            <div
              style={{ minWidth: `${zoom * 100}%` }}
              className="p-6 [&_svg]:w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
