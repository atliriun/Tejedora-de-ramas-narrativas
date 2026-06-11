
import { get, set } from 'idb-keyval';
import { ProjectData, StoryArc, TagGroup, NationResource, NationFaction, NationDetailItem } from '../types';
import { INITIAL_NODE_DATA } from '../constants';
import { uuid } from './uuid';

const safeGetItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const loadProjectDataFromDB = async (): Promise<ProjectData> => {
    // Helper to migrate strings to resources
    const migrateResources = (items: any[]): NationResource[] => {
        if (!Array.isArray(items)) return [];
        return items.map(item => {
            if (typeof item === 'string') {
                return { id: uuid(), name: item, partner: '' };
            }
            return item;
        });
    };

    // Helper to migrate legacy nobleHouses to factions
    const migrateFactions = (nobleHouses: any[], existingFactions: any[]): NationFaction[] => {
        if (existingFactions && existingFactions.length > 0) return existingFactions;
        if (!nobleHouses || nobleHouses.length === 0) return [];
        return nobleHouses.map(h => ({
            id: h.id || uuid(),
            name: h.name,
            type: 'Noble House',
            leader: '',
            motto: h.motto,
            symbol: h.symbol,
            description: h.description,
            influence: h.influence
        }));
    };

    const migrateStringToList = (val: string | NationDetailItem[] | undefined): NationDetailItem[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val.trim().length > 0) {
            return [{ id: uuid(), name: 'General', description: val }];
        }
        return [];
    };

    const loadWithMigration = async (key: string, defaultValue: any[]) => {
        let parsed: any = await get(key);
        if (!parsed) {
            const itemStr = safeGetItem(key);
            if (itemStr) {
                try { parsed = JSON.parse(itemStr); } catch (e) {}
            }
        }
        if (!Array.isArray(parsed)) return defaultValue;
        return parsed.map((item: any) => ({ 
            ...item, 
            aliases: item.aliases || [],
            states: item.states || [],
            attributes: item.attributes || [],
            rules: (item.rules && item.rules.length > 0) ? item.rules : (item.functions || []),
            abilitiesList: item.abilitiesList || [],
            regions: item.regions || [],
            factions: migrateFactions(item.nobleHouses, item.factions),
            values: item.values || [],
            nobleHouses: [],
            economy: {
                exports: migrateResources(item.economy?.exports || []),
                imports: migrateResources(item.economy?.imports || [])
            },
            cultureList: item.cultureList || migrateStringToList(item.culture),
            philosophyList: item.philosophyList || migrateStringToList(item.philosophy),
            aesthetics: {
                architecture: migrateStringToList(item.aesthetics?.architecture),
                clothing: migrateStringToList(item.aesthetics?.clothing)
            },
            active: item.active !== undefined ? item.active : true
        }));
    };

    const loadRulesWithMigration = async () => {
        let rules: any = await get('worldLogicRules');
        if (!rules) {
            const rulesStr = safeGetItem('worldLogicRules');
            if (rulesStr) {
                try { rules = JSON.parse(rulesStr); } catch (e) {}
            }
        }
        if (!Array.isArray(rules)) return [];
        return rules.map((r: any) => ({
            ...r,
            category: r.category || 'Other',
            flexibility: r.flexibility || 'Absolute',
            consequences: r.consequences || '',
            exceptions: r.exceptions || [],
            active: r.active !== undefined ? r.active : true
        }));
    };

    const loadSimpleArray = async (key: string) => {
        let parsed: any = await get(key);
        if (!parsed) {
            const str = safeGetItem(key);
            if (str) {
                try { parsed = JSON.parse(str); } catch (e) {}
            }
        }
        return Array.isArray(parsed) ? parsed : [];
    };

    let storyArcs: StoryArc[] = await get('storyArcs') || [];
    if (!storyArcs || storyArcs.length === 0) {
        const arcsStr = safeGetItem('storyArcs');
        if (arcsStr) {
            try {
                const parsedArcs = JSON.parse(arcsStr);
                if (Array.isArray(parsedArcs)) {
                    storyArcs = parsedArcs.map((arc: any) => ({
                        ...arc,
                        significance: arc.significance !== undefined ? arc.significance : (arc.isHighPriority ? 10 : 0)
                    }));
                }
            } catch (e) { console.error("Failed to parse story arcs from localStorage", e); }
        }
    }

    if (!storyArcs || storyArcs.length === 0) {
        const defaultArc: StoryArc = { id: uuid(), name: 'Main Story', rootNode: INITIAL_NODE_DATA, significance: 10 };
        storyArcs = [defaultArc];
    }
    
    let activeArcId = await get('activeArcId');
    if (!activeArcId) {
        activeArcId = safeGetItem('activeArcId') || storyArcs[0]?.id;
    }

    let tagGroups: TagGroup[] = await get('tagGroups') || [];
    if (!tagGroups || tagGroups.length === 0) {
        const tagGroupsStr = safeGetItem('tagGroups');
        if (tagGroupsStr) {
            try {
                const parsedTags = JSON.parse(tagGroupsStr);
                if (Array.isArray(parsedTags)) {
                    tagGroups = parsedTags;
                }
            } catch (e) { console.error("Failed to parse tag groups from localStorage", e); }
        }
    }

    return {
        storyArcs,
        activeArcId,
        characters: await loadWithMigration('characters', []),
        scenarios: await loadWithMigration('scenarios', []), 
        scenarioProfiles: await loadSimpleArray('scenarioProfiles'),
        psychologicalTraits: await loadSimpleArray('psychologicalTraits'),
        traitProfiles: await loadSimpleArray('traitProfiles'),
        worldLogicRules: await loadRulesWithMigration(), 
        ruleProfiles: await loadSimpleArray('ruleProfiles'), 
        magicSystems: await loadWithMigration('magicSystems', []),
        magicSystemProfiles: await loadSimpleArray('magicSystemProfiles'), 
        worldObjects: await loadWithMigration('worldObjects', []), 
        worldObjectProfiles: await loadSimpleArray('worldObjectProfiles'),
        species: await loadWithMigration('species', []), 
        speciesProfiles: await loadSimpleArray('speciesProfiles'), 
        secrets: (await loadSimpleArray('secrets')).map((s: any) => ({
            ...s,
            category: s.category || 'Personal',
            status: s.status || 'hidden',
            consequences: s.consequences || ''
        })),
        secretProfiles: await loadSimpleArray('secretProfiles'),
        nations: await loadWithMigration('nations', []),
        nationProfiles: await loadSimpleArray('nationProfiles'),
        tagGroups,
        loreEntries: await loadWithMigration('loreEntries', []), 
        loreProfiles: await loadSimpleArray('loreProfiles'), 
        narrativeGoals: await loadWithMigration('narrativeGoals', []), 
        goalProfiles: await loadSimpleArray('goalProfiles'),
        contextPresets: await loadSimpleArray('contextPresets'),
        flags: await loadWithMigration('flags', []), 
        flagProfiles: await loadSimpleArray('flagProfiles'), 
        referenceDocuments: await loadWithMigration('referenceDocuments', [])
    };
};

