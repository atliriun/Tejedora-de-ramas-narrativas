
import { Type, FunctionDeclaration } from "@google/genai";
import { PsychologicalTraitCategory, SafetySettings, AiSettings, StoryNodeData, Character, Scenario, MagicSystem, WorldObject, Species, Secret, PsychologicalTrait, WorldRule, TagGroup, LoreEntry, CharacterMemory, CharacterRelationship, NarrativeGoal, StoryFlag, CharacterVoice, Nation } from './types';

export const DEFAULT_NODE_WIDTH = 550; 
export const MIN_NODE_WIDTH = 400;
export const MAX_NODE_WIDTH = 1000; 
export const MIN_NODE_HEIGHT = 180;

export const TRAIT_CATEGORY_LABELS: Record<PsychologicalTraitCategory, string> = {
    'Motivation': 'Motivación',
    'Cognitive Bias': 'Sesgo Cognitivo',
    'Virtue': 'Virtud',
    'Vice': 'Vicio',
    'Fear': 'Miedo',
    // Fixed: Changed 'Obsesión' to 'Obsession' to match the type definition in types.ts
    'Obsession': 'Obsesión',
    'Complex': 'Complejo',
    'General': 'General'
};

export const CHARACTER_COLORS = [
    { name: 'Blanco', value: 'text-white', bg: 'bg-white' },
    { name: 'Cian', value: 'text-cyan-400', bg: 'bg-cyan-400' },
    { name: 'Esmeralda', value: 'text-emerald-400', bg: 'bg-emerald-400' },
    { name: 'Lima', value: 'text-lime-400', bg: 'bg-lime-400' },
    { name: 'Ambar', value: 'text-amber-400', bg: 'bg-amber-400' },
    { name: 'Naranja', value: 'text-orange-400', bg: 'bg-orange-400' },
    { name: 'Rojo', value: 'text-red-400', bg: 'bg-red-400' },
    { name: 'Rosa', value: 'text-pink-400', bg: 'bg-pink-400' },
    { name: 'Fucsia', value: 'text-fuchsia-400', bg: 'bg-fuchsia-400' },
    { name: 'Violeta', value: 'text-violet-400', bg: 'bg-violet-400' },
    { name: 'Indigo', value: 'text-indigo-400', bg: 'bg-indigo-400' },
    { name: 'Azul', value: 'text-blue-400', bg: 'bg-blue-400' },
    { name: 'Cielo', value: 'text-sky-400', bg: 'bg-sky-400' },
];

export const NODE_STYLES = {
  default: { id: 'default', name: 'Default', bg: 'bg-gray-800', border: 'border-gray-600', hoverBorder: 'hover:border-cyan-500' },
  event: { id: 'event', name: 'Key Event', bg: 'bg-gray-800', border: 'border-blue-500', hoverBorder: 'hover:border-blue-400' },
  decision: { id: 'decision', name: 'Decision Point', bg: 'bg-gray-800', border: 'border-purple-500', hoverBorder: 'hover:border-purple-400' },
  ending: { id: 'ending', name: 'Ending', bg: 'bg-gray-800', border: 'border-green-500', hoverBorder: 'hover:border-green-400' },
  conflict: { id: 'conflict', name: 'Conflict/Danger', bg: 'bg-gray-800', border: 'border-red-500', hoverBorder: 'hover:border-red-400' },
};

export const INITIAL_SAFETY_SETTINGS: SafetySettings = {
  harassment: 0, hateSpeech: 0, sexuallyExplicit: 0, dangerousContent: 0,
};

export const INITIAL_AI_SETTINGS: AiSettings = {
  model: 'gemini-3.1-pro-preview', 
  branchGenerationTemperature: 0.8,
  nodeChatTemperature: 0.7,
  worldChatTemperature: 0.8,
  safetySettings: INITIAL_SAFETY_SETTINGS,
  undoHistoryLimit: 50,
  translationLanguage: 'Spanish',
  googleSearchEnabled: false, 
};

export const INITIAL_NODE_DATA: StoryNodeData = {
    id: 'root',
    name: 'La historia comienza...',
    children: [],
    styleId: 'default',
    note: '',
    tags: [],
    isCollapsed: false,
};

// --- TOOLS FOR DIRECTOR MODE (Function Calling) ---

