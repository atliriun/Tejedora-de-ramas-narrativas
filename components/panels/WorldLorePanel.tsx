
import React, { useState } from 'react';
import { LoreEntry, LoreProfile } from '../../types';
import { FileTextIcon, PlusIcon } from '../icons';
import { LoreEntryAccordion } from '../accordions/LoreEntryAccordion';
import { PanelShell } from '../ui/PanelShell';
import { ProfileManager } from '../shared/ProfileManager';

export const WorldLorePanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    loreEntries: LoreEntry[];
    onAddLoreEntry: () => void;
    onUpdateLoreEntry: (id: string, u: Partial<LoreEntry>) => void;
    onDeleteLoreEntry: (l: LoreEntry) => void;

    // Lore Profiles
    loreProfiles?: LoreProfile[];
    onAddLoreProfile?: (name: string) => void;
    onApplyLoreProfile?: (id: string) => void;
    onUpdateLoreProfile?: (id: string) => void;
    onDeleteLoreProfile?: (id: string) => void;
}> = ({ 
    isOpen, onClose, loreEntries, onAddLoreEntry, onUpdateLoreEntry, onDeleteLoreEntry,
    loreProfiles = [], onAddLoreProfile, onApplyLoreProfile, onUpdateLoreProfile, onDeleteLoreProfile
}) => {
    const [activeAccordionId, setActiveAccordionId] = useState<string | null>(null);
    
     return (
        <PanelShell
            id="lore"
            side="left"
            isOpen={isOpen}
            onClose={onClose}
            title="Lore del Mundo"
            icon={<FileTextIcon />}
            widthConfig={{ initial: 400, min: 300, max: 800 }}
        >
            <div className="flex-grow overflow-y-auto p-3 space-y-4">
                <ProfileManager 
                    title="Perfiles de Lore (Sets)"
                    description="Gestiona qué entradas de historia están activas (ej. 'Mitos Antiguos')."
                    profiles={loreProfiles}
                    onAdd={onAddLoreProfile!}
                    onApply={onApplyLoreProfile!}
                    onUpdate={onUpdateLoreProfile!}
                    onDelete={onDeleteLoreProfile!}
                />

                <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-semibold text-gray-300">Entradas de Lore</h3>
                     <button onClick={onAddLoreEntry} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                </div>
                <div className="space-y-2">
                    {loreEntries.map(entry => (
                        <div key={entry.id} className="bg-gray-700/30 rounded-md">
                            <LoreEntryAccordion
                                entry={entry}
                                isOpen={activeAccordionId === entry.id}
                                onToggle={() => setActiveAccordionId(activeAccordionId === entry.id ? null : entry.id)}
                                onUpdate={onUpdateLoreEntry}
                                onDelete={() => onDeleteLoreEntry(entry)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </PanelShell>
    )
}
