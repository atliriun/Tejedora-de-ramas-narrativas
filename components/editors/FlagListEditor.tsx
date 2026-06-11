
import React, { useState } from 'react';
import { StoryFlag } from '../../types';
import { StyledInput, StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, ToggleLeftIcon, ToggleRightIcon, CheckIcon, XIcon, KeyIcon } from '../icons';
import { DEFAULT_STORY_FLAG } from '../../constants';
import { uuid } from '../../utils/uuid';

interface FlagListEditorProps {
    flags: StoryFlag[] | undefined;
    onUpdate: (newFlags: StoryFlag[]) => void;
}

export const FlagListEditor: React.FC<FlagListEditorProps> = ({ flags = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<StoryFlag, 'id'>>(DEFAULT_STORY_FLAG as Omit<StoryFlag, 'id'>);

    const handleSubmit = () => {
        if (!form.name.trim()) return;

        if (isAdding) {
            onUpdate([...flags, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(flags.map(f => f.id === editingId ? { ...f, ...form } : f));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm(DEFAULT_STORY_FLAG as Omit<StoryFlag, 'id'>);
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (flag: StoryFlag) => {
        setForm({ ...flag });
        setEditingId(flag.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(flags.filter(f => f.id !== id));
    };

    const handleToggleState = (id: string, currentState: boolean) => {
        onUpdate(flags.map(f => f.id === id ? { ...f, state: !currentState } : f));
    };

    const handleToggleActive = (id: string, currentActive: boolean) => {
        onUpdate(flags.map(f => f.id === id ? { ...f, active: !currentActive } : f));
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                <KeyIcon className="w-3 h-3 mr-1"/> Interruptores Globales
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput 
                            label="Identificador (Sin espacios)" 
                            value={form.name} 
                            onChange={e => setForm(v => ({...v, name: e.target.value.replace(/\s+/g, '_')}))} 
                            placeholder="ej. GuerraIniciada" 
                            autoFocus 
                        />
                        <StyledSelect 
                            label="Categoría" 
                            value={form.category || 'Global'} 
                            onChange={e => setForm(v => ({...v, category: e.target.value}))} 
                            options={[
                                {value:'Global',label:'Global'},{value:'Quest',label:'Misión'},
                                {value:'Character',label:'Personaje'},{value:'Relationship',label:'Relación'},
                                {value:'Location',label:'Ubicación'}
                            ]} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded mt-1 border border-gray-700">
                            <label className="text-xs font-semibold text-gray-300 w-16">Valor:</label>
                            <button 
                                onClick={() => setForm(v => ({...v, state: !v.state}))}
                                className={`flex-grow flex items-center justify-center space-x-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${form.state ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-gray-600 text-gray-400 hover:bg-gray-500'}`}
                            >
                                {form.state ? <><CheckIcon className="w-3 h-3"/> <span>TRUE</span></> : <><XIcon className="w-3 h-3"/> <span>FALSE</span></>}
                            </button>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded mt-1 border border-gray-700">
                            <label className="text-xs font-semibold text-gray-300 w-16">Sistema:</label>
                            <button 
                                onClick={() => setForm(v => ({...v, active: !v.active}))}
                                className={`flex-grow flex items-center justify-center space-x-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${form.active !== false ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-600 text-gray-400 hover:bg-gray-500'}`}
                            >
                                {form.active !== false ? <span>ACTIVO</span> : <span>INACTIVO</span>}
                            </button>
                        </div>
                    </div>

                    <StyledTextArea 
                        label="Descripción (Para la IA)" 
                        value={form.description || ''} 
                        onChange={e => setForm(v => ({...v, description: e.target.value}))} 
                        rows={2} 
                        placeholder="¿Qué implica este estado?" 
                    />

                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {flags.map((flag) => {
                    if (flag.id === editingId) return null;
                    const isSystemActive = flag.active !== false;
                    return (
                        <div key={flag.id} className={`p-2 rounded-md border flex items-center justify-between group transition-all ${
                            !isSystemActive ? 'bg-gray-900 opacity-60 grayscale border-gray-800' :
                            flag.state ? 'bg-green-900/20 border-green-700/50' : 'bg-gray-800/50 border-gray-700'
                        }`}>
                            <div className="flex items-center space-x-3 flex-grow min-w-0">
                                {/* State Toggle */}
                                <button 
                                    onClick={() => handleToggleState(flag.id, flag.state)}
                                    disabled={!isSystemActive}
                                    className={`transition-colors ${flag.state ? 'text-green-400 hover:text-green-300' : 'text-gray-600 hover:text-gray-400'} disabled:cursor-not-allowed`}
                                    title={flag.state ? "Estado: TRUE" : "Estado: FALSE"}
                                >
                                    {flag.state ? <ToggleRightIcon className="w-8 h-8" /> : <ToggleLeftIcon className="w-8 h-8" />}
                                </button>
                                
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-sm font-bold font-mono truncate ${flag.state ? 'text-green-100' : 'text-gray-400'}`}>{flag.name}</span>
                                        <span className="text-[9px] bg-black/30 px-1.5 rounded text-gray-500 uppercase">{flag.category}</span>
                                    </div>
                                    {flag.description && <p className="text-xs text-gray-500 truncate">{flag.description}</p>}
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-2">
                                {/* Active Toggle */}
                                <button
                                    onClick={() => handleToggleActive(flag.id, isSystemActive)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                        isSystemActive ? 'text-blue-300 border-blue-900 bg-blue-900/20 hover:bg-blue-900/40' : 'text-gray-600 border-gray-700 bg-gray-800'
                                    }`}
                                    title={isSystemActive ? "Ignorar este flag (Ahorrar Tokens)" : "Activar este flag"}
                                >
                                    {isSystemActive ? 'ON' : 'OFF'}
                                </button>

                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(flag)} className="p-1.5 hover:bg-gray-600 rounded"><EditIcon className="w-3 h-3"/></button>
                                    <button onClick={() => handleDelete(flag.id)} className="p-1.5 hover:bg-red-500/50 rounded"><TrashIcon className="w-3 h-3"/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {flags.length === 0 && !isAdding && (
                    <div className="text-center py-4 text-gray-500 text-xs italic">No hay interruptores definidos.</div>
                )}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Nuevo Interruptor</span>
                </button>
            )}
        </div>
    );
};
