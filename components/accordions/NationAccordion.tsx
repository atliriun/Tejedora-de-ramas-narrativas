
import React from 'react';
import { Nation } from '../../types';
import { NationDetailsEditor } from '../editors/NationDetailsEditor';
import { EntityAccordionShell } from '../ui/EntityAccordionShell';

export const NationAccordion: React.FC<{
    nation: Nation;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<Nation>) => void;
    onDelete: () => void;
}> = ({ nation, isOpen, onToggle, onUpdate, onDelete }) => {
    return (
        <EntityAccordionShell
            name={nation.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(nation.id, { name })}
            onDelete={onDelete}
            isActive={nation.active !== false}
            onToggleActive={() => onUpdate(nation.id, { active: !nation.active })}
            defaultNameCheck="Nuevo Reino"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <NationDetailsEditor nation={nation} onUpdate={onUpdate} />
            </div>
        </EntityAccordionShell>
    );
};
