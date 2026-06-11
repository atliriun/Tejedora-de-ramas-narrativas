
import React, { useState } from 'react';
import { PsychologicalTrait, PsychologicalTraitCategory, Character, TraitDetail } from '../../types';
import { StyledSelect, StyledTextArea, StyledInput } from '../ui/Inputs';
import { TRAIT_CATEGORY_LABELS } from '../../constants';
import { PlusIcon, XIcon, ToggleLeftIcon, ToggleRightIcon, UsersIcon, ArrowUpIcon, TrashIcon } from '../icons';
import { uuid } from '../../utils/uuid';

interface TraitDetailsEditorProps {
    trait: PsychologicalTrait;
    onUpdate: (id: string, u: Partial<PsychologicalTrait>) => void;
    allCharacters: Character[];
    onUpdateCharacter: (id: string, u: Partial<Character>) => void;
}

export const TraitDetailsEditor: React.FC<TraitDetailsEditorProps> = ({ trait, onUpdate, allCharacters, onUpdateCharacter }) => {
    const [triggerInput, setTriggerInput] = useState('');
    const [activeTab, setActiveTab] = useState<'basic' | 'effects' | 'targets'>('basic');

    // --- TRIGGER LOGIC ---
    const handleAddTrigger = () => {
        if (triggerInput.trim()) {
            const newTriggers = [...(trait.triggers || []), triggerInput.trim()];
            onUpdate(trait.id, { triggers: newTriggers });
            setTriggerInput('');
        }
    };

    const handleRemoveTrigger = (trigger: string) => {
        const newTriggers = (trait.triggers || []).filter(t => t !== trigger);
        onUpdate(trait.id, { triggers: newTriggers });
    };

    // --- DETAILS LOGIC ---
    const handleAddDetail = () => {
        const newDetail: TraitDetail = { id: uuid(), title: '', content: '' };
        onUpdate(trait.id, { details: [...(trait.details || []), newDetail] });
    };

    const handleUpdateDetail = (detailId: string, field: keyof TraitDetail, value: string) => {
        const newDetails = (trait.details || []).map(d => d.id === detailId ? { ...d, [field]: value } : d);
        onUpdate(trait.id, { details: newDetails });
    };

    const handleDeleteDetail = (detailId: string) => {
        onUpdate(trait.id, { details: (trait.details || []).filter(d => d.id !== detailId) });
    };

    // --- CHARACTER TARGETING LOGIC ---
    const toggleCharacterTrait = (charId: string, currentTraitIds: string[] | undefined) => {
        const ids = currentTraitIds || [];
        const hasTrait = ids.includes(trait.id);
        if (hasTrait) {
            onUpdateCharacter(charId, { traitIds: ids.filter(id => id !== trait.id) });
        } else {
            onUpdateCharacter(charId, { traitIds: [...ids, trait.id] });
        }
    };

    return (
        <div className="space-y-4">
            {/* Global Active Toggle */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <div className="flex space-x-2 bg-gray-900/50 p-1 rounded">
                    <button onClick={() => setActiveTab('basic')} className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'basic' ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'}`}>Básico</button>
                    <button onClick={() => setActiveTab('effects')} className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'effects' ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'}`}>Efectos Complejos</button>
                    <button onClick={() => setActiveTab('targets')} className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'targets' ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-white'}`}>Afectados</button>
                </div>
                <button 
                    onClick={() => onUpdate(trait.id, { active: !trait.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${trait.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={trait.active !== false ? "Rasgo Activo" : "Rasgo Desactivado Globalmente"}
                >
                    <span>{trait.active !== false ? 'ACTIVO' : 'INACTIVO'}</span>
                    {trait.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* --- BASIC TAB --- */}
            {activeTab === 'basic' && (
                <div className="space-y-3 animate-fade-in-fast">
                    <div className="grid grid-cols-2 gap-3">
                        <StyledSelect 
                            label="Categoría"
                            value={trait.category} 
                            onChange={e => onUpdate(trait.id, { category: e.target.value as PsychologicalTraitCategory })} 
                            options={Object.keys(TRAIT_CATEGORY_LABELS).map(c => ({ value: c, label: TRAIT_CATEGORY_LABELS[c as PsychologicalTraitCategory] }))}
                        />
                        <div>
                            <label className="text-xs font-semibold text-gray-400 block mb-1">Intensidad: {trait.intensity || 5}/10</label>
                            <input 
                                type="range" 
                                min="1" max="10" 
                                value={trait.intensity || 5} 
                                onChange={e => onUpdate(trait.id, { intensity: parseInt(e.target.value) })} 
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className={`text-[10px] text-right mt-0.5 font-bold ${
                                (trait.intensity || 5) > 7 ? 'text-red-400' : (trait.intensity || 5) < 4 ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                                {(trait.intensity || 5) > 7 ? 'Dominante/Obsesivo' : (trait.intensity || 5) < 4 ? 'Latente/Leve' : 'Moderado/Habitual'}
                            </div>
                        </div>
                    </div>

                    <StyledTextArea 
                        label="Descripción Básica" 
                        value={trait.description} 
                        onChange={e => onUpdate(trait.id, { description: e.target.value })} 
                        rows={2} 
                        placeholder="¿En qué consiste este rasgo?" 
                    />

                    <div>
                        <label className="text-xs font-semibold text-gray-400 block mb-1">Disparadores (Triggers)</label>
                        <div className="flex space-x-2 mb-2">
                            <input 
                                className="flex-grow p-1.5 text-xs bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-cyan-500 outline-none"
                                value={triggerInput}
                                onChange={e => setTriggerInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTrigger()}
                                placeholder="ej. Oscuridad, Mentiras, Hambre"
                            />
                            <button onClick={handleAddTrigger} className="px-2 bg-gray-700 hover:bg-gray-600 rounded"><PlusIcon className="w-3 h-3"/></button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {(trait.triggers || []).map((t, i) => (
                                <span key={i} className="text-[10px] bg-gray-800 border border-gray-600 px-2 py-0.5 rounded-full flex items-center group hover:border-red-500/50 transition-colors">
                                    {t}
                                    <button onClick={() => handleRemoveTrigger(t)} className="ml-1 text-gray-500 group-hover:text-red-400"><XIcon className="w-2 h-2"/></button>
                                </span>
                            ))}
                            {(trait.triggers || []).length === 0 && <span className="text-[10px] text-gray-600 italic">Sin disparadores definidos.</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* --- EFFECTS TAB (COMPLEX DETAILS) --- */}
            {activeTab === 'effects' && (
                <div className="space-y-3 animate-fade-in-fast">
                    <p className="text-[10px] text-gray-400 mb-2 bg-gray-800 p-2 rounded">
                        Define múltiples facetas, evoluciones o impactos específicos. Útil para estados complejos como "Parálisis Estética" o "Maldiciones Progresivas".
                    </p>
                    
                    <div className="space-y-3">
                        {(trait.details || []).map((detail, index) => (
                            <div key={detail.id} className="bg-gray-800/50 p-2 rounded border border-gray-700 group">
                                <div className="flex justify-between items-center mb-1">
                                    <input 
                                        type="text" 
                                        value={detail.title}
                                        onChange={e => handleUpdateDetail(detail.id, 'title', e.target.value)}
                                        placeholder="Título (ej. Fase 1, Efecto Social)"
                                        className="bg-transparent font-bold text-sm text-cyan-300 placeholder-gray-600 focus:outline-none w-full"
                                    />
                                    <button onClick={() => handleDeleteDetail(detail.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                                <textarea 
                                    value={detail.content}
                                    onChange={e => handleUpdateDetail(detail.id, 'content', e.target.value)}
                                    placeholder="Descripción detallada del efecto..."
                                    className="w-full bg-gray-900/50 text-xs text-gray-300 p-2 rounded border border-gray-700 focus:border-cyan-500 outline-none resize-y min-h-[60px]"
                                />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleAddDetail}
                        className="w-full py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-dashed border-gray-500 text-gray-300 flex items-center justify-center space-x-1"
                    >
                        <PlusIcon /> <span>Añadir Bloque de Detalle/Efecto</span>
                    </button>

                    {/* Legacy Fields Fallback */}
                    {(trait.impact || trait.evolution) && (
                        <div className="mt-4 pt-2 border-t border-gray-700/50">
                            <h4 className="text-xs font-bold text-gray-500 mb-2">Campos Simples (Legacy)</h4>
                            <StyledTextArea 
                                label="Impacto en Conducta" 
                                value={trait.impact || ''} 
                                onChange={e => onUpdate(trait.id, { impact: e.target.value })} 
                                rows={1} 
                            />
                            <StyledTextArea 
                                label="Evolución" 
                                value={trait.evolution || ''} 
                                onChange={e => onUpdate(trait.id, { evolution: e.target.value })} 
                                rows={1} 
                            />
                        </div>
                    )}
                </div>
            )}

            {/* --- TARGETS TAB (CHARACTER ASSIGNMENT) --- */}
            {activeTab === 'targets' && (
                <div className="animate-fade-in-fast">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-400 flex items-center"><UsersIcon className="w-3 h-3 mr-1"/> Afectados</h3>
                        <span className="text-[10px] text-gray-500">{allCharacters.filter(c => c.traitIds?.includes(trait.id)).length} Personajes</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto bg-gray-900/30 rounded border border-gray-700 p-2 grid grid-cols-1 gap-1">
                        {allCharacters.map(char => {
                            const isAffected = char.traitIds?.includes(trait.id);
                            return (
                                <div 
                                    key={char.id} 
                                    onClick={() => toggleCharacterTrait(char.id, char.traitIds)}
                                    className={`flex items-center p-2 rounded cursor-pointer transition-colors border ${isAffected ? 'bg-cyan-900/20 border-cyan-600/50' : 'bg-transparent border-transparent hover:bg-gray-800'}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${isAffected ? 'bg-cyan-600 border-cyan-500' : 'border-gray-600'}`}>
                                        {isAffected && <PlusIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`text-sm ${isAffected ? 'text-cyan-100 font-medium' : 'text-gray-400'}`}>{char.name}</span>
                                </div>
                            );
                        })}
                        {allCharacters.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No hay personajes creados.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};