export const DIRECTOR_TOOLS: FunctionDeclaration[] = [
    {
        name: 'rename_character',
        description: 'Renames a character throughout the entire project. This globally replaces their name in the database and ALL story nodes.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                oldName: { type: Type.STRING, description: 'The exact current name of the character.' },
                newName: { type: Type.STRING, description: 'The new name to apply.' }
            },
            required: ['oldName', 'newName']
        }
    },
    {
        name: 'update_attribute',
        description: 'Modifies a numeric attribute. Use for damage, healing, mana, fatigue. REQUIRES a reason.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING, description: 'The exact name of the character.' },
                attributeName: { type: Type.STRING, description: 'The name of the attribute (e.g., "Vida", "Mana").' },
                valueChange: { type: Type.NUMBER, description: 'The amount to add or subtract.' },
                reason: { type: Type.STRING, description: 'Mandatory context: Why did this change happen? (e.g. "Stabbed by goblin", "Rested").' }
            },
            required: ['characterName', 'attributeName', 'valueChange', 'reason']
        }
    },
    {
        name: 'update_state',
        description: 'Adds/Updates a condition. REQUIRED: Detailed description of the physical/mental effect.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING, description: 'The exact name of the character.' },
                stateName: { type: Type.STRING, description: 'Name of state (e.g., "Herido", "Miedo").' },
                active: { type: Type.BOOLEAN },
                type: { type: Type.STRING, description: 'Physical, Emotional, Magical, Status.' },
                intensity: { type: Type.NUMBER, description: '1 (mild) to 10 (extreme).' },
                description: { type: Type.STRING, description: 'DETAILED description of how this state manifests (e.g., "Limping heavily, bleeding from thigh").' },
                duration: { type: Type.STRING, description: 'Estimated duration (e.g., "Until healed", "3 hours").' }
            },
            required: ['characterName', 'stateName', 'active', 'description']
        }
    },
    {
        name: 'update_relationship',
        description: 'Updates affinity. REQUIRED: nuanced notes about the change.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                sourceCharacterName: { type: Type.STRING },
                targetCharacterName: { type: Type.STRING },
                scoreChange: { type: Type.NUMBER },
                relationshipType: { type: Type.STRING },
                description: { type: Type.STRING, description: 'Visible interaction style update.' },
                secretNotes: { type: Type.STRING, description: 'Detailed private thoughts/reasons for the change.' }
            },
            required: ['sourceCharacterName', 'targetCharacterName', 'scoreChange']
        }
    },
    {
        name: 'update_inventory',
        description: 'Updates inventory. REQUIRED: Description of item condition or source.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING },
                itemName: { type: Type.STRING },
                quantityChange: { type: Type.NUMBER },
                description: { type: Type.STRING, description: 'Visual details of the item (e.g., "Rusty and old", "Glowing faintly").' }
            },
            required: ['characterName', 'itemName', 'quantityChange']
        }
    },
    {
        name: 'learn_skill',
        description: 'Grants a new ability.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING },
                skillName: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING, description: 'Detailed effect and limitations of the skill.' }
            },
            required: ['characterName', 'skillName', 'description']
        }
    },
    {
        name: 'manage_evolution',
        description: 'Manage character arc milestones. Use when a character grows, achieves a goal, or suffers a permanent change.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING },
                action: { type: Type.STRING, enum: ['add', 'complete', 'update'], description: "'add' for new potential path, 'complete' when achieved." },
                milestoneName: { type: Type.STRING, description: "Name of the milestone (e.g. 'Overcome Fear of Fire')." },
                category: { type: Type.STRING, enum: ['Physical', 'Psychological', 'Magical', 'Social'], description: "Type of growth." },
                description: { type: Type.STRING, description: "What changed? What was achieved?" },
                priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low', 'Inactive'] }
            },
            required: ['characterName', 'action', 'milestoneName']
        }
    },
    {
        name: 'manage_deep_evolution',
        description: 'Creates a CHARACTER DATA FILE (Dossier) for an arc. Use this to record psychological depth. Mandatory: Distinguish between Facts (Key Moments), Secrets (Private Thoughts) and Diary (Internal Monologue).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING, description: "Character to update." },
                stageName: { type: Type.STRING, description: "The title of this evolution chapter (e.g., 'The Broken Hero Phase')." },
                mentalState: { type: Type.STRING, description: "Current mental health status using bracket tags (e.g. [STABLE] or [CRITICAL] Paranoia)." },
                role: { type: Type.STRING, description: "Current archetypical role (e.g. Traitor, Support, Leader)." },
                location: { type: Type.STRING, description: "Physical location during this evolution stage." },
                keyMoments: { type: Type.STRING, description: "THE FACTS: What actually happened? List key events lived by the character." },
                tacticalPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific deductions or strategic data discovered." },
                privateThoughts: { type: Type.STRING, description: "THE SECRETS: What is the character hiding? Internal logic, fears, or plans not shared with others." },
                diaryFragment: { type: Type.STRING, description: "THE DIARY: A first-person internal monologue. Capture the character's unique voice, insecurities and raw emotions." },
                category: { type: Type.STRING, enum: ['Physical', 'Psychological', 'Magical', 'Social'] }
            },
            required: ['characterName', 'stageName', 'mentalState', 'keyMoments', 'privateThoughts', 'diaryFragment', 'category']
        }
    },
    {
        name: 'update_mind_voice',
        description: 'Updates a character\'s psychological profile (brain) and voice signature. Use for personality, ideals, monologue, and dialogue style.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING },
                ideals: { type: Type.STRING, description: 'Core values, e.g. "Justice above all"' },
                flaws: { type: Type.STRING, description: 'Weaknesses, e.g. "Too trusting"' },
                fears: { type: Type.STRING, description: 'Phobias and terrors' },
                desires: { type: Type.STRING, description: 'Hidden goals and desires' },
                coreBeliefs: { type: Type.STRING, description: 'Philosophy, e.g. "The end justifies the means"' },
                decisionMaking: { type: Type.STRING, description: 'How they decide, e.g. "Impulsive"' },
                innerMonologue: { type: Type.STRING, description: 'How they think, e.g. "Anxious and analytical"' },
                tone: { type: Type.STRING, description: 'Emotional baseline (e.g., Sarcastic, Gloomy, Cheerful).' },
                rhythm: { type: Type.STRING, description: 'Speed/Cadence (e.g., Rapid, Stuttering, Measured).' },
                vocabulary: { type: Type.STRING, description: 'Complexity (e.g., Academic, Street slang, Archaic).' },
                style: { type: Type.STRING, description: 'Specific quirks (e.g., Uses metaphors, never asks questions).' },
                sampleQuote: { type: Type.STRING, description: 'A representative sentence showing the new style.' },
                addCatchphrase: { type: Type.STRING, description: 'A specific phrase to add to their list.' }
            },
            required: ['characterName']
        }
    },
    {
        name: 'manage_memory',
        description: 'Add, update, or remove a significant memory. Use for traumas, key plot events, or crucial realizations.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                characterName: { type: Type.STRING },
                action: { type: Type.STRING, enum: ['add', 'update', 'forget'] },
                memoryText: { type: Type.STRING, description: 'The content of the memory. Used to identifying the memory to update/forget.' },
                newText: { type: Type.STRING, description: 'Optional. Use only if rewriting the memory content during an update.' },
                type: { type: Type.STRING, enum: ['event', 'feeling', 'behavior', 'entry'] },
                isCore: { type: Type.BOOLEAN, description: 'If true, this is a fundamental memory that defines personality.' },
                intensity: { type: Type.NUMBER, description: '1-10 impact.' },
                timeframe: { type: Type.STRING, description: 'When did this happen? (e.g. "Childhood", "Recent Battle")' }
            },
            required: ['characterName', 'action', 'memoryText']
        }
    },
    {
        name: 'manage_scenario',
        description: 'Create or update a Location/Scenario in the world database. Use when entering a new place or when a location changes significantly.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, enum: ['create', 'update'] },
                scenarioName: { type: Type.STRING, description: 'Name of the location.' },
                description: { type: Type.STRING, description: 'Visual and physical description.' },
                atmosphere: { type: Type.STRING, description: 'Mood/Vibe (e.g., "Ominous", "Peaceful").' },
                sensoryDetails: { type: Type.STRING, description: 'Specific smells, sounds, temperature.' },
                active: { type: Type.BOOLEAN, description: 'Set to true to make it available/visible in the current context.' }
            },
            required: ['action', 'scenarioName']
        }
    },
    {
        name: 'manage_secret',
        description: 'Manage plot secrets, mysteries, and hidden truths. Use when a secret is created, updated, or REVEALED to a character.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, enum: ['create', 'update', 'reveal'], description: "'reveal' adds a character to the knownBy list." },
                secretName: { type: Type.STRING, description: 'Short identifier for the secret.' },
                content: { type: Type.STRING, description: 'The actual truth or secret information.' },
                status: { type: Type.STRING, enum: ['hidden', 'at_risk', 'revealed'] },
                category: { type: Type.STRING, enum: ['Personal', 'Político', 'Militar', 'Mágico', 'Histórico', 'Otro'] },
                level: { type: Type.NUMBER, description: '1 (Minor) to 5 (World Breaking)' },
                learnerCharacterName: { type: Type.STRING, description: 'Required for "reveal" action. The character who learns the secret.' }
            },
            required: ['action', 'secretName']
        }
    },
    {
        name: 'manage_nation',
        description: 'Modify a Nation. Supports deep editing of Geography (Cities in Regions), Aesthetics, Politics, Economy, etc.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                nationName: { type: Type.STRING, description: 'The name of the nation.' },
                category: { type: Type.STRING, enum: ['Diplomacy', 'Conflict', 'Law', 'Ruler', 'History', 'Economy', 'Military', 'Society', 'Culture', 'Faction', 'Geography', 'Aesthetics'], description: 'Aspect to change.' },
                action: { type: Type.STRING, enum: ['add', 'update', 'remove'], description: 'Operation type.' },
                itemName: { type: Type.STRING, description: 'Name of the entity (City Name, Treaty, Unit, Law, Ruler, etc.).' },
                description: { type: Type.STRING, description: 'Details, description, or context.' },
                targetEntity: { type: Type.STRING, description: 'Partner for treaty, Opponent for war, or Leader Name for factions.' },
                subType: { type: Type.STRING, description: 'Specific type (e.g., "Region", "City", "Architecture", "Export").' },
                numericValue: { type: Type.NUMBER, description: 'Influence, Percentage, or Level.' },
                parentName: { type: Type.STRING, description: 'REQUIRED if adding a nested item (e.g. Region Name if adding a City). Empty otherwise.' }
            },
            required: ['nationName', 'category', 'action', 'description']
        }
    },
    {
        name: 'manage_world_element',
        description: 'Create or update general world elements: Magic Systems, Objects, Species, Lore Entries, or Rules.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING, enum: ['Magic', 'Object', 'Species', 'Lore', 'Rule'], description: 'The type of element to create/edit.' },
                action: { type: Type.STRING, enum: ['create', 'update'], description: 'Action to perform.' },
                name: { type: Type.STRING, description: 'Name of the element (e.g., "Fire Magic", "Excalibur").' },
                description: { type: Type.STRING, description: 'Main content/description of the element.' },
                details: { type: Type.STRING, description: 'Optional extra details (Aliases for Objects, Category for Lore, Consequences for Rules).' }
            },
            required: ['category', 'action', 'name', 'description']
        }
    },
    {
        name: 'manage_story_flow',
        description: 'Manage Narrative Goals (progress/completion) and Global Flags (world state switches). Use to mark quests as done or trigger world events.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['Goal', 'Flag'], description: 'Goal = Objective/Quest. Flag = Global Switch (WarStarted).' },
                action: { type: Type.STRING, enum: ['create', 'update', 'delete'] },
                name: { type: Type.STRING, description: 'Name of the goal or flag.' },
                description: { type: Type.STRING, description: 'Description for Goals.' },
                status: { type: Type.STRING, enum: ['Active', 'Completed', 'Failed', 'Pending', 'Abandoned'], description: 'Status for Goals.' },
                priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'], description: 'Priority for Goals.' },
                progress: { type: Type.NUMBER, description: 'Progress 0-100 for Goals.' },
                state: { type: Type.BOOLEAN, description: 'True/False for Flags.' },
            },
            required: ['type', 'action', 'name']
        }
    },
    {
        name: 'update_node_story_text',
        description: 'Rewrites or modifies the main narrative text of the CURRENT scene/node. Use this when the user asks you to rewrite, expand, or change the story text of the current scene.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                newText: { type: Type.STRING, description: 'The complete new narrative text that will replace the current node\'s text.' }
            },
            required: ['newText']
        }
    },
    {
        name: 'update_director_message',
        description: 'Modifies a previous message sent by the Director AI in the current chat history. Use this when the user asks to change or correct something you said previously.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                messageSnippet: { type: Type.STRING, description: 'A small snippet (5-10 words) of the old message to find it in the history.' },
                newText: { type: Type.STRING, description: 'The complete new text that will replace the old message.' }
            },
            required: ['messageSnippet', 'newText']
        }
    }
];

