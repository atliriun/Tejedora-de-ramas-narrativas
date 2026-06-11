
import { HarmBlockThreshold } from "@google/genai";

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  bookmark?: boolean;
  bookmarkedParagraphs?: number[];
}

export type AiRoleType = 'co-writer' | 'dm' | 'editor' | 'lore-master' | 'chronicler' | 'custom';

export interface NodeTranslation {
  id: string;
  language: string;
  text: string;
}

export interface CharacterAttribute {
    id: string;
    name: string;
    current: number;
    max: number;
    color?: string;
}

export type CharacterStateType = 'Physical' | 'Emotional' | 'Magical' | 'Status' | 'Other';

export interface CharacterState {
    id: string;
    name: string;
    active: boolean;
    type: CharacterStateType;
    intensity: number;
    description: string;
    duration?: string;
    gameplay_effect?: string;
}

export type RelationshipType = 'Family' | 'Friend' | 'Rival' | 'Romantic' | 'Professional' | 'Enemy' | 'Ally' | 'Neutral' | 'Other';

export interface CharacterRelationship {
    id: string;
    targetCharacterId: string;
    type: RelationshipType;
    score: number;
    description?: string;
    notes?: string;
}

export interface CharacterStateSnapshot {
    attributes?: CharacterAttribute[];
    states?: CharacterState[];
    relationships?: CharacterRelationship[];
}

export type BlockType = 'action' | 'dialogue' | 'thought' | 'description' | 'system';

export interface StoryBlock {
  id: string;
  type: BlockType;
  characterId?: string;
  text: string;
}

export interface NodeHistoryEntry {
  action: string;
  timestamp: number;
  user?: string;
  changes?: Record<string, any>;
}

export interface StoryNodeData {
  id:string;
  name: string;
  blocks?: StoryBlock[];
  children?: StoryNodeData[];
  directorChatHistory?: ChatMessage[]; 
  chatDraft?: string;
  styleId?: string;
  note?: string;
  images?: string[]; // New: Array of Base64 image strings
  isCollapsed?: boolean;
  width?: number;
  tags?: string[];
  translations?: NodeTranslation[];
  charactersInScene?: string[]; 
  pointOfViewCharacterId?: string; 
  scenariosInScene?: string[]; 
  statusTagIds?: string[]; 
  canonicalChildId?: string;
  customArcSummary?: string; 
  customCharactersSummary?: string; 
  fantasyDate?: string; 
  lastPlotGuidance?: string; 
  characterStateOverrides?: Record<string, CharacterStateSnapshot>; 
  excludeFromContext?: boolean; 
  customAiRole?: AiRoleType; 
  customAiInstruction?: string;
  strictFocus?: boolean;
  chatHistory?: ChatMessage[];
  history?: NodeHistoryEntry[];
  bookmarkedParagraphs?: number[];
}

export interface StoryArc {
    id: string;
    name: string;
    rootNode: StoryNodeData;
    significance: number; 
    summary?: string;
}

export interface CharacterAbility {
    id: string;
    name: string;
    type: AbilityType;
    description: string;
    cost?: string;
    level?: number;
    cooldown?: string;
    tags?: string[];
}

export type AbilityType = 'Active' | 'Passive' | 'Ultimate' | 'Ritual' | 'Reaction' | 'Trait';

export interface CharacterMemory {
    id: string;
    text: string;
    type: 'event' | 'feeling' | 'behavior' | 'entry';
    isCore: boolean;
    intensity: number;
    timeframe?: string;
    reliability?: 'truth' | 'distorted' | 'false';
    emotionalTone?: string;
}

export type EvolutionCategory = 'Physical' | 'Psychological' | 'Magical' | 'Social';
export type EvolutionPriority = 'High' | 'Medium' | 'Low' | 'Inactive';

