
import React from 'react';
import { Secret, Character } from '../../types';
import { StyledSelect, StyledTextArea, StyledInput, StyledRange } from '../ui/Inputs';
import { KeyIcon, UsersIcon, EyeIcon, EyeOffIcon, AlertIcon, CheckIcon, XIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';

interface SecretDetailsEditorProps {
    secret: Secret;
    onUpdate: (id: string, u: Partial<Secret>) => void;
    allCharacters: Character[];
}

export const SecretDetailsEditor: React.FC<SecretDetailsEditorProps> = ({ secret, onUpdate, allCharacters }) => {
    
    // --- KNOWLEDGE LOGIC ---
    const toggleKnowledge = (charId: string) => {
        const currentList = secret.knownByCharacterIds || [];
        if (currentList.includes(charId)) {
            onUpdate(secret.id, { knownByCharacterIds: currentList.filter(id => id !== charId) });
        } else {
            onUpdate(secret.id, { knownByCharacterIds: [...currentList, charId] });
        }
    };

    const selectAll = () => {
        onUpdate(secret.id, { knownByCharacterIds: allCharacters.map(c => c.id) });
    };

    const selectNone = () => {
        onUpdate(secret.id, { knownByCharacterIds: [] });
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            {/* Global Active Toggle */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Configuración de Trama</span>
                <button 
                    onClick={() => onUpdate(secret.id, { active: !secret.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${secret.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={secret.active !== false ? "Trama Activa (Se envía a IA)" : "Trama Inactiva (Ignorada por IA)"}
                >
                    <span>{secret.active !== false ? 'ACTIVO' : 'INACTIVO'}</span>
                    {secret.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* --- HEADER STATUS & CATEGORY --- */}
            <div className="grid grid-cols-2 gap-3">
                <StyledSelect 
                    label="Categoría de Trama"
                    value={secret.category || 'Personal'} 
                    onChange={e => onUpdate(secret.id, { category: e.target.value as any })}
                    options={[
                        { value: 'Personal', label: '🔒 Personal / Íntimo' },
                        { value: 'Político', label: '🏛️ Político / Facción' },
                        { value: 'Militar', label: '⚔️ Militar / Estrategia' },
                        { value: 'Mágico', label: '✨ Mágico / Arcano' },
                        { value: 'Histórico', label: '📜 Histórico / Lore' },
                        { value: 'Otro', label: '📦 Otro' },
                    ]}
                />
                <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Estado Actual</label>
                    <select 
                        value={secret.status || 'hidden'} 
                        onChange={e => onUpdate(secret.id, { status: e.target.value as any })} 
                        className={`w-full p-1.5 text-sm bg-gray-900 border border-gray-600 rounded-md outline-none font-bold transition-colors
                            ${secret.status === 'revealed' ? 'text-red-400 border-red-900' : 
                              secret.status === 'at_risk' ? 'text-orange-400 border-orange-900' : 
                              'text-green-400 border-green-900'}`}
                    >
                        <option value="hidden">🤫 Oculto (Nadie sospecha)</option>
                        <option value="at_risk">⚠️ En Riesgo (Pistas)</option>
                        <option value="revealed">📢 Revelado (Conocido)</option>
                    </select>
                </div>
            </div>

            {/* --- CONTENT & CONSEQUENCES --- */}
            <div className="space-y-2">
                <StyledTextArea 
                    label="La Verdad (Contenido del Secreto)" 
                    value={secret.content} 
                    onChange={e => onUpdate(secret.id, { content: e.target.value })} 
                    rows={3} 
                    placeholder="¿Qué es lo que realmente sucede? Describe el hecho oculto." 
                    className="border-l-2 border-l-cyan-500"
                />
                
                <div className="grid grid-cols-1 gap-2 bg-gray-900/30 p-2 rounded border border-gray-700">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-red-400 flex items-center">
                            <AlertIcon className="w-3 h-3 mr-1"/> Consecuencias si se revela
                        </label>
                        <span className="text-[10px] text-gray-500">Impacto: {secret.level || 1}/5</span>
                    </div>
                    <textarea 
                        value={secret.consequences || ''} 
                        onChange={e => onUpdate(secret.id, { consequences: e.target.value })} 
                        className="w-full bg-transparent text-xs text-gray-300 outline-none resize-none placeholder-gray-700"
                        rows={2}
                        placeholder="¿Qué pasará si esto sale a la luz? ¿Quién cae?"
                    />
                    <input 
                        type="range" min="1" max="5" 
                        value={secret.level || 1} 
                        onChange={e => onUpdate(secret.id, { level: parseInt(e.target.value) })} 
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                </div>
            </div>

            {/* --- KNOWLEDGE MATRIX (WHO KNOWS) --- */}
            <div className="bg-gray-800/50 rounded border border-gray-700 p-3">
                <div className="flex items-center justify-between mb-2 border-b border-gray-700 pb-2">
                    <h3 className="text-xs font-bold text-gray-300 flex items-center">
                        <UsersIcon className="w-3 h-3 mr-1"/> Matriz de Conocimiento
                    </h3>
                    <div className="flex space-x-2">
                        <button onClick={selectAll} className="text-[10px] text-cyan-500 hover:underline">Todos</button>
                        <button onClick={selectNone} className="text-[10px] text-gray-500 hover:underline">Ninguno</button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {allCharacters.map(char => {
                        const knows = secret.knownByCharacterIds?.includes(char.id);
                        return (
                            <div 
                                key={char.id} 
                                onClick={() => toggleKnowledge(char.id)}
                                className={`flex items-center justify-between p-1.5 rounded cursor-pointer border transition-all ${
                                    knows 
                                    ? 'bg-cyan-900/30 border-cyan-600/50' 
                                    : 'bg-gray-900/50 border-transparent hover:border-gray-600'
                                }`}
                            >
                                <span className={`text-xs truncate ${knows ? 'text-cyan-200 font-medium' : 'text-gray-500'}`}>
                                    {char.name}
                                </span>
                                {knows ? (
                                    <EyeIcon className="w-3.5 h-3.5 text-cyan-400" />
                                ) : (
                                    <EyeOffIcon className="w-3.5 h-3.5 text-gray-600" />
                                )}
                            </div>
                        );
                    })}
                    {allCharacters.length === 0 && (
                        <p className="col-span-2 text-center text-[10px] text-gray-500 py-2">
                            No hay personajes para asignar conocimiento.
                        </p>
                    )}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                    La IA usará esto para generar tensión dramática basada en quién sabe qué.
                </p>
            </div>

            <StyledTextArea 
                label="Notas Adicionales / Pistas" 
                value={secret.notes || ''} 
                onChange={e => onUpdate(secret.id, { notes: e.target.value })} 
                rows={2} 
                placeholder="Detalles meta-narrativos..." 
            />
        </div>
    );
};
