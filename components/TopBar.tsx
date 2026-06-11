
import React, { useState, useRef } from 'react';
import { 
    UndoIcon, RedoIcon, LayersIcon, BookOpenIcon, ScaleIcon, 
    FileTextIcon, MenuIcon, TargetIcon, SaveIcon, ShareIcon, FolderOpenIcon
} from './icons';
import { EditableProjectName } from './EditableProjectName';
import { ShareModal } from './ShareModal';

interface TopBarProps {
    history: {
        undo: () => void;
        redo: () => void;
        canUndo: boolean;
        canRedo: boolean;
    };
    ui: any; // app.ui
    project: any; // app.project
    actions?: any; // app.actions
    collab: any; // app.collab
}

export const TopBar: React.FC<TopBarProps> = ({ history, ui, project, actions, collab }) => {
    const { panels } = ui;
    const { tokenCounts } = project;
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    return (
        <>
            <div className="p-4 bg-gray-800 border-b border-gray-700 shadow-md z-20 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <button onClick={history.undo} disabled={!history.canUndo} className="p-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Deshacer (Ctrl+Z)">
                            <UndoIcon />
                        </button>
                        <button onClick={history.redo} disabled={!history.canRedo} className="p-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Rehacer (Ctrl+Y)">
                            <RedoIcon />
                        </button>
                    </div>
                    <div className="h-8 w-px bg-gray-700"></div>
                    <button onClick={() => panels.setIsStoryArcsPanelOpen(!panels.isStoryArcsPanelOpen)} className={`p-2 rounded-md hover:bg-gray-700 transition-colors ${panels.isStoryArcsPanelOpen ? 'bg-gray-700 text-cyan-400' : ''}`} title="Alternar Panel de Arcos">
                        <LayersIcon />
                    </button>
                    <button onClick={() => panels.setIsWorldStructurePanelOpen(!panels.isWorldStructurePanelOpen)} className={`p-2 rounded-md hover:bg-gray-700 transition-colors ${panels.isWorldStructurePanelOpen ? 'bg-gray-700 text-cyan-400' : ''}`} title="Alternar Panel de Estructura">
                        <BookOpenIcon />
                    </button>
                    <button onClick={() => panels.setIsWorldRulesPanelOpen(!panels.isWorldRulesPanelOpen)} className={`p-2 rounded-md hover:bg-gray-700 transition-colors ${panels.isWorldRulesPanelOpen ? 'bg-gray-700 text-cyan-400' : ''}`} title="Alternar Panel de Reglas">
                        <ScaleIcon />
                    </button>
                    <button onClick={() => panels.setIsLorePanelOpen(!panels.isLorePanelOpen)} className={`p-2 rounded-md hover:bg-gray-700 transition-colors ${panels.isLorePanelOpen ? 'bg-gray-700 text-cyan-400' : ''}`} title="Alternar Panel de Lore">
                        <FileTextIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => panels.setIsStoryObjectivesPanelOpen(!panels.isStoryObjectivesPanelOpen)} className={`p-2 rounded-md hover:bg-gray-700 transition-colors ${panels.isStoryObjectivesPanelOpen ? 'bg-gray-700 text-cyan-400' : ''}`} title="Objetivos Narrativos">
                        <TargetIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <EditableProjectName name={project.name} onNameChange={project.setName} />
                        <p className="text-gray-400 text-sm">Arco Activo: <span className="font-semibold text-cyan-400">{project.activeArc?.name || '...'}</span></p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {collab.cloudProjectId && (
                        <div className="flex items-center space-x-2 mr-2">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-green-400 font-medium">Sincronizado</span>
                        </div>
                    )}
                    <button onClick={() => setIsShareModalOpen(true)} className={`p-2 rounded-md hover:bg-gray-700 transition-colors ${collab.cloudProjectId ? 'text-green-400' : 'text-gray-400'}`} title="Compartir y Colaborar">
                        <ShareIcon />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md hover:bg-gray-700 transition-colors text-cyan-400" title="Cargar/Importar Proyecto">
                        <FolderOpenIcon />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".json,.txt"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                try {
                                    const json = JSON.parse(ev.target?.result as string);
                                    if(actions?.project?.handleLoadProject) {
                                        actions.project.handleLoadProject(json);
                                    }
                                } catch (err) {
                                    alert("Error al analizar el archivo del proyecto.");
                                }
                            };
                            reader.readAsText(file);
                            e.target.value = ''; // Reset
                        }}
                    />
                    <button onClick={() => ui.modals.setIsSaveAsModalOpen(true)} className="p-2 rounded-md hover:bg-gray-700 transition-colors text-cyan-400" title="Guardar Proyecto Como...">
                        <SaveIcon />
                    </button>
                    <button onClick={() => panels.setIsMenuOpen(!panels.isMenuOpen)} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Alternar Menú de Herramientas">
                        <MenuIcon />
                    </button>
                </div>
            </div>
            {isShareModalOpen && (
                <ShareModal 
                    isOpen={isShareModalOpen} 
                    onClose={() => setIsShareModalOpen(false)} 
                    collab={collab} 
                />
            )}
        </>
    );
};
