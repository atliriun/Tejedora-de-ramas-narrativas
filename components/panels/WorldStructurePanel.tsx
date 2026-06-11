
import React, { useState, useMemo } from 'react';
import { Character, Scenario, MagicSystem, WorldObject, Species, Secret, Nation, SecretProfile, SpeciesProfile, WorldObjectProfile, MagicSystemProfile, ScenarioProfile, NationProfile, StoryArc } from '../../types';
import { 
    BookOpenIcon, UsersIcon, GlobeAltIcon, SparkleIcon, CubeIcon, DnaIcon, KeyIcon, 
    PlusIcon, FlagIcon, SearchIcon, XIcon, CopyIcon, ClipboardPasteIcon, ListCheckIcon
} from '../icons';
import { CharacterAccordion } from '../accordions/CharacterAccordion';
import { ScenarioAccordion } from '../accordions/ScenarioAccordion';
import { NationAccordion } from '../accordions/NationAccordion';
import { MagicSystemAccordion, WorldObjectAccordion, SpeciesAccordion, SecretAccordion } from '../accordions/StructureAccordions';
import { PanelShell } from '../ui/PanelShell';
import { ProfileManager } from '../shared/ProfileManager';
import { generateUUID } from '../../utils/uuid';

const TABS = [
    { id: 'characters', icon: <UsersIcon className="w-4 h-4"/>, label: "Personajes" },
    { id: 'scenarios', icon: <GlobeAltIcon className="w-4 h-4"/>, label: "Lugares" },
    { id: 'nations', icon: <FlagIcon className="w-4 h-4"/>, label: "Naciones" },
    { id: 'magic', icon: <SparkleIcon className="w-4 h-4"/>, label: "Magia" },
    { id: 'objects', icon: <CubeIcon className="w-4 h-4"/>, label: "Objetos" },
    { id: 'species', icon: <DnaIcon className="w-4 h-4"/>, label: "Especies" },
    { id: 'secrets', icon: <KeyIcon className="w-4 h-4"/>, label: "Secretos" }
] as const;

