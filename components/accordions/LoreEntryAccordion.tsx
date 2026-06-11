
import React, { useState } from 'react';
import { LoreEntry } from '../../types';
import { BookOpenIcon } from '../icons';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { RichTextRenderer } from '../ui/RichTextRenderer';
import { EntityAccordionShell } from '../ui/EntityAccordionShell';

export const LoreEntryAccordion: React.FC<{
    entry: LoreEntry;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, u: Partial<LoreEntry>) => void;
    onDelete: () => void;
}> = ({ entry, isOpen, onToggle, onUpdate, onDelete }) => {
    const [isPreview, setIsPreview] = useState(false);
    const handleUpdate = (u: Partial<LoreEntry>) => onUpdate(entry.id, u);

    return (
        <EntityAccordionShell
            name={entry.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => handleUpdate({ name })}
            onDelete={onDelete}
            isActive={entry.active !== false}
            onToggleActive={() => handleUpdate({ active: !entry.active })}
            defaultNameCheck="Nueva Entrada de Lore"
        >
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <StyledInput label="Categoría" value={entry.category} onChange={e => handleUpdate({ category: e.target.value })} />
                    <StyledInput label="Alias (Contexto)" value={entry.aliases?.join(', ') || ''} onChange={e => handleUpdate({ aliases: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
                </div>
                
                <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-400">Contenido</label>
                        <button 
                            onClick={() => setIsPreview(!isPreview)} 
                            className={`text-[10px] flex items-center px-2 py-0.5 rounded ${isPreview ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            <BookOpenIcon className="w-3 h-3 mr-1" />
                            {isPreview ? 'Editar' : 'Vista Previa'}
                        </button>
                    </div>
                    
                    {isPreview ? (
                        <div className="w-full min-h-[9rem] p-3 bg-gray-800/50 border border-gray-700 rounded-md">
                            <RichTextRenderer text={entry.content || "Sin contenido."} className="text-sm text-gray-300 whitespace-pre-wrap" />
                        </div>
                    ) : (
                        <StyledTextArea value={entry.content} onChange={e => handleUpdate({ content: e.target.value })} rows={6} placeholder="Escribe aquí..." />
                    )}
                </div>
            </div>
        </EntityAccordionShell>
   )
}
