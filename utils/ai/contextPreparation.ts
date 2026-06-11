
import { HierarchyPointNode, HierarchyNode } from 'd3-hierarchy';
import { StoryNodeData, ProjectData, DirectorContext, Character, Scenario, Tag, PsychologicalTrait, WorldRule, MagicSystem, WorldObject, Species, NarrativeGoal, StoryFlag, LoreEntry } from '../../types';
import { resolveEffectiveEntities, generateStorySummary, getEffectiveNodeContext } from '../storyUtils';
import { buildScenarioContext, buildTagContext, buildLorebookContext, formatWorldContext, formatCharacterTraits } from '../promptUtils';
import { filterContextByKeywords } from '../contextUtils';
import { parseTextToStructuredBlocks, formatBlocksToAiPrompt } from './textParser';

export interface PreparedContext {
    effectivePath: string;
    historyForApi: any[]; 
    fullNarrativeHistory: { id: string; text: string; note?: string; date?: string; pov?: string }[];
    
    // Resolved Entities
    activeCharacters: Character[];
    activeScenarios: Scenario[];
    activeStatusTags: { groupName: string; tag: Tag }[];
    
    // Filtered Lore
    relevantTraits: PsychologicalTrait[];
    
    // Formatted Strings for Prompts
    scenarioContextString: string;
    tagContextString: string;
    worldContextString: string;
    traitContextString: string;
    lorebookContextString: string;
    storySummaryString: string;
    
    // Metadata
    currentDate: string;
    povId?: string;
}

