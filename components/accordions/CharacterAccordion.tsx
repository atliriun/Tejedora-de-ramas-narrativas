
import React, { useState } from 'react';
import { Character, PsychologicalTrait, AiSettings, WorldRule, StoryArc } from '../../types';
import { ActivityIcon, UsersIcon, HistoryIcon, BackpackIcon, MicIcon, FileTextIcon, SparkleIcon, BookOpenIcon, TrendingUpIcon, PaletteIcon, ImageIcon } from '../icons';
import { TRAIT_CATEGORY_LABELS, CHARACTER_COLORS } from '../../constants';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { EntityAccordionShell } from '../ui/EntityAccordionShell';
import { processImageFile } from '../../utils/imageUtils';

// Modular Editors
import { AbilityListEditor } from '../editors/AbilityListEditor';
import { AttributeListEditor } from '../editors/AttributeListEditor';
import { StateListEditor } from '../editors/StateListEditor';
import { RelationshipListEditor } from '../editors/RelationshipListEditor';
import { MemoryListEditor } from '../editors/MemoryListEditor';
import { InventoryEditor } from '../editors/InventoryEditor';
import { VoiceEditor } from '../editors/VoiceEditor';
import { EvolutionEditor } from '../editors/EvolutionEditor';
import { ExpressionListEditor } from '../editors/ExpressionListEditor';

