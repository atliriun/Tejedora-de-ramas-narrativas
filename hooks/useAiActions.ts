
import { useState, useCallback, useMemo, useRef } from 'react';
import { StoryNodeData, ChatMessage, AiSettings, ProjectData, DirectorContext, CharacterAttribute, CharacterState, CharacterRelationship, Character, InventoryItem, ItemType, CharacterAbility, AbilityType, RelationshipType, EvolutionMilestone, EvolutionCategory, EvolutionPriority, CharacterMemory, Scenario, Secret, Nation, NationConflict, NationTreaty, NationPolicy, NationEvent, NationUnit, NationResource, NationDemographic, NationFaction, NationValue, Region, City, NationDetailItem, Landmark, MagicSystem, WorldObject, Species, LoreEntry, WorldRule, NarrativeGoal, StoryFlag } from '../types';
import { generateBranches, regenerateBranch, correctText, translateText, continueChat, continuePlot, directorChat } from '../services/geminiService';
import { findNodeAndModify } from '../utils/treeUtils';
import { getEffectiveNodeContext } from '../utils/storyUtils';
import { prepareNodeAiContext } from '../utils/ai/contextPreparation';
import { HierarchyNode, HierarchyPointNode } from 'd3-hierarchy';
import { generateUUID, safeClone } from '../utils/uuid';

const normalizeStr = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const findCharacterRobust = (name: string, characters: Character[]): Character | undefined => {
    if (!name) return undefined;
    const n = normalizeStr(name);
    let char = characters.find(c => normalizeStr(c.name) === n);
    if (char) return char;
    char = characters.find(c => c.aliases?.some(a => normalizeStr(a) === n));
    if (char) return char;
    char = characters.find(c => normalizeStr(c.name).includes(n) || n.includes(normalizeStr(c.name)));
    return char;
};

const findNationRobust = (name: string, nations: Nation[]): Nation | undefined => {
    if (!name) return undefined;
    const n = normalizeStr(name);
    return nations.find(nat => normalizeStr(nat.name) === n || nat.aliases?.some(a => normalizeStr(a) === n));
};

