
import React, { useState } from 'react';
import { PsychologicalTrait, WorldRule, TagGroup, StoryFlag, Character, TraitProfile, FlagProfile, WorldRuleProfile } from '../../types';
import { 
    ScaleIcon, BrainCircuitIcon, GlobeAltIcon, TagIcon, 
    PlusIcon, KeyIcon
} from '../icons';
import { PsychologicalTraitAccordion, WorldRuleAccordion, TagGroupAccordion } from '../accordions/RulesAccordions';
import { FlagListEditor } from '../editors/FlagListEditor';
import { PanelShell } from '../ui/PanelShell';
import { ProfileManager } from '../shared/ProfileManager';

const TABS = [
    { id: 'psychology', icon: <BrainCircuitIcon />, label: "Psicología" },
    { id: 'logic', icon: <GlobeAltIcon />, label: "Lógica" },
    { id: 'flags', icon: <KeyIcon className="w-4 h-4" />, label: "Flags" },
    { id: 'tags', icon: <TagIcon />, label: "Etiquetas" }
] as const;

export const WorldRulesPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    psychologicalTraits: PsychologicalTrait[];
    onAddPsychologicalTrait: () => void;
    onUpdatePsychologicalTrait: (id: string, u: Partial<PsychologicalTrait>) => void;
    onDeletePsychologicalTrait: (t: PsychologicalTrait) => void;
    worldLogicRules: WorldRule[];
    onAddWorldLogicRule: () => void;
    onUpdateWorldLogicRule: (id: string, u: Partial<WorldRule>) => void;
    onDeleteWorldLogicRule: (r: WorldRule) => void;
    tagGroups: TagGroup[];
    onAddTagGroup: () => void;
    onUpdateTagGroup: (id: string, u: Partial<TagGroup>) => void;
    onDeleteTagGroup: (g: TagGroup) => void;
    flags?: StoryFlag[];
    onUpdateFlags?: (flags: StoryFlag[]) => void;
    
    // Trait Profiles
    traitProfiles?: TraitProfile[];
    onAddTraitProfile?: (name: string) => void;
    onApplyTraitProfile?: (id: string) => void;
    onUpdateTraitProfile?: (id: string) => void;
    onDeleteTraitProfile?: (id: string) => void;

    // Rule Profiles
    ruleProfiles?: WorldRuleProfile[];
    onAddRuleProfile?: (name: string) => void;
    onApplyRuleProfile?: (id: string) => void;
    onUpdateRuleProfile?: (id: string) => void;
    onDeleteRuleProfile?: (id: string) => void;

    // Flag Profiles
    flagProfiles?: FlagProfile[];
    onAddFlagProfile?: (name: string) => void;
    onApplyFlagProfile?: (id: string) => void;
    onUpdateFlagProfile?: (id: string) => void;
    onDeleteFlagProfile?: (id: string) => void;

    allCharacters?: Character[];
    onUpdateCharacter?: (id: string, u: Partial<Character>) => void;
}> = ({ 
    isOpen, onClose, 
    psychologicalTraits, onAddPsychologicalTrait, onUpdatePsychologicalTrait, onDeletePsychologicalTrait, 
    worldLogicRules, onAddWorldLogicRule, onUpdateWorldLogicRule, onDeleteWorldLogicRule, 
    tagGroups, onAddTagGroup, onUpdateTagGroup, onDeleteTagGroup, 
    flags, onUpdateFlags,
    traitProfiles = [], onAddTraitProfile, onApplyTraitProfile, onUpdateTraitProfile, onDeleteTraitProfile,
    ruleProfiles = [], onAddRuleProfile, onApplyRuleProfile, onUpdateRuleProfile, onDeleteRuleProfile,
    flagProfiles = [], onAddFlagProfile, onApplyFlagProfile, onUpdateFlagProfile, onDeleteFlagProfile,
    allCharacters = [], onUpdateCharacter = () => {} 
}) => {
    const [activeAccordionId, setActiveAccordionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'psychology' | 'logic' | 'tags' | 'flags'>('psychology');

    return (
        <PanelShell
            id="rules"
            side="left"
            isOpen={isOpen}
            onClose={onClose}
            title="Reglas del Mundo"
            icon={<ScaleIcon />}
            widthConfig={{ initial: 400, min: 300, max: 600 }}
        >
            {/* Tab Navigation */}
            <div className="flex-shrink-0 flex overflow-x-auto border-b border-gray-700 scrollbar-hide">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === tab.id ? 'border-cyan-400 text-cyan-400 bg-gray-700/30' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                        }`}
                        title={tab.label}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

             <div className="flex-grow overflow-y-auto p-3 space-y-4">
                 {/* Psychological Traits */}
                 {activeTab === 'psychology' && (
                     <div>
                         <ProfileManager 
                            title="Perfiles de Estado Psicológico"
                            description="Guarda combinaciones de rasgos (ej. 'Modo Combate', 'Terror')."
                            profiles={traitProfiles}
                            onAdd={onAddTraitProfile!}
                            onApply={onApplyTraitProfile!}
                            onUpdate={onUpdateTraitProfile!}
                            onDelete={onDeleteTraitProfile!}
                         />

                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><BrainCircuitIcon className="mr-2 h-5 w-5" /> Rasgos Psicológicos</h3>
                             <button onClick={onAddPsychologicalTrait} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                         </div>
                         <div className="space-y-2">
                             {psychologicalTraits.map(trait => (
                                 <div key={trait.id} className="bg-gray-700/30 rounded-md">
                                     <PsychologicalTraitAccordion
                                         trait={trait}
                                         isOpen={activeAccordionId === trait.id}
                                         onToggle={() => setActiveAccordionId(activeAccordionId === trait.id ? null : trait.id)}
                                         onUpdate={onUpdatePsychologicalTrait}
                                         onDelete={() => onDeletePsychologicalTrait(trait)}
                                         allCharacters={allCharacters}
                                         onUpdateCharacter={onUpdateCharacter}
                                     />
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* World Logic Rules */}
                 {activeTab === 'logic' && (
                     <div>
                         <ProfileManager 
                            title="Perfiles de Reglas (Physics/Logic)"
                            description="Gestiona leyes físicas o mágicas activas (ej. 'Mundo Onírico')."
                            profiles={ruleProfiles}
                            onAdd={onAddRuleProfile!}
                            onApply={onApplyRuleProfile!}
                            onUpdate={onUpdateRuleProfile!}
                            onDelete={onDeleteRuleProfile!}
                         />

                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><GlobeAltIcon className="mr-2 h-5 w-5" /> Reglas Lógicas</h3>
                             <button onClick={onAddWorldLogicRule} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                         </div>
                         <div className="space-y-2">
                             {worldLogicRules.map(rule => (
                                 <div key={rule.id} className="bg-gray-700/30 rounded-md">
                                     <WorldRuleAccordion
                                         rule={rule}
                                         isOpen={activeAccordionId === rule.id}
                                         onToggle={() => setActiveAccordionId(activeAccordionId === rule.id ? null : rule.id)}
                                         onUpdate={onUpdateWorldLogicRule}
                                         onDelete={() => onDeleteWorldLogicRule(rule)}
                                     />
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* Story Flags */}
                 {activeTab === 'flags' && (
                     <div>
                         <ProfileManager 
                            title="Perfiles de Flags (Sets)"
                            description="Gestiona qué flags están activos para la IA."
                            profiles={flagProfiles}
                            onAdd={onAddFlagProfile!}
                            onApply={onApplyFlagProfile!}
                            onUpdate={onUpdateFlagProfile!}
                            onDelete={onDeleteFlagProfile!}
                         />

                         <div className="animate-fade-in-fast">
                             <p className="text-xs text-gray-400 mb-2 bg-gray-900/30 p-2 rounded">
                                 Define interruptores binarios. 
                                 Solo los flags <strong>ACTIVOS (ON)</strong> en el sistema se enviarán a la IA para ahorrar tokens.
                             </p>
                             <FlagListEditor 
                                flags={flags} 
                                onUpdate={onUpdateFlags || (() => {})} 
                             />
                         </div>
                     </div>
                 )}

                  {/* Tag Groups */}
                  {activeTab === 'tags' && (
                     <div>
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><TagIcon className="mr-2 h-5 w-5" /> Grupos de Etiquetas</h3>
                             <button onClick={onAddTagGroup} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                         </div>
                         <div className="space-y-2">
                             {tagGroups.map(group => (
                                 <div key={group.id} className="bg-gray-700/30 rounded-md">
                                     <TagGroupAccordion
                                         group={group}
                                         isOpen={activeAccordionId === group.id}
                                         onToggle={() => setActiveAccordionId(activeAccordionId === group.id ? null : group.id)}
                                         onUpdate={onUpdateTagGroup}
                                         onDelete={() => onDeleteTagGroup(group)}
                                     />
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
             </div>
        </PanelShell>
    )
}
