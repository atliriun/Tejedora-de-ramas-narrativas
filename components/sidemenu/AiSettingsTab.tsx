
import React from 'react';
import type { AiSettings } from '../../types';
import { GlobeAltIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';

interface AiSettingsTabProps {
    settings: AiSettings;
    onSettingsChange: (settings: AiSettings) => void;
}

export const AiSettingsTab: React.FC<AiSettingsTabProps> = ({ settings, onSettingsChange }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Configuración General</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Modelo de IA</label>
                        <select 
                            value={settings.model}
                            onChange={(e) => onSettingsChange({...settings, model: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Máximo Razonamiento)</option>
                            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Más Rápido)</option>
                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash</option>
                            <option value="gemini-2.5-flash-preview">Gemini 2.5 Flash</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">Se recomienda Gemini 3.1 Pro para mejores resultados narrativos.</p>
                    </div>

                    {/* Google Search Toggle */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-full ${settings.googleSearchEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                <GlobeAltIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-gray-200 block">Búsqueda en Internet</span>
                                <span className="text-[10px] text-gray-500 block">Permitir que la IA busque datos reales (Grounding).</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onSettingsChange({ ...settings, googleSearchEnabled: !settings.googleSearchEnabled })}
                            className={`transition-colors ${settings.googleSearchEnabled ? 'text-green-400 hover:text-green-300' : 'text-gray-600 hover:text-gray-400'}`}
                            title={settings.googleSearchEnabled ? "Desactivar Búsqueda" : "Activar Búsqueda"}
                        >
                            {settings.googleSearchEnabled ? <ToggleRightIcon className="w-8 h-8" /> : <ToggleLeftIcon className="w-8 h-8" />}
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Límites de Historial</h3>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Tamaño Historial Deshacer</span>
                        <span className="text-cyan-400">{settings.undoHistoryLimit}</span>
                    </div>
                    <input 
                        type="range" min="10" max="100" step="5"
                        value={settings.undoHistoryLimit}
                        onChange={(e) => onSettingsChange({...settings, undoHistoryLimit: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Creatividad (Temperatura)</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Creatividad de Ramas</span>
                            <span className="text-cyan-400">{settings.branchGenerationTemperature}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.1"
                            value={settings.branchGenerationTemperature}
                            onChange={(e) => onSettingsChange({...settings, branchGenerationTemperature: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Creatividad de Chat</span>
                            <span className="text-cyan-400">{settings.nodeChatTemperature}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.1"
                            value={settings.nodeChatTemperature}
                            onChange={(e) => onSettingsChange({...settings, nodeChatTemperature: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Creatividad de World Building</span>
                            <span className="text-cyan-400">{settings.worldChatTemperature}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.1"
                            value={settings.worldChatTemperature}
                            onChange={(e) => onSettingsChange({...settings, worldChatTemperature: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Traducción</h3>
                    <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Idioma Objetivo</label>
                    <input 
                        type="text"
                        value={settings.translationLanguage}
                        onChange={(e) => onSettingsChange({...settings, translationLanguage: e.target.value})}
                        placeholder="e.g., Español, Francés"
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Configuración de Seguridad</h3>
                <p className="text-xs text-gray-500 mb-3">0: Sin Bloqueo - 3: Bloqueo Estricto</p>
                <div className="space-y-3">
                    {[
                        { key: 'harassment', label: 'Acoso' },
                        { key: 'hateSpeech', label: 'Discurso de Odio' },
                        { key: 'sexuallyExplicit', label: 'Sexualmente Explícito' },
                        { key: 'dangerousContent', label: 'Contenido Peligroso' },
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">{label}</span>
                                <span className="text-cyan-400">{
                                    // @ts-ignore
                                    settings.safetySettings[key]
                                }</span>
                            </div>
                            <input 
                                type="range" min="0" max="3" step="1"
                                // @ts-ignore
                                value={settings.safetySettings[key]}
                                onChange={(e) => onSettingsChange({
                                    ...settings, 
                                    // @ts-ignore
                                    safetySettings: { ...settings.safetySettings, [key]: parseInt(e.target.value) }
                                })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
