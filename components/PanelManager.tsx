
import React, { useMemo } from 'react';
import { ProjectData, AiSettings, EntityType } from '../types';
import { StoryArcsPanel } from './panels/StoryArcsPanel';
import { WorldStructurePanel } from './panels/WorldStructurePanel';
import { WorldRulesPanel } from './panels/WorldRulesPanel';
import { WorldLorePanel } from './panels/WorldLorePanel';
import { StoryObjectivesPanel } from './panels/StoryObjectivesPanel';
import { 
    DEFAULT_CHARACTER, DEFAULT_SCENARIO, DEFAULT_MAGIC_SYSTEM, 
    DEFAULT_WORLD_OBJECT, DEFAULT_SPECIES, DEFAULT_SECRET, 
    DEFAULT_PSYCHOLOGICAL_TRAIT, DEFAULT_WORLD_RULE, DEFAULT_TAG_GROUP, DEFAULT_LORE_ENTRY, DEFAULT_NATION
} from '../constants';

interface PanelManagerProps {
    ui: any; // useUIState result
    projectData: ProjectData;
    projectActions: any; // useProjectActions result
    aiSettings: AiSettings;
    documentContent: string;
    storySummary: string;
}

export const PanelManager: React.FC<PanelManagerProps> = ({
    ui,
    projectData,
    projectActions,
    aiSettings,
    documentContent,
    storySummary
}) => {
    const { panels, requestDeleteItem, closeAllPanels } = ui;
    const { 
        handleCreateItem, handleUpdateItem, handleAddArc, 
        handleSetActiveArc, handleDuplicateArc, handleReorderArcs,
        handleAddPreset, handleApplyPreset, handleUpdatePreset, handleDeletePreset,
        // Generic Handlers
        handleCreateProfile, handleApplyProfile, handleUpdateProfile, handleDeleteProfile
    } = projectActions;

    // Helper to generate binding props for profiles
    const bindProfiles = (profileKey: keyof ProjectData, entityKey: keyof ProjectData, configKey: string, propPrefix: string) => ({
        [`${propPrefix}Profiles`]: projectData[profileKey],
        [`onAdd${propPrefix}Profile`]: (name: string) => handleCreateProfile(name, profileKey, entityKey, configKey),
        [`onApply${propPrefix}Profile`]: (id: string) => handleApplyProfile(id, profileKey, entityKey, configKey),
        [`onUpdate${propPrefix}Profile`]: (id: string) => handleUpdateProfile(id, profileKey, entityKey, configKey),
        [`onDelete${propPrefix}Profile`]: (id: string) => handleDeleteProfile(id, profileKey)
    });

    const entityBindings = useMemo(() => {
        const bind = (
            dataKey: keyof ProjectData, 
            entityType: EntityType, 
            defaultTemplate: any, 
            propPrefix: string
        ) => ({
            [dataKey]: projectData[dataKey],
            [`onAdd${propPrefix}`]: () => handleCreateItem(dataKey, defaultTemplate),
            [`onUpdate${propPrefix}`]: (id: string, u: any) => handleUpdateItem(dataKey, id, u),
            [`onDelete${propPrefix}`]: (item: any) => requestDeleteItem({ type: entityType, id: item.id, name: item.name || item.text })
        });

        return {
            characters: bind('characters', 'character', DEFAULT_CHARACTER, 'Character'),
            scenarios: bind('scenarios', 'scenario', DEFAULT_SCENARIO, 'Scenario'),
            magicSystems: bind('magicSystems', 'magic system', DEFAULT_MAGIC_SYSTEM, 'MagicSystem'),
            worldObjects: bind('worldObjects', 'world object', DEFAULT_WORLD_OBJECT, 'WorldObject'),
            species: bind('species', 'species', DEFAULT_SPECIES, 'Species'),
            secrets: bind('secrets', 'secret', DEFAULT_SECRET, 'Secret'),
            traits: bind('psychologicalTraits', 'psychological trait', DEFAULT_PSYCHOLOGICAL_TRAIT, 'PsychologicalTrait'),
            rules: bind('worldLogicRules', 'world logic rule', DEFAULT_WORLD_RULE, 'WorldLogicRule'),
            tags: bind('tagGroups', 'tag group', DEFAULT_TAG_GROUP, 'TagGroup'),
            lore: bind('loreEntries', 'lore entry', DEFAULT_LORE_ENTRY, 'LoreEntry'),
            nations: bind('nations', 'nation', DEFAULT_NATION, 'Nation')
        };
    }, [projectData, handleCreateItem, handleUpdateItem, requestDeleteItem]);

    // Backdrop click handler logic
    if (!panels.isStoryArcsPanelOpen && !panels.isWorldStructurePanelOpen && !panels.isWorldRulesPanelOpen && !panels.isLorePanelOpen && !panels.isStoryObjectivesPanelOpen && !panels.isMenuOpen) {
        return null;
    }

    return (
        <>
            <StoryArcsPanel
                isOpen={panels.isStoryArcsPanelOpen} 
                onClose={() => panels.setIsStoryArcsPanelOpen(false)}
                storyArcs={projectData.storyArcs} 
                activeArcId={projectData.activeArcId}
                onAddArc={handleAddArc}
                onDeleteArc={(arc) => requestDeleteItem({ type: 'story arc', id: arc.id, name: arc.name })}
                onDuplicateArc={handleDuplicateArc}
                onUpdateArcName={(id, n) => handleUpdateItem('storyArcs', id, { name: n })}
                onUpdateArcSummary={(id, s) => handleUpdateItem('storyArcs', id, { summary: s })}
                onUpdateArcSignificance={(id, s) => handleUpdateItem('storyArcs', id, { significance: s })}
                onSetActiveArc={handleSetActiveArc}
                onReorderArcs={handleReorderArcs}
                contextPresets={projectData.contextPresets}
                onAddPreset={handleAddPreset}
                onApplyPreset={handleApplyPreset}
                onDeletePreset={handleDeletePreset}
                onUpdatePreset={handleUpdatePreset}
            />

            <WorldStructurePanel
                isOpen={panels.isWorldStructurePanelOpen} 
                onClose={() => panels.setIsWorldStructurePanelOpen(false)}
                documentContent={documentContent} 
                storySummary={storySummary} 
                aiSettings={aiSettings}
                psychologicalTraits={projectData.psychologicalTraits} 
                worldLogicRules={projectData.worldLogicRules}
                storyArcs={projectData.storyArcs} // NEW
                {...(entityBindings.characters as any)}
                {...(entityBindings.scenarios as any)}
                {...(entityBindings.magicSystems as any)}
                {...(entityBindings.worldObjects as any)}
                {...(entityBindings.species as any)}
                {...(entityBindings.secrets as any)}
                {...(entityBindings.nations as any)}
                
                {...bindProfiles('speciesProfiles', 'species', 'species', 'Species')}
                {...bindProfiles('secretProfiles', 'secrets', 'secrets', 'Secret')}
                {...bindProfiles('worldObjectProfiles', 'worldObjects', 'objects', 'WorldObject')}
                {...bindProfiles('magicSystemProfiles', 'magicSystems', 'magicSystems', 'MagicSystem')}
                {...bindProfiles('scenarioProfiles', 'scenarios', 'scenarios', 'Scenario')}
                {...bindProfiles('nationProfiles', 'nations', 'nations', 'Nation')}
            />

            <WorldRulesPanel
                isOpen={panels.isWorldRulesPanelOpen} 
                onClose={() => panels.setIsWorldRulesPanelOpen(false)}
                {...(entityBindings.traits as any)}
                {...(entityBindings.rules as any)}
                {...(entityBindings.tags as any)}
                
                flags={projectData.flags}
                onUpdateFlags={(newFlags) => handleUpdateItem('flags', 'all', newFlags)}

                {...bindProfiles('traitProfiles', 'psychologicalTraits', 'traits', 'Trait')}
                {...bindProfiles('flagProfiles', 'flags', 'flags', 'Flag')}
                {...bindProfiles('ruleProfiles', 'worldLogicRules', 'rules', 'Rule')}

                allCharacters={projectData.characters}
                onUpdateCharacter={(id, u) => handleUpdateItem('characters', id, u)}
            />

            <WorldLorePanel
                isOpen={panels.isLorePanelOpen} 
                onClose={() => panels.setIsLorePanelOpen(false)}
                {...(entityBindings.lore as any)}
                {...bindProfiles('loreProfiles', 'loreEntries', 'loreEntries', 'Lore')}
            />

            <StoryObjectivesPanel
                isOpen={panels.isStoryObjectivesPanelOpen}
                onClose={() => panels.setIsStoryObjectivesPanelOpen(false)}
                goals={projectData.narrativeGoals || []}
                onUpdateGoals={(newGoals) => handleUpdateItem('narrativeGoals', 'all', newGoals)}
                {...bindProfiles('goalProfiles', 'narrativeGoals', 'goals', 'Goal')}
            />

            {/* Global Backdrop for all panels */}
            <div className="absolute inset-0 bg-black bg-opacity-50 z-30" onClick={closeAllPanels} />
        </>
    );
};
