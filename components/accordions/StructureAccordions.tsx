
import React, { useState } from 'react';
import { MagicSystem, WorldObject, Species, Secret, Character } from '../../types';
import { SparkleIcon, ScaleIcon, FileTextIcon } from '../icons';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { AbilityListEditor } from '../editors/AbilityListEditor';
import { RuleListEditor } from '../editors/RuleListEditor';
import { SecretDetailsEditor } from '../editors/SecretDetailsEditor';
import { SpeciesDetailsEditor } from '../editors/SpeciesDetailsEditor';
import { WorldObjectDetailsEditor } from '../editors/WorldObjectDetailsEditor';
import { MagicSystemDetailsEditor } from '../editors/MagicSystemDetailsEditor';
import { EntityAccordionShell } from '../ui/EntityAccordionShell';

export const MagicSystemAccordion: React.FC<{
    magicSystem: MagicSystem;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<MagicSystem>) => void;
    onDelete: () => void;
}> = ({ magicSystem, isOpen, onToggle, onUpdate, onDelete }) => {
    return (
        <EntityAccordionShell
            name={magicSystem.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(magicSystem.id, { name })}
            onDelete={onDelete}
            isActive={magicSystem.active !== false}
            onToggleActive={() => onUpdate(magicSystem.id, { active: !magicSystem.active })}
            defaultNameCheck="Nuevo Sistema Mágico"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <MagicSystemDetailsEditor magicSystem={magicSystem} onUpdate={onUpdate} />
            </div>
        </EntityAccordionShell>
    );
};

export const WorldObjectAccordion: React.FC<{
    worldObject: WorldObject;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<WorldObject>) => void;
    onDelete: () => void;
}> = ({ worldObject, isOpen, onToggle, onUpdate, onDelete }) => {
    return (
        <EntityAccordionShell
            name={worldObject.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(worldObject.id, { name })}
            onDelete={onDelete}
            isActive={worldObject.active !== false}
            onToggleActive={() => onUpdate(worldObject.id, { active: !worldObject.active })}
            defaultNameCheck="Nuevo Objeto"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <WorldObjectDetailsEditor worldObject={worldObject} onUpdate={onUpdate} />
            </div>
        </EntityAccordionShell>
    );
};

export const SpeciesAccordion: React.FC<{
    species: Species;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<Species>) => void;
    onDelete: () => void;
}> = ({ species, isOpen, onToggle, onUpdate, onDelete }) => {
    return (
        <EntityAccordionShell
            name={species.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(species.id, { name })}
            onDelete={onDelete}
            isActive={species.active !== false}
            onToggleActive={() => onUpdate(species.id, { active: !species.active })}
            defaultNameCheck="Nueva Especie"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <SpeciesDetailsEditor species={species} onUpdate={onUpdate} />
            </div>
        </EntityAccordionShell>
    );
};

export const SecretAccordion: React.FC<{
    secret: Secret;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<Secret>) => void;
    onDelete: () => void;
    allCharacters: Character[];
}> = ({ secret, isOpen, onToggle, onUpdate, onDelete, allCharacters }) => {
    return (
        <EntityAccordionShell
            name={secret.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(secret.id, { name })}
            onDelete={onDelete}
            isActive={secret.active !== false}
            onToggleActive={() => onUpdate(secret.id, { active: !secret.active })}
            defaultNameCheck="Nuevo Secreto"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <SecretDetailsEditor secret={secret} onUpdate={onUpdate} allCharacters={allCharacters} />
            </div>
        </EntityAccordionShell>
    );
};
