
import React, { useRef, useLayoutEffect, useEffect, useImperativeHandle, forwardRef, memo, useState } from 'react';
import * as d3 from 'd3';
import { HierarchyPointNode, HierarchyPointLink, HierarchyNode } from 'd3-hierarchy';
import { StoryNodeData, Character, Scenario, TagGroup } from '../types';
import { StoryLink } from './StoryLink';
import { StoryNode } from './StoryNode';
import { CenterFocusIcon, CopyIcon, XIcon, PlusIcon, MinusIcon, MoveIcon, MousePointerIcon } from './icons';

interface StoryGraphProps {
    nodes: HierarchyPointNode<StoryNodeData>[];
    links: HierarchyPointLink<StoryNodeData>[];
    nodeReadableIds: Map<string, string>;
    canonicalNodeIds: Set<string>;
    movingNodeId: string | null;
    characters: Character[];
    scenarios: Scenario[];
    tagGroups: TagGroup[];
    aiSettings: any;
    nodeActions: any;
    aiActions: any;
    loadingStates: any;
    activeStates: {
        chattingNodeId: string | null;
        translatingNodeId: string | null;
        setChattingNodeId: (id: string | null) => void;
        setTranslatingNodeId: (id: string | null) => void;
    };
    interaction: {
        isNavMode: boolean;
        setIsNavMode: (mode: boolean) => void;
    };
    setEditingNode: (node: HierarchyPointNode<StoryNodeData>) => void;
    setNodeToDelete: (node: HierarchyPointNode<StoryNodeData>) => void;
    onSetMovingNodeId: (id: string | null) => void;
    onSetCopiedNodeData: (data: any) => void;
    copiedNodeData: any;
    onHeightChange: (nodeId: string, height: number) => void;
    rootHierarchy: HierarchyNode<StoryNodeData>;
    onSearchByTag: (tag: string) => void;
    onUpdateCharacter: (id: string, updates: Partial<Character>) => void; 
}

export interface StoryGraphRef {
    centerView: (duration?: number) => void;
    goToNode: (node: HierarchyPointNode<StoryNodeData>) => void;
}

const MemoizedStoryLink = memo(StoryLink);
const MemoizedStoryNode = memo(StoryNode);

