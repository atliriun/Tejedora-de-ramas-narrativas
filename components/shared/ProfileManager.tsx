
import React, { useState } from 'react';
import { ChevronDownIcon, SaveIcon, TrashIcon, CheckIcon, XIcon } from '../icons';

export interface ProfileManagerProps {
    title: string;
    description: string;
    profiles: any[]; // Generic
    onAdd: (name: string) => void;
    onApply: (id: string) => void;
    onUpdate: (id: string) => void;
    onDelete: (id: string) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
    title, description, profiles, onAdd, onApply, onUpdate, onDelete
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const handleSubmit = () => {
        if (newName.trim()) {
            onAdd(newName.trim());
            setNewName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="mb-4 bg-gray-800/50 rounded border border-gray-700 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 text-xs font-bold text-gray-400 uppercase hover:text-white hover:bg-gray-700 transition-colors"
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="p-2 border-t border-gray-700 animate-fade-in-fast space-y-2">
                    <p className="text-[10px] text-gray-500 mb-2">
                        {description}
                    </p>
                    {profiles.length > 0 && (
                        <div className="space-y-1">
                            {profiles.map(profile => (
                                <div key={profile.id} className="flex items-center justify-between bg-gray-700/50 p-1.5 rounded text-sm">
                                    <span className="font-medium truncate flex-grow text-xs">{profile.name}</span>
                                    <div className="flex space-x-1">
                                        <button onClick={() => onApply(profile.id)} className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-[10px] rounded font-semibold" title="Aplicar este perfil">Cargar</button>
                                        <button onClick={() => onUpdate(profile.id)} className="p-1 bg-gray-600 hover:bg-green-500 rounded text-[10px]" title="Actualizar con configuración actual"><SaveIcon className="w-3 h-3"/></button>
                                        <button onClick={() => onDelete(profile.id)} className="p-1 bg-gray-600 hover:bg-red-500 rounded text-[10px]" title="Eliminar"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {isCreating ? (
                        <div className="flex items-center space-x-2 mt-2">
                            <input 
                                type="text" 
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nombre del perfil..."
                                className="flex-grow bg-gray-900 border border-cyan-500 rounded px-2 py-1 text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <button onClick={handleSubmit} className="p-1 bg-green-600 hover:bg-green-500 rounded"><CheckIcon className="w-3 h-3"/></button>
                            <button onClick={() => setIsCreating(false)} className="p-1 bg-gray-600 hover:bg-gray-500 rounded"><XIcon className="w-3 h-3"/></button>
                        </div>
                    ) : (
                        <button onClick={() => setIsCreating(true)} className="w-full text-[10px] flex items-center justify-center space-x-1 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-dashed border-gray-500 text-gray-300">
                            <SaveIcon className="w-3 h-3" />
                            <span>Guardar Estado Actual como Perfil</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