export const useAiActions = (
    aiSettings: AiSettings,
    projectData: ProjectData,
    updateActiveArcRoot: (updater: (root: StoryNodeData) => StoryNodeData, overwrite?: boolean) => void,
    updateGlobalEntity: (key: keyof ProjectData, id: string, updates: any, overwrite?: boolean) => void,
    renameCharacterGlobally: (oldName: string, newName: string) => void
) => {
    const [generatingNodeId, setGeneratingNodeId] = useState<string | null>(null);
    const [regeneratingNodeId, setRegeneratingNodeId] = useState<string | null>(null);
    const [correctingNodeId, setCorrectingNodeId] = useState<string | null>(null);
    const [continuingPlotNodeId, setContinuingPlotNodeId] = useState<string | null>(null);
    const [translatingNodeId, setTranslatingNodeId] = useState<string | null>(null);
    const [chatLoadingNodeId, setChatLoadingNodeId] = useState<string | null>(null);
    const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);

    const activeRequestController = useRef<AbortController | null>(null);

    const handleStopGeneration = useCallback(() => {
        if (activeRequestController.current) {
            activeRequestController.current.abort();
            activeRequestController.current = null;
        }
        setGeneratingNodeId(null);
        setRegeneratingNodeId(null);
        setCorrectingNodeId(null);
        setContinuingPlotNodeId(null);
        setTranslatingNodeId(null);
        setChatLoadingNodeId(null);
        setRegeneratingMessageId(null);
    }, []);

    const startRequest = useCallback(() => {
        if (activeRequestController.current) {
            activeRequestController.current.abort();
        }
        const controller = new AbortController();
        activeRequestController.current = controller;
        return controller;
    }, []);

    const handleGenerate = useCallback(async (node: HierarchyPointNode<StoryNodeData>, branchType: string) => {
        const controller = startRequest();
        setGeneratingNodeId(node.data.id);
        try {
            const ctx = prepareNodeAiContext(node, projectData);
            const suggestions = await generateBranches(ctx.effectivePath, branchType, aiSettings.model, aiSettings.branchGenerationTemperature, aiSettings.safetySettings, ctx.relevantTraits, projectData.worldLogicRules, ctx.activeScenarios, ctx.activeStatusTags, ctx.activeCharacters, aiSettings.googleSearchEnabled, controller.signal);
            if (controller.signal.aborted) return;
            updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => {
                if (!n.children) n.children = [];
                suggestions.forEach(suggestion => {
                    n.children!.push({ id: generateUUID(), name: suggestion.name, children: [], styleId: 'default', note: '', fantasyDate: ctx.currentDate, pointOfViewCharacterId: ctx.povId, tags: n.tags ? [...n.tags] : undefined });
                });
                n.isCollapsed = false;
            }));
        } catch (error: any) { if (error.name !== 'AbortError') console.error(error); } 
        finally { if (activeRequestController.current === controller) setGeneratingNodeId(null); }
    }, [aiSettings, projectData, updateActiveArcRoot, startRequest]);

    const handleRegenerate = useCallback(async (node: HierarchyPointNode<StoryNodeData>) => {
        if (!node.parent) return;
        const controller = startRequest();
        setRegeneratingNodeId(node.data.id);
        try {
            const ctx = prepareNodeAiContext(node.parent, projectData);
            const suggestion = await regenerateBranch(ctx.effectivePath, node.data.name, aiSettings.model, aiSettings.branchGenerationTemperature, aiSettings.safetySettings, ctx.relevantTraits, projectData.worldLogicRules, ctx.activeScenarios, ctx.activeStatusTags, ctx.activeCharacters, aiSettings.googleSearchEnabled, controller.signal);
            if (controller.signal.aborted) return;
            if (suggestion.name) updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => { n.name = suggestion.name; }));
        } catch (error: any) { if (error.name !== 'AbortError') console.error(error); } 
        finally { if (activeRequestController.current === controller) setRegeneratingNodeId(null); }
    }, [aiSettings, projectData, updateActiveArcRoot, startRequest]);

    const handleCorrectNodeText = useCallback(async (node: HierarchyPointNode<StoryNodeData>) => {
        const controller = startRequest();
        setCorrectingNodeId(node.data.id);
        try {
            const correctedText = await correctText(node.data.name, aiSettings.model, aiSettings.safetySettings, controller.signal);
            if (controller.signal.aborted) return;
            if (correctedText && !correctedText.startsWith('Error:')) updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => { n.name = correctedText; }));
        } catch (error: any) { if (error.name !== 'AbortError') console.error(error); } 
        finally { if (activeRequestController.current === controller) setCorrectingNodeId(null); }
    }, [aiSettings, updateActiveArcRoot, startRequest]);

    const handleTranslateNodeText = useCallback(async (nodeId: string, translationId: string, targetLanguage: string, rootHierarchy: HierarchyNode<StoryNodeData>) => {
        const controller = startRequest();
        setTranslatingNodeId(nodeId);
        try {
            const targetNode = rootHierarchy.descendants().find(d => d.data.id === nodeId);
            if (!targetNode) return;
            const translatedText = await translateText(targetNode.data.name, targetLanguage, aiSettings.model, aiSettings.safetySettings, controller.signal);
            if (controller.signal.aborted) return;
            updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (n) => {
                if (!n.translations) return;
                const tr = n.translations.find(t => t.id === translationId);
                if (tr) tr.text = translatedText;
            }));
        } catch (error: any) { if (error.name !== 'AbortError') console.error(error); } 
        finally { if (activeRequestController.current === controller) setTranslatingNodeId(null); }
    }, [aiSettings, updateActiveArcRoot, startRequest]);

    const handleDirectorChat = useCallback(async (
        node: HierarchyPointNode<StoryNodeData>,
        chatHistory: ChatMessage[],
        userMessageText: string,
        contextOverrides: DirectorContext,
        isRegeneration: boolean = false,
        isSystemMode: boolean = false,
        externalContext: string = "",
        onChunk?: (text: string) => void
    ) => {
        if (!userMessageText && !isRegeneration) return "Error: Mensaje vacío.";
        const controller = startRequest();
        setChatLoadingNodeId(node.data.id);

        if (!isRegeneration) {
            const userMsg: ChatMessage = { id: generateUUID(), role: 'user', text: userMessageText };
            updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => {
                if (!n.directorChatHistory) n.directorChatHistory = [];
                n.directorChatHistory.push(userMsg);
            }), false);
        }

        try {
            const ctx = prepareNodeAiContext(node, projectData, { contextOverrides });
            const result = await directorChat(
                chatHistory, userMessageText, ctx.fullNarrativeHistory, projectData.characters, projectData.scenarios, projectData.tagGroups, projectData.magicSystems, projectData.worldObjects, projectData.species, aiSettings.model, aiSettings.nodeChatTemperature, aiSettings.safetySettings, projectData.psychologicalTraits, projectData.worldLogicRules, ctx.storySummaryString, projectData.narrativeGoals, projectData.flags,
                { fantasyDate: ctx.currentDate, activeCharacterIds: contextOverrides.characterIds, activeScenarioIds: contextOverrides.scenarioIds, activeTagIds: contextOverrides.tagIds, nodeTags: node.data.tags || [], aiRole: contextOverrides.aiRole, aiCustomInstruction: contextOverrides.aiCustomInstruction },
                aiSettings.googleSearchEnabled, isSystemMode, externalContext, controller.signal, undefined, undefined, onChunk
            );

            if (controller.signal.aborted) return "Operación detenida.";

            const { text: responseText, toolCalls, modelContent } = result;
            let systemUpdateMessage = "";
            
            let workingCharacters: Character[] = safeClone(projectData.characters); 
            let workingScenarios: Scenario[] = safeClone(projectData.scenarios);
            let workingSecrets: Secret[] = safeClone(projectData.secrets);
            let workingNations: Nation[] = safeClone(projectData.nations || []);
            let workingMagic: MagicSystem[] = safeClone(projectData.magicSystems || []);
            let workingObjects: WorldObject[] = safeClone(projectData.worldObjects || []);
            let workingSpecies: Species[] = safeClone(projectData.species || []);
            let workingRules: WorldRule[] = safeClone(projectData.worldLogicRules || []);
            let workingLore: LoreEntry[] = safeClone(projectData.loreEntries || []);
            let workingGoals: NarrativeGoal[] = safeClone(projectData.narrativeGoals || []);
            let workingFlags: StoryFlag[] = safeClone(projectData.flags || []);
            
            let hasCharacterChanges = false, hasScenarioChanges = false, hasSecretChanges = false, hasNationChanges = false, hasMagicChanges = false, hasObjectChanges = false, hasSpeciesChanges = false, hasRuleChanges = false, hasLoreChanges = false, hasGoalChanges = false, hasFlagChanges = false;

            const functionResponses: any[] = [];

            if (toolCalls && toolCalls.length > 0) {
                toolCalls.forEach(call => {
                    try {
                        const args = call.args;
                        let success = false;
                        let details = "";
                        
                        // --- CHARACTER TOOLS ---
                        if (call.name === 'rename_character') {
                            const target = findCharacterRobust(args.oldName, workingCharacters);
                            if (target) {
                                renameCharacterGlobally(target.name, args.newName);
                                details = `\n**[Sistema] Nombre Cambiado:** Todos los registros de ${target.name} han sido cambiados a ${args.newName}.`;
                                systemUpdateMessage += details;
                                success = true;
                                // We also update it locally in the working characters for subsequent AI turns
                                target.name = args.newName;
                                hasCharacterChanges = true;
                            }
                        }

                        if (call.name === 'update_attribute') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target) {
                                hasCharacterChanges = true;
                                if (!target.attributes) target.attributes = [];
                                let attr = target.attributes.find(a => normalizeStr(a.name) === normalizeStr(args.attributeName));
                                if (!attr) {
                                    attr = { id: generateUUID(), name: args.attributeName, current: 100, max: 100, color: 'bg-red-500' };
                                    target.attributes.push(attr);
                                }
                                attr.current = Math.max(0, Math.min(attr.max, attr.current + args.valueChange));
                                details = `\n**[Sistema] Atributo:** ${target.name} (${attr.name} -> ${attr.current}). Motivo: ${args.reason}`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'update_state') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target) {
                                hasCharacterChanges = true;
                                if (!target.states) target.states = [];
                                let state = target.states.find(s => normalizeStr(s.name) === normalizeStr(args.stateName));
                                if (state) {
                                    Object.assign(state, { active: args.active, intensity: args.intensity ?? state.intensity, description: args.description, duration: args.duration });
                                } else if (args.active) {
                                    target.states.push({ id: generateUUID(), name: args.stateName, active: true, type: (args.type || 'Physical') as any, intensity: args.intensity || 5, description: args.description, duration: args.duration || '' });
                                }
                                details = `\n**[Sistema] Estado:** ${target.name} ahora está **${args.stateName}** (${args.active ? 'ON' : 'OFF'}).`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'update_relationship') {
                            const source = findCharacterRobust(args.sourceCharacterName, workingCharacters);
                            const target = findCharacterRobust(args.targetCharacterName, workingCharacters);
                            if (source && target) {
                                hasCharacterChanges = true;
                                if (!source.relationships) source.relationships = [];
                                let rel = source.relationships.find(r => r.targetCharacterId === target.id);
                                if (!rel) {
                                    rel = { id: generateUUID(), targetCharacterId: target.id, score: 50, type: (args.relationshipType || 'Neutral') as any, description: args.description || '' };
                                    source.relationships.push(rel);
                                }
                                rel.score = Math.max(0, Math.min(100, rel.score + args.scoreChange));
                                if (args.relationshipType) rel.type = args.relationshipType as any;
                                if (args.description) rel.description = args.description;
                                if (args.secretNotes) rel.notes = args.secretNotes;
                                details = `\n**[Sistema] Relación:** Afinidad de ${source.name} hacia ${target.name} ahora es ${rel.score}%.`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'update_inventory') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target) {
                                hasCharacterChanges = true;
                                if (!target.inventory) target.inventory = [];
                                let item = target.inventory.find(i => normalizeStr(i.name) === normalizeStr(args.itemName));
                                if (item) {
                                    item.quantity = Math.max(0, item.quantity + args.quantityChange);
                                    if (args.description) item.description = args.description;
                                } else if (args.quantityChange > 0) {
                                    target.inventory.push({ id: generateUUID(), name: args.itemName, quantity: args.quantityChange, type: 'Misc', description: args.description || '', equipped: false });
                                }
                                details = `\n**[Sistema] Inventario:** ${target.name} (${args.itemName} x${args.quantityChange}).`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'learn_skill') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target) {
                                hasCharacterChanges = true;
                                if (!target.abilitiesList) target.abilitiesList = [];
                                target.abilitiesList.push({ id: generateUUID(), name: args.skillName, type: (args.type || 'Active') as any, description: args.description });
                                details = `\n**[Sistema] Habilidad:** ${target.name} aprendió **${args.skillName}**.`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'manage_memory') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target && args.action === 'add') {
                                hasCharacterChanges = true;
                                if (!target.memories) target.memories = [];
                                target.memories.push({ id: generateUUID(), text: args.memoryText, type: args.type || 'event', isCore: args.isCore, intensity: args.intensity, timeframe: args.timeframe });
                                details = `\n**[Sistema] Memoria:** Nuevo recuerdo para ${target.name}.`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'manage_evolution') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target) {
                                hasCharacterChanges = true;
                                if (!target.evolution) target.evolution = [];
                                if (args.action === 'add' || args.action === 'complete') {
                                    target.evolution.push({ id: generateUUID(), name: args.milestoneName, description: args.description || '', mentalState: '', roleAtMoment: '', locationAtMoment: '', tacticalPoints: [], privateThoughts: '', diaryFragment: '', category: args.category as any, priority: args.priority || 'Medium', achieved: args.action === 'complete', dateAchieved: args.action === 'complete' ? ctx.currentDate : undefined, arcId: projectData.activeArcId });
                                }
                                details = `\n**[Sistema] Evolución:** Hito '${args.milestoneName}' (${args.action}) para **${target.name}**.`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'update_mind_voice') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target) {
                                hasCharacterChanges = true;
                                if (!target.voice) target.voice = { tone: '', rhythm: '', vocabulary: '', style: '', catchphrases: [], sampleQuote: '', ideals: '', flaws: '', fears: '', desires: '', coreBeliefs: '', decisionMaking: '', innerMonologue: '' };
                                if (args.tone) target.voice.tone = args.tone;
                                if (args.rhythm) target.voice.rhythm = args.rhythm;
                                if (args.vocabulary) target.voice.vocabulary = args.vocabulary;
                                if (args.style) target.voice.style = args.style;
                                if (args.addCatchphrase) target.voice.catchphrases.push(args.addCatchphrase);
                                if (args.sampleQuote) target.voice.sampleQuote = args.sampleQuote;
                                if (args.ideals) target.voice.ideals = args.ideals;
                                if (args.flaws) target.voice.flaws = args.flaws;
                                if (args.fears) target.voice.fears = args.fears;
                                if (args.desires) target.voice.desires = args.desires;
                                if (args.coreBeliefs) target.voice.coreBeliefs = args.coreBeliefs;
                                if (args.decisionMaking) target.voice.decisionMaking = args.decisionMaking;
                                if (args.innerMonologue) target.voice.innerMonologue = args.innerMonologue;
                                details = `\n**[Sistema] Cerebro/Voz:** Perfil psicológico y voz actualizados para **${target.name}**.`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'manage_deep_evolution') {
                            const target = findCharacterRobust(args.characterName, workingCharacters);
                            if (target) {
                                hasCharacterChanges = true;
                                if (!target.evolution) target.evolution = [];
                                target.evolution.push({ id: generateUUID(), name: args.stageName, description: args.keyMoments || '', mentalState: args.mentalState, roleAtMoment: args.role, locationAtMoment: args.location, tacticalPoints: args.tacticalPoints || [], privateThoughts: args.privateThoughts || '', diaryFragment: args.diaryFragment || '', category: args.category as any, priority: 'Medium', achieved: true, dateAchieved: ctx.currentDate, arcId: projectData.activeArcId });
                                details = `\n**[Sistema] Evolución:** Dossier de etapa generado para **${target.name}**.`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        // --- WORLD TOOLS ---
                        if (call.name === 'manage_scenario' && args.action === 'create') {
                            hasScenarioChanges = true;
                            // Added missing required Scenario properties: aliases, attributes
                            workingScenarios.push({ id: generateUUID(), name: args.scenarioName, description: args.description, atmosphere: args.atmosphere, sensoryDetails: args.sensoryDetails, active: args.active !== false, aliases: [], attributes: [] });
                            details = `\n**[Sistema] Mundo:** Nuevo lugar registrado: **${args.scenarioName}**.`;
                            systemUpdateMessage += details;
                            success = true;
                        }

                        if (call.name === 'manage_secret' && args.action === 'create') {
                            hasSecretChanges = true;
                            workingSecrets.push({ id: generateUUID(), name: args.secretName, content: args.content, status: args.status || 'hidden', category: args.category || 'Otro', level: args.level || 1, active: true });
                            details = `\n**[Sistema] Trama:** Nuevo secreto oculto: **${args.secretName}**.`;
                            systemUpdateMessage += details;
                            success = true;
                        }

                        if (call.name === 'manage_world_element' && args.action === 'create') {
                            const name = args.name;
                            const desc = args.description;
                            switch(args.category) {
                                // Added missing required properties for each world element
                                case 'Magic': hasMagicChanges = true; workingMagic.push({ id: generateUUID(), name, description: desc, active: true, aliases: [], abilitiesList: [], rules: [] }); break;
                                case 'Object': hasObjectChanges = true; workingObjects.push({ id: generateUUID(), name, description: desc, active: true, aliases: [], abilitiesList: [], rules: [] }); break;
                                case 'Species': hasSpeciesChanges = true; workingSpecies.push({ id: generateUUID(), name, description: desc, active: true, aliases: [], attributes: [], abilitiesList: [] }); break;
                                case 'Lore': hasLoreChanges = true; workingLore.push({ id: generateUUID(), name, content: desc, category: args.details || 'General', active: true, aliases: [] }); break;
                                case 'Rule': hasRuleChanges = true; workingRules.push({ id: generateUUID(), text: name, description: desc, consequences: args.details, active: true }); break;
                            }
                            details = `\n**[Sistema] Base de Datos:** Creado elemento de tipo ${args.category}: **${name}**.`;
                            systemUpdateMessage += details;
                            success = true;
                        }

                        if (call.name === 'manage_nation') {
                            const nat = findNationRobust(args.nationName, workingNations);
                            if (nat) {
                                hasNationChanges = true;
                                if (args.category === 'Geography' && args.action === 'add') {
                                    if (!nat.regions) nat.regions = [];
                                    if (args.subType === 'Region') {
                                        // Added missing required Region property: capital
                                        nat.regions.push({ id: generateUUID(), name: args.itemName, description: args.description, cities: [], landmarks: [], capital: false });
                                    } else if (args.subType === 'City') {
                                        const reg = nat.regions.find(r => normalizeStr(r.name) === normalizeStr(args.parentName || ''));
                                        if (reg) {
                                            if (!reg.cities) reg.cities = [];
                                            // Added missing required City property: isCapital
                                            reg.cities.push({ id: generateUUID(), name: args.itemName, description: args.description, type: 'City', isCapital: false });
                                        }
                                    }
                                } else if (args.category === 'Diplomacy' && args.action === 'add') {
                                    if (!nat.treaties) nat.treaties = [];
                                    nat.treaties.push({ id: generateUUID(), name: args.itemName, partner: args.targetEntity, description: args.description, type: args.subType || 'Alliance' });
                                } else if (args.category === 'Conflict' && args.action === 'add') {
                                    if (!nat.conflicts) nat.conflicts = [];
                                    nat.conflicts.push({ id: generateUUID(), name: args.itemName, opponent: args.targetEntity, description: args.description, type: args.subType || 'War' });
                                }
                                details = `\n**[Sistema] Geopolítica:** Actualizada nación **${nat.name}** (${args.category}).`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'manage_story_flow') {
                            if (args.type === 'Goal' && args.action === 'create') {
                                hasGoalChanges = true;
                                workingGoals.push({ id: generateUUID(), description: args.name, type: 'Plot', status: args.status || 'Active', priority: args.priority || 'Medium', progress: args.progress || 0, active: true });
                                details = `\n**[Sistema] Objetivo:** Nueva misión registrada: **${args.name}**.`;
                                systemUpdateMessage += details;
                                success = true;
                            } else if (args.type === 'Flag') {
                                hasFlagChanges = true;
                                let flag = workingFlags.find(f => normalizeStr(f.name) === normalizeStr(args.name));
                                if (!flag && args.action === 'create') {
                                    workingFlags.push({ id: generateUUID(), name: args.name, state: args.state ?? false, active: true });
                                } else if (flag) {
                                    if (args.state !== undefined) flag.state = args.state;
                                }
                                details = `\n**[Sistema] Flag:** Interruptor **${args.name}** puesto en **${args.state}**.`;
                                systemUpdateMessage += details;
                                success = true;
                            }
                        }

                        if (call.name === 'update_node_story_text') {
                            updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => {
                                n.name = args.newText;
                            }), true);
                            details = `\n**[Sistema] Historia:** El texto de la escena actual ha sido modificado.`;
                            systemUpdateMessage += details;
                            success = true;
                        }

                        if (call.name === 'update_director_message') {
                            updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => {
                                if (n.directorChatHistory) {
                                    const snippet = args.messageSnippet.toLowerCase();
                                    const targetMessages = n.directorChatHistory.filter(m => m.role === 'model' && m.text.toLowerCase().includes(snippet));
                                    if (targetMessages.length > 0) {
                                        targetMessages[targetMessages.length - 1].text = args.newText;
                                    }
                                }
                            }), true);
                            details = `\n**[Sistema] Historia:** Un mensaje anterior del director ha sido editado.`;
                            systemUpdateMessage += details;
                            success = true;
                        }

                        functionResponses.push({
                            name: call.name,
                            response: { result: success ? "Success" : "Ignored or Not Found", details: details }
                        });

                    } catch (e) { 
                        console.error("Tool execution error", e); 
                        functionResponses.push({
                            name: call.name,
                            response: { result: "Error", details: String(e) }
                        });
                    }
                });
            }

            if (hasCharacterChanges) updateGlobalEntity('characters', 'all', workingCharacters, true);
            if (hasScenarioChanges) updateGlobalEntity('scenarios', 'all', workingScenarios, true);
            if (hasSecretChanges) updateGlobalEntity('secrets', 'all', workingSecrets, true);
            if (hasNationChanges) updateGlobalEntity('nations', 'all', workingNations, true);
            if (hasMagicChanges) updateGlobalEntity('magicSystems', 'all', workingMagic, true);
            if (hasObjectChanges) updateGlobalEntity('worldObjects', 'all', workingObjects, true);
            if (hasSpeciesChanges) updateGlobalEntity('species', 'all', workingSpecies, true);
            if (hasRuleChanges) updateGlobalEntity('worldLogicRules', 'all', workingRules, true);
            if (hasLoreChanges) updateGlobalEntity('loreEntries', 'all', workingLore, true);
            if (hasGoalChanges) updateGlobalEntity('narrativeGoals', 'all', workingGoals, true);
            if (hasFlagChanges) updateGlobalEntity('flags', 'all', workingFlags, true);

            let finalText = systemUpdateMessage ? `${responseText}\n\n---${systemUpdateMessage}` : (responseText || "Respuesta recibida.");

            if (toolCalls && toolCalls.length > 0 && functionResponses.length > 0) {
                try {
                    const secondResult = await directorChat(
                        chatHistory, userMessageText, ctx.fullNarrativeHistory, workingCharacters, workingScenarios, projectData.tagGroups, workingMagic, workingObjects, workingSpecies, aiSettings.model, aiSettings.nodeChatTemperature, aiSettings.safetySettings, projectData.psychologicalTraits, workingRules, ctx.storySummaryString, workingGoals, workingFlags,
                        { fantasyDate: ctx.currentDate, activeCharacterIds: contextOverrides.characterIds, activeScenarioIds: contextOverrides.scenarioIds, activeTagIds: contextOverrides.tagIds, nodeTags: node.data.tags || [], aiRole: contextOverrides.aiRole, aiCustomInstruction: contextOverrides.aiCustomInstruction },
                        aiSettings.googleSearchEnabled, isSystemMode, externalContext, controller.signal,
                        modelContent, functionResponses, onChunk
                    );
                    
                    if (secondResult.text && secondResult.text !== "Error.") {
                        finalText = systemUpdateMessage ? `${secondResult.text}\n\n---${systemUpdateMessage}` : secondResult.text;
                    } else if (secondResult.text === "Error.") {
                        finalText = systemUpdateMessage ? `Hubo un error de conexión al generar la respuesta interactiva, pero las herramientas se ejecutaron:\n---${systemUpdateMessage}` : "Error de red en el segundo turno.";
                    }
                } catch (e) {
                    console.error("Second turn error", e);
                    finalText = systemUpdateMessage ? `Las herramientas se ejecutaron correctamente pero falló el resumen final de la IA:\n---${systemUpdateMessage}` : "Error en el segundo turno.";
                }
            }

            const aiMsg: ChatMessage = { id: generateUUID(), role: 'model', text: finalText };
            updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => {
                if (!n.directorChatHistory) n.directorChatHistory = [];
                n.directorChatHistory.push(aiMsg);
            }), true);
            return finalText;
        } catch (e: any) { 
            if (e.name === 'AbortError') return "Operación detenida.";
            console.error(e); 
            return "Error en la charla."; 
        } finally { 
            if (activeRequestController.current === controller) setChatLoadingNodeId(null); 
        }
    }, [aiSettings, projectData, updateActiveArcRoot, updateGlobalEntity, startRequest]);

    const handleContinuePlot = useCallback(async (node: HierarchyPointNode<StoryNodeData>, userGuidance?: string, contextOverrides?: DirectorContext) => {
        const controller = startRequest();
        setContinuingPlotNodeId(node.data.id);
        try {
            updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => { n.lastPlotGuidance = userGuidance; }));
            const ctx = prepareNodeAiContext(node, projectData, { contextOverrides });
            const result = await continuePlot(ctx.fullNarrativeHistory, ctx.activeCharacters, ctx.activeScenarios, projectData.magicSystems, projectData.worldObjects, projectData.species, aiSettings.model, aiSettings.branchGenerationTemperature, aiSettings.safetySettings, ctx.relevantTraits, projectData.worldLogicRules, ctx.storySummaryString, projectData.narrativeGoals, projectData.flags, userGuidance, aiSettings.googleSearchEnabled, controller.signal);
            if (controller.signal.aborted) return;
            if (result) {
                updateActiveArcRoot(root => findNodeAndModify(root, node.data.id, (n) => {
                    if (!n.children) n.children = [];
                    const inh = getEffectiveNodeContext(node);
                    n.children.push({ id: generateUUID(), name: result.summary, note: result.details, children: [], styleId: 'default', fantasyDate: ctx.currentDate, pointOfViewCharacterId: ctx.povId, characterStateOverrides: inh.overrides ? safeClone(inh.overrides) : undefined, tags: n.tags ? [...n.tags] : undefined });
                    n.isCollapsed = false;
                }));
            }
        } catch (error: any) { if (error.name !== 'AbortError') console.error(error); } 
        finally { if (activeRequestController.current === controller) setContinuingPlotNodeId(null); }
    }, [aiSettings, projectData, updateActiveArcRoot, startRequest]);

    return useMemo(() => ({
        loadingStates: { generatingNodeId, regeneratingNodeId, correctingNodeId, continuingPlotNodeId, translatingNodeId, chatLoadingNodeId, regeneratingMessageId, setTranslatingNodeId, setChatLoadingNodeId },
        actions: { handleGenerate, handleRegenerate, handleCorrectNodeText, handleTranslateNodeText, handleContinuePlot, handleDirectorChat, handleStopGeneration }
    }), [generatingNodeId, regeneratingNodeId, correctingNodeId, continuingPlotNodeId, translatingNodeId, chatLoadingNodeId, regeneratingMessageId, handleGenerate, handleRegenerate, handleCorrectNodeText, handleTranslateNodeText, handleContinuePlot, handleStopGeneration]);
};
