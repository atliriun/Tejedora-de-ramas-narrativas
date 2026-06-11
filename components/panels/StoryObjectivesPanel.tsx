
import React from 'react';
import { NarrativeGoal, NarrativeGoalProfile } from '../../types';
import { TargetIcon } from '../icons';
import { ObjectiveListEditor } from '../editors/ObjectiveListEditor';
import { PanelShell } from '../ui/PanelShell';
import { ProfileManager } from '../shared/ProfileManager';

export const StoryObjectivesPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    goals: NarrativeGoal[];
    onUpdateGoals: (goals: NarrativeGoal[]) => void;

    // Goal Profiles
    goalProfiles?: NarrativeGoalProfile[];
    onAddGoalProfile?: (name: string) => void;
    onApplyGoalProfile?: (id: string) => void;
    onUpdateGoalProfile?: (id: string) => void;
    onDeleteGoalProfile?: (id: string) => void;
}> = ({ 
    isOpen, onClose, goals, onUpdateGoals,
    goalProfiles = [], onAddGoalProfile, onApplyGoalProfile, onUpdateGoalProfile, onDeleteGoalProfile
}) => {
    
    const sortedGoals = [...goals].sort((a, b) => {
        const statusOrder = { 'Active': 1, 'Pending': 2, 'Completed': 3, 'Failed': 4, 'Abandoned': 5 };
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        
        // @ts-ignore
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            // @ts-ignore
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return (
        <PanelShell
            id="objectives"
            side="left"
            isOpen={isOpen}
            onClose={onClose}
            title="Objetivos Narrativos"
            icon={<TargetIcon />}
            widthConfig={{ initial: 350, min: 300, max: 600 }}
        >
            <div className="flex-grow overflow-y-auto p-4">
                <ProfileManager 
                    title="Perfiles de Objetivos (Sets)"
                    description="Gestiona qué objetivos están activos para la IA."
                    profiles={goalProfiles}
                    onAdd={onAddGoalProfile!}
                    onApply={onApplyGoalProfile!}
                    onUpdate={onUpdateGoalProfile!}
                    onDelete={onDeleteGoalProfile!}
                />

                <p className="text-xs text-gray-400 mb-4">
                    Define los hilos conductores de la historia. La IA priorizará los objetivos activos marcados como <strong>Alta</strong> o <strong>Media</strong> prioridad si el interruptor de sistema está en <strong>ON</strong>.
                </p>
                
                <ObjectiveListEditor 
                    goals={sortedGoals} 
                    onUpdate={onUpdateGoals} 
                />
            </div>
        </PanelShell>
    )
}
