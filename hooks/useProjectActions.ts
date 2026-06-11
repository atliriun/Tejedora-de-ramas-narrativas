
import { useCallback } from 'react';
import { ProjectData, ArcProfileData, ContextPreset, AiSettings, EntityType, StoryNodeData, StoryArc } from '../types';
import { cloneTreeWithNewIds } from '../utils/treeUtils';
import { INITIAL_NODE_DATA, INITIAL_AI_SETTINGS } from '../constants';
import { generateUUID, safeClone } from '../utils/uuid';

export const useProjectActions = (
    setProjectData: (action: ProjectData | ((prevState: ProjectData) => ProjectData), overwrite?: boolean) => void,
    setProjectName: (name: string) => void,
    clearHistory: (state: ProjectData) => void,
    setAiSettings: (settings: AiSettings) => void,
    loadChatData: (data: any) => void
) => {

    const handleNewProject = useCallback(() => {
        const newRootId = generateUUID();
        const freshRoot: StoryNodeData = {
            ...INITIAL_NODE_DATA,
            id: newRootId,
            children: []
        };
        const freshArc: StoryArc = {
            id: generateUUID(),
            name: 'Historia Principal',
            rootNode: freshRoot,
            significance: 10
        };
        
        const freshData: ProjectData = {
            storyArcs: [freshArc],
            activeArcId: freshArc.id,
            characters: [],
            scenarios: [],
            scenarioProfiles: [],
            psychologicalTraits: [],
            traitProfiles: [],
            worldLogicRules: [],
            ruleProfiles: [],
            magicSystems: [],
            magicSystemProfiles: [],
            worldObjects: [],
            worldObjectProfiles: [],
            species: [],
            speciesProfiles: [],
            secrets: [],
            secretProfiles: [],
            nations: [],
            nationProfiles: [],
            tagGroups: [],
            loreEntries: [],
            loreProfiles: [],
            narrativeGoals: [],
            goalProfiles: [],
            contextPresets: [],
            flags: [],
            flagProfiles: [],
            referenceDocuments: [],
        };

        setProjectName('Nuevo Proyecto');
        setAiSettings(INITIAL_AI_SETTINGS);
        clearHistory(freshData);
    }, [setProjectName, clearHistory, setAiSettings]);

    const handleLoadProject = useCallback((state: any) => {
        try {
            if(state && (state.storyArcs || state.activeArcId)) {
                // 1. Construct Complete Data Object with defaults
                let fullProjectData: ProjectData = {
                    ...state,
                    characters: state.characters || [],
                    scenarios: state.scenarios || [],
                    scenarioProfiles: state.scenarioProfiles || [],
                    storyArcs: state.storyArcs || [],
                    magicSystems: state.magicSystems || [],
                    magicSystemProfiles: state.magicSystemProfiles || [],
                    worldObjects: state.worldObjects || [],
                    worldObjectProfiles: state.worldObjectProfiles || [],
                    species: state.species || [],
                    speciesProfiles: state.speciesProfiles || [],
                    secrets: state.secrets || [],
                    secretProfiles: state.secretProfiles || [],
                    nations: state.nations || [],
                    nationProfiles: state.nationProfiles || [],
                    psychologicalTraits: state.psychologicalTraits || [],
                    traitProfiles: state.traitProfiles || [],
                    worldLogicRules: state.worldLogicRules || [],
                    ruleProfiles: state.ruleProfiles || [], 
                    tagGroups: state.tagGroups || [],
                    loreEntries: state.loreEntries || [],
                    loreProfiles: state.loreProfiles || [],
                    narrativeGoals: state.narrativeGoals || [],
                    goalProfiles: state.goalProfiles || [], 
                    contextPresets: state.contextPresets || [],
                    flags: state.flags || [],
                    flagProfiles: state.flagProfiles || [],
                    activeArcId: state.activeArcId || (state.storyArcs && state.storyArcs[0]?.id) || ''
                };

                // 2. SANITIZATION ROUTINE (Clean up old files)
                const validTraitIds = new Set(fullProjectData.psychologicalTraits.map(t => t.id));
                const validCharIds = new Set(fullProjectData.characters.map(c => c.id));

                fullProjectData.characters = fullProjectData.characters.map(c => ({
                    ...c,
                    traitIds: (c.traitIds || []).filter(tid => validTraitIds.has(tid)),
                    relationships: (c.relationships || []).filter(r => validCharIds.has(r.targetCharacterId))
                }));

                fullProjectData.secrets = fullProjectData.secrets.map(s => ({
                    ...s,
                    knownByCharacterIds: (s.knownByCharacterIds || []).filter(cid => validCharIds.has(cid))
                }));
                
                setProjectName(state.projectName || 'Semidios Atrapado');
                clearHistory(fullProjectData);
                if (state.aiSettings) setAiSettings(state.aiSettings);
                loadChatData(state);
                console.log("Project loaded and sanitized successfully.");
            } else {
                alert("Error: Invalid project file. Missing core data.");
            }
        } catch (e) {
            console.error("Failed to load project:", e);
            alert("Critical Error: Could not parse project file.");
        }
    }, [setProjectName, clearHistory, setAiSettings, loadChatData]);

    const handleDeleteItem = useCallback((type: EntityType, id: string) => {
        setProjectData(d => {
            if (!d) return d;
            const filter = (arr: any[]) => (arr || []).filter(x => x.id !== id);
            
            switch (type) {
                case 'character': 
                    const remainingChars = filter(d.characters);
                    const cleanedChars = remainingChars.map(c => ({
                        ...c,
                        relationships: c.relationships?.filter(r => r.targetCharacterId !== id)
                    }));
                    const cleanedSecrets = d.secrets.map(s => ({
                        ...s,
                        knownByCharacterIds: s.knownByCharacterIds?.filter(charId => charId !== id)
                    }));
                    return { ...d, characters: cleanedChars, secrets: cleanedSecrets };
                case 'scenario': return { ...d, scenarios: filter(d.scenarios) };
                case 'magic system': return { ...d, magicSystems: filter(d.magicSystems) };
                case 'world object': return { ...d, worldObjects: filter(d.worldObjects) };
                case 'species': return { ...d, species: filter(d.species) };
                case 'secret': return { ...d, secrets: filter(d.secrets) };
                case 'nation': return { ...d, nations: filter(d.nations) };
                case 'psychological trait': 
                    const remainingTraits = filter(d.psychologicalTraits);
                    const charsCleanedOfTrait = d.characters.map(c => ({
                        ...c,
                        traitIds: c.traitIds?.filter(tid => tid !== id)
                    }));
                    return { ...d, psychologicalTraits: remainingTraits, characters: charsCleanedOfTrait };
                case 'world logic rule': return { ...d, worldLogicRules: filter(d.worldLogicRules) };
                case 'tag group': return { ...d, tagGroups: filter(d.tagGroups) };
                case 'lore entry': return { ...d, loreEntries: filter(d.loreEntries) };
                case 'narrative goal': return { ...d, narrativeGoals: filter(d.narrativeGoals || []) };
                case 'story arc': 
                    const newArcs = (d.storyArcs || []).filter(a => a.id !== id);
                    const nextActiveId = d.activeArcId === id ? (newArcs[0]?.id || '') : d.activeArcId;
                    return { ...d, storyArcs: newArcs, activeArcId: nextActiveId };
                case 'story flag': return { ...d, flags: filter(d.flags) };
                default: return d;
            }
        });
    }, [setProjectData]);

    const handleCreateItem = useCallback(<T extends { id: string }>(key: keyof ProjectData, template: Partial<T>) => {
        setProjectData(d => {
            if (!d) return d;
            const newItem = { id: generateUUID(), ...template } as T;
            const list = d[key];
            if (Array.isArray(list)) {
                return { ...d, [key]: [...list, newItem] };
            }
            return d;
        });
    }, [setProjectData]);

    const handleUpdateItem = useCallback((key: keyof ProjectData, id: string, updates: any, overwrite?: boolean) => {
        setProjectData(d => {
            if (!d) return d;
            if (id === 'all' && Array.isArray(updates)) {
                return { ...d, [key]: updates };
            }
            const list = d[key];
            if (Array.isArray(list)) {
                return { ...d, [key]: list.map(item => item.id === id ? { ...item, ...updates } : item) };
            }
            return d;
        }, overwrite);
    }, [setProjectData]);

    const handleRenameCharacterGlobally = useCallback((oldName: string, newName: string) => {
        if (!oldName || !newName || oldName === newName) return;
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        const replaceStr = (str: string | undefined): string => str ? str.replace(regex, newName) : '';

        setProjectData(d => {
            if (!d) return d;
            
            // Deep clone to ensure immutability
            const nextData = safeClone(d) as ProjectData;

            // 1. Rename the character itself
            const character = nextData.characters.find(c => c.name === oldName);
            if (character) character.name = newName;

            // 2. Rename in Lore, Narratives, Rules, etc.
            if (nextData.loreEntries) nextData.loreEntries.forEach(l => { l.content = replaceStr(l.content); });
            if (nextData.narrativeGoals) nextData.narrativeGoals.forEach(g => { g.description = replaceStr(g.description); });
            if (nextData.worldLogicRules) nextData.worldLogicRules.forEach(r => { r.description = replaceStr(r.description); });
            if (nextData.scenarios) nextData.scenarios.forEach(s => { s.description = replaceStr(s.description); });
            if (nextData.secrets) nextData.secrets.forEach(s => { s.content = replaceStr(s.content); });

            // 3. Rename in all story arcs
            const traverseNode = (n: StoryNodeData) => {
                n.name = replaceStr(n.name);
                n.note = replaceStr(n.note);
                n.customArcSummary = replaceStr(n.customArcSummary);
                n.customCharactersSummary = replaceStr(n.customCharactersSummary);
                n.blocks?.forEach(b => { 
                    b.text = replaceStr(b.text); 
                });
                n.directorChatHistory?.forEach(c => { 
                    c.text = replaceStr(c.text); 
                });
                n.translations?.forEach(t => { 
                    t.text = replaceStr(t.text); 
                });
                n.children?.forEach(traverseNode);
            };

            nextData.storyArcs.forEach(a => traverseNode(a.rootNode));

            return nextData;
        });
    }, [setProjectData]);

    const handleSetActiveArc = useCallback((id: string) => {
        setProjectData(d => d ? ({ ...d, activeArcId: id }) : d);
    }, [setProjectData]);

    const handleAddArc = useCallback(() => {
        setProjectData(d => {
            if (!d) return d;
            const newArc = { 
                id: generateUUID(), 
                name: `Nuevo Arco ${(d.storyArcs || []).length + 1}`, 
                rootNode: safeClone(INITIAL_NODE_DATA), 
                significance: 5 
            };
            newArc.rootNode.id = generateUUID(); 
            return { ...d, storyArcs: [...(d.storyArcs || []), newArc], activeArcId: newArc.id }; 
        });
    }, [setProjectData]);

    const handleDuplicateArc = useCallback((arcId: string) => {
        setProjectData(d => {
            if (!d) return d;
            const originalArc = (d.storyArcs || []).find(a => a.id === arcId);
            if (!originalArc) return d;
            const newRoot = cloneTreeWithNewIds(originalArc.rootNode);
            const newArc = { ...originalArc, id: generateUUID(), name: `${originalArc.name} (Copia)`, rootNode: newRoot };
            return { ...d, storyArcs: [...(d.storyArcs || []), newArc], activeArcId: newArc.id };
        });
    }, [setProjectData]);

    const handlePromoteBranchToArc = useCallback((nodeId: string) => {
        setProjectData(d => {
            if (!d) return d;
            const activeArcIndex = d.storyArcs.findIndex(a => a.id === d.activeArcId);
            if (activeArcIndex === -1) return d;
            const activeArc = d.storyArcs[activeArcIndex];
            if (activeArc.rootNode.id === nodeId) {
                alert("No se puede promover el nodo raíz.");
                return d;
            }
            let foundNode: StoryNodeData | null = null;
            const findAndDetach = (node: StoryNodeData): boolean => {
                if (!node.children) return false;
                const index = node.children.findIndex(child => child.id === nodeId);
                if (index !== -1) {
                    foundNode = node.children[index];
                    node.children.splice(index, 1);
                    return true;
                }
                for (const child of node.children) {
                    if (findAndDetach(child)) return true;
                }
                return false;
            };
            const newRootNode = safeClone(activeArc.rootNode);
            const found = findAndDetach(newRootNode);
            if (!found || !foundNode) return d;
            const newArcRoot: StoryNodeData = { ...foundNode };
            const newArc: StoryArc = {
                id: generateUUID(),
                name: (foundNode.name && foundNode.name.length > 30) ? foundNode.name.substring(0, 30) + "..." : (foundNode.name || "Nuevo Arco Dividido"),
                rootNode: newArcRoot,
                significance: 5,
                summary: `Rama dividida de ${activeArc.name}`
            };
            const updatedOldArc = { ...activeArc, rootNode: newRootNode };
            const newStoryArcs = [...d.storyArcs];
            newStoryArcs[activeArcIndex] = updatedOldArc;
            newStoryArcs.push(newArc);
            return { ...d, storyArcs: newStoryArcs, activeArcId: newArc.id };
        });
    }, [setProjectData]);

    const handleReorderArcs = useCallback((newArcs: StoryArc[]) => {
        setProjectData(d => d ? ({ ...d, storyArcs: newArcs }) : d);
    }, [setProjectData]);

    const handleAddPreset = useCallback((name: string) => {
        setProjectData(d => {
            if (!d) return d;
            const arcConfig: Record<string, ArcProfileData> = {};
            (d.storyArcs || []).forEach(arc => {
                arcConfig[arc.id] = { significance: arc.significance || 0, summary: arc.summary || '' };
            });
            const newPreset: ContextPreset = { id: generateUUID(), name, arcConfig };
            return { ...d, contextPresets: [...(d.contextPresets || []), newPreset] };
        });
    }, [setProjectData]);

    const handleApplyPreset = useCallback((presetId: string) => {
        setProjectData(d => {
            if (!d) return d;
            const preset = (d.contextPresets || []).find(p => p.id === presetId);
            if (!preset) return d;
            const updatedArcs = (d.storyArcs || []).map(arc => {
                const config = preset.arcConfig[arc.id];
                if (config) return { ...arc, significance: config.significance, summary: config.summary };
                return arc;
            });
            return { ...d, storyArcs: updatedArcs };
        });
    }, [setProjectData]);

    const handleUpdatePreset = useCallback((presetId: string) => {
        setProjectData(d => {
            if (!d) return d;
            const arcConfig: Record<string, ArcProfileData> = {};
            (d.storyArcs || []).forEach(arc => {
                arcConfig[arc.id] = { significance: arc.significance || 0, summary: arc.summary || '' };
            });
            return { ...d, contextPresets: (d.contextPresets || []).map(p => p.id === presetId ? { ...p, arcConfig } : p) };
        });
    }, [setProjectData]);

    const handleDeletePreset = useCallback((presetId: string) => {
        setProjectData(d => d ? ({ ...d, contextPresets: (d.contextPresets || []).filter(p => p.id !== presetId) }) : d);
    }, [setProjectData]);

    const handleCreateProfile = useCallback((name: string, profileListKey: keyof ProjectData, entityListKey: keyof ProjectData, configKeyInProfile: string) => {
        setProjectData(d => {
            if (!d) return d;
            const config: any = {};
            const entities = d[entityListKey] as any[];
            entities.forEach(item => {
                const isActive = item.active !== false;
                if (configKeyInProfile === 'traits') {
                    config[item.id] = { active: isActive, intensity: item.intensity || 5 };
                } else {
                    config[item.id] = isActive;
                }
            });
            const newProfile = { id: generateUUID(), name, [configKeyInProfile]: config };
            return { ...d, [profileListKey]: [...(d[profileListKey] as any[] || []), newProfile] };
        });
    }, [setProjectData]);

    const handleApplyProfile = useCallback((profileId: string, profileListKey: keyof ProjectData, entityListKey: keyof ProjectData, configKeyInProfile: string) => {
        setProjectData(d => {
            if (!d) return d;
            const profile = (d[profileListKey] as any[]).find(p => p.id === profileId);
            if (!profile) return d;
            const config = profile[configKeyInProfile];
            const updatedEntities = (d[entityListKey] as any[]).map(item => {
                const savedState = config[item.id];
                if (savedState === undefined) return item;
                if (configKeyInProfile === 'traits') {
                    return { ...item, active: savedState.active, intensity: savedState.intensity };
                } else {
                    return { ...item, active: savedState };
                }
            });
            return { ...d, [entityListKey]: updatedEntities };
        });
    }, [setProjectData]);

    const handleUpdateProfile = useCallback((profileId: string, profileListKey: keyof ProjectData, entityListKey: keyof ProjectData, configKeyInProfile: string) => {
        setProjectData(d => {
            if (!d) return d;
            const config: any = {};
            const entities = d[entityListKey] as any[];
            entities.forEach(item => {
                const isActive = item.active !== false;
                if (configKeyInProfile === 'traits') {
                    config[item.id] = { active: isActive, intensity: item.intensity || 5 };
                } else {
                    config[item.id] = isActive;
                }
            });
            return { ...d, [profileListKey]: (d[profileListKey] as any[]).map(p => p.id === profileId ? { ...p, [configKeyInProfile]: config } : p) };
        });
    }, [setProjectData]);

    const handleDeleteProfile = useCallback((profileId: string, profileListKey: keyof ProjectData) => {
        setProjectData(d => d ? ({ ...d, [profileListKey]: (d[profileListKey] as any[]).filter(p => p.id !== profileId) }) : d);
    }, [setProjectData]);

    const handleGlobalReplace = useCallback((searchStr: string, replaceStr: string, matchCase: boolean, wholeWord: boolean) => {
        if (!searchStr) return;
        
        const textualKeys = new Set([
            'text', 'name', 'description', 'content', 'note', 'summary', 
            'appearance', 'personality', 'backstory', 'mainMotivation', 
            'ticsMannerisms', 'catchphrases', 'sampleQuote', 'notes', 
            'atmosphere', 'sensoryDetails', 'aliases', 'chatDraft', 'customArcSummary', 'customCharactersSummary', 'lastPlotGuidance'
        ]);

        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = matchCase ? 'g' : 'gi';
        const pattern = wholeWord ? `\\b${escapeRegExp(searchStr)}\\b` : escapeRegExp(searchStr);
        const regex = new RegExp(pattern, flags);

        const recursiveReplace = (obj: any): any => {
            if (obj === null || obj === undefined) return obj;
            
            if (typeof obj === 'string') {
                return obj; // We only replace specific keys
            }
            
            if (Array.isArray(obj)) {
                return obj.map(item => recursiveReplace(item));
            }
            
            if (typeof obj === 'object') {
                const newObj: any = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (textualKeys.has(key)) {
                        if (typeof value === 'string') {
                            newObj[key] = value.replace(regex, replaceStr);
                        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                            newObj[key] = value.map(v => typeof v === 'string' ? v.replace(regex, replaceStr) : v);
                        } else if (typeof value === 'object') {
                            newObj[key] = recursiveReplace(value);
                        } else {
                            newObj[key] = value;
                        }
                    } else if (typeof value === 'object') {
                        newObj[key] = recursiveReplace(value);
                    } else {
                        newObj[key] = value;
                    }
                }
                return newObj;
            }
            
            return obj;
        };

        setProjectData(d => {
            if (!d) return d;
            return recursiveReplace(d) as ProjectData;
        });
    }, [setProjectData]);

    return {
        handleNewProject,
        handleLoadProject,
        handleDeleteItem,
        handleCreateItem,
        handleUpdateItem,
        handleRenameCharacterGlobally,
        handleSetActiveArc,
        handleAddArc,
        handleDuplicateArc,
        handleReorderArcs,
        handlePromoteBranchToArc,
        handleAddPreset,
        handleApplyPreset,
        handleUpdatePreset,
        handleDeletePreset,
        handleCreateProfile,
        handleApplyProfile,
        handleUpdateProfile,
        handleDeleteProfile,
        handleGlobalReplace
    };
};