// --- DEFAULT ENTITY TEMPLATES ---

const DEFAULT_VOICE: CharacterVoice = {
    tone: '',
    rhythm: '',
    vocabulary: '',
    style: '',
    catchphrases: [],
    sampleQuote: ''
};

export const DEFAULT_CHARACTER: Partial<Character> = { 
    name: 'Nuevo Personaje', 
    color: 'text-white',
    states: [], 
    attributes: [], 
    aliases: [], 
    abilitiesList: [],
    memories: [],
    relationships: [],
    inventory: [],
    resources: [],
    voice: DEFAULT_VOICE,
    evolution: [],
    active: true 
};
export const DEFAULT_SCENARIO: Partial<Scenario> = { 
    name: 'Nuevo Escenario', 
    description: '', 
    aliases: [],
    attributes: [], 
    active: true 
};
export const DEFAULT_MAGIC_SYSTEM: Partial<MagicSystem> = { 
    name: 'Nuevo Sistema Mágico', 
    description: '', 
    aliases: [],
    abilitiesList: [], 
    rules: [], 
    active: true 
};
export const DEFAULT_WORLD_OBJECT: Partial<WorldObject> = { 
    name: 'Nuevo Objeto', 
    description: '', 
    aliases: [],
    abilitiesList: [],
    rules: [], 
    active: true 
};
export const DEFAULT_SPECIES: Partial<Species> = { 
    name: 'Nueva Especie', 
    description: '', 
    aliases: [],
    abilitiesList: [],
    attributes: [], 
    active: true 
};
export const DEFAULT_SECRET: Partial<Secret> = { name: 'Nuevo Secreto', content: '', level: 1, status: 'hidden', category: 'Personal', active: true };

