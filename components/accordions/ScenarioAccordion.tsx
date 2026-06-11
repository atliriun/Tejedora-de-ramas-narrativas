
import React, { useState } from 'react';
import { Scenario, Character, AiSettings, PsychologicalTrait, WorldRule } from '../../types';
import { ScenarioDetailsEditor } from '../editors/ScenarioDetailsEditor';
import { EntityAccordionShell } from '../ui/EntityAccordionShell';

export const ScenarioAccordion: React.FC<{
    scenario: Scenario;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: string, updates: Partial<Scenario>) => void;
    onDelete: () => void;
    // Legacy props for interface compatibility
    storySummary?: string;
    characters?: Character[];
    otherScenarios?: Scenario[];
    aiSettings?: AiSettings;
    psychologicalTraits?: PsychologicalTrait[];
    worldLogicRules?: WorldRule[];
}> = ({ scenario, isOpen, onToggle, onUpdate, onDelete }) => {
    return (
        <EntityAccordionShell
            name={scenario.name}
            isOpen={isOpen}
            onToggle={onToggle}
            onUpdateName={(name) => onUpdate(scenario.id, { name })}
            onDelete={onDelete}
            isActive={scenario.active !== false}
            onToggleActive={() => onUpdate(scenario.id, { active: !scenario.active })}
            defaultNameCheck="Nuevo Escenario"
        >
            <div className="bg-gray-800/30 p-2 rounded">
                <ScenarioDetailsEditor scenario={scenario} onUpdate={onUpdate} />
            </div>
        </EntityAccordionShell>
    );
};
