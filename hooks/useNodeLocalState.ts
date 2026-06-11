
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { HierarchyPointNode } from 'd3-hierarchy';
import { StoryNodeData } from '../types';
import { MIN_NODE_HEIGHT } from '../constants';

export const useNodeLocalState = (
    node: HierarchyPointNode<StoryNodeData>,
    isChatOpen: boolean,
    isTranslateOpen: boolean,
    onHeightChange: (id: string, h: number) => void,
    isVisible: boolean = true
) => {
    const [height, setHeight] = useState(MIN_NODE_HEIGHT);
    const [noteText, setNoteText] = useState(node.data.note || '');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [isStateMonitorOpen, setIsStateMonitorOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const divRef = useRef<HTMLDivElement>(null);
    const noteTextAreaRef = useRef<HTMLTextAreaElement>(null);

    // Sync state with props if props change externally
    useEffect(() => { setNoteText(node.data.note || ''); }, [node.data.note]);

    // Dynamic Height Calculation
    useLayoutEffect(() => {
        if (isVisible && divRef.current) {
            const extraPadding = (isChatOpen || isTranslateOpen || isNoteOpen || isStateMonitorOpen || isHistoryOpen) ? 16 : 0;
            const targetHeight = Math.max(MIN_NODE_HEIGHT, divRef.current.scrollHeight + extraPadding);
            if (Math.abs(targetHeight - height) > 1) {
                setHeight(targetHeight);
                onHeightChange(node.data.id, targetHeight);
            }
        }
    }, [
        isVisible,
        node.data.name, isChatOpen, isNoteOpen, isTranslateOpen, isStateMonitorOpen, isHistoryOpen,
        node.data.chatHistory, node.data.translations, onHeightChange, node.data.id, 
        node.data.width, node.data.tags, node.data.charactersInScene, 
        node.data.pointOfViewCharacterId, node.data.scenariosInScene, 
        node.data.statusTagIds, node.data.fantasyDate
    ]);

    // Dynamic Note Textarea Height
    useLayoutEffect(() => {
        if (isNoteOpen && noteTextAreaRef.current) {
            const textarea = noteTextAreaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [noteText, isNoteOpen]);

    return {
        height,
        noteText, setNoteText,
        isAddingTag, setIsAddingTag,
        newTag, setNewTag,
        isNoteOpen, setIsNoteOpen,
        isStateMonitorOpen, setIsStateMonitorOpen,
        isHistoryOpen, setIsHistoryOpen,
        divRef,
        noteTextAreaRef
    };
};
