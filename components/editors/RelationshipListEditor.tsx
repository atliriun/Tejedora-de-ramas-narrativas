
import React, { useState } from 'react';
import { CharacterRelationship, RelationshipType, Character } from '../../types';
import { StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, UsersIcon, ArrowUpIcon } from '../icons';
import { DEFAULT_RELATIONSHIP } from '../../constants';
import { uuid } from '../../utils/uuid';

interface RelationshipListEditorProps {
    relationships: CharacterRelationship[] | undefined;
    onUpdate: (newRels: CharacterRelationship[]) => void;
    allCharacters: Character[];
    currentCharacterId: string;
}

export const RelationshipListEditor: React.FC<RelationshipListEditorProps> = ({ relationships = [], onUpdate, allCharacters, currentCharacterId }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<CharacterRelationship, 'id'>>(DEFAULT_RELATIONSHIP);

    const handleSubmit = () => {
        if (!form.targetCharacterId) return;

        if (isAdding) {
            onUpdate([...relationships, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(relationships.map(r => r.id === editingId ? { ...r, ...form } : r));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm(DEFAULT_RELATIONSHIP);
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (rel: CharacterRelationship) => {
        setForm({ ...rel });
        setEditingId(rel.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(relationships.filter(r => r.id !== id));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === relationships.length - 1)) return;
        const newRels = [...relationships];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newRels[index], newRels[targetIndex]] = [newRels[targetIndex], newRels[index]];
        onUpdate(newRels);
    };

    const getAffinityLabel = (score: number) => {
        if (score <= 10) return "Odio Mortal";
        if (score <= 30) return "Hostil / Desconfiado";
        if (score <= 45) return "Frío / Distante";
        if (score <= 60) return "Neutral / Indiferente";
        if (score <= 75) return "Amistoso / Leal";
        if (score <= 90) return "Muy Cercano / Amor";
        return "Devoción Absoluta";
    };

    const getAffinityColor = (score: number) => {
        if (score <= 30) return "text-red-400";
        if (score <= 60) return "text-gray-300";
        return "text-green-400";
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                <UsersIcon className="w-3 h-3 mr-1"/> Vínculos y Relaciones
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <div className="grid grid-cols-2 gap-2">
                        <StyledSelect 
                            label="Personaje Objetivo" 
                            value={form.targetCharacterId} 
                            onChange={e => setForm(v => ({...v, targetCharacterId: e.target.value}))} 
                            options={[
                                { value: '', label: 'Seleccionar...' },
                                ...allCharacters.filter(c => c.id !== currentCharacterId).map(c => ({ value: c.id, label: c.name }))
                            ]}
                        />
                        <StyledSelect 
                            label="Rol / Etiqueta" 
                            value={form.type} 
                            onChange={e => setForm(v => ({...v, type: e.target.value as RelationshipType}))} 
                            options={[
                                {value:'Family',label:'Familia'},{value:'Friend',label:'Amigo'},
                                {value:'Rival',label:'Rival'},{value:'Romantic',label:'Pareja/Romance'},
                                {value:'Professional',label:'Profesional/Colega'},{value:'Enemy',label:'Enemigo'},
                                {value:'Ally',label:'Aliado'},{value:'Neutral',label:'Conocido'},{value:'Other',label:'Otro'}
                            ]} 
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-2 p-2 bg-gray-800/50 rounded border border-gray-700">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-gray-400">Afinidad Visible</label>
                            <span className={`text-xs font-bold ${getAffinityColor(form.score)}`}>
                                {form.score}% - {getAffinityLabel(form.score)}
                            </span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={form.score} 
                            onChange={e => setForm(v => ({...v, score: parseInt(e.target.value)}))} 
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500 uppercase font-bold">
                            <span>Enemigos</span>
                            <span>Neutrales</span>
                            <span>Aliados</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <StyledTextArea 
                            label="Interacción Pública (Visible)" 
                            value={form.description} 
                            onChange={e => setForm(v => ({...v, description: e.target.value}))} 
                            rows={2} 
                            placeholder="¿Cómo se comportan frente a otros?" 
                        />
                        <StyledTextArea 
                            label="Pensamientos Privados / Notas Ocultas (Solo AI)" 
                            value={form.notes || ''} 
                            onChange={e => setForm(v => ({...v, notes: e.target.value}))} 
                            rows={2} 
                            placeholder="¿Qué siente realmente? (Celos, sospecha, amor secreto...)" 
                            className="border-l-2 border-l-yellow-500"
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {relationships.map((rel, index) => {
                    if (rel.id === editingId) return null;
                    const target = allCharacters.find(c => c.id === rel.targetCharacterId);
                    const targetName = target ? target.name : 'Desconocido';
                    
                    // Helper to translate type for display
                    const typeLabels: Record<string, string> = {
                        'Family': 'Familia', 'Friend': 'Amigo', 'Rival': 'Rival',
                        'Romantic': 'Romántico', 'Professional': 'Profesional',
                        'Enemy': 'Enemigo', 'Ally': 'Aliado', 'Neutral': 'Neutral', 'Other': 'Otro'
                    };

                    return (
                        <div key={rel.id} className="bg-gray-800/50 p-2 rounded border border-gray-700 flex items-start space-x-2 group">
                            <div className="flex flex-col space-y-1 mt-1">
                                <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-sm text-cyan-300">{targetName}</span>
                                        <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 border border-gray-600">{typeLabels[rel.type] || rel.type}</span>
                                    </div>
                                    <span className={`text-xs font-mono font-bold ${getAffinityColor(rel.score)}`}>{rel.score}%</span>
                                </div>
                                <div className="text-xs text-gray-300 mb-1">
                                    <span className="opacity-70">Público:</span> {rel.description}
                                </div>
                                {rel.notes && (
                                    <div className="text-xs text-yellow-200/80 italic bg-yellow-900/10 px-1.5 py-0.5 rounded border-l-2 border-yellow-600">
                                        <span className="font-bold not-italic opacity-70">Privado:</span> {rel.notes}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button onClick={() => startEdit(rel)} className="p-1 hover:bg-gray-600 rounded"><EditIcon/></button>
                                <button onClick={() => handleDelete(rel.id)} className="p-1 hover:bg-red-500 rounded"><TrashIcon/></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Relación</span>
                </button>
            )}
        </div>
    );
};