export const WorldStructurePanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    characters: Character[];
    onAddCharacter: () => void;
    onDeleteCharacter: (c: Character) => void;
    onUpdateCharacter: (id: string, u: Partial<Character>) => void;
    scenarios: Scenario[];
    onAddScenario: () => void;
    onDeleteScenario: (s: Scenario) => void;
    onUpdateScenario: (id: string, u: Partial<Scenario>) => void;
    magicSystems: MagicSystem[];
    onAddMagicSystem: () => void;
    onDeleteMagicSystem: (m: MagicSystem) => void;
    onUpdateMagicSystem: (id: string, u: Partial<MagicSystem>) => void;
    worldObjects: WorldObject[];
    onAddWorldObject: () => void;
    onDeleteWorldObject: (o: WorldObject) => void;
    onUpdateWorldObject: (id: string, u: Partial<WorldObject>) => void;
    species: Species[];
    onAddSpecies: () => void;
    onDeleteSpecies: (s: Species) => void;
    onUpdateSpecies: (id: string, u: Partial<Species>) => void;
    secrets: Secret[];
    onAddSecret: () => void;
    onDeleteSecret: (s: Secret) => void;
    onUpdateSecret: (id: string, u: Partial<Secret>) => void;
    nations?: Nation[];
    onAddNation?: () => void;
    onDeleteNation?: (n: Nation) => void;
    onUpdateNation?: (id: string, u: Partial<Nation>) => void;
    storyArcs?: StoryArc[]; // NEW
    
    // Profiles
    secretProfiles?: SecretProfile[];
    onAddSecretProfile?: (name: string) => void;
    onApplySecretProfile?: (id: string) => void;
    onUpdateSecretProfile?: (id: string) => void;
    onDeleteSecretProfile?: (id: string) => void;

    speciesProfiles?: SpeciesProfile[];
    onAddSpeciesProfile?: (name: string) => void;
    onApplySpeciesProfile?: (id: string) => void;
    onUpdateSpeciesProfile?: (id: string) => void;
    onDeleteSpeciesProfile?: (id: string) => void;

    worldObjectProfiles?: WorldObjectProfile[];
    onAddWorldObjectProfile?: (name: string) => void;
    onApplyWorldObjectProfile?: (id: string) => void;
    onUpdateWorldObjectProfile?: (id: string) => void;
    onDeleteWorldObjectProfile?: (id: string) => void;

    magicSystemProfiles?: MagicSystemProfile[];
    onAddMagicSystemProfile?: (name: string) => void;
    onApplyMagicSystemProfile?: (id: string) => void;
    onUpdateMagicSystemProfile?: (id: string) => void;
    onDeleteMagicSystemProfile?: (id: string) => void;

    scenarioProfiles?: ScenarioProfile[];
    onAddScenarioProfile?: (name: string) => void;
    onApplyScenarioProfile?: (id: string) => void;
    onUpdateScenarioProfile?: (id: string) => void;
    onDeleteScenarioProfile?: (id: string) => void;

    nationProfiles?: NationProfile[];
    onAddNationProfile?: (name: string) => void;
    onApplyNationProfile?: (id: string) => void;
    onUpdateNationProfile?: (id: string) => void;
    onDeleteNationProfile?: (id: string) => void;

    [key: string]: any;
}> = ({ 
    isOpen, onClose, 
    characters, onAddCharacter, onDeleteCharacter, onUpdateCharacter,
    scenarios, onAddScenario, onDeleteScenario, onUpdateScenario,
    magicSystems, onAddMagicSystem, onDeleteMagicSystem, onUpdateMagicSystem,
    worldObjects, onAddWorldObject, onDeleteWorldObject, onUpdateWorldObject,
    species, onAddSpecies, onDeleteSpecies, onUpdateSpecies,
    secrets, onAddSecret, onDeleteSecret, onUpdateSecret,
    nations = [], onAddNation, onDeleteNation, onUpdateNation,
    storyArcs = [],
    secretProfiles = [], onAddSecretProfile, onApplySecretProfile, onUpdateSecretProfile, onDeleteSecretProfile,
    speciesProfiles = [], onAddSpeciesProfile, onApplySpeciesProfile, onUpdateSpeciesProfile, onDeleteSpeciesProfile,
    worldObjectProfiles = [], onAddWorldObjectProfile, onApplyWorldObjectProfile, onUpdateWorldObjectProfile, onDeleteWorldObjectProfile,
    magicSystemProfiles = [], onAddMagicSystemProfile, onApplyMagicSystemProfile, onUpdateMagicSystemProfile, onDeleteMagicSystemProfile,
    scenarioProfiles = [], onAddScenarioProfile, onApplyScenarioProfile, onUpdateScenarioProfile, onDeleteScenarioProfile,
    nationProfiles = [], onAddNationProfile, onApplyNationProfile, onUpdateNationProfile, onDeleteNationProfile,
    ...props 
}) => {
    const [activeAccordionId, setActiveAccordionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'characters' | 'scenarios' | 'nations' | 'magic' | 'objects' | 'species' | 'secrets'>('characters');
    const [charSearch, setCharSearch] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredCharacters = useMemo(() => {
        if (!charSearch) return characters;
        const lower = charSearch.toLowerCase();
        return characters.filter(c => 
            c.name.toLowerCase().includes(lower) || 
            c.aliases?.some(a => a.toLowerCase().includes(lower))
        );
    }, [characters, charSearch]);

    return (
        <PanelShell
            id="structure"
            side="left"
            isOpen={isOpen}
            onClose={onClose}
            title="Estructura del Mundo"
            icon={<BookOpenIcon />}
            widthConfig={{ initial: 400, min: 300, max: 800 }}
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
                {activeTab === 'characters' && (
                    <div>
                        <div className="flex flex-col space-y-2 mb-2">
                             <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-300 flex items-center"><UsersIcon className="mr-2" /> Personajes ({characters.length})</h3>
                                <div className="flex space-x-1">
                                    <button 
                                        onClick={() => {
                                            setIsSelectionMode(!isSelectionMode);
                                            if (isSelectionMode) setSelectedIds(new Set());
                                        }}
                                        className={`p-1.5 rounded transition-colors ${isSelectionMode ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                        title={isSelectionMode ? "Cancelar selección" : "Seleccionar personajes para exportar"}
                                    >
                                        <ListCheckIcon className="w-4 h-4" />
                                    </button>
                                    <label 
                                        className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                                        title="Importar personajes desde archivo JSON"
                                    >
                                        <ClipboardPasteIcon className="w-4 h-4" />
                                        <input 
                                            type="file" 
                                            accept=".json"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    try {
                                                        const text = event.target?.result as string;
                                                        const imported = JSON.parse(text);
                                                        if (Array.isArray(imported) && imported[0] && imported[0].id && imported[0].name !== undefined) {
                                                            const newChars = imported.map((c: any) => ({
                                                                ...c,
                                                                id: generateUUID()
                                                            }));
                                                            onUpdateCharacter('all', [...characters, ...newChars]);
                                                            alert(`${newChars.length} personajes importados con éxito.`);
                                                        } else {
                                                            alert("El archivo no contiene datos de personajes válidos.");
                                                        }
                                                    } catch (e) {
                                                        console.error("Error al importar", e);
                                                        alert("Error al importar: Asegúrate de que es un archivo JSON válido de personajes.");
                                                    }
                                                };
                                                reader.readAsText(file);
                                                e.target.value = ''; // refresh value so same file can be uploaded again
                                            }}
                                        />
                                    </label>
                                    <button onClick={onAddCharacter} className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition-colors" title="Añadir nuevo">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>
                             
                             {isSelectionMode && (
                                <div className="bg-gray-800 p-2 rounded-md flex justify-between items-center text-xs animate-fade-in-fast border border-gray-700">
                                    <span className="text-gray-300 font-medium">{selectedIds.size} seleccionados</span>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => {
                                                const charsToExport = characters.filter(c => selectedIds.has(c.id));
                                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(charsToExport, null, 2));
                                                const downloadAnchorNode = document.createElement('a');
                                                downloadAnchorNode.setAttribute("href",     dataStr);
                                                downloadAnchorNode.setAttribute("download", `personajes_exportados_${new Date().getTime()}.json`);
                                                document.body.appendChild(downloadAnchorNode); // required for firefox
                                                downloadAnchorNode.click();
                                                downloadAnchorNode.remove();
                                                setIsSelectionMode(false);
                                                setSelectedIds(new Set());
                                            }}
                                            disabled={selectedIds.size === 0}
                                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-white transition-colors shadow-sm"
                                        >
                                            <CopyIcon className="w-3.5 h-3.5 mr-1.5" /> Descargar Datos
                                        </button>
                                    </div>
                                </div>
                             )}

                             {/* Character Search Bar */}
                             <div className="relative">
                                <input 
                                    type="text" 
                                    value={charSearch}
                                    onChange={(e) => setCharSearch(e.target.value)}
                                    placeholder="Buscar por nombre o alias..."
                                    className="w-full bg-gray-900 border border-gray-700 rounded-md py-1.5 pl-8 pr-8 text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                                />
                                <SearchIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                                {charSearch && (
                                    <button 
                                        onClick={() => setCharSearch('')}
                                        className="absolute right-2 top-2 text-gray-500 hover:text-white"
                                    >
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                             </div>
                        </div>

                        <div className="space-y-2">
                            {filteredCharacters.map(char => (
                                <div key={char.id} className="flex items-start space-x-2 w-full">
                                    {isSelectionMode && (
                                        <div className="mt-3 ml-1 flex-shrink-0 animate-fade-in-fast">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(char.id)}
                                                onChange={(e) => {
                                                    const newIds = new Set(selectedIds);
                                                    if (e.target.checked) newIds.add(char.id);
                                                    else newIds.delete(char.id);
                                                    setSelectedIds(newIds);
                                                }}
                                                className="w-4 h-4 text-cyan-600 bg-gray-900 border-gray-600 rounded focus:ring-cyan-500 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                    <div className="bg-gray-700/30 rounded-md flex-grow overflow-hidden w-full min-w-0">
                                        <CharacterAccordion 
                                            character={char}
                                            isOpen={activeAccordionId === char.id}
                                            onToggle={() => setActiveAccordionId(activeAccordionId === char.id ? null : char.id)}
                                            onUpdate={onUpdateCharacter}
                                            onDelete={() => onDeleteCharacter(char)}
                                            allCharacters={characters}
                                            allTraits={props.psychologicalTraits || []}
                                            allArcs={storyArcs}
                                        />
                                    </div>
                                </div>
                            ))}
                            {filteredCharacters.length === 0 && charSearch && (
                                <p className="text-xs text-gray-500 text-center italic py-4">No se encontraron personajes.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'scenarios' && (
                    <div>
                        <ProfileManager 
                            title="Perfiles de Escenario (Sets)"
                            description="Gestiona qué lugares son relevantes para la IA en diferentes momentos."
                            profiles={scenarioProfiles}
                            onAdd={onAddScenarioProfile!}
                            onApply={onApplyScenarioProfile!}
                            onUpdate={onUpdateScenarioProfile!}
                            onDelete={onDeleteScenarioProfile!}
                        />
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><GlobeAltIcon className="mr-2" /> Escenarios y Lugares</h3>
                             <button onClick={onAddScenario} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                        </div>
                        <div className="space-y-2">
                            {scenarios.map(scenario => (
                                <div key={scenario.id} className="bg-gray-700/30 rounded-md">
                                    <ScenarioAccordion
                                        scenario={scenario}
                                        isOpen={activeAccordionId === scenario.id}
                                        onToggle={() => setActiveAccordionId(activeAccordionId === scenario.id ? null : scenario.id)}
                                        onUpdate={onUpdateScenario}
                                        onDelete={() => onDeleteScenario(scenario)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'nations' && (
                    <div>
                        <ProfileManager 
                            title="Perfiles de Naciones"
                            description="Gestiona qué reinos están activos en esta era."
                            profiles={nationProfiles}
                            onAdd={onAddNationProfile!}
                            onApply={onApplyNationProfile!}
                            onUpdate={onUpdateNationProfile!}
                            onDelete={onDeleteNationProfile!}
                        />
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><FlagIcon className="mr-2" /> Naciones y Reinos</h3>
                             <button onClick={onAddNation} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                        </div>
                        <div className="space-y-2">
                            {nations.map(nation => (
                                <div key={nation.id} className="bg-gray-700/30 rounded-md">
                                    <NationAccordion
                                        nation={nation}
                                        isOpen={activeAccordionId === nation.id}
                                        onToggle={() => setActiveAccordionId(activeAccordionId === nation.id ? null : nation.id)}
                                        onUpdate={onUpdateNation!}
                                        onDelete={() => onDeleteNation!(nation)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'magic' && (
                    <div>
                        <ProfileManager 
                            title="Perfiles de Magia (Sets)"
                            description="Gestiona qué sistemas mágicos están activos (ej. 'Era de la Magia Alta')."
                            profiles={magicSystemProfiles}
                            onAdd={onAddMagicSystemProfile!}
                            onApply={onApplyMagicSystemProfile!}
                            onUpdate={onUpdateMagicSystemProfile!}
                            onDelete={onDeleteMagicSystemProfile!}
                        />
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><SparkleIcon className="mr-2" /> Sistemas Mágicos</h3>
                             <button onClick={onAddMagicSystem} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                        </div>
                        <div className="space-y-2">
                            {magicSystems.map(ms => (
                                <div key={ms.id} className="bg-gray-700/30 rounded-md">
                                    <MagicSystemAccordion
                                        magicSystem={ms}
                                        isOpen={activeAccordionId === ms.id}
                                        onToggle={() => setActiveAccordionId(activeAccordionId === ms.id ? null : ms.id)}
                                        onUpdate={onUpdateMagicSystem}
                                        onDelete={() => onDeleteMagicSystem(ms)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'objects' && (
                    <div>
                        <ProfileManager 
                            title="Perfiles de Objetos (Sets)"
                            description="Gestiona sets de objetos (ej. 'Reliquias Perdidas') para cambiar el contexto."
                            profiles={worldObjectProfiles}
                            onAdd={onAddWorldObjectProfile!}
                            onApply={onApplyWorldObjectProfile!}
                            onUpdate={onUpdateWorldObjectProfile!}
                            onDelete={onDeleteWorldObjectProfile!}
                        />
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><CubeIcon className="mr-2" /> Objetos e Ítems</h3>
                             <button onClick={onAddWorldObject} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                        </div>
                        <div className="space-y-2">
                            {worldObjects.map(obj => (
                                <div key={obj.id} className="bg-gray-700/30 rounded-md">
                                    <WorldObjectAccordion
                                        worldObject={obj}
                                        isOpen={activeAccordionId === obj.id}
                                        onToggle={() => setActiveAccordionId(activeAccordionId === obj.id ? null : obj.id)}
                                        onUpdate={onUpdateWorldObject}
                                        onDelete={() => onDeleteWorldObject(obj)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                 {activeTab === 'species' && (
                     <div>
                        <ProfileManager 
                            title="Perfiles de Especies"
                            description="Gestiona qué especies existen o son relevantes en diferentes épocas."
                            profiles={speciesProfiles}
                            onAdd={onAddSpeciesProfile!}
                            onApply={onApplySpeciesProfile!}
                            onUpdate={onUpdateSpeciesProfile!}
                            onDelete={onDeleteSpeciesProfile!}
                        />
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><DnaIcon className="mr-2" /> Especies y Razas</h3>
                             <button onClick={onAddSpecies} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                        </div>
                        <div className="space-y-2">
                            {species.map(s => (
                                <div key={s.id} className="bg-gray-700/30 rounded-md">
                                    <SpeciesAccordion
                                        species={s}
                                        isOpen={activeAccordionId === s.id}
                                        onToggle={() => setActiveAccordionId(activeAccordionId === s.id ? null : s.id)}
                                        onUpdate={onUpdateSpecies}
                                        onDelete={() => onDeleteSpecies(s)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'secrets' && (
                    <div>
                        <ProfileManager 
                            title="Perfiles de Trama"
                            description="Guarda qué tramas están activas/inactivas para cambiar el contexto."
                            profiles={secretProfiles}
                            onAdd={onAddSecretProfile!}
                            onApply={onApplySecretProfile!}
                            onUpdate={onUpdateSecretProfile!}
                            onDelete={onDeleteSecretProfile!}
                        />
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-gray-300 flex items-center"><KeyIcon className="mr-2" /> Secretos y Tramas</h3>
                             <button onClick={onAddSecret} className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded"><PlusIcon /></button>
                        </div>
                        <div className="space-y-2">
                            {secrets.map(s => (
                                <div key={s.id} className="bg-gray-700/30 rounded-md">
                                    <SecretAccordion
                                        secret={s}
                                        isOpen={activeAccordionId === s.id}
                                        onToggle={() => setActiveAccordionId(activeAccordionId === s.id ? null : s.id)}
                                        onUpdate={onUpdateSecret}
                                        onDelete={() => onDeleteSecret(s)}
                                        allCharacters={characters}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PanelShell>
    );
};
