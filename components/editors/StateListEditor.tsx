
import React, { useState } from 'react';
import { CharacterState, CharacterStateType } from '../../types';
import { StyledInput, StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, CheckIcon, XIcon } from '../icons';
import { uuid } from '../../utils/uuid';

interface StateListEditorProps {
    states: CharacterState[] | undefined;
    onUpdate: (newStates: CharacterState[]) => void;
}

export const StateListEditor: React.FC<StateListEditorProps> = ({ states = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const defaultForm: Omit<CharacterState, 'id'> = { 
        name: '', type: 'Physical', description: '', active: true, intensity: 1, duration: '', gameplay_effect: '' 
    };
    const [form, setForm] = useState(defaultForm);

    const handleSubmit = () => {
        if (!form.name.trim()) return;

        if (isAdding) {
            onUpdate([...states, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(states.map(s => s.id === editingId ? { ...s, ...form } : s));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm(defaultForm);
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (state: CharacterState) => {
        setForm({ ...state });
        setEditingId(state.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(states.filter(s => s.id !== id));
    };

    const handleToggleActive = (id: string, currentStatus: boolean) => {
        onUpdate(states.map(s => s.id === id ? { ...s, active: !currentStatus } : s));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === states.length - 1)) return;
        const newStates = [...states];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newStates[index], newStates[targetIndex]] = [newStates[targetIndex], newStates[index]];
        onUpdate(newStates);
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1">
                Estados y Condiciones
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput label="Nombre" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Envenenado" autoFocus />
                        <StyledSelect label="Tipo" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value as CharacterStateType}))} options={[
                            {value:'Physical',label:'Físico'},{value:'Emotional',label:'Emocional'},
                            {value:'Magical',label:'Mágico'},{value:'Status',label:'Estatus'},{value:'Other',label:'Otro'}
                        ]} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput label="Duración" value={form.duration || ''} onChange={e => setForm(v => ({...v, duration: e.target.value}))} placeholder="ej. 3 Turnos" />
                        <StyledInput label="Intensidad (1-10)" type="number" value={form.intensity || 1} onChange={e => setForm(v => ({...v, intensity: parseInt(e.target.value)}))} />
                    </div>
                    <StyledInput label="Efecto de Juego" value={form.gameplay_effect || ''} onChange={e => setForm(v => ({...v, gameplay_effect: e.target.value}))} placeholder="ej. -2 a la Fuerza" />
                    <StyledTextArea label="Descripción Visual/Narrativa" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
                    
                    {/* Active Toggle in Form */}
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded mt-1 border border-gray-700">
                        <label className="text-xs font-semibold text-gray-300">Estado Actual:</label>
                        <button 
                            onClick={() => setForm(v => ({...v, active: !v.active}))}
                            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-bold transition-colors ${form.active ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-gray-600 text-gray-400 hover:bg-gray-500'}`}
                        >
                            {form.active ? <><CheckIcon className="w-3 h-3"/> <span>ACTIVO</span></> : <><XIcon className="w-3 h-3"/> <span>INACTIVO</span></>}
                        </button>
                    </div>

                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-2">
                {states.map((state, index) => {
                    if (state.id === editingId) return null;
                    // Safety check: active might be undefined in old data
                    const isActive = state.active !== false; 
                    return (
                        <div key={state.id} className={`p-2 rounded-md border ${isActive ? 'bg-gray-800/80 border-gray-600' : 'bg-gray-900 border-gray-800 opacity-50 grayscale'} group flex items-start space-x-2 transition-all`}>
                             <div className="flex flex-col space-y-1 mt-1">
                                <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                             </div>
                             <div className="w-full">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {/* LIST VIEW TOGGLE */}
                                        <button 
                                            onClick={() => handleToggleActive(state.id, isActive)}
                                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${isActive ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-400'}`}
                                            title={isActive ? "Marcar como Inactivo" : "Marcar como Activo"}
                                        >
                                            {isActive ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                                        </button>
                                        <span className={`font-semibold text-sm ${isActive ? 'text-gray-200' : 'text-gray-500 line-through'}`}>{state.name}</span>
                                        <span className="text-[9px] bg-gray-700 px-1.5 rounded text-gray-300">{state.type}</span>
                                    </div>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(state)} className="p-1 rounded-full hover:bg-gray-600"><EditIcon /></button>
                                        <button onClick={() => handleDelete(state.id)} className="p-1 rounded-full hover:bg-red-500"><TrashIcon /></button>
                                    </div>
                                 </div>
                                 <div className="flex items-center space-x-3 mt-1 text-[10px] text-gray-400 font-mono pl-7">
                                    {state.intensity && <span>NIVEL {state.intensity}</span>}
                                    {state.duration && <span>⏱ {state.duration}</span>}
                                    {state.gameplay_effect && <span className="text-orange-300">⚡ {state.gameplay_effect}</span>}
                                 </div>
                                 <p className="text-xs text-gray-500 mt-0.5 pl-7">{state.description}</p>
                             </div>
                        </div>
                    );
                })}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Estado</span>
                </button>
            )}
        </div>
    );
};