export const DEFAULT_NATION: Partial<Nation> = {
    name: 'Nuevo Reino',
    description: '',
    governmentType: 'Monarquía',
    continent: 'Desconocido',
    capitalName: '',
    ruler: '',
    population: '',
    demonym: '',
    cultureList: [],
    philosophyList: [],
    geography: '',
    language: '',
    currency: '',
    religion: '',
    regions: [],
    factions: [], 
    values: [], 
    history: [],
    treaties: [],
    conflicts: [],
    policies: [],
    technologies: [],
    ranks: [],
    demographics: [],
    figures: [], 
    militaryUnits: [], 
    aesthetics: { architecture: [], clothing: [] }, 
    economy: { exports: [], imports: [] },
    floraFauna: [], 
    rumors: [], 
    aliases: [],
    active: true
};

export const DEFAULT_PSYCHOLOGICAL_TRAIT: Partial<PsychologicalTrait> = { 
    name: 'Nuevo Rasgo', 
    description: '', 
    category: 'General',
    intensity: 5,
    triggers: [],
    details: [], 
    active: true, 
    impact: '',
    evolution: ''
};

export const DEFAULT_WORLD_RULE: Partial<WorldRule> = { 
    text: 'Nueva Regla', 
    description: '', 
    category: 'Other',
    flexibility: 'Absolute',
    consequences: '',
    exceptions: [],
    active: true 
};
export const DEFAULT_TAG_GROUP: Partial<TagGroup> = { name: 'Nuevo Grupo', tags: [] };
export const DEFAULT_TAG_GROUP_ENTITY: Partial<TagGroup> = { name: 'Nuevo Grupo', tags: [] };
export const DEFAULT_LORE_ENTRY: Partial<LoreEntry> = { 
    name: 'Nueva Entrada de Lore', 
    content: '', 
    category: 'General', 
    aliases: [], 
    active: true 
};

export const DEFAULT_MEMORY: Omit<CharacterMemory, 'id'> = {
    type: 'event',
    text: '',
    isCore: false,
    intensity: 5,
    timeframe: 'Pasado',
    reliability: 'truth',
    emotionalTone: 'Neutral'
};

export const DEFAULT_RELATIONSHIP: Omit<CharacterRelationship, 'id'> = {
    targetCharacterId: '',
    description: '',
    type: 'Neutral',
    score: 50,
    notes: ''
};

export const DEFAULT_NARRATIVE_GOAL: Partial<NarrativeGoal> = {
    description: 'Nuevo Objetivo Narrativo',
    type: 'Plot',
    status: 'Active',
    priority: 'Medium',
    progress: 0,
    notes: '',
    active: true 
};

export const DEFAULT_STORY_FLAG: Partial<StoryFlag> = {
    name: 'Nuevo Interruptor',
    state: false,
    category: 'Global',
    description: '',
    color: 'bg-gray-500',
    active: true 
};
