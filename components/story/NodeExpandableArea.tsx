
import React from 'react';
import { Character, StoryNodeData, NodeTranslation, CharacterStateSnapshot } from '../../types';
import { StateMonitorPanel } from './StateMonitorPanel';
import { TranslationsPanel } from './TranslationsPanel';
import { NodeHistoryPanel } from './NodeHistoryPanel';
import { ImageUploader } from '../ui/ImageUploader';
import { StarIcon, ArrowUpIcon } from '../icons';

interface NodeExpandableAreaProps {
    nodeId: string;
    nodeData: StoryNodeData; 
    local: {
        isStateMonitorOpen: boolean;
        isNoteOpen: boolean;
        isHistoryOpen: boolean;
        noteText: string;
        setNoteText: (t: string) => void;
        noteTextAreaRef: React.RefObject<HTMLTextAreaElement | null>;
        setIsStateMonitorOpen: (o: boolean) => void;
        setIsNoteOpen: (o: boolean) => void;
        setIsHistoryOpen: (o: boolean) => void;
    };
    flags: {
        isTranslateOpen: boolean;
    };
    effectiveSceneCharacters: Character[];
    allCharacters: Character[];
    inheritedCustomSummary: string;
    translationLanguage: string;
    actions: {
        onUpdateNodeData: (nodeId: string, data: Partial<StoryNodeData>, actionName?: string) => void;
        onUpdateNodeCharacterState: (nodeId: string, charId: string, updates: CharacterStateSnapshot) => void;
        onResetNodeCharacterState: (nodeId: string, charId: string) => void;
        onPromoteNote: (nodeId: string, content: string) => void;
    };
    aiHandlers: {
        onTranslateNodeText: (nodeId: string, translationId: string, targetLanguage: string) => Promise<void>;
    };
}

export const NodeExpandableArea: React.FC<NodeExpandableAreaProps> = ({
    nodeId, nodeData, local, flags,
    effectiveSceneCharacters, allCharacters, inheritedCustomSummary, translationLanguage,
    actions, aiHandlers
}) => {
    const handleNoteBlur = () => { if (local.noteText !== (nodeData.note || '')) actions.onUpdateNodeData(nodeId, { note: local.noteText }); };

    return (
        <div className="px-3 bg-gray-800/30">
            {local.isStateMonitorOpen && (
                <StateMonitorPanel 
                    nodeId={nodeId} characters={effectiveSceneCharacters} allCharacters={allCharacters} 
                    localSummary={nodeData.customCharactersSummary || ''} inheritedSummary={inheritedCustomSummary} 
                    localOverrides={nodeData.characterStateOverrides || {}}
                    onUpdateCharacter={(charId, updates) => {
                        const snapshotUpdates: CharacterStateSnapshot = {};
                        if (updates.attributes !== undefined) snapshotUpdates.attributes = updates.attributes;
                        if (updates.states !== undefined) snapshotUpdates.states = updates.states;
                        if (updates.relationships !== undefined) snapshotUpdates.relationships = updates.relationships;
                        actions.onUpdateNodeCharacterState(nodeId, charId, snapshotUpdates);
                    }}
                    onUpdateContext={(summary) => actions.onUpdateNodeData(nodeId, { customCharactersSummary: summary })}
                    onResetCharacter={(charId) => actions.onResetNodeCharacterState(nodeId, charId)}
                />
            )}
            
            {local.isNoteOpen && (
                <div className="pb-3 pt-2 space-y-4 animate-fade-in-fast border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-yellow-400 px-1 flex items-center"><StarIcon className="w-3 h-3 mr-1"/> Nota</p>
                        <textarea ref={local.noteTextAreaRef} value={local.noteText} onChange={(e) => local.setNoteText(e.target.value)} onBlur={handleNoteBlur} placeholder="Añadir nota..." className="w-full p-2 text-xs bg-gray-900 border border-yellow-600/50 rounded focus:ring-1 focus:ring-yellow-500 outline-none resize-none overflow-hidden text-yellow-100" autoFocus />
                        <div className="flex justify-end space-x-2 px-1 mt-1">
                            <button onClick={(e) => { e.stopPropagation(); if (!local.noteText.trim()) return; actions.onPromoteNote(nodeId, local.noteText); local.setNoteText(''); }} disabled={!local.noteText.trim()} className="text-[10px] bg-cyan-700 hover:bg-cyan-600 text-white px-2 py-1 rounded flex items-center space-x-1 disabled:opacity-50 transition-colors shadow-md"><ArrowUpIcon className="w-3 h-3" /> <span>Anexar</span></button>
                        </div>
                    </div>
                    
                    <ImageUploader 
                        images={nodeData.images || []}
                        onUpdate={(newImages) => actions.onUpdateNodeData(nodeId, { images: newImages })}
                    />
                </div>
            )}
            
            {flags.isTranslateOpen && (
                <div className="pb-3 border-t border-white/5">
                    <TranslationsPanel nodeId={nodeId} translations={nodeData.translations || []} onUpdate={(newTranslations) => actions.onUpdateNodeData(nodeId, { translations: newTranslations })} onTranslate={(translationId, lang) => aiHandlers.onTranslateNodeText(nodeId, translationId, lang)} defaultLanguage={translationLanguage} />
                </div>
            )}
            
            {local.isHistoryOpen && (
                <NodeHistoryPanel nodeId={nodeId} history={nodeData.history || []} />
            )}
        </div>
    );
};
