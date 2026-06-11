
import React, { useState } from 'react';
import { CharacterAbility, AbilityType } from '../../types';
import { StyledInput, StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, SparkleIcon, XIcon, ArrowUpIcon } from '../icons';
import { uuid } from '../../utils/uuid';

interface AbilityListEditorProps {
    abilities: CharacterAbility[] | undefined;
    onUpdate: (newAbilities: CharacterAbility[]) => void;
    label?: string;
}

export const AbilityListEditor: React.FC<AbilityListEditorProps> = ({ abilities = [], onUpdate, label = "Habilidades y Poderes Estructurados" }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<CharacterAbility, 'id'>>({ 
        name: '', type: 'Active', description: '', cost: '', level: 1, cooldown: '', tags: [] 
    });
    const [tagInput, setTagInput] = useState('');

    const resetForm = () => {
        setForm({ name: '', type: 'Active', description: '', cost: '', level: 1, cooldown: '', tags: [] });
        setTagInput('');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
            setForm(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setForm(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = () => {
        if (!form.name.trim()) return;

        if (isAdding) {
            const newAbility: CharacterAbility = { id: uuid(), ...form };
            onUpdate([...abilities, newAbility]);
        } else if (editingId) {
            onUpdate(abilities.map(a => a.id === editingId ? { ...a, ...form } : a));
        }
        resetForm();
    };

    const startEdit = (ability: CharacterAbility) => {
        setForm({ ...ability });
        setEditingId(ability.id);
        setIsAdding(false);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === abilities.length - 1)) return;
        const newAbilities = [...abilities];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newAbilities[index], newAbilities[targetIndex]] = [newAbilities[targetIndex], newAbilities[index]];
        onUpdate(newAbilities);
    };

    // Helper for Spanish Labels
    const typeLabels: Record<string, string> = {
        'Active': 'Activa', 'Passive': 'Pasiva', 'Ultimate': 'Definitiva', 
        'Ritual': 'Ritual', 'Reaction': 'Reacción', 'Trait': 'Rasgo Innato'
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                    <SparkleIcon className="w-3 h-3 mr-1"/> {label}
                </h3>

                {(isAdding || editingId) && (
                    <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2 animate-fade-in-fast">
                        <div className="grid grid-cols-2 gap-2">
                            <StyledInput label="Nombre" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Bola de Fuego" autoFocus />
                            <StyledSelect label="Tipo" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value as AbilityType}))} options={[
                                {value:'Active',label:'Activa'}, {value:'Passive',label:'Pasiva'}, {value:'Ultimate',label:'Definitiva'}, 
                                {value:'Ritual',label:'Ritual'}, {value:'Reaction',label:'Reacción'}, {value:'Trait',label:'Rasgo Innato'}
                            ]} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <StyledInput label="Coste" value={form.cost || ''} onChange={e => setForm(v => ({...v, cost: e.target.value}))} placeholder="10 Maná" />
                            <StyledInput label="Recarga (CD)" value={form.cooldown || ''} onChange={e => setForm(v => ({...v, cooldown: e.target.value}))} placeholder="1 Turno" />
                            <StyledInput label="Nivel/Rango" type="number" value={form.level || 1} onChange={e => setForm(v => ({...v, level: parseInt(e.target.value)}))} />
                        </div>
                        <StyledTextArea label="Efecto / Descripción" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
                        
                        {/* Tag Inputs */}
                        <div>
                             <label className="text-xs font-semibold text-gray-400 block mb-1">Etiquetas (Tags Contextuales)</label>
                             <div className="flex space-x-2 mb-2">
                                 <input 
                                    className="flex-grow p-1.5 text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-cyan-500 outline-none"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                    placeholder="ej. Fuego, Rango, Peligroso"
                                 />
                                 <button onClick={handleAddTag} className="px-2 bg-gray-700 hover:bg-gray-600 rounded"><PlusIcon/></button>
                             </div>
                             <div className="flex flex-wrap gap-1">
                                 {form.tags?.map(tag => (
                                     <span key={tag} className="text-[10px] bg-gray-800 border border-gray-600 px-1.5 py-0.5 rounded-full flex items-center">
                                         {tag}
                                         <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400"><XIcon className="w-2 h-2"/></button>
                                     </span>
                                 ))}
                             </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-2">
                            <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                            <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {abilities.map((ability, index) => {
                        if (ability.id === editingId) return null;
                        return (
                            <div key={ability.id} className="bg-gray-800/50 p-2 rounded border border-gray-700 group hover:border-gray-600 transition-colors flex items-start space-x-2">
                                <div className="flex flex-col space-y-1 mt-1">
                                    <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                    <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                                </div>
                                <div className="w-full">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-cyan-300 text-sm">{ability.name}</span>
                                                <span className={`text-[9px] uppercase px-1 rounded ${ability.type === 'Passive' ? 'bg-gray-600' : ability.type === 'Ultimate' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                                                    {typeLabels[ability.type] || ability.type}
                                                </span>
                                                {ability.level && ability.level > 1 && <span className="text-[9px] text-yellow-500">Nv.{ability.level}</span>}
                                            </div>
                                            <div className="flex space-x-2 text-[10px] text-gray-400 mt-0.5">
                                                {ability.cost && <span>Coste: {ability.cost}</span>}
                                                {ability.cooldown && <span>CD: {ability.cooldown}</span>}
                                            </div>
                                        </div>
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(ability)} className="p-1 hover:bg-gray-600 rounded"><EditIcon/></button>
                                            <button onClick={() => onUpdate(abilities.filter(a => a.id !== ability.id))} className="p-1 hover:bg-red-500 rounded"><TrashIcon/></button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-300 mt-1 border-t border-gray-700/50 pt-1">{ability.description}</p>
                                    {ability.tags && ability.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {ability.tags.map(t => (
                                                <span key={t} className="text-[9px] text-gray-500 bg-black/20 px-1 rounded">{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {!isAdding && !editingId && (
                    <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                        <PlusIcon /> <span>Añadir Habilidad</span>
                    </button>
                )}
            </div>
        </div>
    );
};
