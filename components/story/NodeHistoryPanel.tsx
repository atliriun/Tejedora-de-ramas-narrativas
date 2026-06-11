import React from 'react';
import { StoryNodeData } from '../../types';
import { EyeIcon } from '../icons';

interface NodeHistoryPanelProps {
    nodeId: string;
    history: StoryNodeData['history'];
}

export const NodeHistoryPanel: React.FC<NodeHistoryPanelProps> = ({ nodeId, history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="pb-3 pt-2 space-y-4 animate-fade-in-fast border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                    <p className="text-xs font-bold text-blue-400 px-1 flex items-center">
                        <EyeIcon className="w-3 h-3 mr-1"/> Historial de Cambios
                    </p>
                    <div className="p-4 text-center text-gray-400 text-sm">
                        No hay historial de cambios para este nodo.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-3 pt-2 space-y-4 animate-fade-in-fast border-t border-white/5" onMouseDown={(e) => e.stopPropagation()}>
            <div className="space-y-2">
                <p className="text-xs font-bold text-blue-400 px-1 flex items-center">
                    <EyeIcon className="w-3 h-3 mr-1"/> Historial de Cambios
                </p>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {[...history].reverse().map((entry, index) => (
                        <div key={index} className="bg-gray-900/50 p-2 rounded border border-blue-900/30 text-xs">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-blue-300">{entry.action}</span>
                                <span className="text-[10px] text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                            {entry.user && (
                                <div className="text-[10px] text-gray-400 mb-1">
                                    Por: {entry.user}
                                </div>
                            )}
                            {entry.changes && Object.keys(entry.changes).length > 0 && (
                                <div className="mt-1 space-y-1">
                                    {Object.entries(entry.changes).map(([key, value]) => (
                                        <div key={key} className="flex flex-col">
                                            <span className="text-gray-500 text-[10px]">{key}:</span>
                                            <span className="text-gray-300 line-clamp-2" title={String(value)}>{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
