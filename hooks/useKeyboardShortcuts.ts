
import { useEffect } from 'react';

export const useKeyboardShortcuts = (
    undo: () => void,
    redo: () => void,
    cancelMove: () => void,
    movingNodeId: string | null,
    onSave?: () => void
) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Priority Shortcuts (Work even inside inputs)
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    if (onSave) onSave();
                    return;
                }
            }

            const target = e.target as HTMLElement;
            const isEditingText = target instanceof HTMLInputElement || 
                                  target instanceof HTMLTextAreaElement || 
                                  target.isContentEditable;
            if (isEditingText) return;

            // Navigation/Edit Shortcuts (Blocked inside inputs)
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (key === 'z') {
                    e.preventDefault();
                    e.shiftKey ? redo() : undo();
                }
                if (key === 'y') {
                    e.preventDefault();
                    redo();
                }
            }
            if (e.key === 'Escape' && movingNodeId) {
                cancelMove();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, movingNodeId, cancelMove, onSave]);
};
