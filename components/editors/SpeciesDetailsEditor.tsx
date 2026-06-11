
import React, { useState } from 'react';
import { Species, CharacterAttribute } from '../../types';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { DnaIcon, ActivityIcon, BookOpenIcon, SparkleIcon, FileTextIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';
import { AbilityListEditor } from './AbilityListEditor';
import { AttributeListEditor } from './AttributeListEditor';

interface SpeciesDetailsEditorProps {
    species: Species;
    onUpdate: (id: string, u: Partial<Species>) => void;
}

export const SpeciesDetailsEditor: React.FC<SpeciesDetailsEditorProps> = ({ species, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'physiology' | 'culture' | 'abilities'>('general');
    const [aliases, setAliases] = useState(species.aliases?.join(', ') || '');

    const handleAliasesBlur = () => {
        const arr = aliases.split(',').map(s => s.trim()).filter(s => s);
        onUpdate(species.id, { aliases: arr });
    };

    const handleUpdateField = (field: keyof Species, value: any) => {
        onUpdate(species.id, { [field]: value });
    };

    const TabButton: React.FC<{ id: string; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
        <button 
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-1 px-3 py-2 text-xs font-bold uppercase rounded-t-md transition-colors border-b-2 ${
                activeTab === id 
                ? 'bg-gray-700/50 border-cyan-400 text-white' 
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="animate-fade-in-fast">
            {/* Active Toggle Header */}
            <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Configuración de Especie</span>
                <button 
                    onClick={() => onUpdate(species.id, { active: !species.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${species.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={species.active !== false ? "Especie Activa (Visible para IA)" : "Especie Inactiva (Ignorada)"}
                >
                    <span>{species.active !== false ? 'ACTIVA' : 'INACTIVA'}</span>
                    {species.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-3 overflow-x-auto scrollbar-hide">
                <TabButton id="general" label="Resumen" icon={<FileTextIcon className="w-3 h-3"/>} />
                <TabButton id="physiology" label="Fisiología" icon={<ActivityIcon className="w-3 h-3"/>} />
                <TabButton id="culture" label="Cultura" icon={<BookOpenIcon className="w-3 h-3"/>} />
                <TabButton id="abilities" label="Habilidades" icon={<SparkleIcon className="w-3 h-3"/>} />
            </div>

            {/* Content Area */}
            <div className="min-h-[200px]">
                {activeTab === 'general' && (
                    <div className="space-y-3 animate-fade-in-fast">
                        <StyledInput 
                            label="Nombres Alternativos / Alias" 
                            value={aliases} 
                            onChange={e => setAliases(e.target.value)} 
                            onBlur={handleAliasesBlur} 
                            placeholder="ej. Los Primeros, Hijos del Bosque"
                        />
                        <StyledTextArea 
                            label="Descripción Visual y General" 
                            value={species.description || ''} 
                            onChange={e => handleUpdateField('description', e.target.value)} 
                            rows={6} 
                            placeholder="Apariencia física general, distribución en el mundo, rasgos distintivos..." 
                        />
                    </div>
                )}

                {activeTab === 'physiology' && (
                    <div className="space-y-4 animate-fade-in-fast">
                        <div className="bg-gray-900/30 p-3 rounded border border-gray-700">
                            <AttributeListEditor 
                                attributes={species.attributes}
                                onUpdate={(list) => onUpdate(species.id, { attributes: list })}
                            />
                            <p className="text-[10px] text-gray-500 mt-2 italic">
                                Define bonificadores raciales, estadísticas base o características biológicas medibles (ej. Fuerza Base: 12, Esperanza de Vida: 200).
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'culture' && (
                    <div className="space-y-4 animate-fade-in-fast">
                        <StyledTextArea 
                            label="Estructura Social y Política" 
                            value={species.politics || ''} 
                            onChange={e => handleUpdateField('politics', e.target.value)} 
                            rows={4} 
                            placeholder="¿Cómo se gobiernan? ¿Tribus, imperio, anarquía? ¿Jerarquías?" 
                        />
                        <StyledTextArea 
                            label="Filosofía, Religión y Creencias" 
                            value={species.philosophy || ''} 
                            onChange={e => handleUpdateField('philosophy', e.target.value)} 
                            rows={4} 
                            placeholder="¿Qué valoran? ¿A quién adoran? ¿Cuál es su visión del mundo?" 
                        />
                    </div>
                )}

                {activeTab === 'abilities' && (
                    <div className="animate-fade-in-fast">
                        <AbilityListEditor 
                            abilities={species.abilitiesList}
                            onUpdate={(list) => onUpdate(species.id, { abilitiesList: list })}
                            label="Rasgos Raciales y Habilidades Innate"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