export interface EvolutionMilestone {
    id: string;
    name: string;
    category: EvolutionCategory;
    description: string;
    achieved: boolean;
    dateAchieved?: string;
    priority: EvolutionPriority;
    mentalState?: string;
    roleAtMoment?: string;
    locationAtMoment?: string;
    tacticalPoints?: string[];
    privateThoughts?: string;
    diaryFragment?: string;
    interestingData?: string;
    arcId?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    type: ItemType;
    quantity: number;
    weight?: number;
    equipped?: boolean;
    description?: string;
    value?: string;
}

export type ItemType = 'Weapon' | 'Armor' | 'Consumable' | 'Key' | 'Material' | 'Tool' | 'Misc';

export interface Resource {
    id: string;
    name: string;
    current: number;
    max: number;
    color?: string;
}

export interface CharacterVoice {
    tone: string;
    rhythm: string;
    vocabulary: string;
    style: string;
    catchphrases: string[];
    sampleQuote: string;
    
    // Mind & Personality (Cerebro)
    ideals?: string;
    flaws?: string;
    fears?: string;
    desires?: string;
    coreBeliefs?: string;
    decisionMaking?: string;
    innerMonologue?: string;
}

export interface CharacterExpression {
    id: string;
    name: string;
    imageUrl: string;
}

export interface Character {
    id: string;
    name: string;
    avatar?: string;
    expressions?: CharacterExpression[];
    source?: string;
    color: string;
    active: boolean;
    aliases: string[];
    appearance?: string;
    personality?: string;
    backstory?: string;
    archetype?: string;
    mainMotivation?: string;
    ticsMannerisms?: string;
    attributes: CharacterAttribute[];
    states: CharacterState[];
    traitIds: string[];
    abilities?: string; 
    abilitiesList: CharacterAbility[];
    memories: CharacterMemory[];
    relationships: CharacterRelationship[];
    inventory: InventoryItem[];
    resources: Resource[];
    voice: CharacterVoice;
    evolution: EvolutionMilestone[];
    notes?: string;
}

export interface Scenario {
    id: string;
    name: string;
    aliases: string[];
    description: string;
    atmosphere?: string;
    sensoryDetails?: string;
    attributes: CharacterAttribute[];
    active: boolean;
    notes?: string;
}

export interface MagicSystem {
    id: string;
    name: string;
    aliases: string[];
    description: string;
    abilitiesList: CharacterAbility[];
    rules: WorldRule[];
    active: boolean;
    notes?: string;
}

export interface WorldObject {
    id: string;
    name: string;
    aliases: string[];
    description: string;
    abilitiesList: CharacterAbility[];
    rules: WorldRule[];
    active: boolean;
    notes?: string;
}

export interface Species {
    id: string;
    name: string;
    aliases: string[];
    description: string;
    attributes: CharacterAttribute[];
    abilitiesList: CharacterAbility[];
    politics?: string;
    philosophy?: string;
    active: boolean;
}

export interface Secret {
    id: string;
    name: string;
    content: string;
    status: 'hidden' | 'at_risk' | 'revealed';
    category: 'Personal' | 'Político' | 'Militar' | 'Mágico' | 'Histórico' | 'Otro';
    level: number;
    knownByCharacterIds?: string[];
    consequences?: string;
    active: boolean;
    notes?: string;
}

export interface NationDetailItem {
    id: string;
    name: string;
    description: string;
}

export interface NationResource {
    id: string;
    name: string;
    partner?: string;
}

export interface Landmark {
    id: string;
    name: string;
    type: string;
    description: string;
}

export interface City {
    id: string;
    name: string;
    type: 'City' | 'Town' | 'Village' | 'Fortress' | 'Port';
    population?: string;
    description: string;
    isCapital: boolean;
}

export interface Region {
    id: string;
    name: string;
    description: string;
    capital: boolean;
    climate?: string;
    resources?: string;
    cities: City[];
    landmarks: Landmark[];
}

export interface NationFaction {
    id: string;
    name: string;
    type: string;
    leader?: string;
    description: string;
    motto?: string;
    symbol?: string;
    influence: number;
}

export interface NationTreaty {
    id: string;
    name: string;
    partner?: string;
    description: string;
    type: string;
}

export interface NationConflict {
    id: string;
    name: string;
    opponent?: string;
    description: string;
    type: string;
}

