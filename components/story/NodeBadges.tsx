
import React, { useState } from 'react';
import { ChatIcon, NoteIcon, TranslateIcon, CopyIcon, CheckIcon, FilmIcon, BanIcon } from '../icons';

interface NodeBadgesProps {
    hasChat: boolean;
    hasNote: boolean;
    hasTranslations: boolean;
    hasDirectorChat?: boolean;
    readableId?: string;
    isExcluded?: boolean; // NEW PROP
}

export const NodeBadges: React.FC<NodeBadgesProps> = ({ 
    hasChat, hasNote, hasTranslations, hasDirectorChat, readableId, isExcluded 
}) => {
    const [isIdCopied, setIsIdCopied] = useState(false);

    const hasIcons = hasChat || hasNote || hasTranslations || hasDirectorChat || isExcluded;

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!readableId) return;
        navigator.clipboard.writeText(readableId);
        setIsIdCopied(true);
        setTimeout(() => setIsIdCopied(false), 2000);
    };

    return (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1 pointer-events-auto">
            {hasIcons && (
                <div className="flex items-center space-x-1.5 bg-gray-700/80 backdrop-blur-sm rounded-full px-2 py-1">
                    {/* Exclusion Badge - High Priority Visual */}
                    {isExcluded && (
                        <div title="Bloqueado: Ignorado por la IA" className="bg-red-900/50 rounded-full p-0.5">
                            <BanIcon className="h-3.5 w-3.5 text-red-400" />
                        </div>
                    )}
                    
                    {hasChat && (
                        <div title="Chat Co-Escritor">
                            <ChatIcon className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                    )}
                    {hasDirectorChat && (
                        <div title="Historial del Asistente del Nodo (Modo Director)">
                            <FilmIcon className="h-3.5 w-3.5 text-cyan-400" />
                        </div>
                    )}
                    {hasNote && (
                        <div title="Nota">
                            <NoteIcon className="h-3.5 w-3.5 text-yellow-400" />
                        </div>
                    )}
                    {hasTranslations && (
                        <div title="Traducciones">
                            <TranslateIcon className="h-3.5 w-3.5 text-orange-400" />
                        </div>
                    )}
                </div>
            )}
            {readableId && (
                <div className="flex items-center bg-gray-700/80 backdrop-blur-sm text-cyan-300 text-xs font-mono rounded-full">
                    <span className="pl-2 pr-1 py-0.5">{readableId}</span>
                    <button 
                        onClick={handleCopyId} 
                        className="p-1 rounded-full hover:bg-gray-600/50 transition-colors"
                        title="Copiar ID del Nodo"
                    >
                        {isIdCopied ? <CheckIcon className="w-3 h-3"/> : <CopyIcon className="w-3 h-3"/>}
                    </button>
                </div>
            )}
        </div>
    );
};