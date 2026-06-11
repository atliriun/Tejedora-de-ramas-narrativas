
import React, { useState } from 'react';
import { Scenario } from '../../types';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { GlobeAltIcon, ActivityIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';
import { AttributeListEditor } from './AttributeListEditor';

interface ScenarioDetailsEditorProps {
    scenario: Scenario;
    onUpdate: (id: string, u: Partial<Scenario>) => void;
}

export const ScenarioDetailsEditor: React.FC<ScenarioDetailsEditorProps> = ({ scenario, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'stats'>('general');

    const handleUpdate = (u: Partial<Scenario>) => onUpdate(scenario.id, u);

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
                <span className="text-xs font-bold text-gray-400 uppercase">Configuración de Escenario</span>
                <button 
                    onClick={() => handleUpdate({ active: !scenario.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${scenario.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={scenario.active !== false ? "Escenario Activo (Visible para IA)" : "Escenario Inactivo (Ignorado)"}
                >
                    <span>{scenario.active !== false ? 'ACTIVO' : 'INACTIVO'}</span>
                    {scenario.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-3 overflow-x-auto scrollbar-hide">
                <TabButton id="general" label="General" icon={<GlobeAltIcon className="w-3 h-3"/>} />
                <TabButton id="stats" label="Estadísticas" icon={<ActivityIcon className="w-3 h-3"/>} />
            </div>

            {/* Content Area */}
            <div className="min-h-[200px]">
                {activeTab === 'general' && (
                    <div className="space-y-3 animate-fade-in-fast">
                        <StyledInput 
                            label="Alias / Palabras Clave" 
                            value={scenario.aliases?.join(', ') || ''} 
                            onChange={e => handleUpdate({ aliases: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} 
                            placeholder="ej. El Castillo, Fortaleza" 
                        />
                        <StyledTextArea 
                            label="Descripción" 
                            value={scenario.description || ''} 
                            onChange={e => handleUpdate({ description: e.target.value })} 
                            rows={4} 
                            placeholder="Apariencia general y propósito del lugar..."
                        />
                        <StyledInput 
                            label="Atmósfera / Vibe" 
                            value={scenario.atmosphere || ''} 
                            onChange={e => handleUpdate({ atmosphere: e.target.value })} 
                            placeholder="ej. Tenebroso, Solemne, Caótico"
                        />
                        <StyledTextArea 
                            label="Detalles Sensoriales (Olores, Sonidos)" 
                            value={scenario.sensoryDetails || ''} 
                            onChange={e => handleUpdate({ sensoryDetails: e.target.value })} 
                            rows={2} 
                            placeholder="Huele a humedad, se escucha el viento..."
                        />
                        <StyledTextArea 
                            label="Notas Privadas" 
                            value={scenario.notes || ''} 
                            onChange={e => handleUpdate({ notes: e.target.value })} 
                            rows={2} 
                            placeholder="Detalles para el escritor..."
                        />
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="animate-fade-in-fast">
                        <div className="bg-gray-900/30 p-3 rounded border border-gray-700">
                            <AttributeListEditor 
                                attributes={scenario.attributes} 
                                onUpdate={(l) => handleUpdate({ attributes: l })} 
                            />
                            <p className="text-[10px] text-gray-500 mt-2 italic">
                                Define estadísticas del lugar (ej. Nivel de Peligro: 8/10, Población: 500, Densidad Mágica: 20).
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
