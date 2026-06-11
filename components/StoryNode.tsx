import React, { useMemo, memo, useRef } from 'react';
import type { HierarchyPointNode } from 'd3-hierarchy';
import type { StoryNodeData, Character, Scenario, TagGroup, CharacterStateSnapshot } from '../types';
import { 
    PlusIcon, ChevronDownIcon, MagnetIcon, StarIcon, XIcon, LayersIcon
} from './icons';
import { SceneMetadataEditor } from './story/SceneMetadataEditor';
import { NodeTextRenderer } from './story/NodeTextRenderer';
import { NodeBadges } from './story/NodeBadges';
import { NodeToolbar } from './story/NodeToolbar';
import { NodeExpandableArea } from './story/NodeExpandableArea';
import { DEFAULT_NODE_WIDTH, NODE_STYLES } from '../constants';
import { useNodeLocalState } from '../hooks/useNodeLocalState';
import { useVisibility } from '../hooks/useVisibility';
import { getEffectiveNodeContext, resolveCharacterStateSnapshots } from '../utils/storyUtils';

interface StoryNodeProps {
  node: HierarchyPointNode<StoryNodeData>;
  readableId?: string;
  isDimmed?: boolean;
  onHover: (isHovering: boolean) => void;
  actions: {
      onUpdateNodeData: (nodeId: string, data: Partial<StoryNodeData>, actionName?: string) => void;
      onAddChild: (nodeId: string) => void;
      onEdit: (node: HierarchyPointNode<StoryNodeData>) => void;
      onDelete: (node: HierarchyPointNode<StoryNodeData>) => void;
      onPromoteNote: (nodeId: string, content: string) => void;
      onAddTag: (nodeId: string, tag: string) => void;
      onRemoveTag: (nodeId: string, tag: string) => void;
      onSearchByTag: (tag: string) => void;
      onHeightChange: (nodeId: string, height: number) => void;
      onToggleCollapse: (nodeId: string) => void;
      onResizeStart: (nodeId: string, initialWidth: number, startX: number, direction: 'left' | 'right') => void;
      onCopyNode: (nodeId: string) => void;
      onPasteNodeAsChild: (parentNodeId: string) => void;
      onPasteNodeContent: (targetNodeId: string) => void;
      onCutNode: (nodeId: string) => void;
      onMoveNode: (targetParentId: string) => void;
      onUpdateCharacter: (charId: string, updates: Partial<Character>) => void;
      onUpdateNodeCharacterState: (nodeId: string, charId: string, updates: CharacterStateSnapshot) => void;
      onResetNodeCharacterState: (nodeId: string, charId: string) => void;
      onPromoteToArc: (nodeId: string) => void;
      onToggleContextExclusion: (nodeId: string) => void;
  };
  aiHandlers: {
      onGenerate: (node: HierarchyPointNode<StoryNodeData>, branchType: string) => void;
      onRegenerate: (node: HierarchyPointNode<StoryNodeData>) => void;
      onCorrectText: (node: HierarchyPointNode<StoryNodeData>) => void;
      onContinuePlot: (node: HierarchyPointNode<StoryNodeData>) => void; 
      onTranslateNodeText: (nodeId: string, translationId: string, targetLanguage: string) => Promise<void>;
  };
  data: {
      characters: Character[];
      scenarios: Scenario[];
      allTagGroups: TagGroup[];
      translationLanguage: string;
      copiedNodeData: Partial<StoryNodeData> | null;
      movingNodeId: string | null;
      isCanonical: boolean;
  };
  flags: {
      isGenerating: boolean;
      isRegenerating: boolean;
      isCorrecting: boolean;
      isContinuingPlot: boolean;
      isTranslateOpen: boolean;
      isNavMode: boolean; 
      onToggleTranslate: (nodeId: string) => void;
  };
}

