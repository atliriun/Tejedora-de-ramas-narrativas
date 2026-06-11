
import React, { useState } from 'react';
import { StoryArc, ContextPreset, StoryNodeData } from '../../types';
import { 
    LayersIcon, XIcon, ChevronDownIcon, SaveIcon, TrashIcon, 
    CheckIcon, PlusIcon, CopyIcon, EditIcon, BookOpenIcon, ArrowUpIcon
} from '../icons';
import { PanelShell } from '../ui/PanelShell';

interface StoryArcsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    storyArcs: StoryArc[];
    activeArcId: string;
    onAddArc: () => void;
    onDeleteArc: (arc: StoryArc) => void;
    onDuplicateArc: (arcId: string) => void;
    onUpdateArcName: (arcId: string, newName: string) => void;
    onUpdateArcSummary: (arcId: string, newSummary: string) => void;
    onUpdateArcSignificance: (arcId: string, score: number) => void;
    onSetActiveArc: (arcId: string) => void;
    onReorderArcs: (arcs: StoryArc[]) => void;
    contextPresets: ContextPreset[];
    onAddPreset: (name: string) => void;
    onApplyPreset: (presetId: string) => void;
    onDeletePreset: (presetId: string) => void;
    onUpdatePreset: (presetId: string) => void;
}

