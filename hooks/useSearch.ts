
import { useState, useEffect } from 'react';
import { HierarchyPointNode } from 'd3-hierarchy';
import { StoryNodeData } from '../types';

export const useSearch = (
    nodes: HierarchyPointNode<StoryNodeData>[],
    nodeReadableIds: Map<string, string>
) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<HierarchyPointNode<StoryNodeData>[]>([]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        
        const results = nodes.filter(node => {
            const readableId = nodeReadableIds.get(node.data.id)?.toLowerCase() || "";
            const name = node.data.name.toLowerCase();
            const note = (node.data.note || "").toLowerCase();
            const tags = (node.data.tags || []).join(" ").toLowerCase();
            
            // Búsqueda profunda en chats (importante para encontrar "nodos fantasma" mencionados por la IA)
            const chatContent = (node.data.chatHistory || []).map(m => m.text).join(" ").toLowerCase();
            const directorContent = (node.data.directorChatHistory || []).map(m => m.text).join(" ").toLowerCase();
            const translations = (node.data.translations || []).map(t => t.text).join(" ").toLowerCase();

            return (
                name.includes(lowercasedQuery) ||
                note.includes(lowercasedQuery) ||
                tags.includes(lowercasedQuery) ||
                readableId === lowercasedQuery ||
                readableId.includes(lowercasedQuery) ||
                chatContent.includes(lowercasedQuery) ||
                directorContent.includes(lowercasedQuery) ||
                translations.includes(lowercasedQuery)
            );
        });

        setSearchResults(results);
    }, [searchQuery, nodes, nodeReadableIds]);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        nodeReadableIds 
    };
};
