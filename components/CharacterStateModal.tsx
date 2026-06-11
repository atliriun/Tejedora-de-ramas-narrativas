
import React, { useState, useEffect, useMemo } from 'react';
import { HierarchyPointNode } from 'd3-hierarchy';
import { StoryNodeData, Character, StoryArc } from '../types';
import { XIcon, HeartIcon, ActivityIcon, UsersIcon, BackpackIcon, TrendingUpIcon, HistoryIcon } from './icons';
import { AttributeListEditor } from './editors/AttributeListEditor';
import { StateListEditor } from './editors/StateListEditor';
import { InventoryEditor } from './editors/InventoryEditor';
import { RelationshipListEditor } from './editors/RelationshipListEditor';
import { EvolutionEditor } from './editors/EvolutionEditor';
import { MemoryListEditor } from './editors/MemoryListEditor';
import { getEffectiveNodeContext, resolveCharacterStateSnapshots } from '../utils/storyUtils';

interface CharacterStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetNode: HierarchyPointNode<StoryNodeData> | null;
    allCharacters: Character[];
    onUpdateCharacter: (id: string, u: Partial<Character>) => void;
    allArcs?: StoryArc[];
}

type TabType = 'vitals' | 'evolution' | 'memories' | 'inventory' | 'relationships';