export const getInitialProjectData = (): ProjectData => {
    const arcsStr = safeGetItem('storyArcs');
    let storyArcs: StoryArc[] = [];
    if (arcsStr) {
        try {
            const parsedArcs = JSON.parse(arcsStr);
            if (Array.isArray(parsedArcs)) {
                storyArcs = parsedArcs.map((arc: any) => ({
                    ...arc,
                    significance: arc.significance !== undefined ? arc.significance : (arc.isHighPriority ? 10 : 0)
                }));
            }
        } catch (e) { console.error("Failed to parse story arcs from localStorage", e); }
    }

    if (storyArcs.length === 0) {
        const defaultArc: StoryArc = { id: uuid(), name: 'Main Story', rootNode: INITIAL_NODE_DATA, significance: 10 };
        storyArcs = [defaultArc];
    }
    
    const activeArcId = safeGetItem('activeArcId') || storyArcs[0]?.id;

    let tagGroups: TagGroup[] = [];
    const tagGroupsStr = safeGetItem('tagGroups');
    if (tagGroupsStr) {
        try {
            const parsedTags = JSON.parse(tagGroupsStr);
            if (Array.isArray(parsedTags)) {
                tagGroups = parsedTags;
            }
        } catch (e) { console.error("Failed to parse tag groups from localStorage", e); }
    }

    // Helper to migrate strings to resources
    const migrateResources = (items: any[]): NationResource[] => {
        if (!Array.isArray(items)) return [];
        return items.map(item => {
            if (typeof item === 'string') {
                return { id: uuid(), name: item, partner: '' };
            }
            return item;
        });
    };

    // Helper to migrate legacy nobleHouses to factions
    const migrateFactions = (nobleHouses: any[], existingFactions: any[]): NationFaction[] => {
        // If we already have new factions, use them
        if (existingFactions && existingFactions.length > 0) return existingFactions;
        
        // Otherwise try to migrate old noble houses
        if (!nobleHouses || nobleHouses.length === 0) return [];

        return nobleHouses.map(h => ({
            id: h.id || uuid(),
            name: h.name,
            type: 'Noble House',
            leader: '',
            motto: h.motto,
            symbol: h.symbol,
            description: h.description,
            influence: h.influence
        }));
    };

    // Helper to migrate old string fields to new Detail Item Lists (Culture, Philosophy, Aesthetics)
    const migrateStringToList = (val: string | NationDetailItem[] | undefined): NationDetailItem[] => {
        if (Array.isArray(val)) return val;
        // If it's a non-empty string, wrap it in a generic item
        if (typeof val === 'string' && val.trim().length > 0) {
            return [{ id: uuid(), name: 'General', description: val }];
        }
        return [];
    };

    // Helper to load arrays with migration (ensuring new fields exist and legacy data is preserved)
    const loadWithMigration = (key: string, defaultValue: any[]) => {
        const itemStr = safeGetItem(key);
        if (!itemStr) return defaultValue;
        try {
            const parsed = JSON.parse(itemStr);
            if (!Array.isArray(parsed)) return defaultValue;
            return parsed.map((item: any) => ({ 
                ...item, 
                aliases: item.aliases || [],
                states: item.states || [],
                attributes: item.attributes || [],
                // Migrate legacy fields if new structure is empty
                rules: (item.rules && item.rules.length > 0) ? item.rules : (item.functions || []), // Migration: functions -> rules preference
                abilitiesList: item.abilitiesList || [],
                regions: item.regions || [],
                factions: migrateFactions(item.nobleHouses, item.factions),
                values: item.values || [],
                nobleHouses: [], // Clear legacy field in memory to avoid duplication
                economy: {
                    exports: migrateResources(item.economy?.exports || []),
                    imports: migrateResources(item.economy?.imports || [])
                },
                // Migrate Culture/Philosophy/Aesthetics
                cultureList: item.cultureList || migrateStringToList(item.culture),
                philosophyList: item.philosophyList || migrateStringToList(item.philosophy),
                aesthetics: {
                    architecture: migrateStringToList(item.aesthetics?.architecture),
                    clothing: migrateStringToList(item.aesthetics?.clothing)
                },
                
                active: item.active !== undefined ? item.active : true // Default active true for migration
            }));
        } catch(e) { return defaultValue; }
    };

    // Rule migration logic
    const loadRulesWithMigration = () => {
        try {
            const rulesStr = safeGetItem('worldLogicRules');
            if (!rulesStr) return [];
            const rules = JSON.parse(rulesStr);
            if (!Array.isArray(rules)) return [];
            return rules.map((r: any) => ({
                ...r,
                category: r.category || 'Other',
                flexibility: r.flexibility || 'Absolute',
                consequences: r.consequences || '',
                exceptions: r.exceptions || [],
                active: r.active !== undefined ? r.active : true // New active field
            }));
        } catch { return []; }
    };

    const loadSimpleArray = (key: string) => {
        try {
            const str = safeGetItem(key);
            if (!str) return [];
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    };

    return {
        storyArcs,
        activeArcId,
        characters: loadWithMigration('characters', []), // Migrated
        scenarios: loadWithMigration('scenarios', []), 
        scenarioProfiles: loadSimpleArray('scenarioProfiles'),
        psychologicalTraits: loadSimpleArray('psychologicalTraits'),
        traitProfiles: loadSimpleArray('traitProfiles'),
        worldLogicRules: loadRulesWithMigration(), 
        ruleProfiles: loadSimpleArray('ruleProfiles'), 
        magicSystems: loadWithMigration('magicSystems', []),
        magicSystemProfiles: loadSimpleArray('magicSystemProfiles'), 
        worldObjects: loadWithMigration('worldObjects', []), 
        worldObjectProfiles: loadSimpleArray('worldObjectProfiles'),
        species: loadWithMigration('species', []), 
        speciesProfiles: loadSimpleArray('speciesProfiles'), 
        secrets: loadSimpleArray('secrets').map((s: any) => ({
            ...s,
            category: s.category || 'Personal',
            status: s.status || 'hidden',
            consequences: s.consequences || ''
        })),
        secretProfiles: loadSimpleArray('secretProfiles'),
        nations: loadWithMigration('nations', []), // NEW
        nationProfiles: loadSimpleArray('nationProfiles'), // NEW
        tagGroups,
        loreEntries: loadWithMigration('loreEntries', []), 
        loreProfiles: loadSimpleArray('loreProfiles'), 
        narrativeGoals: loadWithMigration('narrativeGoals', []), 
        goalProfiles: loadSimpleArray('goalProfiles'),
        contextPresets: loadSimpleArray('contextPresets'),
        flags: loadWithMigration('flags', []), 
        flagProfiles: loadSimpleArray('flagProfiles'), 
        referenceDocuments: loadWithMigration('referenceDocuments', [])
    }
};
