import React, { useState, useRef, useEffect } from 'react';
import { HierarchyPointNode } from 'd3-hierarchy';
import { StoryNodeData } from '../../types';
import { NODE_STYLES } from '../../constants';
import { 
    PlusIcon, CopyIcon, ScissorsIcon, ClipboardPasteIcon, EditIcon, LoaderIcon, 
    SpellCheckIcon, FeatherIcon, RefreshIcon, TrashIcon, SparkleIcon, 
    TranslateIcon, PaletteIcon, NoteIcon, QuestionMarkIcon, UsersIcon, ArrowUpIcon, CheckIcon, SplitIcon, BanIcon, EyeIcon,
    ActivityIcon
} from '../icons';

interface NodeToolbarProps {
    node: HierarchyPointNode<StoryNodeData>;
    isRoot: boolean;
    isMovingThisNode: boolean;
    copiedNodeData: Partial<StoryNodeData> | null;
    onAddChild: (id: string) => void;
    onCopyNode: (id: string) => void;
    onCutNode: (id: string) => void;
    onPasteNodeAsChild: (id: string) => void;
    onPasteNodeContent: (id: string) => void;
    onEdit: (node: HierarchyPointNode<StoryNodeData>) => void;
    onCorrectText: (node: HierarchyPointNode<StoryNodeData>) => void;
    onContinuePlot: (node: HierarchyPointNode<StoryNodeData>) => void; 
    onRegenerate: (node: HierarchyPointNode<StoryNodeData>) => void;
    onDelete: (node: HierarchyPointNode<StoryNodeData>) => void;
    onGenerate: (node: HierarchyPointNode<StoryNodeData>, type: string) => void;
    onToggleTranslate: (id: string) => void;
    onToggleNote: (id: string) => void;
    onToggleStateMonitor: (id: string) => void;
    onToggleHistory: (id: string) => void;
    onPromoteToArc: (id: string) => void;
    onToggleContextExclusion: (id: string) => void;
    onUpdateNodeData: (id: string, data: Partial<StoryNodeData>, actionName?: string) => void;
    isCorrecting: boolean;
    isContinuingPlot: boolean;
    isGenerating: boolean;
    isRegenerating: boolean;
    isNoteOpen: boolean;
    isStateMonitorOpen: boolean;
    isHistoryOpen: boolean;
    hasNote: boolean;
    isExcluded?: boolean;
}

