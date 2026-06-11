
import React, { useState } from 'react';
import { WorldObject } from '../../types';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { CubeIcon, FileTextIcon, SparkleIcon, ScaleIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';
import { AbilityListEditor } from './AbilityListEditor';
import { RuleListEditor } from './RuleListEditor';

interface WorldObjectDetailsEditorProps {
    worldObject: WorldObject;
    onUpdate: (id: string, u: Partial<WorldObject>) => void;
}

export const WorldObjectDetailsEditor: React.FC<WorldObjectDetailsEditorProps> = ({ worldObject, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'abilities' | 'rules'>('general');
    const [aliases, setAliases] = useState(worldObject.aliases?.join(', ') || '');

    const handleAliasesBlur = () => {
        const arr = aliases.split(',').map(s => s.trim()).filter(s => s);
        onUpdate(worldObject.id, { aliases: arr });
    };

    const handleUpdateField = (field: keyof WorldObject, value: any) => {
        onUpdate(worldObject.id, { [field]: value });
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
                <span className="text-xs font-bold text-gray-400 uppercase">Configuración de Objeto</span>
                <button 
                    onClick={() => onUpdate(worldObject.id, { active: !worldObject.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${worldObject.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={worldObject.active !== false ? "Objeto Activo (Visible para IA)" : "Objeto Inactivo (Ignorado)"}
                >
                    <span>{worldObject.active !== false ? 'ACTIVO' : 'INACTIVO'}</span>
                    {worldObject.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-3 overflow-x-auto scrollbar-hide">
                <TabButton id="general" label="General" icon={<FileTextIcon className="w-3 h-3"/>} />
                <TabButton id="abilities" label="Propiedades" icon={<SparkleIcon className="w-3 h-3"/>} />
                <TabButton id="rules" label="Reglas" icon={<ScaleIcon className="w-3 h-3"/>} />
            </div>

            {/* Content Area */}
            <div className="min-h-[200px]">
                {activeTab === 'general' && (
                    <div className="space-y-3 animate-fade-in-fast">
                        <StyledInput 
                            label="Alias (Palabras Clave)" 
                            value={aliases} 
                            onChange={e => setAliases(e.target.value)} 
                            onBlur={handleAliasesBlur} 
                            placeholder="ej. Espada Maestra, Filo del Destino"
                        />
                        <StyledTextArea 
                            label="Descripción Física y Lore" 
                            value={worldObject.description || ''} 
                            onChange={e => handleUpdateField('description', e.target.value)} 
                            rows={4} 
                            placeholder="Aspecto, historia, origen..." 
                        />
                        <StyledTextArea 
                            label="Notas Privadas" 
                            value={worldObject.notes || ''} 
                            onChange={e => handleUpdateField('notes', e.target.value)} 
                            rows={2} 
                            placeholder="Detalles para el escritor..." 
                        />
                    </div>
                )}

                {activeTab === 'abilities' && (
                    <div className="animate-fade-in-fast">
                        <AbilityListEditor 
                            abilities={worldObject.abilitiesList} 
                            onUpdate={(l) => handleUpdateField('abilitiesList', l)} 
                            label="Propiedades Mágicas / Efectos"
                        />
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="animate-fade-in-fast">
                        <RuleListEditor
                            rules={worldObject.rules}
                            onUpdate={(l) => handleUpdateField('rules', l)}
                            label="Reglas de Uso / Maldiciones"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
