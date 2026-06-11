
import React, { useState } from 'react';
import { PsychologicalTrait, WorldRule, TagGroup, Tag, Character } from '../../types';
import { PlusIcon, XIcon } from '../icons';
import { TraitDetailsEditor } from '../editors/TraitDetailsEditor';
import { RuleDetailsEditor } from '../editors/RuleDetailsEditor';
import { EntityAccordionShell } from '../ui/EntityAccordionShell';
import { uuid } from '../../utils/uuid';

export const PsychologicalTraitAccordion: React.FC<{
    trait: PsychologicalTrait;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, u: Partial<PsychologicalTrait>) => void;
    onDelete: () => void;
    allCharacters: Character[];
    onUpdateCharacter: (id: string, u: Partial<Character>) => void;
}> = ({ trait, isOpen, onToggle, onUpdate, onDelete, allCharacters, onUpdateCharacter }) => {
    return (
        <EntityAccordionShell
            name={trait.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(trait.id, { name })}
            onDelete={onDelete}
            isActive={trait.active}
            onToggleActive={() => onUpdate(trait.id, { active: !trait.active })}
            defaultNameCheck="Nuevo Rasgo"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <TraitDetailsEditor 
                    trait={trait} 
                    onUpdate={onUpdate} 
                    allCharacters={allCharacters}
                    onUpdateCharacter={onUpdateCharacter}
                />
            </div>
        </EntityAccordionShell>
    )
}

export const WorldRuleAccordion: React.FC<{
    rule: WorldRule;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, u: Partial<WorldRule>) => void;
    onDelete: () => void;
}> = ({ rule, isOpen, onToggle, onUpdate, onDelete }) => {
    return (
        <EntityAccordionShell
            name={rule.text}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(text) => onUpdate(rule.id, { text })}
            onDelete={onDelete}
            isActive={rule.active !== false}
            onToggleActive={() => onUpdate(rule.id, { active: !rule.active })}
            defaultNameCheck="Nueva Regla"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <RuleDetailsEditor rule={rule} onUpdate={onUpdate} />
            </div>
        </EntityAccordionShell>
   )
}

export const TagGroupAccordion: React.FC<{
    group: TagGroup;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, u: Partial<TagGroup>) => void;
    onDelete: () => void;
}> = ({ group, isOpen, onToggle, onUpdate, onDelete }) => {
    const [newTagName, setNewTagName] = useState('');

    const handleAddTag = () => {
        if (newTagName.trim()) {
            const newTag: Tag = { id: uuid(), name: newTagName.trim(), description: '' };
            onUpdate(group.id, { tags: [...group.tags, newTag] });
            setNewTagName('');
        }
    };
    
    const handleDeleteTag = (tagId: string) => {
        onUpdate(group.id, { tags: group.tags.filter(t => t.id !== tagId) });
    };

    return (
        <EntityAccordionShell
            name={group.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(group.id, { name })}
            onDelete={onDelete}
            defaultNameCheck="Nuevo Grupo"
        >
            <div className="space-y-3">
                <div className="flex space-x-2">
                    <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Nombre de Nueva Etiqueta" className="flex-grow text-sm p-1.5 bg-gray-900 border border-gray-600 rounded-md outline-none" onKeyDown={e => e.key === 'Enter' && handleAddTag()} />
                    <button onClick={handleAddTag} className="px-2 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {group.tags.map(tag => (
                        <div key={tag.id} className="flex items-center bg-gray-700 px-2 py-1 rounded-full text-xs">
                            <span>{tag.name}</span>
                            <button onClick={() => handleDeleteTag(tag.id)} className="ml-1 text-gray-400 hover:text-red-400"><XIcon className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </EntityAccordionShell>
   )
}
