
import React, { useState } from 'react';
import { CharacterAttribute } from '../../types';
import { PlusIcon, XIcon, TrashIcon } from '../icons';
import { uuid } from '../../utils/uuid';

interface AttributeListEditorProps {
    attributes: CharacterAttribute[] | undefined;
    onUpdate: (newAttributes: CharacterAttribute[]) => void;
}

export const AttributeListEditor: React.FC<AttributeListEditorProps> = ({ attributes = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');

    const handleAdd = () => {
        if (!newName.trim()) return;
        const newAttr: CharacterAttribute = {
            id: uuid(),
            name: newName.trim(),
            current: 10,
            max: 10,
            color: 'bg-red-500'
        };
        onUpdate([...attributes, newAttr]);
        setNewName('');
        setIsAdding(false);
    };

    const handleUpdateItem = (id: string, updates: Partial<CharacterAttribute>) => {
        onUpdate(attributes.map(attr => attr.id === id ? { ...attr, ...updates } : attr));
    };

    const handleDelete = (id: string) => {
        onUpdate(attributes.filter(attr => attr.id !== id));
    };

    return (
        <div className="space-y-3 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1">
                Atributos Vitales
            </h3>
            
            <div className="space-y-3">
                {attributes.map(attr => (
                    <div key={attr.id} className="bg-gray-800/50 p-2 rounded border border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={attr.name} 
                                    onChange={(e) => handleUpdateItem(attr.id, { name: e.target.value })} 
                                    className="bg-transparent font-semibold text-sm text-gray-200 w-24 focus:bg-gray-900 focus:outline-none rounded px-1" 
                                />
                                <select 
                                    value={attr.color} 
                                    onChange={(e) => handleUpdateItem(attr.id, { color: e.target.value })} 
                                    className="bg-gray-900 text-[10px] border border-gray-600 rounded text-gray-400 outline-none p-0.5"
                                >
                                    <option value="bg-red-500">Rojo</option>
                                    <option value="bg-blue-500">Azul</option>
                                    <option value="bg-green-500">Verde</option>
                                    <option value="bg-yellow-500">Amarillo</option>
                                    <option value="bg-purple-500">Morado</option>
                                    <option value="bg-gray-500">Gris</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-1 text-xs">
                                <input 
                                    type="number" 
                                    value={attr.current} 
                                    onChange={(e) => handleUpdateItem(attr.id, { current: parseInt(e.target.value) || 0 })} 
                                    className="w-12 bg-gray-900 border border-gray-600 rounded text-center outline-none focus:border-cyan-500" 
                                />
                                <span className="text-gray-500">/</span>
                                <input 
                                    type="number" 
                                    value={attr.max} 
                                    onChange={(e) => handleUpdateItem(attr.id, { max: parseInt(e.target.value) || 1 })} 
                                    className="w-12 bg-gray-900 border border-gray-600 rounded text-center outline-none focus:border-cyan-500" 
                                />
                                <button onClick={() => handleDelete(attr.id)} className="ml-1 p-1 text-gray-500 hover:text-red-500">
                                    <TrashIcon className="w-3 h-3"/>
                                </button>
                            </div>
                        </div>
                        {/* Bar Visualizer */}
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden relative mb-1">
                            <div 
                                className={`h-full transition-all duration-300 ${attr.color}`} 
                                style={{ width: `${Math.min(100, Math.max(0, (attr.current / attr.max) * 100))}%` }} 
                            />
                        </div>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                        placeholder="Nombre (ej. Vida)" 
                        className="flex-grow text-sm p-1 bg-gray-900 border border-gray-600 rounded outline-none focus:border-cyan-500" 
                        autoFocus 
                        onKeyDown={e => e.key === 'Enter' && handleAdd()} 
                    />
                    <button onClick={handleAdd} className="p-1 bg-green-600 hover:bg-green-500 rounded text-white font-bold px-2">OK</button>
                    <button onClick={() => setIsAdding(false)} className="p-1 bg-gray-600 hover:bg-gray-500 rounded"><XIcon className="w-4 h-4"/></button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)} 
                    className="w-full py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-dashed border-gray-500 text-gray-300 flex items-center justify-center space-x-1"
                >
                    <PlusIcon /> <span>Añadir Atributo</span>
                </button>
            )}
        </div>
    );
};
