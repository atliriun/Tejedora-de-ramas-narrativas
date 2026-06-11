
import React, { useState } from 'react';
import { Character, CharacterAttribute, CharacterState, CharacterStateSnapshot, StoryArc } from '../../types';
import { ActivityIcon, HeartIcon, FileTextIcon, CheckIcon, UsersIcon, ChevronDownIcon, UndoIcon, TrendingUpIcon, HistoryIcon, BackpackIcon } from '../icons';
import { AttributeListEditor } from '../editors/AttributeListEditor';
import { StateListEditor } from '../editors/StateListEditor';
import { RelationshipListEditor } from '../editors/RelationshipListEditor';
import { EvolutionEditor } from '../editors/EvolutionEditor';
import { MemoryListEditor } from '../editors/MemoryListEditor';

interface StateMonitorPanelProps {
    nodeId: string;
    characters: Character[];
    allCharacters: Character[]; 
    localSummary: string;
    inheritedSummary: string;
    localOverrides: Record<string, CharacterStateSnapshot>; 
    onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
    onUpdateContext: (summary: string) => void;
    onResetCharacter: (charId: string) => void; 
    allArcs?: StoryArc[];
}

export const StateMonitorPanel: React.FC<StateMonitorPanelProps> = ({ 
    characters, allCharacters, localSummary, inheritedSummary, localOverrides, 
    onUpdateCharacter, onUpdateContext, onResetCharacter, allArcs = []
}) => {
    const [justSynced, setJustSynced] = useState(false);
    const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'states' | 'evolution' | 'memories' | 'relationships'>('states');

    const effectiveSummary = localSummary || inheritedSummary;
    const [draftSummary, setDraftSummary] = useState(effectiveSummary);

    React.useEffect(() => {
        setDraftSummary(effectiveSummary);
    }, [effectiveSummary]);

    const handleSummaryBlur = () => {
        if (draftSummary !== effectiveSummary) {
            onUpdateContext(draftSummary);
        }
    };

    const handleAttributeChange = (charId: string, attrId: string, currentAttributes: CharacterAttribute[], delta: number) => {
        const newAttributes = currentAttributes.map(a => {
            if (a.id === attrId) {
                const newValue = Math.min(a.max, Math.max(0, a.current + delta));
                return { ...a, current: newValue };
            }
            return a;
        });
        onUpdateCharacter(charId, { attributes: newAttributes });
        setJustSynced(false); 
    };

    const handleSyncToContext = () => {
        const lines = characters.map(char => {
            const attributes = char.attributes || [];
            const hp = attributes.find(a => a.name.toLowerCase().match(/vida|hp|salud|health/)) || attributes[0];
            const activeStates = char.states?.filter(s => s.active).map(s => s.name) || [];
            let status = `${char.name}`;
            if (hp) status += `: ${hp.current}/${hp.max} HP`;
            if (activeStates.length > 0) status += ` [${activeStates.join(', ')}]`;
            return status;
        });
        const summaryText = lines.join(' | ');
        onUpdateContext(summaryText);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2000);
    };

    if (characters.length === 0) {
        return (
            <div className="p-3 text-center text-xs text-gray-500 italic border-t border-gray-700/50">
                No hay personajes asignados a esta escena.
            </div>
        );
    }

    return (
        <div className="pt-2 border-t border-gray-700/50 space-y-3 animate-fade-in-fast" onMouseDown={e => e.stopPropagation()}>
            <div className="px-2 flex items-center justify-between">
                <div className="flex items-center text-[10px] font-bold text-red-300 uppercase tracking-wider">
                    <ActivityIcon className="w-3 h-3 mr-1 text-red-400"/> Monitor Neuronal
                </div>
                <button 
                    onClick={handleSyncToContext}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${justSynced ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-cyan-600 text-gray-300 hover:text-white'}`}
                >
                    {justSynced ? <CheckIcon className="w-3 h-3" /> : <FileTextIcon className="w-3 h-3" />}
                    <span>{justSynced ? 'Sincronizado' : 'Resumir Estado'}</span>
                </button>
            </div>
            
            {characters.map(char => {
                const attributes = char.attributes || [];
                const hpAttr = attributes.find(a => a.name.toLowerCase().match(/vida|hp|salud|health/)) || attributes[0];
                const activeStates = char.states?.filter(s => s.active) || [];
                const isExpanded = expandedCharId === char.id;
                const hasLocalOverride = !!localOverrides[char.id];

                return (
                    <div key={char.id} className={`bg-gray-900/60 rounded-lg border transition-all ${isExpanded ? 'border-cyan-500/50 p-3' : 'border-gray-700/50 p-2'}`}>
                        <div className="flex justify-between items-center mb-1.5 cursor-pointer" onClick={() => setExpandedCharId(isExpanded ? null : char.id)}>
                            <div className="flex items-center space-x-2 min-w-0">
                                <span className={`text-xs font-bold truncate ${char.color || 'text-cyan-100'}`}>{char.name}</span>
                                {hasLocalOverride && <span className="text-[8px] bg-cyan-900/50 text-cyan-400 border border-cyan-700 px-1 rounded">Local</span>}
                            </div>
                            <div className="flex items-center space-x-2">
                                {!isExpanded && (
                                    <div className="flex space-x-1">
                                        {activeStates.map(s => (
                                            <span key={s.id} className="text-[9px] px-1 bg-red-900/40 text-red-300 border border-red-800 rounded">{s.name}</span>
                                        ))}
                                    </div>
                                )}
                                <ChevronDownIcon className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        {!isExpanded ? (
                            <div className="space-y-1.5">
                                {hpAttr && (
                                    <div className="flex items-center space-x-2">
                                        <HeartIcon className="w-3 h-3 text-red-500 flex-shrink-0" />
                                        <div className="flex-grow relative h-2.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300" style={{ width: `${(hpAttr.current / hpAttr.max) * 100}%` }} />
                                        </div>
                                        <div className="flex space-x-0.5">
                                            <button onClick={(e) => { e.stopPropagation(); handleAttributeChange(char.id, hpAttr.id, attributes, -1); }} className="w-4 h-4 bg-gray-700 hover:bg-red-900 text-[10px] rounded flex items-center justify-center">-</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleAttributeChange(char.id, hpAttr.id, attributes, 1); }} className="w-4 h-4 bg-gray-700 hover:bg-green-900 text-[10px] rounded flex items-center justify-center">+</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-2 border-t border-gray-700 pt-2">
                                <div className="flex flex-wrap gap-1 bg-gray-800/50 p-1 rounded mb-3">
                                    {[
                                        {id:'states', label: 'Biometría', icon: <HeartIcon className="w-3 h-3"/>},
                                        {id:'evolution', label: 'Evolución', icon: <TrendingUpIcon className="w-3 h-3"/>},
                                        {id:'memories', label: 'Memoria', icon: <HistoryIcon className="w-3 h-3"/>},
                                        {id:'relationships', label: 'Vínculos', icon: <UsersIcon className="w-3 h-3"/>}
                                    ].map(tab => (
                                        <button 
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`px-2 py-1 text-[9px] font-black uppercase rounded transition-colors flex items-center space-x-1 ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                        >
                                            {tab.icon} <span>{tab.label}</span>
                                        </button>
                                    ))}
                                    {hasLocalOverride && (
                                        <button onClick={() => onResetCharacter(char.id)} className="ml-auto p-1 text-red-400 hover:text-red-300 transition-colors" title="Resetear a heredado">
                                            <UndoIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 pr-1">
                                    {activeTab === 'states' && (
                                        <div className="space-y-4 animate-fade-in-fast">
                                            <AttributeListEditor attributes={char.attributes} onUpdate={(attrs) => onUpdateCharacter(char.id, { attributes: attrs })} />
                                            <StateListEditor states={char.states} onUpdate={(states) => onUpdateCharacter(char.id, { states })} />
                                        </div>
                                    )}
                                    {activeTab === 'evolution' && (
                                        <div className="animate-fade-in-fast">
                                            <EvolutionEditor evolution={char.evolution} onUpdate={(l) => onUpdateCharacter(char.id, { evolution: l })} allArcs={allArcs} />
                                        </div>
                                    )}
                                    {activeTab === 'memories' && (
                                        <div className="animate-fade-in-fast">
                                            <MemoryListEditor memories={char.memories} onUpdate={(l) => onUpdateCharacter(char.id, { memories: l })} />
                                        </div>
                                    )}
                                    {activeTab === 'relationships' && (
                                        <div className="animate-fade-in-fast">
                                            <RelationshipListEditor relationships={char.relationships} onUpdate={(rels) => onUpdateCharacter(char.id, { relationships: rels })} allCharacters={allCharacters} currentCharacterId={char.id} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="px-1">
                <textarea
                    value={draftSummary}
                    onChange={(e) => setDraftSummary(e.target.value)}
                    onBlur={handleSummaryBlur}
                    className="w-full bg-black/40 border border-cyan-900/50 text-cyan-100 rounded p-2 text-[10px] font-mono resize-none focus:ring-1 focus:ring-cyan-500 outline-none"
                    rows={2}
                    placeholder="Estado físico/emocional visible para la IA..."
                />
            </div>
        </div>
    );
};
