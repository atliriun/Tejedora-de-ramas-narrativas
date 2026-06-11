
import React, { useState } from 'react';
import { NationFaction } from '../../types';
import { StyledInput, StyledTextArea, StyledSelect } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, CastleIcon, ArrowUpIcon, ShieldIcon } from '../icons';
import { uuid } from '../../utils/uuid';

interface FactionListEditorProps {
    factions: NationFaction[] | undefined;
    onUpdate: (newFactions: NationFaction[]) => void;
}

export const FactionListEditor: React.FC<FactionListEditorProps> = ({ factions = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<NationFaction, 'id'>>({ 
        name: '', 
        type: 'Noble House', 
        leader: '', 
        description: '', 
        motto: '', 
        symbol: '', 
        influence: 5 
    });

    const handleSubmit = () => {
        if (!form.name.trim()) return;

        if (isAdding) {
            onUpdate([...factions, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(factions.map(f => f.id === editingId ? { ...f, ...form } : f));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm({ name: '', type: 'Noble House', leader: '', description: '', motto: '', symbol: '', influence: 5 });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (faction: NationFaction) => {
        setForm({ 
            name: faction.name, 
            type: faction.type || 'Noble House', 
            leader: faction.leader || '',
            description: faction.description, 
            motto: faction.motto || '', 
            symbol: faction.symbol || '', 
            influence: faction.influence || 5 
        });
        setEditingId(faction.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(factions.filter(f => f.id !== id));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === factions.length - 1)) return;
        const newFactions = [...factions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFactions[index], newFactions[targetIndex]] = [newFactions[targetIndex], newFactions[index]];
        onUpdate(newFactions);
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                <ShieldIcon className="w-3 h-3 mr-1"/> Facciones y Organizaciones
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput 
                            label="Nombre" 
                            value={form.name} 
                            onChange={e => setForm(v => ({...v, name: e.target.value}))} 
                            placeholder="ej. Gremio de Ladrones" 
                            autoFocus 
                        />
                        <StyledSelect 
                            label="Tipo de Organización" 
                            value={form.type} 
                            onChange={e => setForm(v => ({...v, type: e.target.value}))} 
                            options={[
                                {value:'Noble House',label:'Casa Noble'},
                                {value:'Guild',label:'Gremio / Sindicato'},
                                {value:'Order',label:'Orden (Militar/Religiosa)'},
                                {value:'Cult',label:'Culto / Secta'},
                                {value:'Criminal',label:'Criminal / Mafia'},
                                {value:'Academic',label:'Académica / Escuela'},
                                {value:'Political',label:'Partido Político'}
                            ]} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput label="Líder / Cabeza" value={form.leader || ''} onChange={e => setForm(v => ({...v, leader: e.target.value}))} placeholder="ej. Gran Maestre..." />
                        <StyledInput 
                            label="Influencia (1-10)" 
                            type="number" 
                            value={form.influence || 5} 
                            onChange={e => setForm(v => ({...v, influence: parseInt(e.target.value)}))} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput label="Lema / Credo" value={form.motto || ''} onChange={e => setForm(v => ({...v, motto: e.target.value}))} placeholder="Frase célebre..." />
                        <StyledInput label="Símbolo" value={form.symbol || ''} onChange={e => setForm(v => ({...v, symbol: e.target.value}))} placeholder="Iconografía..." />
                    </div>

                    <StyledTextArea label="Descripción / Objetivos" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />

                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {factions.map((faction, index) => {
                    if (faction.id === editingId) return null;
                    return (
                        <div key={faction.id} className="bg-gray-800/50 p-2 rounded border border-gray-700 flex items-start space-x-2 group">
                            <div className="flex flex-col space-y-1 mt-1">
                                <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-sm text-gray-200">{faction.name}</span>
                                        <span className="text-[9px] bg-purple-900/30 text-purple-300 px-1.5 rounded border border-purple-800">{faction.type}</span>
                                    </div>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(faction)} className="p-1 hover:bg-gray-600 rounded"><EditIcon className="w-3 h-3"/></button>
                                        <button onClick={() => handleDelete(faction.id)} className="p-1 hover:bg-red-500 rounded"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 mb-1 flex gap-2">
                                    {faction.leader && <span className="text-cyan-400">Líder: {faction.leader}</span>}
                                    <span className="text-purple-300">Inf: {faction.influence || 5}</span>
                                </div>
                                {(faction.motto || faction.symbol) && (
                                    <div className="text-[10px] text-gray-500 mb-1 italic">
                                        {faction.symbol && <span>[{faction.symbol}] </span>}
                                        {faction.motto && <span>"{faction.motto}"</span>}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500">{faction.description}</p>
                            </div>
                        </div>
                    );
                })}
                {factions.length === 0 && !isAdding && (
                    <div className="text-center py-2 text-gray-500 text-xs italic">No hay facciones definidas.</div>
                )}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Facción</span>
                </button>
            )}
        </div>
    );
};
