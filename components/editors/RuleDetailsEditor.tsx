
import React, { useState } from 'react';
import { WorldRule, WorldRuleCategory, RuleFlexibility } from '../../types';
import { StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, XIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';

interface RuleDetailsEditorProps {
    rule: WorldRule;
    onUpdate: (id: string, u: Partial<WorldRule>) => void;
}

export const RuleDetailsEditor: React.FC<RuleDetailsEditorProps> = ({ rule, onUpdate }) => {
    const [exceptionInput, setExceptionInput] = useState('');

    const handleAddException = () => {
        if (exceptionInput.trim()) {
            const newExceptions = [...(rule.exceptions || []), exceptionInput.trim()];
            onUpdate(rule.id, { exceptions: newExceptions });
            setExceptionInput('');
        }
    };

    const handleRemoveException = (ex: string) => {
        const newExceptions = (rule.exceptions || []).filter(e => e !== ex);
        onUpdate(rule.id, { exceptions: newExceptions });
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            {/* Global Active Toggle */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Configuración de Regla</span>
                <button 
                    onClick={() => onUpdate(rule.id, { active: !rule.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${rule.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={rule.active !== false ? "Regla Activa (Se envía a IA)" : "Regla Inactiva (Ignorada por IA)"}
                >
                    <span>{rule.active !== false ? 'ACTIVA' : 'INACTIVA'}</span>
                    {rule.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <StyledSelect 
                    label="Categoría"
                    value={rule.category || 'Other'} 
                    onChange={e => onUpdate(rule.id, { category: e.target.value as WorldRuleCategory })} 
                    options={[
                        { value: 'Physics', label: 'Física' },
                        { value: 'Magic', label: 'Magia' },
                        { value: 'Social', label: 'Social/Ley' },
                        { value: 'Economy', label: 'Economía' },
                        { value: 'Divine', label: 'Divino' },
                        { value: 'Meta', label: 'Metafísico' },
                        { value: 'Other', label: 'Otro' },
                    ]}
                />
                <StyledSelect 
                    label="Flexibilidad / Rigidez"
                    value={rule.flexibility || 'Absolute'} 
                    onChange={e => onUpdate(rule.id, { flexibility: e.target.value as RuleFlexibility })} 
                    options={[
                        { value: 'Absolute', label: '🔴 Absoluta (Inviolable)' },
                        { value: 'High', label: '🟠 Alta (Difícil)' },
                        { value: 'Moderate', label: '🟡 Moderada' },
                        { value: 'Low', label: '🟢 Baja (Flexible)' },
                        { value: 'Guideline', label: '🔵 Guía (Sugerencia)' },
                    ]}
                />
            </div>

            <StyledTextArea 
                label="Descripción Detallada" 
                value={rule.description} 
                onChange={e => onUpdate(rule.id, { description: e.target.value })} 
                rows={3} 
                placeholder="Explica cómo funciona esta regla..." 
            />

            <StyledTextArea 
                label="Consecuencias de Romperla" 
                value={rule.consequences || ''} 
                onChange={e => onUpdate(rule.id, { consequences: e.target.value })} 
                rows={2} 
                placeholder="¿Qué sucede si se intenta violar esta regla? (Paradoja, castigo, fallo...)" 
            />

            <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Excepciones Conocidas</label>
                <div className="flex space-x-2 mb-2">
                    <input 
                        className="flex-grow p-1.5 text-xs bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-cyan-500 outline-none"
                        value={exceptionInput}
                        onChange={e => setExceptionInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddException()}
                        placeholder="ej. Objetos de obsidiana, Linaje Real"
                    />
                    <button onClick={handleAddException} className="px-2 bg-gray-700 hover:bg-gray-600 rounded"><PlusIcon className="w-3 h-3"/></button>
                </div>
                <div className="flex flex-wrap gap-1">
                    {(rule.exceptions || []).map((ex, i) => (
                        <span key={i} className="text-[10px] bg-gray-800 border border-gray-600 px-2 py-0.5 rounded-full flex items-center group hover:border-yellow-500/50 transition-colors">
                            {ex}
                            <button onClick={() => handleRemoveException(ex)} className="ml-1 text-gray-500 group-hover:text-yellow-400"><XIcon className="w-2 h-2"/></button>
                        </span>
                    ))}
                    {(rule.exceptions || []).length === 0 && <span className="text-[10px] text-gray-600 italic">Sin excepciones registradas.</span>}
                </div>
            </div>
        </div>
    );
};