export const StoryGraph = forwardRef<StoryGraphRef, StoryGraphProps>(({
    nodes, links, nodeReadableIds, canonicalNodeIds, movingNodeId,
    characters, scenarios, tagGroups, aiSettings,
    nodeActions, aiActions, loadingStates, activeStates, interaction,
    setEditingNode, setNodeToDelete, onSetMovingNodeId,
    onSetCopiedNodeData, copiedNodeData, onHeightChange, rootHierarchy,
    onSearchByTag, onUpdateCharacter
}, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [flashingNodeId, setFlashingNodeId] = useState<string | null>(null);

    const applyTransform = (t: d3.ZoomTransform) => {
        if (gRef.current) {
            gRef.current.setAttribute('transform', t.toString());
        }
        transformRef.current = t;
    };

    const highlightedNodeIds = React.useMemo(() => {
        if (!hoveredNodeId) return null;
        const targetNode = nodes.find(n => n.data.id === hoveredNodeId);
        if (!targetNode) return null;
        
        const ids = new Set<string>();
        let current: HierarchyPointNode<StoryNodeData> | null = targetNode;
        while (current) {
            ids.add(current.data.id);
            current = current.parent;
        }
        return ids;
    }, [hoveredNodeId, nodes]);

    useImperativeHandle(ref, () => ({
        centerView: (duration = 750) => {
            if (!svgRef.current || !zoomRef.current || !gRef.current) return;
            const svg = d3.select(svgRef.current);
            const { width, height } = svgRef.current.getBoundingClientRect();
            const { x, y, width: bw, height: bh } = gRef.current.getBBox();
            if (bw === 0 || bh === 0) { 
                svg.transition().duration(duration).call(zoomRef.current.transform, d3.zoomIdentity); 
                return; 
            }
            const scale = Math.min(1, 0.9 * Math.min(width / bw, height / bh));
            const tx = width / 2 - scale * (x + bw / 2);
            const ty = height / 2 - scale * (y + bh / 2);
            svg.transition().duration(duration).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        },
        goToNode: (node: HierarchyPointNode<StoryNodeData>) => {
            if (!svgRef.current || !zoomRef.current) return;
            const { width, height } = svgRef.current.getBoundingClientRect();
            
            // Efecto flash
            setFlashingNodeId(node.data.id);
            setTimeout(() => setFlashingNodeId(null), 2000);

            const scale = 1.2; // Zoom de enfoque
            const tx = width / 2 - scale * node.y;
            const ty = height / 2 - scale * node.x;
            
            d3.select(svgRef.current)
                .transition()
                .duration(1000)
                .ease(d3.easeCubicInOut)
                .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        }
    }));

    const handleZoomIn = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.6);
        }
    };

    const handleResizeStart = (nodeId: string, initialWidth: number, startX: number, direction: 'left' | 'right') => {
        let isFirstMove = true;
        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const delta = direction === 'right' ? deltaX : -deltaX;
            const newWidth = initialWidth + delta * 2;
            nodeActions.onUpdateNodeData(nodeId, { width: newWidth }, undefined, !isFirstMove);
            isFirstMove = false;
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        if (!svgRef.current) return;
        const svgEl = svgRef.current;

        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.05, 5])
          .filter((event) => {
              if (!interaction.isNavMode) {
                  if (event.type === 'wheel') return true;
                  let target = event.target;
                  while (target && target !== svgEl) {
                      if (target.tagName === 'foreignObject' || (target.classList && target.classList.contains('node-content'))) {
                          return false;
                      }
                      target = target.parentNode;
                  }
              }
              return event.type === 'wheel' || event.type === 'dblclick' || event.type === 'touchstart' || event.button === 0 || event.button === 1;
          })
          .on('zoom', (event) => {
              applyTransform(event.transform);
          });

        const selection = d3.select(svgEl);
        selection.call(zoomBehavior);
        zoomRef.current = zoomBehavior;

        if (gRef.current) {
            gRef.current.setAttribute('transform', transformRef.current.toString());
        }

        return () => {
            selection.on('.zoom', null);
        };
    }, [interaction.isNavMode]);

    return (
        <div className={`flex-grow relative h-full w-full overflow-hidden ${interaction.isNavMode ? 'select-none' : ''}`}>
            {movingNodeId && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center space-x-2 pointer-events-none">
                    <CopyIcon className="w-4 h-4" />
                    <span>Reubicando Globo... Selecciona destino.</span>
                    <button onClick={() => onSetMovingNodeId(null)} className="ml-2 p-1 bg-black/20 rounded-full pointer-events-auto"><XIcon className="w-4 h-4"/></button>
                </div>
            )}
            
            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none outline-none">
                <g ref={gRef}>
                    {links.map((link) => {
                        const isCanonical = canonicalNodeIds.has(link.source.data.id) && canonicalNodeIds.has(link.target.data.id);
                        const isDimmed = highlightedNodeIds ? !highlightedNodeIds.has(link.target.data.id) : false;
                        const isHighlighted = highlightedNodeIds ? highlightedNodeIds.has(link.target.data.id) : false;
                        return (
                            <MemoizedStoryLink 
                                key={`${link.source.data.id}-${link.target.data.id}`} 
                                link={link} 
                                isCanonical={isCanonical} 
                                isDimmed={isDimmed}
                                isHighlighted={isHighlighted}
                                onSetCanonical={() => nodeActions.handleSetCanonicalChild(link.source.data.id, link.target.data.id)} 
                            />
                        )
                    })}
                    {nodes.map(node => {
                        const isDimmed = highlightedNodeIds ? !highlightedNodeIds.has(node.data.id) : false;
                        const isFlashing = flashingNodeId === node.data.id;
                        return (
                            <g key={node.data.id} className={isFlashing ? 'animate-pulse scale-105 transition-transform' : ''} style={{ filter: isFlashing ? 'drop-shadow(0 0 20px rgba(34,211,238,0.8))' : 'none' }}>
                                <MemoizedStoryNode
                                    node={node}
                                    readableId={nodeReadableIds.get(node.data.id)}
                                    isDimmed={isDimmed}
                                    onHover={(hovering) => setHoveredNodeId(hovering ? node.data.id : null)}
                                    actions={{
                                        ...nodeActions,
                                        onUpdateNodeData: nodeActions.onUpdateNodeData,
                                        onAddChild: nodeActions.handleAddChild,
                                        onEdit: setEditingNode,
                                        onDelete: setNodeToDelete,
                                        onAddTag: nodeActions.handleAddTag,
                                        onRemoveTag: nodeActions.handleRemoveTag,
                                        onSearchByTag: onSearchByTag,
                                        onHeightChange,
                                        onToggleCollapse: (id) => nodeActions.onUpdateNodeData(id, { isCollapsed: !node.data.isCollapsed }),
                                        onResizeStart: handleResizeStart,
                                        onCopyNode: (id: string) => {
                                            const n = rootHierarchy.descendants().find(d => d.data.id === id);
                                            if(n) onSetCopiedNodeData(n.data);
                                        },
                                        onPasteNodeAsChild: (id: string) => nodeActions.handlePasteNodeAsChild(id, copiedNodeData),
                                        onPasteNodeContent: (id: string) => nodeActions.handlePasteNodeContent(id, copiedNodeData),
                                        onCutNode: (id: string) => onSetMovingNodeId(id === movingNodeId ? null : id),
                                        onMoveNode: (targetId: string) => nodeActions.handleMoveNode(targetId),
                                        onUpdateCharacter: (id, u) => onUpdateCharacter(id, u),
                                        onUpdateNodeCharacterState: nodeActions.handleUpdateNodeCharacterState,
                                        onResetNodeCharacterState: nodeActions.handleResetNodeCharacterState,
                                        onPromoteNote: nodeActions.handlePromoteNote,
                                        onPromoteToArc: nodeActions.onPromoteToArc,
                                        onToggleContextExclusion: nodeActions.handleToggleContextExclusion
                                    }}
                                    aiHandlers={{
                                        onGenerate: aiActions.handleGenerate,
                                        onRegenerate: aiActions.handleRegenerate,
                                        onCorrectText: aiActions.handleCorrectNodeText,
                                        onTranslateNodeText: (id: string, transId: string, lang: string) => aiActions.handleTranslateNodeText(id, transId, lang, rootHierarchy),
                                        onContinuePlot: aiActions.handleContinuePlot
                                    }}
                                    data={{
                                        characters,
                                        scenarios,
                                        allTagGroups: tagGroups,
                                        translationLanguage: aiSettings.translationLanguage,
                                        copiedNodeData,
                                        movingNodeId,
                                        isCanonical: canonicalNodeIds.has(node.data.id)
                                    }}
                                    flags={{
                                        isGenerating: loadingStates.generatingNodeId === node.data.id,
                                        isRegenerating: loadingStates.regeneratingNodeId === node.data.id,
                                        isCorrecting: loadingStates.correctingNodeId === node.data.id,
                                        isContinuingPlot: loadingStates.continuingPlotNodeId === node.data.id,
                                        isTranslateOpen: activeStates.translatingNodeId === node.data.id,
                                        onToggleTranslate: (id: string) => activeStates.setTranslatingNodeId(activeStates.translatingNodeId === id ? null : id),
                                        isNavMode: interaction.isNavMode
                                    }}
                                />
                            </g>
                        )
                    })}
                </g>
            </svg>

            <div className="absolute bottom-8 right-8 z-30 flex flex-col space-y-3">
                 <button 
                    onClick={() => interaction.setIsNavMode(!interaction.isNavMode)} 
                    className={`p-4 rounded-2xl shadow-2xl transition-all active:scale-90 border-2 ${interaction.isNavMode ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-gray-800 border-gray-600 text-cyan-400 hover:bg-gray-700'}`}
                    title={interaction.isNavMode ? "Modo Navegación (Mover Mapa)" : "Modo Edición (Scroll y Selección)"}
                 >
                    {interaction.isNavMode ? <MoveIcon className="w-8 h-8" /> : <MousePointerIcon className="w-8 h-8" />}
                 </button>

                 <button onClick={handleZoomIn} className="p-4 bg-gray-800 border-2 border-gray-600 rounded-2xl hover:bg-gray-700 hover:border-cyan-500 shadow-2xl text-cyan-400 transition-all active:scale-90" title="Acercar">
                    <PlusIcon className="w-6 h-6" />
                 </button>
                 <button onClick={handleZoomOut} className="p-4 bg-gray-800 border-2 border-gray-600 rounded-2xl hover:bg-gray-700 hover:border-cyan-500 shadow-2xl text-cyan-400 transition-all active:scale-90" title="Alejar">
                    <MinusIcon className="w-6 h-6" />
                 </button>
                 <button onClick={() => {
                     if(svgRef.current && zoomRef.current) {
                        const svg = d3.select(svgRef.current);
                        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
                     }
                 }} className="p-4 bg-cyan-600 border-2 border-cyan-500 rounded-2xl hover:bg-cyan-500 shadow-2xl text-white transition-all active:scale-90" title="Centrar Vista">
                    <CenterFocusIcon className="w-6 h-6" />
                 </button>
            </div>

            {!interaction.isNavMode && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-cyan-900/90 text-cyan-100 px-4 py-2 rounded-full text-xs font-bold border border-cyan-500 animate-bounce shadow-2xl pointer-events-none">
                    Mover mapa arrastrando el fondo vacío
                </div>
            )}
        </div>
    );
});