export interface NationPolicy {
    id: string;
    name: string;
    type: string;
    description: string;
    active: boolean;
}

export interface NationTechnology {
    id: string;
    name: string;
    level: string;
    description: string;
}

export interface NationEvent {
    id: string;
    name: string;
    year: string;
    description: string;
}

export interface NationRank {
    id: string;
    name: string;
    title: string;
    level: number;
}

export interface NationDemographic {
    id: string;
    name: string;
    percentage: string;
    status: string;
}

export interface NationValue {
    id: string;
    name: string;
    type: 'Virtue' | 'Taboo';
    description: string;
}

export interface NationFloraFauna {
    id: string;
    name: string;
    type: 'Fauna' | 'Flora' | 'Monster' | 'Resource';
    description: string;
}

export interface NationRumor {
    id: string;
    name: string;
    description: string;
}

export interface NationUnit {
    id: string;
    name: string;
    type: string;
    description: string;
}

export interface NationFigure {
    id: string;
    name: string;
    role: string;
    description: string;
}

export interface Nation {
    id: string;
    name: string;
    aliases: string[];
    description: string;
    governmentType?: string;
    continent?: string;
    capitalName?: string;
    ruler?: string;
    population?: string;
    demonym?: string;
    geography?: string;
    language?: string;
    currency?: string;
    religion?: string;
    regions: Region[];
    factions: NationFaction[];
    values: NationValue[];
    history: NationEvent[];
    treaties: NationTreaty[];
    conflicts: NationConflict[];
    policies: NationPolicy[];
    technologies: NationTechnology[];
    ranks: NationRank[];
    demographics: NationDemographic[];
    figures: NationFigure[];
    militaryUnits: NationUnit[];
    floraFauna: NationFloraFauna[];
    rumors: NationRumor[];
    aesthetics?: { architecture: NationDetailItem[]; clothing: NationDetailItem[]; };
    economy?: { exports: NationResource[]; imports: NationResource[]; };
    cultureList: NationDetailItem[];
    philosophyList: NationDetailItem[];
    active: boolean;
}

export type PsychologicalTraitCategory = 'Motivation' | 'Cognitive Bias' | 'Virtue' | 'Vice' | 'Fear' | 'Obsession' | 'Complex' | 'General';

export interface TraitDetail {
    id: string;
    title: string;
    content: string;
}

export interface PsychologicalTrait {
    id: string;
    name: string;
    description: string;
    category: PsychologicalTraitCategory;
    intensity: number;
    triggers: string[];
    details: TraitDetail[];
    active: boolean;
    impact?: string;
    evolution?: string;
}

export type WorldRuleCategory = 'Physics' | 'Magic' | 'Social' | 'Economy' | 'Divine' | 'Meta' | 'Other';
export type RuleFlexibility = 'Absolute' | 'High' | 'Moderate' | 'Low' | 'Guideline';

export interface WorldRule {
    id: string;
    text: string;
    description: string;
    category?: WorldRuleCategory;
    flexibility?: RuleFlexibility;
    consequences?: string;
    exceptions?: string[];
    active: boolean;
}

export interface Tag {
    id: string;
    name: string;
    description?: string;
}

export interface TagGroup {
    id: string;
    name: string;
    tags: Tag[];
}

export interface LoreEntry {
    id: string;
    name: string;
    content: string;
    category: string;
    aliases: string[];
    active: boolean;
}

export type GoalType = 'Plot' | 'Character' | 'World' | 'Theme';
export type GoalStatus = 'Active' | 'Completed' | 'Failed' | 'Pending' | 'Abandoned';
export type GoalPriority = 'High' | 'Medium' | 'Low';

export interface NarrativeGoal {
    id: string;
    description: string;
    type: GoalType;
    status: GoalStatus;
    priority: GoalPriority;
    progress: number;
    notes?: string;
    active: boolean;
}

export interface StoryFlag {
    id: string;
    name: string;
    state: boolean;
    category?: string;
    description?: string;
    color?: string;
    active: boolean;
}