export const StoryNode = memo(({ node, readableId, isDimmed = false, onHover, actions, aiHandlers, data, flags }: StoryNodeProps) => {
  const isRoot = node.depth === 0;
  const hasChildren = node.data.children && node.data.children.length > 0;
  const currentWidth = node.data.width || DEFAULT_NODE_WIDTH;
  const isCollapsed = node.data.isCollapsed;
  const hasDirectorChat = node.data.directorChatHistory && node.data.directorChatHistory.length > 0; 
  const hasNote = !!node.data.note?.trim();
  const hasTranslations = node.data.translations && node.data.translations.length > 0;
  const isExcluded = node.data.excludeFromContext;
  const isMovingThisNode = data.movingNodeId === node.data.id;
  const isMoveMode = !!data.movingNodeId;

  const foreignDivRef = useRef<HTMLDivElement>(null);
  const isVisible = useVisibility(foreignDivRef);

  const local = useNodeLocalState(node, false, flags.isTranslateOpen, actions.onHeightChange, isVisible);

  const style = NODE_STYLES[node.data.styleId as keyof typeof NODE_STYLES] || NODE_STYLES.default;
  const moveStyleClass = isMovingThisNode ? 'ring-4 ring-yellow-500 animate-pulse' : '';
  const excludeStyleClass = isExcluded ? 'opacity-70 saturate-50' : '';

  const effectiveSceneCharacters = useMemo(() => {
      const context = getEffectiveNodeContext(node);
      const baseCharacters = context.characterIds.map((id: string) => data.characters.find(c => c.id === id)).filter(Boolean) as Character[];
      return resolveCharacterStateSnapshots(baseCharacters, context.overrides);
  }, [node, data.characters]);

  const inheritedCustomSummary = useMemo(() => {
      let current = node.parent;
      while (current) {
          if (current.data.customCharactersSummary) return current.data.customCharactersSummary;
          current = current.parent;
      }
      return '';
  }, [node]);

  const handleInternalInteraction = (e: React.MouseEvent | React.TouchEvent) => { if (!flags.isNavMode) e.stopPropagation(); };

  return (
    <g transform={`translate(${node.y},${node.x})`} style={{ transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease', opacity: isDimmed ? 0.15 : 1, filter: isDimmed ? 'grayscale(0.8)' : 'none' }} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <foreignObject width={currentWidth} height={local.height} x={-currentWidth / 2} y={-local.height / 2} className="overflow-visible">
        <div ref={foreignDivRef} className="relative w-full h-full flex items-center justify-center group" onMouseDown={handleInternalInteraction} onTouchStart={handleInternalInteraction}>
            {isVisible ? (
              <>
            <div className={`absolute inset-0 ${style.bg} rounded-3xl -z-10 blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            {isCollapsed && hasChildren && ( <div className="absolute inset-0 bg-gray-800 border border-gray-600 rounded-3xl -z-20 transform translate-x-3 translate-y-3 shadow-2xl opacity-50"></div> )}
            <NodeBadges hasChat={false} hasNote={hasNote} hasTranslations={hasTranslations} hasDirectorChat={hasDirectorChat} readableId={readableId} isExcluded={isExcluded} />
            {isMoveMode && !isMovingThisNode && (
                <div className="absolute bottom-full mb-10 left-1/2 -translate-x-1/2 z-50">
                     <button onClick={() => actions.onMoveNode(node.data.id)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-2 px-6 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center space-x-2 transform hover:scale-110 transition-all animate-bounce"><MagnetIcon className="w-5 h-5" /> <span>CONECTAR AQUÍ</span></button>
                </div>
            )}
            <div ref={local.divRef} className={`node-content relative w-full h-auto ${style.bg} border-[3px] ${style.border} ${style.hoverBorder} ${moveStyleClass} ${excludeStyleClass} rounded-[2rem] shadow-2xl flex flex-col justify-between transition-all duration-500 overflow-hidden backdrop-blur-sm`}>
                <div className="bg-black/40 p-4 pb-3 border-b border-white/5 backdrop-blur-md">
                    {data.isCanonical && <div className="absolute -top-2 -left-2 z-10 bg-yellow-500 rounded-full p-1.5 shadow-lg border-2 border-gray-900" title="Camino Canónico"><StarIcon className="w-4 h-4 text-gray-900" /></div>}
                    <SceneMetadataEditor node={node} allCharacters={data.characters} onUpdateData={(d) => actions.onUpdateNodeData(node.data.id, d)} allScenarios={data.scenarios} allTagGroups={data.allTagGroups} />
                </div>
                <div className={`px-6 py-6 bg-gray-800/40 min-h-[100px] ${!flags.isNavMode ? 'selectable-text' : ''}`}>
                    <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2" onMouseDown={(e) => e.stopPropagation()}>
                        <NodeTextRenderer text={node.data.name} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 items-center min-h-[28px]">
                        {node.data.tags?.map(tag => (
                            <div key={tag} className="flex items-center bg-cyan-900/30 text-cyan-300 text-[10px] font-bold px-3 py-1 rounded-full border border-cyan-700/50 hover:bg-cyan-700/50 hover:text-white transition-all">
                                <button onClick={() => actions.onSearchByTag(tag)} className="hover:underline">{tag.toUpperCase()}</button>
                                <button onClick={() => actions.onRemoveTag(node.data.id, tag)} className="ml-2 -mr-1 p-0.5 rounded-full hover:bg-red-500/50 transition-colors"><XIcon className="h-3 w-3" /></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-3 bg-black/40 border-t border-white/5 backdrop-blur-md">
                    <NodeToolbar 
                        node={node} isRoot={isRoot} isMovingThisNode={isMovingThisNode} copiedNodeData={data.copiedNodeData}
                        onAddChild={actions.onAddChild} onCopyNode={actions.onCopyNode} onCutNode={actions.onCutNode} onPasteNodeAsChild={actions.onPasteNodeAsChild} onPasteNodeContent={actions.onPasteNodeContent}
                        onEdit={actions.onEdit} onCorrectText={aiHandlers.onCorrectText} onContinuePlot={aiHandlers.onContinuePlot} onRegenerate={aiHandlers.onRegenerate} onDelete={actions.onDelete} onGenerate={aiHandlers.onGenerate}
                        onToggleTranslate={flags.onToggleTranslate} 
                        onToggleNote={() => { local.setIsNoteOpen(!local.isNoteOpen); }}
                        onToggleStateMonitor={() => local.setIsStateMonitorOpen(!local.isStateMonitorOpen)}
                        onToggleHistory={() => local.setIsHistoryOpen(!local.isHistoryOpen)}
                        onUpdateNodeData={actions.onUpdateNodeData}
                        onPromoteToArc={actions.onPromoteToArc}
                        onToggleContextExclusion={() => actions.onToggleContextExclusion(node.data.id)}
                        isCorrecting={flags.isCorrecting} isContinuingPlot={flags.isContinuingPlot} isGenerating={flags.isGenerating} isRegenerating={flags.isRegenerating}
                        isNoteOpen={local.isNoteOpen} hasNote={hasNote} isStateMonitorOpen={local.isStateMonitorOpen} isHistoryOpen={local.isHistoryOpen} isExcluded={isExcluded}
                    />
                </div>
                <NodeExpandableArea 
                    nodeId={node.data.id} nodeData={node.data} local={local} flags={flags} effectiveSceneCharacters={effectiveSceneCharacters}
                    allCharacters={data.characters} inheritedCustomSummary={inheritedCustomSummary} translationLanguage={data.translationLanguage}
                    actions={actions} aiHandlers={aiHandlers}
                />
            </div>
            {/* Tiradores y Colapso ... */}
            {hasChildren && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 z-20 flex items-center" style={{ transform: `translateX(${currentWidth / 2}px) translateY(-50%)`}}>
                    <button onClick={(e) => { e.stopPropagation(); actions.onToggleCollapse(node.data.id); }} className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ring-4 ring-gray-900 transition-all shadow-2xl ${isCollapsed ? 'bg-orange-600 hover:bg-orange-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {isCollapsed ? <LayersIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5 rotate-[-90deg]" />}
                    </button>
                </div>
            )}
            </>
            ) : (
                <div style={{ width: currentWidth, height: local.height }} />
            )}
        </div>
      </foreignObject>
    </g>
  );
});