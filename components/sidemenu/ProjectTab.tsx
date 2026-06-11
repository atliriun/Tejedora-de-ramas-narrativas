
import React, { useRef } from 'react';
import { 
    FolderIcon, PlusIcon, FolderOpenIcon, SaveAsIcon, SaveIcon, 
    HistoryIcon, FileTextIcon, TrashIcon, DnaIcon, ActivityIcon
} from '../icons';

interface ProjectTabProps {
    project: any; // app.project
    actions: any; // app.actions
    autoSave: any; // app.autoSave
    openSaveAs: () => void;
}

export const ProjectTab: React.FC<ProjectTabProps> = ({
    project, actions, autoSave, openSaveAs
}) => {
    const loadFileInputRef = useRef<HTMLInputElement>(null);
    const { tokenCounts } = project; // { total, active, breakdown }
    const { handleLoadProject, handleNewProject } = actions.project;
    const { 
        autoSaves, autoSaveInterval, setAutoSaveInterval, 
        autoDownloadEnabled, setAutoDownloadEnabled, 
        onDownloadAutoSave, onExportScript, onExportDeepProfile,
        deleteAutoSave, clearAllAutoSaves
    } = autoSave;

    // Wrapper for restoration to handle any data mismatch
    const handleRestore = (state: any) => {
        handleLoadProject(state);
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            {/* Token Count */}
            <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 mb-2 flex items-center"><ActivityIcon className="mr-2 w-4 h-4"/> Conteo de Tokens</h4>
                <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Activos / Totales</span>
                        <div className="text-sm font-mono">
                            <span className="text-green-400 font-bold">{tokenCounts?.active?.toLocaleString() || 0}</span>
                            <span className="text-gray-500 mx-1">/</span>
                            <span className="text-gray-300">{tokenCounts?.total?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                    {tokenCounts?.total > 0 && (
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-gradient-to-r from-green-700 to-green-400 transition-all duration-500" style={{ width: `${Math.min(100, (tokenCounts.active / tokenCounts.total) * 100)}%` }} />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div className="flex justify-between bg-gray-900/50 px-2 py-1 rounded">
                            <span>Historia:</span>
                            <span className="font-mono text-gray-300">{tokenCounts?.breakdown?.story?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between bg-gray-900/50 px-2 py-1 rounded">
                            <span>Personajes:</span>
                            <span className="font-mono text-gray-300">{tokenCounts?.breakdown?.characters?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between bg-gray-900/50 px-2 py-1 rounded">
                            <span>Mundo:</span>
                            <span className="font-mono text-gray-300">{tokenCounts?.breakdown?.world?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between bg-gray-900/50 px-2 py-1 rounded">
                            <span>Chat:</span>
                            <span className="font-mono text-gray-300">{tokenCounts?.breakdown?.chat?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export / Compile */}
            <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 mb-2 flex items-center"><FileTextIcon className="mr-2 w-4 h-4"/> Exportar Historia</h4>
                
                <button 
                    onClick={onExportScript} 
                    className="w-full flex items-center justify-center space-x-2 bg-purple-700 hover:bg-purple-600 py-2 rounded-md font-semibold text-sm transition-colors border border-purple-500/50"
                >
                    <FileTextIcon /> <span>Compilar Guion (Ruta Canónica)</span>
                </button>

                <button 
                    onClick={onExportDeepProfile} 
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-700 hover:bg-indigo-600 py-2 rounded-md font-semibold text-sm transition-colors border border-indigo-500/50"
                    title="Exporta un archivo Markdown con estados de personajes, memorias y relaciones detalladas para cada escena."
                >
                    <DnaIcon className="w-4 h-4" /> <span>Compilar Perfil Profundo (Contexto Grok/AI)</span>
                </button>

                <p className="text-[10px] text-gray-500 mt-1 px-1">
                    Usa el <strong>Perfil Profundo</strong> para dar contexto masivo a otras IAs sobre la evolución psicológica y vital de los personajes.
                </p>
            </div>

            {/* File Operations */}
            <div className="border-t border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-300 mb-2 flex items-center"><FolderIcon className="mr-2 w-4 h-4"/> Operaciones de Archivo</h4>
                <div className="grid grid-cols-2 gap-2">
                        <button 
                        onClick={() => {
                            if (window.confirm("¿Estás seguro de que quieres iniciar un nuevo proyecto? Los cambios no guardados en el archivo actual se perderán en esta sesión.")) {
                                handleNewProject();
                            }
                        }} 
                        className="flex items-center justify-center space-x-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-md text-sm"
                    >
                        <PlusIcon /> <span>Nuevo Proyecto</span>
                    </button>
                    <button 
                        onClick={() => loadFileInputRef.current?.click()} 
                        className="flex items-center justify-center space-x-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-md text-sm"
                    >
                        <FolderOpenIcon /> <span>Cargar Proyecto</span>
                    </button>
                    <input 
                        type="file" 
                        ref={loadFileInputRef} 
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                try {
                                    const json = JSON.parse(ev.target?.result as string);
                                    handleLoadProject(json);
                                } catch (err) {
                                    alert("Error al analizar el archivo del proyecto.");
                                }
                            };
                            reader.readAsText(file);
                            e.target.value = ''; // Reset
                        }}
                        className="hidden" 
                        accept=".json,.txt"
                    />
                </div>
                    <button onClick={openSaveAs} className="w-full mt-2 flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 py-2 rounded-md font-semibold text-sm">
                    <SaveAsIcon /> <span>Guardar Proyecto Como...</span>
                    </button>
            </div>

            {/* Auto-Save Settings */}
                <div className="border-t border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-300 mb-2 flex items-center"><SaveIcon className="mr-2 w-4 h-4" /> Auto-Guardado</h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Auto-Descargar JSON</span>
                        <div 
                            onClick={() => setAutoDownloadEnabled(!autoDownloadEnabled)}
                            className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${autoDownloadEnabled ? 'bg-cyan-600' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${autoDownloadEnabled ? 'left-6' : 'left-1'}`} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Intervalo de Guardado</span>
                            <span>{autoSaveInterval / 60000} min</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="30" 
                            value={autoSaveInterval / 60000} 
                            onChange={(e) => setAutoSaveInterval(parseInt(e.target.value) * 60000)}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
                
                {/* Recovery */}
                <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-300 flex items-center"><HistoryIcon className="mr-2" /> Recuperación</h4>
                    {autoSaves.length > 0 && (
                        <button 
                            onClick={() => { if(confirm("¿Borrar TODOS los auto-guardados locales? Esta acción no se puede deshacer.")) clearAllAutoSaves(); }}
                            className="text-[10px] bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-800 rounded px-2 py-0.5 transition-colors flex items-center space-x-1"
                        >
                            <TrashIcon className="w-3 h-3" /> <span>Limpiar Todo</span>
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {(autoSaves || []).map((save: any) => (
                        <div key={save.timestamp} className="bg-gray-700/50 p-2 rounded text-sm flex justify-between items-center group hover:bg-gray-700/80 transition-colors">
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-medium text-gray-300 truncate max-w-[120px]" title={save.state.projectName}>{save.state.projectName}</span>
                                <span className="text-[10px] text-gray-500">{new Date(save.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0 items-center">
                                <button onClick={() => onDownloadAutoSave(save.state, save.timestamp)} className="p-1 text-gray-400 hover:text-cyan-400" title="Descargar JSON"><SaveIcon /></button>
                                <button onClick={() => handleRestore(save.state)} className="text-cyan-400 hover:underline text-xs border border-cyan-600 px-2 py-1 rounded hover:bg-cyan-600 hover:text-white transition-colors">Restaurar</button>
                                <button 
                                    onClick={() => deleteAutoSave(save.timestamp)} 
                                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-gray-800 rounded transition-colors" 
                                    title="Borrar este guardado"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {(autoSaves || []).length === 0 && <p className="text-xs text-gray-500 italic">No hay auto-guardados aún.</p>}
                </div>
                </div>
        </div>
    );
};