export interface SafetySettings {
    harassment: number;
    hateSpeech: number;
    sexuallyExplicit: number;
    dangerousContent: number;
}

export interface AiSettings {
    model: string;
    branchGenerationTemperature: number;
    nodeChatTemperature: number;
    worldChatTemperature: number;
    safetySettings: SafetySettings;
    undoHistoryLimit: number;
    translationLanguage: string;
    googleSearchEnabled: boolean;
}

export interface ArcProfileData {
    significance: number;
    summary: string;
}

export interface ContextPreset {
    id: string;
    name: string;
    arcConfig: Record<string, ArcProfileData>;
}

export interface ProfileConfig { [key: string]: boolean | { active: boolean, intensity: number } }

export interface BaseProfile {
    id: string;
    name: string;
}

export interface LoreProfile extends BaseProfile { loreEntries: Record<string, boolean> }
export interface SecretProfile extends BaseProfile { secrets: Record<string, boolean> }
export interface SpeciesProfile extends BaseProfile { species: Record<string, boolean> }
export interface WorldObjectProfile extends BaseProfile { objects: Record<string, boolean> }
export interface MagicSystemProfile extends BaseProfile { magicSystems: Record<string, boolean> }
export interface ScenarioProfile extends BaseProfile { scenarios: Record<string, boolean> }
export interface NationProfile extends BaseProfile { nations: Record<string, boolean> }
export interface TraitProfile extends BaseProfile { traits: Record<string, { active: boolean, intensity: number }> }
export interface WorldRuleProfile extends BaseProfile { rules: Record<string, boolean> }
export interface FlagProfile extends BaseProfile { flags: Record<string, boolean> }
export interface NarrativeGoalProfile extends BaseProfile { goals: Record<string, boolean> }

export interface ReferenceDocument {
    id: string;
    name: string;
    content: string;
}

export interface ProjectData {
    storyArcs: StoryArc[];
    activeArcId: string;
    characters: Character[];
    scenarios: Scenario[];
    scenarioProfiles: ScenarioProfile[];
    psychologicalTraits: PsychologicalTrait[];
    traitProfiles: TraitProfile[];
    worldLogicRules: WorldRule[];
    ruleProfiles: WorldRuleProfile[];
    magicSystems: MagicSystem[];
    magicSystemProfiles: MagicSystemProfile[];
    worldObjects: WorldObject[];
    worldObjectProfiles: WorldObjectProfile[];
    species: Species[];
    speciesProfiles: SpeciesProfile[];
    secrets: Secret[];
    secretProfiles: SecretProfile[];
    nations: Nation[];
    nationProfiles: NationProfile[];
    tagGroups: TagGroup[];
    loreEntries: LoreEntry[];
    loreProfiles: LoreProfile[];
    narrativeGoals: NarrativeGoal[];
    goalProfiles: NarrativeGoalProfile[];
    contextPresets: ContextPreset[];
    flags: StoryFlag[];
    flagProfiles: FlagProfile[];
    referenceDocuments: ReferenceDocument[];
}

export interface ProjectSaveState extends ProjectData {
    projectName: string;
    aiSettings: AiSettings;
    autoSaveInterval: number;
    autoDownloadEnabled: boolean;
    searchHistory: string[];
}

export interface AutoSave {
    timestamp: number;
    state: ProjectSaveState;
}

export interface DirectorContext {
    fantasyDate: string;
    characterIds: string[];
    focalCharacterIds?: string[]; 
    strictFocus?: boolean; 
    scenarioIds: string[];
    tagIds: string[];
    povCharacterId?: string;
    aiRole?: AiRoleType;
    aiCustomInstruction?: string;
}

export type EntityType = 
    | 'character' 
    | 'scenario' 
    | 'magic system' 
    | 'world object' 
    | 'species' 
    | 'nation'
    | 'secret' 
    | 'psychological trait' 
    | 'world logic rule' 
    | 'tag group' 
    | 'lore entry' 
    | 'story arc'
    | 'narrative goal'
    | 'story flag';

export type SideMenuTabType = 'search' | 'aiSettings' | 'documents' | 'project';