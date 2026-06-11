
import React, { useState } from 'react';
import { WorldRule } from '../../types';
import { PlusIcon, XIcon, TrashIcon, ScaleIcon, ArrowUpIcon, EditIcon } from '../icons';
import { StyledTextArea, StyledInput } from '../ui/Inputs';
import { uuid } from '../../utils/uuid';

interface RuleListEditorProps {
    rules: WorldRule[] | undefined;
    onUpdate: (newRules: WorldRule[]) => void;
    label?: string;
    placeholderTitle?: string;
    placeholderDesc?: string;
}

export const RuleListEditor: React.FC<RuleListEditorProps> = ({ 
    rules = [], 
    onUpdate, 
    label = "Reglas y Leyes",
    placeholderTitle = "Concepto / Ley",
    placeholderDesc = "Descripción detallada de la regla o coste..."
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<WorldRule, 'id'>>({ text: '', description: '', active: true });

    const resetForm = () => {
        setForm({ text: '', description: '', active: true });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = () => {
        if (!form.text.trim()) return;

        if (isAdding) {
            const newRule: WorldRule = { id: uuid(), ...form };
            onUpdate([...rules, newRule]);
        } else if (editingId) {
            onUpdate(rules.map(r => r.id === editingId ? { ...r, ...form } : r));
        }
        resetForm();
    };

    const startEdit = (rule: WorldRule) => {
        const { id, ...rest } = rule;
        setForm(rest);
        setEditingId(rule.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(rules.filter(r => r.id !== id));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === rules.length - 1)) return;
        const newRules = [...rules];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];
        onUpdate(newRules);
    };

    return (
        <div className="space-y-3 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                <ScaleIcon className="w-3 h-3 mr-1"/> {label}
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <StyledInput 
                        label="Título / Concepto" 
                        value={form.text} 
                        onChange={e => setForm(v => ({...v, text: e.target.value}))} 
                        placeholder={placeholderTitle} 
                        autoFocus 
                    />
                    <StyledTextArea 
                        label="Detalles" 
                        value={form.description} 
                        onChange={e => setForm(v => ({...v, description: e.target.value}))} 
                        rows={2} 
                        placeholder={placeholderDesc}
                    />
                    
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {rules.map((rule, index) => {
                    if (rule.id === editingId) return null;
                    return (
                        <div key={rule.id} className="bg-gray-800/50 p-2 rounded border border-gray-700 flex items-start space-x-2 group">
                            <div className="flex flex-col space-y-1 mt-1">
                                <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-sm text-gray-200">{rule.text}</span>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(rule)} className="p-1 hover:bg-gray-600 rounded"><EditIcon className="w-3 h-3"/></button>
                                        <button onClick={() => handleDelete(rule.id)} className="p-1 hover:bg-red-500 rounded"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                </div>
                                {rule.description && <p className="text-xs text-gray-400 mt-1 border-t border-gray-700/50 pt-1">{rule.description}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Regla</span>
                </button>
            )}
        </div>
    );
};