export const StoryArcsPanel: React.FC<StoryArcsPanelProps> = ({ 
    isOpen, onClose, storyArcs, activeArcId, onAddArc, onDeleteArc, 
    onDuplicateArc, onUpdateArcName, onUpdateArcSummary, onUpdateArcSignificance, 
    onSetActiveArc, onReorderArcs, contextPresets, onAddPreset, onApplyPreset, onDeletePreset, onUpdatePreset 
}) => {
    const [editingArcId, setEditingArcId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [newPresetName, setNewPresetName] = useState('');
    const [isCreatingPreset, setIsCreatingPreset] = useState(false);
    const [isPresetsOpen, setIsPresetsOpen] = useState(false);

    const handleEditStart = (arc: StoryArc) => {
        setEditingArcId(arc.id);
        setEditingName(arc.name);
    };
    
    const handleEditCancel = () => {
        setEditingArcId(null);
        setEditingName('');
    };

    const handleEditSave = () => {
        if (editingArcId && editingName.trim()) {
            onUpdateArcName(editingArcId, editingName.trim());
        }
        handleEditCancel();
    };

    const handleCreatePresetSubmit = () => {
        if (newPresetName.trim()) {
            onAddPreset(newPresetName.trim());
            setNewPresetName('');
            setIsCreatingPreset(false);
        }
    };

    const handleMoveArc = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === storyArcs.length - 1)) return;
        
        const newArcs = [...storyArcs];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newArcs[index], newArcs[targetIndex]] = [newArcs[targetIndex], newArcs[index]];
        
        onReorderArcs(newArcs);
    };

    return (
        <PanelShell
            id="storyarcs"
            side="left"
            isOpen={isOpen}
            onClose={onClose}
            title="Arcos Narrativos"
            icon={<LayersIcon />}
            widthConfig={{ initial: 400, min: 300, max: 600 }}
        >
            {/* Context Presets Section - Collapsible */}
            <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
                 <button 
                    onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase hover:text-white transition-colors focus:outline-none"
                 >
                    <span>Perfiles de Contexto (Context Profiles)</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isPresetsOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isPresetsOpen && (
                    <div className="mt-3 space-y-2 animate-fade-in-fast">
                        {contextPresets.length > 0 && (
                            <div className="grid grid-cols-1 gap-2">
                                {contextPresets.map(preset => (
                                    <div key={preset.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded text-sm">
                                        <span className="font-medium truncate flex-grow">{preset.name}</span>
                                        <div className="flex space-x-1">
                                            <button onClick={() => onApplyPreset(preset.id)} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-xs rounded font-semibold" title="Cargar este perfil (Score + Resumen)">Cargar</button>
                                            <button onClick={() => onUpdatePreset(preset.id)} className="p-1 bg-gray-600 hover:bg-green-500 text-xs rounded" title="Actualizar con configuración actual"><SaveIcon /></button>
                                            <button onClick={() => onDeletePreset(preset.id)} className="p-1 bg-gray-600 hover:bg-red-500 text-xs rounded" title="Eliminar"><TrashIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {isCreatingPreset ? (
                            <div className="flex items-center space-x-2 mt-2">
                                <input 
                                    type="text" 
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    placeholder="Nombre del perfil..."
                                    className="flex-grow bg-gray-900 border border-cyan-500 rounded px-2 py-1 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreatePresetSubmit();
                                        if (e.key === 'Escape') setIsCreatingPreset(false);
                                    }}
                                />
                                <button onClick={handleCreatePresetSubmit} className="p-1.5 bg-green-600 hover:bg-green-500 rounded" title="Guardar"><CheckIcon className="w-4 h-4"/></button>
                                <button onClick={() => setIsCreatingPreset(false)} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded" title="Cancelar"><XIcon className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <button onClick={() => setIsCreatingPreset(true)} className="w-full text-xs flex items-center justify-center space-x-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded border border-dashed border-gray-500 text-gray-300">
                                <SaveIcon />
                                <span>Guardar Config Actual (Score + Textos)</span>
                            </button>
                        )}
                    </div>
                 )}
            </div>

            <div className="p-3 border-b border-gray-700 flex-shrink-0">
                <button onClick={onAddArc} className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold transition-colors text-sm" title="Añadir Nuevo Arco">
                    <PlusIcon />
                    <span>Añadir Nuevo Arco Narrativo</span>
                </button>
            </div>
            <div className="overflow-y-auto flex-grow p-3 space-y-3">
                {storyArcs.map((arc, index) => {
                    const score = arc.significance ?? 0;
                    const isIgnored = score === 0;

                    return (
                        <div key={arc.id} className={`p-3 rounded-md group transition-colors flex items-start space-x-2 ${arc.id === activeArcId ? 'bg-cyan-900/50 border border-cyan-700' : 'bg-gray-700/50 border border-transparent hover:border-gray-600'}`}>
                            
                            {/* Reorder Buttons */}
                            <div className="flex flex-col space-y-1 mt-1 flex-shrink-0">
                                <button 
                                    onClick={() => handleMoveArc(index, 'up')} 
                                    disabled={index === 0}
                                    className="text-gray-500 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ArrowUpIcon className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={() => handleMoveArc(index, 'down')} 
                                    disabled={index === storyArcs.length - 1}
                                    className="text-gray-500 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ArrowUpIcon className="w-3 h-3 rotate-180" />
                                </button>
                            </div>

                            <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    {editingArcId === arc.id ? (
                                        <div className="flex-grow flex items-center space-x-2">
                                            <input 
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleEditSave();
                                                    if (e.key === 'Escape') handleEditCancel();
                                                }}
                                                onBlur={handleEditSave}
                                                className="bg-gray-900 border border-cyan-500 rounded px-2 py-1 text-sm w-full"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-grow min-w-0 flex items-center space-x-2">
                                            <p className={`text-sm font-semibold truncate cursor-pointer ${isIgnored && arc.id !== activeArcId ? 'text-gray-500' : 'text-gray-200'}`} title={arc.name} onClick={() => onSetActiveArc(arc.id)}>
                                                {arc.name}
                                            </p>
                                            {arc.id === activeArcId && <span className="text-xs bg-cyan-600 px-1.5 py-0.5 rounded text-white">Activo</span>}
                                        </div>
                                    )}
                                    <div className="flex-shrink-0 flex items-center space-x-1">
                                        {editingArcId === arc.id ? (
                                            <>
                                                <button onClick={handleEditCancel} className="p-1.5 rounded-full hover:bg-gray-600" title="Cancelar"><XIcon/></button>
                                                <button onClick={handleEditSave} className="p-1.5 rounded-full hover:bg-green-600" title="Guardar"><CheckIcon/></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => onDuplicateArc(arc.id)} className="p-1.5 rounded-full hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Duplicar Arco (Clonar Árbol)"><CopyIcon /></button>
                                                <button onClick={() => handleEditStart(arc)} className="p-1.5 rounded-full hover:bg-gray-600 opacity-0 group-hover:opacity-100" title="Renombrar"><EditIcon /></button>
                                                <button onClick={() => onDeleteArc(arc)} className="p-1.5 rounded-full hover:bg-red-500 opacity-0 group-hover:opacity-100" title="Borrar"><TrashIcon /></button>
                                                <button onClick={() => onSetActiveArc(arc.id)} disabled={arc.id === activeArcId} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded disabled:bg-gray-600 disabled:cursor-not-allowed ml-2">
                                                    Ver
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* Context Priority UI */}
                                {arc.id !== activeArcId && (
                                    <div className="mt-3 p-3 bg-gray-900/40 rounded-lg border border-gray-700/50 shadow-inner">
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nivel de Importancia</label>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                                score >= 10 ? 'bg-red-900/30 border-red-500/50 text-red-300' :
                                                score >= 7 ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300' :
                                                score >= 4 ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300' :
                                                score > 0 ? 'bg-gray-800 border-gray-600 text-gray-300' :
                                                'bg-gray-800 border-gray-700 text-gray-500'
                                            }`}>
                                                {score === 0 ? 'Ignorado' : score}
                                            </span>
                                        </div>
                                        
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="10" 
                                            step="1" 
                                            value={score} 
                                            onChange={(e) => onUpdateArcSignificance(arc.id, parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-cyan-400 transition-all"
                                        />
                                        
                                        <p className="text-[10px] mt-1.5 leading-tight h-8 flex items-center">
                                            {score === 0 ? <span className="text-gray-500 flex items-center">🚫 Excluido de la memoria de la IA.</span> :
                                            score >= 10 ? <span className="text-red-300 flex items-center">🔥 <strong>Crítico:</strong> Se envía todo el árbol de nodos.</span> :
                                            score >= 7 ? <span className="text-yellow-300 flex items-center">✨ <strong>Canónico:</strong> Se envía el resumen y el camino "oficial".</span> :
                                            score >= 4 ? <span className="text-cyan-300 flex items-center">🏷️ <strong>Temático:</strong> Se envía el resumen y nodos con etiquetas.</span> :
                                            <span className="text-gray-300 flex items-center">📄 <strong>Fondo:</strong> Solo se envía el resumen manual.</span>}
                                        </p>

                                        {(arc.significance || 0) > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                                                <label className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 uppercase mb-1">
                                                    <BookOpenIcon /> <span>Resumen Global</span>
                                                </label>
                                                <textarea 
                                                    value={arc.summary || ''}
                                                    onChange={(e) => onUpdateArcSummary(arc.id, e.target.value)}
                                                    placeholder="Resume este arco para la IA (ahorra tokens)..."
                                                    className="w-full text-xs bg-gray-800 border border-gray-600 rounded p-2 focus:ring-1 focus:ring-cyan-500 outline-none resize-y h-16"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </PanelShell>
    );
};
