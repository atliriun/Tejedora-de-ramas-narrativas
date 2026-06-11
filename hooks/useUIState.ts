import { useState, useCallback } from 'react';
import { HierarchyPointNode } from 'd3-hierarchy';
import { StoryNodeData, EntityType, SideMenuTabType } from '../types';

export const useUIState = () => {
    // Panels
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isWorldStructurePanelOpen, setIsWorldStructurePanelOpen] = useState(false);
    const [isWorldRulesPanelOpen, setIsWorldRulesPanelOpen] = useState(false);
    const [isLorePanelOpen, setIsLorePanelOpen] = useState(false);
    const [isStoryArcsPanelOpen, setIsStoryArcsPanelOpen] = useState(false);
    const [isStoryObjectivesPanelOpen, setIsStoryObjectivesPanelOpen] = useState(false); 
    
    // Interaction Modes
    const [isNavMode, setIsNavMode] = useState(true); // Default to true (standard mobile behavior)

    // Modals
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false); 
    const [directorTargetNode, setDirectorTargetNode] = useState<HierarchyPointNode<StoryNodeData> | null>(null);
    
    const [editingNode, setEditingNode] = useState<HierarchyPointNode<StoryNodeData> | null>(null);
    const [nodeToDelete, setNodeToDelete] = useState<HierarchyPointNode<StoryNodeData> | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: EntityType; id: string; name: string; } | null>(null);
    
    // New: Promote Node State
    const [nodeIdToPromote, setNodeIdToPromote] = useState<string | null>(null);

    // Tabs
    const [activeSideMenuTab, setActiveSideMenuTab] = useState<SideMenuTabType>('search');

    // Actions
    const closeAllPanels = useCallback(() => {
        setIsMenuOpen(false);
        setIsWorldStructurePanelOpen(false);
        setIsWorldRulesPanelOpen(false);
        setIsLorePanelOpen(false);
        setIsStoryArcsPanelOpen(false);
        setIsStoryObjectivesPanelOpen(false); 
        setIsDirectorModalOpen(false);
    }, []);

    const openDirectorModal = useCallback((node: HierarchyPointNode<StoryNodeData>) => {
        setDirectorTargetNode(node);
        setIsDirectorModalOpen(true);
    }, []);

    const requestDeleteItem = useCallback((item: { type: EntityType; id: string; name: string }) => {
        setItemToDelete(item);
    }, []);

    return {
        panels: {
            isMenuOpen, setIsMenuOpen,
            isWorldStructurePanelOpen, setIsWorldStructurePanelOpen,
            isWorldRulesPanelOpen, setIsWorldRulesPanelOpen,
            isLorePanelOpen, setIsLorePanelOpen,
            isStoryArcsPanelOpen, setIsStoryArcsPanelOpen,
            isStoryObjectivesPanelOpen, setIsStoryObjectivesPanelOpen,
        },
        modals: {
            isSaveAsModalOpen, setIsSaveAsModalOpen,
            isDirectorModalOpen, setIsDirectorModalOpen,
            directorTargetNode, openDirectorModal,
            editingNode, setEditingNode,
            nodeToDelete, setNodeToDelete,
            itemToDelete, setItemToDelete,
            nodeIdToPromote, setNodeIdToPromote, // Export new state
        },
        tabs: {
            activeSideMenuTab, setActiveSideMenuTab
        },
        interaction: {
            isNavMode, setIsNavMode
        },
        closeAllPanels,
        requestDeleteItem
    };
};