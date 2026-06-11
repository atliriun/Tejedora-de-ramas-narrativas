
import React, { useState } from 'react';
import { MagicSystem } from '../../types';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { FileTextIcon, SparkleIcon, ScaleIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';
import { AbilityListEditor } from './AbilityListEditor';
import { RuleListEditor } from './RuleListEditor';

interface MagicSystemDetailsEditorProps {
    magicSystem: MagicSystem;
    onUpdate: (id: string, u: Partial<MagicSystem>) => void;
}

export const MagicSystemDetailsEditor: React.FC<MagicSystemDetailsEditorProps> = ({ magicSystem, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'spells' | 'rules'>('general');

    const handleUpdateField = (field: keyof MagicSystem, value: any) => {
        onUpdate(magicSystem.id, { [field]: value });
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
                <span className="text-xs font-bold text-gray-400 uppercase">Configuración de Magia</span>
                <button 
                    onClick={() => onUpdate(magicSystem.id, { active: !magicSystem.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${magicSystem.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={magicSystem.active !== false ? "Sistema Mágico Activo (Visible para IA)" : "Sistema Inactivo (Ignorado)"}
                >
                    <span>{magicSystem.active !== false ? 'ACTIVO' : 'INACTIVO'}</span>
                    {magicSystem.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-3 overflow-x-auto scrollbar-hide">
                <TabButton id="general" label="General" icon={<FileTextIcon className="w-3 h-3"/>} />
                <TabButton id="spells" label="Hechizos" icon={<SparkleIcon className="w-3 h-3"/>} />
                <TabButton id="rules" label="Leyes" icon={<ScaleIcon className="w-3 h-3"/>} />
            </div>

            {/* Content Area */}
            <div className="min-h-[200px]">
                {activeTab === 'general' && (
                    <div className="space-y-3 animate-fade-in-fast">
                        <StyledInput 
                            label="Alias / Nombres Alternativos" 
                            value={magicSystem.aliases?.join(', ') || ''} 
                            onChange={e => handleUpdateField('aliases', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} 
                            placeholder="ej. El Arte, Alquimia, La Fuerza" 
                        />
                        <StyledTextArea 
                            label="Descripción General" 
                            value={magicSystem.description} 
                            onChange={e => handleUpdateField('description', e.target.value)} 
                            rows={6} 
                            placeholder="¿Qué es? ¿De dónde viene? Resumen del concepto." 
                        />
                        <StyledTextArea 
                            label="Notas Privadas" 
                            value={magicSystem.notes || ''} 
                            onChange={e => handleUpdateField('notes', e.target.value)} 
                            rows={2} 
                            placeholder="Detalles para el escritor..." 
                        />
                    </div>
                )}

                {activeTab === 'spells' && (
                    <div className="animate-fade-in-fast">
                        <AbilityListEditor 
                            abilities={magicSystem.abilitiesList} 
                            onUpdate={(l) => handleUpdateField('abilitiesList', l)} 
                            label="Hechizos y Técnicas Específicas"
                        />
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="animate-fade-in-fast">
                        <RuleListEditor
                            rules={magicSystem.rules}
                            onUpdate={(l) => handleUpdateField('rules', l)}
                            label="Leyes Mágicas, Costes y Limitaciones"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
