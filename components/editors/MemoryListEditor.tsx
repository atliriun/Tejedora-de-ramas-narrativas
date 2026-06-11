
import React, { useState } from 'react';
import { CharacterMemory } from '../../types';
import { StyledInput, StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, HistoryIcon, ArrowUpIcon } from '../icons';
import { DEFAULT_MEMORY } from '../../constants';
import { uuid } from '../../utils/uuid';

interface MemoryListEditorProps {
    memories: CharacterMemory[] | undefined;
    onUpdate: (newMemories: CharacterMemory[]) => void;
}

export const MemoryListEditor: React.FC<MemoryListEditorProps> = ({ memories = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<CharacterMemory, 'id'>>(DEFAULT_MEMORY);

    const handleSubmit = () => {
        if (!form.text.trim()) return;

        if (isAdding) {
            onUpdate([...memories, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(memories.map(m => m.id === editingId ? { ...m, ...form } : m));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm(DEFAULT_MEMORY);
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (mem: CharacterMemory) => {
        setForm({ ...mem });
        setEditingId(mem.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(memories.filter(m => m.id !== id));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === memories.length - 1)) return;
        const newMemories = [...memories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newMemories[index], newMemories[targetIndex]] = [newMemories[targetIndex], newMemories[index]];
        onUpdate(newMemories);
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
             <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                <HistoryIcon className="w-3 h-3 mr-1"/> Recuerdos Clave
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <StyledTextArea label="Contenido del Recuerdo" value={form.text} onChange={e => setForm(v => ({...v, text: e.target.value}))} rows={3} autoFocus placeholder="Describe el evento..." />
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput label="Marco Temporal" value={form.timeframe || ''} onChange={e => setForm(v => ({...v, timeframe: e.target.value}))} placeholder="Infancia, La Guerra..." />
                        <StyledSelect label="Tipo" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value as any}))} options={[
                            {value:'event',label:'Evento'},{value:'feeling',label:'Sentimiento'},
                            {value:'behavior',label:'Comportamiento'},{value:'entry',label:'Diario'}
                        ]} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-end">
                        <StyledInput label="Intensidad (1-10)" type="number" value={form.intensity || 5} onChange={e => setForm(v => ({...v, intensity: parseInt(e.target.value)}))} />
                        <div className="flex items-center mb-2 space-x-2 bg-gray-800 p-2 rounded">
                            <input type="checkbox" checked={form.isCore} onChange={e => setForm(v => ({...v, isCore: e.target.checked}))} className="w-4 h-4 text-cyan-600 rounded cursor-pointer" id="core-mem-check" />
                            <label htmlFor="core-mem-check" className="text-xs text-yellow-400 font-bold cursor-pointer">¿Recuerdo Núcleo?</label>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {memories.map((mem, index) => {
                    if (mem.id === editingId) return null;
                    
                    const typeLabels: Record<string, string> = { 'event': 'Evento', 'feeling': 'Sentir', 'behavior': 'Conducta', 'entry': 'Diario' };

                    return (
                        <div key={mem.id} className={`p-2 rounded border border-gray-700 flex items-start space-x-2 ${mem.isCore ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-gray-800/50'} group`}>
                            <div className="flex flex-col space-y-1 mt-1">
                                <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className={`text-[9px] uppercase px-1 rounded ${mem.isCore ? 'bg-indigo-500 text-white font-bold' : 'bg-gray-600 text-gray-300'}`}>
                                            {typeLabels[mem.type] || mem.type}
                                        </span>
                                        {mem.timeframe && <span className="text-[10px] text-gray-400">({mem.timeframe})</span>}
                                        {mem.isCore && <span className="text-[10px] text-yellow-400">★ Núcleo</span>}
                                    </div>
                                    <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button onClick={() => startEdit(mem)} className="p-1 hover:bg-gray-600 rounded"><EditIcon/></button>
                                        <button onClick={() => handleDelete(mem.id)} className="p-1 hover:bg-red-500 rounded"><TrashIcon/></button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-200">{mem.text}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Recuerdo</span>
                </button>
            )}
        </div>
    );
};
