import React, { useState } from 'react';
import { Character, CharacterExpression } from '../../types';
import { StyledInput } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, SparkleIcon } from '../icons';
import { uuid } from '../../utils/uuid';
import { processImageFile } from '../../utils/imageUtils';

interface ExpressionListEditorProps {
    expressions: CharacterExpression[] | undefined;
    onUpdate: (newExpressions: CharacterExpression[]) => void;
    allCharacters?: Character[];
    currentCharacterId?: string;
}

export const ExpressionListEditor: React.FC<ExpressionListEditorProps> = ({ expressions = [], onUpdate, allCharacters, currentCharacterId }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<CharacterExpression, 'id'>>({ name: '', imageUrl: '' });

    const handleSubmit = () => {
        if (!form.name.trim() || !form.imageUrl) return;

        if (isAdding) {
            onUpdate([...expressions, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(expressions.map(e => e.id === editingId ? { ...e, ...form } : e));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm({ name: '', imageUrl: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (expr: CharacterExpression) => {
        setForm({ name: expr.name, imageUrl: expr.imageUrl });
        setEditingId(expr.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(expressions.filter(e => e.id !== id));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === expressions.length - 1)) return;
        const newList = [...expressions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        onUpdate(newList);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await processImageFile(file, 800, 800);
            setForm(prev => ({ ...prev, imageUrl: base64 }));
        } catch (error) {
            console.error("Error processing expression image:", error);
        }
    };

    const handleImportMissing = () => {
        if (!allCharacters) return;
        
        const originalCasingNames = new Map<string, string>();
        allCharacters.forEach(c => {
            if (c.id === currentCharacterId) return;
            c.expressions?.forEach(e => {
                const lower = e.name.toLowerCase();
                if (!originalCasingNames.has(lower)) originalCasingNames.set(lower, e.name);
            });
        });

        const currentNames = new Set(expressions.map(e => e.name.toLowerCase()));
        const missingNames = Array.from(originalCasingNames.keys()).filter(n => !currentNames.has(n));

        if (missingNames.length === 0) return;

        const newExpressions = missingNames.map(lower => ({
            id: uuid(),
            name: originalCasingNames.get(lower) || lower,
            imageUrl: ''
        }));

        onUpdate([...expressions, ...newExpressions]);
    };

    const hasMissingToImport = () => {
        if (!allCharacters) return false;
        let count = 0;
        const currentNames = new Set(expressions.map(e => e.name.toLowerCase()));
        
        allCharacters.forEach(c => {
            if (c.id === currentCharacterId) return;
            c.expressions?.forEach(e => {
                const lower = e.name.toLowerCase();
                if (!currentNames.has(lower)) {
                    currentNames.add(lower);
                    count++;
                }
            });
        });
        return count > 0;
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
             <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center justify-between">
                <span>Expresiones</span>
                {allCharacters && hasMissingToImport() && (
                    <button onClick={handleImportMissing} className="text-[10px] flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                        <SparkleIcon className="w-3 h-3" />
                        <span>Sincronizar Nombres Faltantes</span>
                    </button>
                )}
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-3 border border-gray-700 mb-2">
                    <StyledInput label="Nombre de Expresión (ej. Feliz, Enojado)" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} autoFocus />
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Imagen</label>
                        <div className="flex items-center space-x-4">
                            {form.imageUrl ? (
                                <div className="relative w-16 h-16 rounded overflow-hidden border border-gray-600">
                                    <img src={form.imageUrl} alt="Expressión" className="w-full h-full object-cover" />
                                    <button onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs" title="Remover">X</button>
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded border border-dashed border-gray-600 flex items-center justify-center overflow-hidden relative bg-gray-800">
                                    <span className="text-[10px] text-gray-500">Vacío</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" title="Subir imagen GIF/PNG/JPG" />
                                </div>
                            )}
                            <div className="text-xs text-gray-500">
                                Haz clic en el cuadro para subir una imagen.
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} disabled={!form.name.trim()} className={`px-2 py-1 text-xs rounded ${(!form.name.trim()) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>Guardar</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {expressions.map((expr, index) => {
                    if (expr.id === editingId) return null;

                    return (
                        <div key={expr.id} className="relative group rounded-md border border-gray-700 bg-gray-800/50 overflow-hidden flex flex-col">
                            <div className="w-full aspect-square bg-black relative">
                                {expr.imageUrl ? (
                                    <img src={expr.imageUrl} alt={expr.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500 border-2 border-dashed border-gray-600 group-hover:bg-gray-700 transition-colors">
                                        <span className="text-[10px] uppercase font-bold text-center">Falta<br />Imagen</span>
                                    </div>
                                )}
                                
                                <div className="absolute top-1 left-1 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={(e) => { e.stopPropagation(); handleMove(index, 'up'); }} className="p-1 bg-black/70 hover:bg-cyan-600 rounded text-gray-300 hover:text-white"><ArrowUpIcon className="w-3 h-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleMove(index, 'down'); }} className="p-1 bg-black/70 hover:bg-cyan-600 rounded text-gray-300 hover:text-white"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                                </div>

                                <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(expr); }} className="p-1.5 bg-black/80 hover:bg-cyan-600 rounded text-gray-300 hover:text-white"><EditIcon className="w-3 h-3"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(expr.id); }} className="p-1.5 bg-black/80 hover:bg-red-600 rounded text-gray-300 hover:text-white"><TrashIcon className="w-3 h-3"/></button>
                                </div>
                            </div>
                            <div className="p-2 text-center bg-gray-900 border-t border-gray-700">
                                <span className="text-xs font-bold text-gray-300 uppercase truncate block" title={expr.name}>{expr.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Expresión</span>
                </button>
            )}
        </div>
    );
};