export const prepareNodeAiContext = (
    node: HierarchyPointNode<StoryNodeData> | HierarchyNode<StoryNodeData>,
    projectData: ProjectData,
    options: {
        useChatHistory?: boolean; 
        contextOverrides?: DirectorContext; 
    } = {}
): PreparedContext => {
    const { 
        characters, scenarios, tagGroups, psychologicalTraits, 
        worldLogicRules, magicSystems, worldObjects, species,
        narrativeGoals, flags, storyArcs, activeArcId, loreEntries, nations
    } = projectData;

    // 1. Path & History
    const ancestors = node.ancestors().reverse();
    
    // STRICT FILTER: Remove blocked nodes from the linear path and the history script
    const filteredAncestors = ancestors.filter(d => !d.data.excludeFromContext);
    
    const pathParts = filteredAncestors.map(d => {
        const structuredBlocks = d.data.blocks && d.data.blocks.length > 0 
            ? d.data.blocks 
            : parseTextToStructuredBlocks(d.data.name);
        return formatBlocksToAiPrompt(structuredBlocks);
    });
    
    const inherited = getEffectiveNodeContext(node); 
    let customContext = '';
    if (node.data.customArcSummary) customContext += `\n[MANUAL ARC CONTEXT: ${node.data.customArcSummary}]`;
    if (inherited.customCharactersSummary) customContext += `\n[MANUAL CHARACTER CONTEXT: ${inherited.customCharactersSummary}]`;
    
    const effectivePath = customContext ? `${pathParts.join('\n')}\n${customContext}` : pathParts.join('\n');

    const fullNarrativeHistory = filteredAncestors
        .map(anc => {
            // --- PARSING INTEGRATION ---
            // Instead of raw text, we parse it into semantic blocks (Action, Dialogue, Thought)
            // If blocks exist, use them directly, otherwise parse the text
            const structuredBlocks = anc.data.blocks && anc.data.blocks.length > 0 
                ? anc.data.blocks 
                : parseTextToStructuredBlocks(anc.data.name);
            const jsonContent = formatBlocksToAiPrompt(structuredBlocks);
            
            let enrichedText = `SCENE DATA (JSON): ${jsonContent}`;
            
            const combinedContent = [];
            
            if (anc.data.chatHistory && anc.data.chatHistory.length > 0) {
                const chatText = anc.data.chatHistory
                    .filter(m => m.text && m.text.trim().length > 0)
                    .map(m => `[Co-Writer Chat]: ${m.text}`)
                    .join('\n');
                if (chatText) combinedContent.push(chatText);
            }

            if (anc.data.directorChatHistory && anc.data.directorChatHistory.length > 0) {
                 const directorText = anc.data.directorChatHistory
                    .filter(m => m.text && m.text.trim().length > 0)
                    .map(m => `[Director Mode]: ${m.text}`)
                    .join('\n');
                 if (directorText) combinedContent.push(directorText);
            }

            if (combinedContent.length > 0) {
                enrichedText += `\n\n--- EXTRA LOGS ---\n${combinedContent.join('\n\n')}\n--- END LOG ---`;
            }

            return {
                id: anc.data.id,
                text: enrichedText,
                note: anc.data.note,
                date: anc.data.fantasyDate,
                pov: anc.data.pointOfViewCharacterId
            };
        });

    const historyForApi = (node.data.chatHistory || []).slice(0, -1); 

    // 2. Resolve Effective Context (Inheritance + Overrides)
    const finalCharacterIds = options.contextOverrides?.characterIds ?? inherited.characterIds;
    const finalScenarioIds = options.contextOverrides?.scenarioIds ?? inherited.scenarioIds;
    const finalTagIds = options.contextOverrides?.tagIds ?? inherited.tagIds;
    const finalDate = options.contextOverrides?.fantasyDate ?? inherited.date;
    const finalPov = options.contextOverrides?.povCharacterId ?? inherited.pov;
    
    // PRIORIDAD: Override > Dato Guardado en Nodo > False
    const isStrictFocus = options.contextOverrides?.strictFocus ?? (node.data as StoryNodeData).strictFocus ?? false;

    const { activeCharacters, activeScenarios, activeStatusTags } = resolveEffectiveEntities(
        finalCharacterIds, finalScenarioIds, finalTagIds, characters, scenarios, tagGroups, inherited.overrides
    );

    // 3. Filter Traits
    const activeTraitIds = new Set(activeCharacters.flatMap(c => c.traitIds || []));
    const relevantTraits = psychologicalTraits.filter(t => activeTraitIds.has(t.id));

    // 4. Generate Context Strings
    const activeSpeciesList = species.filter(s => s.active !== false);
    const activeObjectsList = worldObjects.filter(o => o.active !== false);
    const activeMagicList = magicSystems.filter(m => m.active !== false);
    const activeScenariosList = scenarios.filter(s => s.active !== false);
    const activeFlagsList = flags.filter(f => f.active !== false);
    const activeRulesList = worldLogicRules.filter(r => r.active !== false); 
    const activeLoreList = loreEntries.filter(l => l.active !== false); 
    const activeGoalsList = narrativeGoals.filter(g => g.active !== false); 
    const activeNationsList = nations ? nations.filter(n => n.active !== false) : []; 
    
    // Elenco Global filtrado por estado activo
    const activeGlobalCharacters = characters.filter(c => c.active !== false);

    const scenarioContextString = buildScenarioContext(activeScenarios);
    const tagContextString = buildTagContext(activeStatusTags);
    const worldContextString = formatWorldContext(psychologicalTraits, activeRulesList, activeGoalsList, activeFlagsList);
    const traitContextString = formatCharacterTraits(activeCharacters, relevantTraits); 

    // Lorebook scan
    const textToScan = effectivePath + " " + fullNarrativeHistory.map(n => n.text).join(" ");

    const relevantMagic = filterContextByKeywords(textToScan, activeMagicList); 
    const relevantObjects = filterContextByKeywords(textToScan, activeObjectsList); 
    const relevantSpecies = filterContextByKeywords(textToScan, activeSpeciesList); 
    const relevantScenarios = filterContextByKeywords(textToScan, activeScenariosList);
    const relevantLore = filterContextByKeywords(textToScan, activeLoreList); 
    const relevantNations = filterContextByKeywords(textToScan, activeNationsList); 
    
    // AISLAMIENTO DE ELENCO VINCULADO AL ESTADO ACTIVO
    // Si strictFocus es true: Ignoramos escaneo de menciones, SOLO enviamos los de la lista de escena.
    // Si strictFocus es false: Buscamos menciones PERO solo entre los personajes marcados como ACTIVOS globalmente.
    const relevantMentionedCharacters = isStrictFocus ? [] : filterContextByKeywords(textToScan, activeGlobalCharacters);
    
    // Combinar lista explícita de escena con mencionados (si no hay aislamiento)
    const combinedRelevantCharacters = [...new Map([...activeCharacters, ...relevantMentionedCharacters].map(c => [c.id, c])).values()];

    const lorebookContextString = buildLorebookContext(
        combinedRelevantCharacters,
        relevantScenarios, 
        relevantMagic, 
        relevantObjects, 
        relevantSpecies,
        relevantLore, 
        relevantNations,
        characters,
        psychologicalTraits
    );

    const storySummaryString = generateStorySummary(storyArcs, activeArcId);

    return {
        effectivePath,
        historyForApi,
        fullNarrativeHistory,
        activeCharacters,
        activeScenarios,
        activeStatusTags,
        relevantTraits,
        scenarioContextString,
        tagContextString,
        worldContextString,
        traitContextString,
        lorebookContextString,
        storySummaryString,
        currentDate: finalDate,
        povId: finalPov
    };
};