export const CharacterStateModal: React.FC<CharacterStateModalProps> = ({
    isOpen, onClose, targetNode, allCharacters, onUpdateCharacter, allArcs = []
}) => {
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('vitals');

    const sceneCharacters = useMemo(() => {
        if (!targetNode) return [];
        const context = getEffectiveNodeContext(targetNode);
        const snapshotCharacters = resolveCharacterStateSnapshots(allCharacters, context.overrides);
        const ids = context.characterIds || [];
        return ids.map(id => snapshotCharacters.find(c => c.id === id)).filter(Boolean) as Character[];
    }, [targetNode, allCharacters, isOpen]);

    useEffect(() => {
        if (isOpen && sceneCharacters.length > 0 && (!selectedCharId || !sceneCharacters.find(c => c.id === selectedCharId))) {
            setSelectedCharId(sceneCharacters[0].id);
        } else if (sceneCharacters.length === 0) {
            setSelectedCharId(null);
        }
    }, [isOpen, sceneCharacters]);

    const activeCharacter = useMemo(() => sceneCharacters.find(c => c.id === selectedCharId), [sceneCharacters, selectedCharId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in-fast p-4">
            <div className="bg-gray-900 border border-cyan-900/50 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative ring-1 ring-cyan-900/30">
                
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-900/20 rounded-lg text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                            <ActivityIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-100 tracking-tight">Monitor de Estado de Escena</h2>
                            <p className="text-xs text-gray-400">Gestión de biometría, evolución y memoria neuronal.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    
                    <div className="w-full md:w-1/5 border-r border-gray-800 bg-gray-900/50 flex flex-col overflow-y-auto p-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2 pt-2 flex items-center">
                            <UsersIcon className="w-3 h-3 mr-1"/> Actores ({sceneCharacters.length})
                        </h3>
                        <div className="space-y-1">
                            {sceneCharacters.map(char => {
                                const hp = char.attributes?.find(a => a.name.toLowerCase().match(/vida|hp|salud|health/));
                                const hpPercent = hp ? (hp.current / hp.max) * 100 : 100;
                                return (
                                    <button
                                        key={char.id}
                                        onClick={() => setSelectedCharId(char.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-all border flex flex-col ${selectedCharId === char.id ? 'bg-cyan-900/20 border-cyan-500/50 shadow-md' : 'bg-transparent border-transparent hover:bg-gray-800/50'}`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            {char.avatar ? (
                                                <img src={char.avatar} alt={char.name} className="w-8 h-8 rounded-full object-cover border border-gray-600 bg-gray-800 flex-shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                    <UsersIcon className="w-4 h-4 text-gray-500" />
                                                </div>
                                            )}
                                            <div className={`font-bold text-sm truncate ${char.color || 'text-gray-200'}`}>{char.name}</div>
                                        </div>
                                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mt-2">
                                            <div className={`h-full ${hpPercent < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${hpPercent}%` }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full md:w-4/5 bg-gray-900 flex flex-col overflow-hidden">
                        {activeCharacter ? (
                            <>
                                <div className="flex-shrink-0 p-4 border-b border-gray-800 bg-gray-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-center space-x-3">
                                        {activeCharacter.avatar ? (
                                            <img src={activeCharacter.avatar} alt={activeCharacter.name} className="w-10 h-10 rounded-full border border-gray-600 bg-gray-800 object-cover" />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-lg font-bold bg-gray-800 ${activeCharacter.color || 'text-white'}`}>
                                                {activeCharacter.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className={`text-lg font-bold leading-tight ${activeCharacter.color || 'text-white'}`}>{activeCharacter.name}</h2>
                                            <p className="text-xs text-gray-500">{activeCharacter.archetype || 'Actor narrativo'}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1 bg-gray-800/50 p-1 rounded-xl">
                                        <button onClick={() => setActiveTab('vitals')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${activeTab === 'vitals' ? 'bg-gray-700 text-cyan-400 shadow' : 'text-gray-400 hover:bg-gray-800'}`}>
                                            <HeartIcon className="w-3.5 h-3.5" /> <span>Vitales</span>
                                        </button>
                                        <button onClick={() => setActiveTab('evolution')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${activeTab === 'evolution' ? 'bg-gray-700 text-cyan-400 shadow' : 'text-gray-400 hover:bg-gray-800'}`}>
                                            <TrendingUpIcon className="w-3.5 h-3.5" /> <span>Evolución</span>
                                        </button>
                                        <button onClick={() => setActiveTab('memories')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${activeTab === 'memories' ? 'bg-gray-700 text-cyan-400 shadow' : 'text-gray-400 hover:bg-gray-800'}`}>
                                            <HistoryIcon className="w-3.5 h-3.5" /> <span>Memorias</span>
                                        </button>
                                        <button onClick={() => setActiveTab('inventory')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${activeTab === 'inventory' ? 'bg-gray-700 text-cyan-400 shadow' : 'text-gray-400 hover:bg-gray-800'}`}>
                                            <BackpackIcon className="w-3.5 h-3.5" /> <span>Inventario</span>
                                        </button>
                                        <button onClick={() => setActiveTab('relationships')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${activeTab === 'relationships' ? 'bg-gray-700 text-cyan-400 shadow' : 'text-gray-400 hover:bg-gray-800'}`}>
                                            <UsersIcon className="w-3.5 h-3.5" /> <span>Relaciones</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-800">
                                    <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
                                        {activeTab === 'vitals' && (
                                            <div className="space-y-6 animate-fade-in-fast">
                                                <AttributeListEditor attributes={activeCharacter.attributes} onUpdate={(list) => onUpdateCharacter(activeCharacter.id, { attributes: list })} />
                                                <StateListEditor states={activeCharacter.states} onUpdate={(list) => onUpdateCharacter(activeCharacter.id, { states: list })} />
                                            </div>
                                        )}
                                        {activeTab === 'evolution' && (
                                            <div className="animate-fade-in-fast h-full">
                                                <EvolutionEditor evolution={activeCharacter.evolution} onUpdate={(list) => onUpdateCharacter(activeCharacter.id, { evolution: list })} allArcs={allArcs} />
                                            </div>
                                        )}
                                        {activeTab === 'memories' && (
                                            <div className="animate-fade-in-fast h-full">
                                                <MemoryListEditor memories={activeCharacter.memories} onUpdate={(list) => onUpdateCharacter(activeCharacter.id, { memories: list })} />
                                            </div>
                                        )}
                                        {activeTab === 'inventory' && (
                                            <div className="animate-fade-in-fast">
                                                <InventoryEditor inventory={activeCharacter.inventory} resources={activeCharacter.resources} onUpdateInventory={(list) => onUpdateCharacter(activeCharacter.id, { inventory: list })} onUpdateResources={(list) => onUpdateCharacter(activeCharacter.id, { resources: list })} />
                                            </div>
                                        )}
                                        {activeTab === 'relationships' && (
                                            <div className="animate-fade-in-fast">
                                                <RelationshipListEditor relationships={activeCharacter.relationships} onUpdate={(list) => onUpdateCharacter(activeCharacter.id, { relationships: list })} allCharacters={allCharacters} currentCharacterId={activeCharacter.id} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-600 flex-col">
                                <ActivityIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p>Selecciona un actor del elenco para sincronizar su estado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
