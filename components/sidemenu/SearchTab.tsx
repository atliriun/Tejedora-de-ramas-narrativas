
import React, { useState, useEffect } from 'react';
import type { HierarchyPointNode } from 'd3-hierarchy';
import type { StoryNodeData } from '../../types';
import { SearchIcon, CenterFocusIcon, CubeIcon, ListCheckIcon, EditIcon, BookOpenIcon, SaveIcon } from '../icons';
import { SyntaxTranslator } from '../tools/SyntaxTranslator';
import { ConfirmationModal } from '../ConfirmationModal';

interface SearchTabProps {
    search: any;
    projectActions?: any;
    onClose: () => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({ 
    search, projectActions, onClose 
}) => {
    const { searchQuery, setSearchQuery, searchResults, handleClick } = search;
    const [mode, setMode] = useState<'search' | 'translator' | 'replace' | 'help'>('search');
    
    // Replace state
    const [replaceSearchStr, setReplaceSearchStr] = useState('');
    const [replaceWithStr, setReplaceWithStr] = useState('');
    const [matchCase, setMatchCase] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    const executeReplace = () => {
        if (!replaceSearchStr) return;
        setIsConfirmOpen(true);
    };

    const handleConfirmReplace = () => {
        if (projectActions && projectActions.handleGlobalReplace) {
            projectActions.handleGlobalReplace(replaceSearchStr, replaceWithStr, matchCase, wholeWord);
            setIsConfirmOpen(false);
            setIsSuccessOpen(true);
            setTimeout(() => {
                setIsSuccessOpen(false);
            }, 3000);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Mode Toggle */}
            <div className="flex bg-gray-900 p-1 rounded-lg mb-4 flex-shrink-0 border border-gray-700 flex-wrap">
                <button 
                    onClick={() => setMode('search')}
                    className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-1 rounded-md text-xs font-bold transition-all ${mode === 'search' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <SearchIcon className="w-3.5 h-3.5" />
                    <span>Buscar</span>
                </button>
                <button 
                    onClick={() => setMode('replace')}
                    className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-1 rounded-md text-xs font-bold transition-all ${mode === 'replace' ? 'bg-gray-700 text-green-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <ListCheckIcon className="w-3.5 h-3.5" />
                    <span>Reemplazar</span>
                </button>
                <button 
                    onClick={() => setMode('translator')}
                    className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-1 rounded-md text-xs font-bold transition-all ${mode === 'translator' ? 'bg-gray-700 text-cyan-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <CubeIcon className="w-3.5 h-3.5" />
                    <span>JSON</span>
                </button>
                <button 
                    onClick={() => setMode('help')}
                    className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-1 rounded-md text-xs font-bold transition-all ${mode === 'help' ? 'bg-gray-700 text-yellow-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <BookOpenIcon className="w-3.5 h-3.5" />
                    <span>Ayuda</span>
                </button>
            </div>

            {mode === 'search' ? (
                <div className="space-y-6 flex-grow overflow-y-auto">
                    <div className="space-y-2">
                        <div className="relative">
                             <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="ej. Escena 235, A-B-1..." 
                                className="w-full bg-gray-900 border border-cyan-900/50 rounded-md py-2 pl-3 pr-10 text-sm focus:ring-1 focus:ring-cyan-500 outline-none shadow-inner text-white"
                            />
                             <div className="absolute right-3 top-2.5 text-cyan-600"><SearchIcon /></div>
                        </div>
                        <div className="space-y-2 mt-2 max-h-[500px] overflow-y-auto pr-1">
                            {(searchResults || []).map((node: HierarchyPointNode<StoryNodeData>) => (
                                <div key={node.data.id} onClick={() => { handleClick(node); onClose(); }} className="p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700 border border-gray-700 hover:border-cyan-500/50 transition-all group flex justify-between items-center">
                                    <div className="min-w-0 flex-grow">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-sm text-gray-200 truncate pr-2">{node.data.name || 'Sin título'}</p>
                                            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-cyan-400 font-mono">{search.nodeReadableIds.get(node.data.id)}</span>
                                        </div>
                                    </div>
                                    <div className="ml-3 p-2 bg-cyan-900/20 text-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><CenterFocusIcon className="w-4 h-4" /></div>
                                </div>
                            ))}
                            {searchQuery.trim() !== '' && searchResults.length === 0 && (
                                <p className="text-center text-xs text-gray-500 py-4 italic">No se encontraron resultados.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : mode === 'replace' ? (
                <div className="space-y-6 flex-grow overflow-y-auto p-2 bg-gray-800 rounded-lg">
                    <div>
                        <h3 className="text-sm font-bold text-green-400 mb-2">Reemplazo Global</h3>
                        <p className="text-xs text-gray-400 mb-4">Esta herramienta busca y reemplaza texto en TODO el proyecto (nodos, descripciones de personajes, chat del director, notas, lore, escenarios, etc).</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Texto Original (Buscar)</label>
                                <input 
                                    type="text" 
                                    value={replaceSearchStr} 
                                    onChange={(e) => setReplaceSearchStr(e.target.value)} 
                                    placeholder="ej. Antonio, [Protagonista]" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-sm focus:border-green-500 outline-none text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Nuevo Texto (Reemplazo)</label>
                                <input 
                                    type="text" 
                                    value={replaceWithStr} 
                                    onChange={(e) => setReplaceWithStr(e.target.value)} 
                                    placeholder="ej. Marco" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-sm focus:border-green-500 outline-none text-white"
                                />
                            </div>

                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 text-xs text-gray-300">
                                    <input 
                                        type="checkbox" 
                                        checked={matchCase} 
                                        onChange={(e) => setMatchCase(e.target.checked)} 
                                        className="rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
                                    />
                                    <span>Mayúsculas/Minúsculas</span>
                                </label>
                                <label className="flex items-center space-x-2 text-xs text-gray-300">
                                    <input 
                                        type="checkbox" 
                                        checked={wholeWord} 
                                        onChange={(e) => setWholeWord(e.target.checked)} 
                                        className="rounded border-gray-700 bg-gray-900 text-green-500 focus:ring-green-500"
                                    />
                                    <span>Palabra Completa</span>
                                </label>
                            </div>

                            <button 
                                onClick={executeReplace}
                                disabled={!replaceSearchStr}
                                className={`w-full py-2 px-4 rounded-md font-bold text-sm transition-colors flex items-center justify-center space-x-2 ${!replaceSearchStr ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}
                            >
                                <EditIcon className="w-4 h-4" />
                                <span>Reemplazar en Todo el Proyecto</span>
                            </button>
                            
                            {isSuccessOpen && (
                                <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded text-center text-green-400 text-sm animate-fade-in-fast font-semibold">
                                    Reemplazo completado con éxito.
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            ) : mode === 'help' ? (
                <div className="space-y-6 flex-grow flex flex-col p-4 bg-gray-800 rounded-lg overflow-y-auto">
                    <div>
                        <h3 className="text-sm font-bold text-yellow-400 mb-4 flex items-center space-x-2">
                            <BookOpenIcon className="w-5 h-5" />
                            <span>Guía del Modo Edición (IA)</span>
                        </h3>
                        <div className="text-gray-300 text-sm space-y-4">
                            <p>
                                <strong>Modo Edición del Director:</strong><br/>
                                La IA tiene la capacidad de editar la historia o sus propios mensajes anteriores.
                                Para usar esta función, simplemente pídele al Director (en el chat del Director) que modifique un texto.
                            </p>
                            <ul className="list-disc pl-5 space-y-3">
                                <li>
                                    <strong>Editar la historia (nodo actual):</strong><br/>
                                    Puedes decirle <em>"Reescribe la escena actual para que tenga un tono más oscuro"</em> o <em>"Cambia el texto de la historia y pon que el personaje encuentra una llave escondida en el cajón."</em>.
                                </li>
                                <li>
                                    <strong>Editar mensajes del Director:</strong><br/>
                                    Si la IA dio una respuesta que quieres cambiar en el historial de chat, puedes decirle <em>"Corrige tu mensaje anterior donde dijiste 'la espada era de hierro' y cámbialo a 'la espada era de plata cristalizada'"</em>.
                                </li>
                                <li>
                                    <strong>Actualizar fichas y mundo:</strong><br/>
                                    Recuerda que el modo Director también puede usar herramientas para actualizar atributos, inventarios, lore, banderas y estados de personajes basándose en tus instrucciones.
                                </li>
                            </ul>
                            <div className="mt-8 p-4 bg-gray-900 rounded-md border border-gray-700">
                                <p className="text-xs text-gray-400 text-center">
                                    💡 <em>Nota:</em> Este proceso utiliza herramientas internas de la IA. La IA confirmará en el chat cuando haya actualizado la información.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-grow overflow-hidden">
                    <SyntaxTranslator />
                </div>
            )}
            
            <ConfirmationModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={handleConfirmReplace} 
                title="Confirmar Reemplazo Global"
                confirmText="Reemplazar Todo"
            >
                <div className="space-y-4">
                    <p className="text-gray-300">
                        Se buscará <strong>"{replaceSearchStr}"</strong> y se reemplazará por <strong>"{replaceWithStr}"</strong> en todo el proyecto.
                    </p>
                    <p className="text-red-400 font-bold bg-red-900/20 p-3 rounded-lg text-sm border border-red-800">
                        Esta acción NO se puede deshacer y afectará a personajes, nodos de historia, lore y descripciones.
                    </p>
                </div>
            </ConfirmationModal>
            
        </div>
    );
};