export const NodeToolbar: React.FC<NodeToolbarProps> = ({
    node, isRoot, isMovingThisNode, copiedNodeData,
    onAddChild, onCopyNode, onCutNode, onPasteNodeAsChild, onPasteNodeContent,
    onEdit, onCorrectText, onContinuePlot, onRegenerate, onDelete, onGenerate,
    onToggleTranslate, onToggleNote, onToggleStateMonitor, onToggleHistory, onUpdateNodeData,
    onPromoteToArc, onToggleContextExclusion,
    isCorrecting, isContinuingPlot, isGenerating, isRegenerating,
    isNoteOpen, isStateMonitorOpen, isHistoryOpen, hasNote, isExcluded
}) => {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isGeneratingOptionsOpen, setIsGeneratingOptionsOpen] = useState(false);
    const [isPasteOptionsOpen, setIsPasteOptionsOpen] = useState(false);
    
    const paletteRef = useRef<HTMLDivElement>(null);
    const generationOptionsRef = useRef<HTMLDivElement>(null);
    const generationButtonRef = useRef<HTMLButtonElement>(null);
    const pasteOptionsRef = useRef<HTMLDivElement>(null);
    const pasteButtonRef = useRef<HTMLButtonElement>(null);

    const BRANCH_TYPES_WITH_ICONS = {
        default: { name: 'Por Defecto', icon: <SparkleIcon className="w-4 h-4 text-purple-400" /> },
        unexpected: { name: 'Evento Inesperado', icon: <QuestionMarkIcon className="w-4 h-4 text-yellow-400" /> },
        interaction: { name: 'Interacción de Personajes', icon: <UsersIcon className="w-4 h-4 text-blue-400" /> },
        twist: { name: 'Giro de Trama', icon: <RefreshIcon className="w-4 h-4 text-red-400" /> },
        escalation: { name: 'Escalar Conflicto', icon: <ArrowUpIcon className="w-4 h-4 text-orange-400" /> },
        resolution: { name: 'Resolver Conflicto', icon: <CheckIcon className="w-4 h-4 text-green-400" /> },
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) setIsPaletteOpen(false);
            if (isGeneratingOptionsOpen && generationOptionsRef.current && !generationOptionsRef.current.contains(event.target as Node) && generationButtonRef.current && !generationButtonRef.current.contains(event.target as Node)) setIsGeneratingOptionsOpen(false);
            if (isPasteOptionsOpen && pasteOptionsRef.current && !pasteOptionsRef.current.contains(event.target as Node) && pasteButtonRef.current && !pasteButtonRef.current.contains(event.target as Node)) setIsPasteOptionsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPaletteOpen, isGeneratingOptionsOpen, isPasteOptionsOpen]);

    const handleGenerateClick = (type: string) => {
        onGenerate(node, type);
        setIsGeneratingOptionsOpen(false);
    };

    return (
        <div className="flex justify-end items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pt-2 relative flex-wrap">
            <button onClick={() => onAddChild(node.data.id)} className="p-1.5 rounded-full bg-gray-700 hover:bg-green-500 text-white transition-colors" title="Añadir Rama"><PlusIcon /></button>
            <button onClick={() => onCopyNode(node.data.id)} className="p-1.5 rounded-full bg-gray-700 hover:bg-cyan-500 text-white transition-colors" title="Copiar Nodo"><CopyIcon /></button>
            {!isRoot && (
                <>
                    <button onClick={() => onCutNode(node.data.id)} className={`p-1.5 rounded-full transition-colors ${isMovingThisNode ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-yellow-500 text-white'}`} title={isMovingThisNode ? "Cancelar Movimiento" : "Cortar / Mover Rama"}><ScissorsIcon /></button>
                    <button onClick={() => onPromoteToArc(node.data.id)} className="p-1.5 rounded-full bg-gray-700 hover:bg-purple-600 text-white transition-colors" title="Dividir en Nuevo Arco (Promover)"><SplitIcon /></button>
                </>
            )}
            {copiedNodeData && (
                <div className="relative" ref={pasteOptionsRef}>
                    <button ref={pasteButtonRef} onClick={() => setIsPasteOptionsOpen(p => !p)} className="p-1.5 rounded-full bg-gray-700 hover:bg-green-500 text-white transition-colors" title="Pegar Nodo"><ClipboardPasteIcon /></button>
                    {isPasteOptionsOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 border border-gray-600 rounded-md shadow-lg z-20 p-2 space-y-1 animate-fade-in-fast">
                            <button onClick={() => { onPasteNodeAsChild(node.data.id); setIsPasteOptionsOpen(false); }} className="w-full text-left text-sm p-1.5 rounded hover:bg-gray-700">Pegar como nueva rama</button>
                            <button onClick={() => { onPasteNodeContent(node.data.id); setIsPasteOptionsOpen(false); }} className="w-full text-left text-sm p-1.5 rounded hover:bg-gray-700">Pegar y sobrescribir</button>
                        </div>
                    )}
                </div>
            )}
            <button onClick={() => onEdit(node)} className="p-1.5 rounded-full bg-gray-700 hover:bg-blue-500 text-white transition-colors" title="Editar Texto"><EditIcon /></button>
            <button onClick={() => onCorrectText(node)} disabled={isCorrecting || isContinuingPlot} className="p-1.5 rounded-full bg-gray-700 hover:bg-green-600 text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" title="Corregir Ortografía">{isCorrecting ? <LoaderIcon /> : <SpellCheckIcon />}</button>
            <button onClick={() => onContinuePlot(node)} disabled={isContinuingPlot || isGenerating || isRegenerating} className="p-2.5 rounded-full transition-all duration-300 bg-gradient-to-br from-emerald-500 to-green-700 hover:from-emerald-400 hover:to-green-600 text-white shadow-lg border border-emerald-400/30 transform hover:scale-110 active:scale-95 disabled:grayscale mx-2" title="Asistente Avanzado (Modo Director)"><FeatherIcon className="w-5 h-5 stroke-[2.5]" /></button>

            {!isRoot && (
                <>
                    <button onClick={() => onRegenerate(node)} disabled={isRegenerating || isGenerating || isContinuingPlot} className="p-1.5 rounded-full bg-gray-700 hover:bg-yellow-500 text-white transition-colors disabled:bg-gray-600" title="Regenerar con IA">{isRegenerating ? <LoaderIcon /> : <RefreshIcon />}</button>
                    <button onClick={() => onDelete(node)} className="p-1.5 rounded-full bg-gray-700 hover:bg-red-500 text-white transition-colors" title="Eliminar Rama"><TrashIcon /></button>
                </>
            )}
            <button ref={generationButtonRef} onClick={() => setIsGeneratingOptionsOpen(prev => !prev)} disabled={isGenerating || isRegenerating || isContinuingPlot} className="p-1.5 rounded-full bg-gray-700 hover:bg-purple-500 text-white transition-colors disabled:bg-gray-600" title="Generar Ramas con IA">{isGenerating ? <LoaderIcon /> : <SparkleIcon />}</button>
            <button onClick={() => onToggleContextExclusion(node.data.id)} className={`p-1.5 rounded-full transition-colors ${isExcluded ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`} title={isExcluded ? "Nodo Bloqueado" : "Bloquear Nodo"}><BanIcon /></button>
            <button onClick={() => onToggleStateMonitor(node.data.id)} className={`p-1.5 rounded-full transition-colors ${isStateMonitorOpen ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-red-500 text-white'}`} title="Monitor de Estados"><ActivityIcon /></button>
            <button onClick={() => onToggleHistory(node.data.id)} className={`p-1.5 rounded-full transition-colors ${isHistoryOpen ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-blue-500 text-white'}`} title="Historial de Cambios"><EyeIcon /></button>
            <button onClick={() => onToggleTranslate(node.data.id)} className="p-1.5 rounded-full bg-gray-700 hover:bg-orange-500 text-white transition-colors" title="Traducciones"><TranslateIcon /></button>
            <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="p-1.5 rounded-full bg-gray-700 hover:bg-teal-500 text-white transition-colors" title="Cambiar Estilo"><PaletteIcon /></button>
            <button onClick={() => onToggleNote(node.data.id)} className={`p-1.5 rounded-full transition-colors ${isNoteOpen ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-white hover:bg-yellow-600'}`} title={hasNote ? "Ver/Editar Nota" : "Añadir Nota"}><NoteIcon className={!isNoteOpen && hasNote ? 'text-yellow-400' : ''}/></button>
            
            {isGeneratingOptionsOpen && (
                <div ref={generationOptionsRef} className="absolute bottom-full right-0 mb-2 w-56 bg-gray-900 border border-gray-600 rounded-md shadow-lg z-20 p-2 space-y-1 animate-fade-in-fast">
                    {Object.entries(BRANCH_TYPES_WITH_ICONS).map(([key, { name, icon }]) => (
                        <button key={key} onClick={() => handleGenerateClick(key)} className="w-full text-left text-sm flex items-center space-x-2 p-1.5 rounded hover:bg-gray-700"><span className="flex-shrink-0">{icon}</span><span>{name}</span></button>
                    ))}
                </div>
            )}
            {isPaletteOpen && (
                <div ref={paletteRef} className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 border border-gray-600 rounded-md shadow-lg z-20 p-2 space-y-1">
                    {Object.values(NODE_STYLES).map(s => (
                    <button key={s.id} onClick={() => { onUpdateNodeData(node.data.id, { styleId: s.id }); setIsPaletteOpen(false); }} className="w-full text-left text-sm flex items-center space-x-2 p-1.5 rounded hover:bg-gray-700"><span className={`w-3 h-3 rounded-full border-2 ${s.border}`}></span><span>{s.name}</span></button>
                    ))}
                </div>
            )}
        </div>
    );
};