export const CharacterAccordion: React.FC<{
    character: Character;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<Character>) => void;
    onDelete: () => void;
    allCharacters: Character[];
    allTraits: PsychologicalTrait[];
    allArcs?: StoryArc[]; // NEW
    // Legacy props kept for interface compatibility
    storySummary?: string;
    aiSettings?: AiSettings;
    psychologyRules?: PsychologicalTrait[];
    worldLogicRules?: WorldRule[];
    documentContent?: string;
}> = ({ character, isOpen, onToggle, onUpdate, onDelete, allCharacters, allTraits, allArcs = [] }) => {
    const [activeTab, setActiveTab] = useState('profile');

    const handleUpdate = (updates: Partial<Character>) => onUpdate(character.id, updates);

    const handleToggleTrait = (traitId: string) => { 
        const current = character.traitIds || []; 
        handleUpdate({ traitIds: current.includes(traitId) ? current.filter(id => id !== traitId) : [...current, traitId] }); 
    };

    const tabs = [
        { id: 'profile', label: 'Perfil', icon: <FileTextIcon className="w-3 h-3"/> },
        { id: 'expressions', label: 'Expr.', count: character.expressions?.length || 0, icon: <ImageIcon className="w-3 h-3"/> },
        { id: 'states', label: 'Estado', count: (character.states?.length || 0) + (character.attributes?.length || 0), icon: <ActivityIcon className="w-3 h-3"/> },
        { id: 'evolution', label: 'Evolución', count: character.evolution?.length || 0, icon: <TrendingUpIcon className="w-3 h-3"/> },
        { id: 'inventory', label: 'Inventario', count: character.inventory?.length || 0, icon: <BackpackIcon className="w-3 h-3"/> },
        { id: 'voice', label: 'Voz', icon: <MicIcon className="w-3 h-3"/> },
        { id: 'psychology', label: 'Psique', count: character.traitIds?.length || 0 },
        { id: 'abilities', label: 'Poderes', count: character.abilitiesList?.length || 0, icon: <SparkleIcon className="w-3 h-3"/> },
        { id: 'memories', label: 'Memoria', count: character.memories?.length || 0, icon: <HistoryIcon className="w-3 h-3"/> },
        { id: 'relationships', label: 'Relación', count: character.relationships?.length || 0, icon: <UsersIcon className="w-3 h-3"/> },
        { id: 'notes', label: 'Notas', icon: <BookOpenIcon className="w-3 h-3"/> },
    ];

    return (
        <EntityAccordionShell
            name={character.name}
            nameColor={character.color}
            avatar={character.avatar}
            onUpdateAvatar={(avatar) => handleUpdate({ avatar })}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => handleUpdate({ name })}
            onDelete={onDelete}
            defaultNameCheck="Nuevo Personaje"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isActive={character.active !== false}
            onToggleActive={() => handleUpdate({ active: !character.active })}
        >
            {activeTab === 'profile' && (
                <div className="space-y-3 animate-fade-in-fast">
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput label="Nombre" value={character.name} onChange={e => handleUpdate({ name: e.target.value })} />
                        <StyledInput label="Origen / Universo" value={character.source || ''} onChange={e => handleUpdate({ source: e.target.value })} />
                    </div>

                    {/* Avatar / Portrait */}
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 flex flex-col gap-5 items-center w-full">
                        <div 
                            className="relative w-full aspect-square max-h-[300px] max-w-[300px] rounded-xl border-2 border-dashed border-gray-700 hover:border-cyan-500 bg-black/50 flex items-center justify-center overflow-hidden group cursor-pointer transition-all shadow-2xl"
                            onClick={() => document.getElementById(`avatar-upload-${character.id}`)?.click()}
                        >
                            {character.avatar ? (
                                <img src={character.avatar} alt="Avatar" className="w-full h-full object-cover transition-opacity group-hover:opacity-50" />
                            ) : (
                                <div className="text-gray-600 flex flex-col items-center group-hover:text-cyan-500 transition-colors">
                                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                                    <span className="text-[10px] font-bold uppercase">Añadir Foto</span>
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                                <span className="text-white text-xs font-bold uppercase tracking-wider">Cambiar</span>
                            </div>
                            <input 
                                id={`avatar-upload-${character.id}`}
                                type="file" 
                                accept="image/png, image/jpeg, image/webp, image/gif"
                                className="hidden" 
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            const base64Image = await processImageFile(file);
                                            handleUpdate({ avatar: base64Image });
                                        } catch (e) {
                                            console.error("Error processing avatar:", e);
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="flex-grow space-y-3 w-full flex flex-col items-center text-center">
                            {/* Color Selector */}
                            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center">
                                <PaletteIcon className="w-3 h-3 mr-1"/> Color de Identificación
                            </label>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {CHARACTER_COLORS.map((col) => (
                                    <button
                                        key={col.value}
                                        onClick={() => handleUpdate({ color: col.value })}
                                        className={`w-7 h-7 rounded-full border-2 transition-all transform hover:scale-110 ${col.bg} ${
                                            character.color === col.value ? 'border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                        title={col.name}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 max-w-xs">
                                Selecciona el color base y un retrato para identificar al personaje fácilmente en chats y gráficos.
                            </p>
                        </div>
                    </div>

                    <StyledInput label="Alias (Contexto AI)" value={character.aliases?.join(', ') || ''} onChange={e => handleUpdate({ aliases: e.target.value.split(/[,/;|]+/).map(s=>s.trim()).filter(Boolean) })} placeholder="ej. El Héroe, Roberto" />
                    <StyledTextArea label="Apariencia" value={character.appearance || ''} onChange={e => handleUpdate({ appearance: e.target.value })} rows={3} />
                    <StyledTextArea label="Personalidad" value={character.personality || ''} onChange={e => handleUpdate({ personality: e.target.value })} rows={3} />
                    <StyledTextArea label="Historia de Fondo" value={character.backstory || ''} onChange={e => handleUpdate({ backstory: e.target.value })} rows={3} />
                </div>
            )}

            {activeTab === 'expressions' && (
                <ExpressionListEditor expressions={character.expressions} onUpdate={(l) => handleUpdate({ expressions: l })} allCharacters={allCharacters} currentCharacterId={character.id} />
            )}
            
            {activeTab === 'states' && (
                <div className="space-y-6">
                    <AttributeListEditor attributes={character.attributes} onUpdate={(l) => handleUpdate({ attributes: l })} />
                    <StateListEditor states={character.states} onUpdate={(l) => handleUpdate({ states: l })} />
                </div>
            )}

            {activeTab === 'evolution' && (
                <EvolutionEditor 
                    evolution={character.evolution} 
                    onUpdate={(l) => handleUpdate({ evolution: l })} 
                    allArcs={allArcs}
                />
            )}

            {activeTab === 'inventory' && (
                <InventoryEditor 
                    inventory={character.inventory} resources={character.resources}
                    onUpdateInventory={(i) => handleUpdate({ inventory: i })}
                    onUpdateResources={(r) => handleUpdate({ resources: r })}
                />
            )}

            {activeTab === 'voice' && (
                <VoiceEditor voice={character.voice} onUpdate={(v) => handleUpdate({ voice: v })} />
            )}
            
            {activeTab === 'psychology' && (
                <div className="space-y-3">
                     <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-700 pb-1">Rasgos Vinculados</h3>
                     <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {allTraits.length > 0 ? allTraits.map(trait => (
                            <div key={trait.id} className="flex items-center">
                                <input type="checkbox" id={`trait-${character.id}-${trait.id}`} checked={character.traitIds?.includes(trait.id) || false} onChange={() => handleToggleTrait(trait.id)} className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" />
                                <label htmlFor={`trait-${character.id}-${trait.id}`} className="ml-2 text-sm text-gray-300 cursor-pointer w-full">
                                    <p className="font-medium">{trait.name} <span className="text-xs text-gray-500 ml-1">({TRAIT_CATEGORY_LABELS[trait.category]})</span></p>
                                </label>
                            </div>
                        )) : <p className="text-sm text-gray-500 italic">No hay rasgos definidos.</p>}
                     </div>
                </div>
            )}

            {activeTab === 'abilities' && (
                 <div className="space-y-4">
                    <StyledTextArea label="Notas de Poderes (Texto Simple)" value={character.abilities || ''} onChange={e => handleUpdate({ abilities: e.target.value })} rows={2} placeholder="Notas rápidas no estructuradas..." />
                    <AbilityListEditor abilities={character.abilitiesList} onUpdate={(l) => handleUpdate({ abilitiesList: l })} />
                </div>
            )}

            {activeTab === 'memories' && (
                <MemoryListEditor memories={character.memories} onUpdate={(l) => handleUpdate({ memories: l })} />
            )}

            {activeTab === 'relationships' && (
                <RelationshipListEditor relationships={character.relationships} onUpdate={(l) => handleUpdate({ relationships: l })} allCharacters={allCharacters} currentCharacterId={character.id} />
            )}

             {activeTab === 'notes' && (
                <StyledTextArea value={character.notes || ''} onChange={e => handleUpdate({ notes: e.target.value })} rows={8} placeholder="Notas generales..." />
             )}
        </EntityAccordionShell>
    );
};
