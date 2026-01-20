import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3-force';
import Y2KWindow from './Y2KWindow';

interface Node {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string;
  referrals_count: number;
  type: 'me' | 'sponsor' | 'referral';
  level?: number;
  x?: number;
  y?: number;
}

interface Link {
  source: number | Node;
  target: number | Node;
}

interface NetworkData {
  nodes: Node[];
  links: Link[];
}

interface ReferralNetworkProps {
  data: NetworkData;
}

const ReferralNetwork = ({ data }: ReferralNetworkProps) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
        updateDimensions();
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Reset layout state when data changes
  useEffect(() => {
    setIsLayoutReady(false);
  }, [data]);

  // Configure forces when data changes
  useEffect(() => {
    if (!graphRef.current || !data.nodes.length) return;

    const fg = graphRef.current;

    // Configure forces for better initial layout
    fg.d3Force('charge', d3.forceManyBody()
      .strength(-150)  // Moderate repulsion
      .distanceMax(400)
    );

    fg.d3Force('collide', d3.forceCollide()
      .radius((node: any) => getNodeSize(node) + 15)  // Padding between nodes
      .strength(0.8)
    );

    fg.d3Force('link')
      ?.distance(80)  // Link distance
      .strength(0.5);

  }, [data]);

  const getNodeColor = (node: Node) => {
    if (node.type === 'me') return '#FF1053'; // Hot Fucsia
    if (node.type === 'sponsor') return '#119DA4'; // Dark Cyan

    // Color by level for referrals
    if (node.level === 1) return '#FFD700'; // Gold (Coordinators)
    if (node.level === 2) return '#FFA500'; // Orange
    if (node.level === 3) return '#FF4500'; // OrangeRed
    if (node.level === 4) return '#32CD32'; // LimeGreen
    if (node.level === 5) return '#1E90FF'; // DodgerBlue
    if (node.level && node.level >= 6) return '#9370DB'; // MediumPurple

    return '#15F287'; // Spring Green (Default)
  };

  const getNodeSize = (node: Node) => {
    const baseSize = 20;  // Larger base size for readability
    // Scale based on referrals (using square root to prevent huge nodes)
    const size = baseSize + Math.sqrt(node.referrals_count || 0) * 4;

    if (node.type === 'me') return Math.max(size, 28);
    if (node.type === 'sponsor') return Math.max(size, 24);
    return size;
  };

  return (
    <div className={`relative h-full w-full overflow-hidden transition-colors duration-500 ${isFullscreen ? 'bg-black/60' : ''}`} ref={containerRef}>
      {/* Loading overlay */}
      {!isLayoutReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-primary uppercase tracking-wide">Organizando red...</p>
          </div>
        </div>
      )}
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        dagMode="td"
        dagLevelDistance={120}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.4}
        cooldownTicks={200}
        warmupTicks={100}
        onEngineStop={() => {
          graphRef.current?.zoomToFit(400, 50);
          setIsLayoutReady(true);
        }}
        nodeLabel={() => ''}
        nodeColor={getNodeColor}
        nodeRelSize={6}
        linkColor={() => isFullscreen ? '#FFFFFF' : '#000000'}
        linkWidth={1}
        linkCanvasObject={(link: any, ctx, globalScale) => {
          const source = link.source;
          const target = link.target;

          if (!source || !target || typeof source.x !== 'number' || typeof target.x !== 'number') return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance === 0) return;

          const sourceRadius = getNodeSize(source);
          const targetRadius = getNodeSize(target);

          // Normalize direction
          const nx = dx / distance;
          const ny = dy / distance;

          // Arrow configuration
          const arrowLength = 6 / globalScale;
          const padding = 2 / globalScale; // Extra padding to ensure it doesn't overlap

          // Start and End points (at borders)
          const startX = source.x + nx * sourceRadius;
          const startY = source.y + ny * sourceRadius;
          const endX = target.x - nx * (targetRadius + padding);
          const endY = target.y - ny * (targetRadius + padding);

          // Draw Line
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = isFullscreen ? '#FFFFFF' : '#000000';
          ctx.lineWidth = 1 / globalScale;
          ctx.stroke();

          // Draw Arrow
          const arrowAngle = Math.atan2(ny, nx);

          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
            endY - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
            endY - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = isFullscreen ? '#FFFFFF' : '#000000';
          ctx.fill();
        }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
            const r = getNodeSize(node);

            // Draw Node (Transparent background)
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

            // Thick colored border
            ctx.strokeStyle = getNodeColor(node);
            ctx.lineWidth = 3 / globalScale;
            ctx.stroke();

            // Visibility check: if node is too small on screen, don't draw text
            // r * globalScale is the radius in screen pixels
            if (r * globalScale < 15) return;

            // Dynamic font size based on node radius
            // We want to fit 3 lines of text.
            // r/3.2 provides a good balance to fill the node without overflowing
            const fontSize = r / 3.2;

            // Draw Text
            ctx.textAlign = 'center';
            // High contrast color based on background
            ctx.fillStyle = isFullscreen ? '#FFFFFF' : '#1e1b4b';

            // Name (Bold, Top)
            ctx.font = `bold ${fontSize}px Sans-Serif`;
            ctx.textBaseline = 'bottom';
            ctx.fillText(node.nombres.split(' ')[0], node.x, node.y - (fontSize * 0.1));

            // Surname (Normal, Middle)
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(node.apellidos.split(' ')[0], node.x, node.y + (fontSize * 0.1));

            // Referral Count (Larger, Bottom)
            ctx.font = `bold ${fontSize}px Sans-Serif`;
            ctx.fillStyle = isFullscreen ? '#FFFFFF' : '#1e1b4b'; // High contrast
            ctx.fillText(`(${node.referrals_count})`, node.x, node.y + (fontSize * 1.3));
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
            const r = getNodeSize(node);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fill();
        }}
        onNodeHover={(node) => {
            setHoverNode(node as Node || null);
            document.body.style.cursor = node ? 'pointer' : 'default';
        }}
        onNodeClick={(node) => {
            setSelectedNode(node as Node);
            if (graphRef.current) {
                graphRef.current.centerAt(node.x, node.y, 1000);
                graphRef.current.zoom(4, 2000);
            }
        }}
      />

      {/* Hover Tooltip */}
      {hoverNode && !selectedNode && (
        <div
            className="absolute pointer-events-none bg-white/90 border-2 border-black p-2 shadow-lg z-10"
            style={{
                left: '50%',
                top: '10%',
                transform: 'translateX(-50%)'
            }}
        >
            <p className="font-bold text-sm uppercase">{hoverNode.nombres} {hoverNode.apellidos}</p>
            <p className="text-xs">Tel: {hoverNode.telefono}</p>
            <p className="text-xs font-bold text-primary">Referidos: {hoverNode.referrals_count}</p>
        </div>
      )}

      {/* Mobile Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
            onClick={() => {
                if (graphRef.current) {
                    graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400);
                }
            }}
            className="bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            title="Acercar"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
        <button
            onClick={() => {
                if (graphRef.current) {
                    graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400);
                }
            }}
            className="bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            title="Alejar"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
        <button
            onClick={() => {
                if (graphRef.current) {
                    graphRef.current.zoomToFit(400);
                }
            }}
            className="bg-white border-2 border-primary text-primary p-2 shadow-[4px_4px_0px_0px_rgba(0,82,88,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,82,88,1)] transition-all"
            title="Centrar"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
        </button>
        <button
            onClick={() => {
                if (!document.fullscreenElement) {
                    containerRef.current?.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }}
            className="bg-white border-2 border-primary text-primary p-2 shadow-[4px_4px_0px_0px_rgba(0,82,88,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,82,88,1)] transition-all"
            title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
        >
            {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
            )}
        </button>
      </div>

      {/* Selected Node Detail Window */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-20 w-64">
            <Y2KWindow
                title="Detalle de Usuario"
                onClose={() => setSelectedNode(null)}
                className="animate-in slide-in-from-right duration-300"
                isStatic={true}
            >
                <div className="space-y-2 text-sm">
                    <div>
                        <p className="font-bold text-black/60 text-xs uppercase">Nombre Completo</p>
                        <p className="font-bold">{selectedNode.nombres} {selectedNode.apellidos}</p>
                    </div>
                    <div>
                        <p className="font-bold text-black/60 text-xs uppercase">Cédula</p>
                        <p>{selectedNode.cedula}</p>
                    </div>
                    <div>
                        <p className="font-bold text-black/60 text-xs uppercase">Teléfono</p>
                        <p>{selectedNode.telefono}</p>
                    </div>
                    <div>
                        <p className="font-bold text-black/60 text-xs uppercase">Correo</p>
                        <p className="break-all">{selectedNode.email || 'No registrado'}</p>
                    </div>
                    <div className="pt-2 border-t border-black/10">
                        <p className="font-bold text-primary">Referidos Directos: {selectedNode.referrals_count}</p>
                    </div>
                </div>
            </Y2KWindow>
        </div>
      )}
    </div>
  );
};

export default ReferralNetwork;
