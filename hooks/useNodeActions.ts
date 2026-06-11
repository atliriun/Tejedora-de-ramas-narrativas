
import { useCallback, useMemo, useRef } from 'react';
import { ProjectData, StoryNodeData, CharacterStateSnapshot, ChatMessage } from '../types';
import { findNodeAndModify, isDescendant } from '../utils/treeUtils';
import { MIN_NODE_WIDTH, MAX_NODE_WIDTH } from '../constants';
import { getEffectiveNodeContext } from '../utils/storyUtils';
import { generateUUID, safeClone } from '../utils/uuid';

export const useNodeActions = (
    setProjectData: (action: ProjectData | ((prevState: ProjectData) => ProjectData), overwrite?: boolean) => void
) => {

    const updateActiveArcRoot = useCallback((updater: (rootNode: StoryNodeData) => StoryNodeData, overwrite: boolean = false) => {
        setProjectData(currentData => {
            if (!currentData || !currentData.storyArcs) return currentData; 

            const activeArcIndex = currentData.storyArcs.findIndex(a => a.id === currentData.activeArcId);
            if (activeArcIndex === -1) return currentData;
    
            const activeArc = currentData.storyArcs[activeArcIndex];
            const newRootNode = updater(activeArc.rootNode);
    
            const newArcs = [...currentData.storyArcs];
            newArcs[activeArcIndex] = { ...activeArc, rootNode: newRootNode };
    
            return { ...currentData, storyArcs: newArcs };
        }, overwrite);
    }, [setProjectData]);

    const onUpdateNodeData = useCallback((nodeId: string, updates: Partial<StoryNodeData>, actionName?: string, overwrite?: boolean) => {
        const significantKeys = ['name', 'note', 'tags', 'charactersInScene', 'scenariosInScene', 'pointOfViewCharacterId', 'fantasyDate', 'customCharactersSummary', 'customArcSummary', 'styleId', 'images', 'translations', 'bookmarkedParagraphs'];
        const hasSignificantKeys = Object.keys(updates).some(key => significantKeys.includes(key));
        const shouldOverwrite = overwrite !== undefined ? overwrite : (!hasSignificantKeys && !actionName);

        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (updates.width !== undefined) {
                updates.width = Math.max(MIN_NODE_WIDTH, Math.min(updates.width, MAX_NODE_WIDTH));
            }
            
            const changes: Record<string, any> = {};
            let actualSignificantChanges = false;
            
            for (const key of Object.keys(updates)) {
                if (significantKeys.includes(key) && (node as any)[key] !== (updates as any)[key]) {
                    changes[key] = (updates as any)[key];
                    actualSignificantChanges = true;
                }
            }

            if ((actualSignificantChanges || actionName) && !shouldOverwrite) {
                if (!node.history) node.history = [];
                node.history.push({
                    action: actionName || 'Actualización de nodo',
                    timestamp: Date.now(),
                    changes: actualSignificantChanges ? changes : undefined
                });
                if (node.history.length > 20) node.history = node.history.slice(node.history.length - 20);
            }

            Object.assign(node, updates);
        }), shouldOverwrite);
    }, [updateActiveArcRoot]);

    const handleAddChild = useCallback((nodeId: string, initialData?: Partial<StoryNodeData>) => {
        updateActiveArcRoot(root => {
            return findNodeAndModify(root, nodeId, (parentNode) => {
                const context = getEffectiveNodeContext(parentNode);
                if (!parentNode.children) parentNode.children = [];
                
                const newChild: StoryNodeData = {
                    id: generateUUID(),
                    name: 'Nueva decisión...',
                    children: [],
                    styleId: 'default',
                    note: '',
                    fantasyDate: context.date,
                    charactersInScene: undefined, 
                    scenariosInScene: undefined,
                    statusTagIds: undefined,
                    pointOfViewCharacterId: context.pov, 
                    characterStateOverrides: context.overrides ? safeClone(context.overrides) : undefined,
                    customCharactersSummary: undefined, 
                    customArcSummary: undefined, 
                    tags: parentNode.tags ? [...parentNode.tags] : [],
                    history: [{ action: 'Nodo creado', timestamp: Date.now() }],
                    ...initialData 
                };
                parentNode.children.push(newChild);
                parentNode.isCollapsed = false;
            });
        });
    }, [updateActiveArcRoot]);

    const handleDeleteNode = useCallback((nodeId: string, activeArcRootId: string) => {
        if (nodeId === 'root' || nodeId === activeArcRootId) return;
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node, parent) => {
            if (parent && parent.children) {
                parent.children = parent.children.filter(child => child.id !== nodeId);
            }
        }));
    }, [updateActiveArcRoot]);

    const handlePromoteNote = useCallback((nodeId: string, content: string) => {
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            const separator = node.name ? '\n\n' : '';
            node.name = node.name + separator + content;
            node.note = ''; 
            if (!node.history) node.history = [];
            node.history.push({ action: 'Nota anexada al texto', timestamp: Date.now() });
        }));
    }, [updateActiveArcRoot]);

    const handleSetCanonicalChild = useCallback((parentId: string, childId: string) => {
        updateActiveArcRoot(root => findNodeAndModify(root, parentId, (node) => {
            node.canonicalChildId = (node.canonicalChildId === childId) ? undefined : childId;
        }));
    }, [updateActiveArcRoot]);

    const handleToggleContextExclusion = useCallback((nodeId: string) => {
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            node.excludeFromContext = !node.excludeFromContext;
            if (!node.history) node.history = [];
            node.history.push({ action: node.excludeFromContext ? 'Excluido del contexto' : 'Incluido en el contexto', timestamp: Date.now() });
        }));
    }, [updateActiveArcRoot]);

    const lastCharStateUpdateRef = useRef<Record<string, number>>({});

    const handleUpdateNodeCharacterState = useCallback((nodeId: string, charId: string, updates: CharacterStateSnapshot) => {
        const now = Date.now();
        const key = `${nodeId}-${charId}`;
        const lastUpdate = lastCharStateUpdateRef.current[key] || 0;
        const shouldOverwrite = (now - lastUpdate) < 5000;
        lastCharStateUpdateRef.current[key] = now;

        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (!node.characterStateOverrides) node.characterStateOverrides = {};
            const existing = node.characterStateOverrides[charId] || {};
            node.characterStateOverrides[charId] = { ...existing, ...updates };
            
            if (!node.history) node.history = [];
            const actionName = `Estado de personaje actualizado (${charId})`;
            
            if (shouldOverwrite && node.history.length > 0 && node.history[node.history.length - 1].action === actionName) {
                node.history[node.history.length - 1].timestamp = now;
            } else {
                node.history.push({ action: actionName, timestamp: now });
                if (node.history.length > 20) node.history = node.history.slice(node.history.length - 20);
            }
        }), shouldOverwrite);
    }, [updateActiveArcRoot]);

    const handleResetNodeCharacterState = useCallback((nodeId: string, charId: string) => {
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (node.characterStateOverrides) {
                delete node.characterStateOverrides[charId];
                if (Object.keys(node.characterStateOverrides).length === 0) node.characterStateOverrides = undefined;
            }
        }));
    }, [updateActiveArcRoot]);

    const handleAddTag = useCallback((nodeId: string, tag: string) => {
        const newTag = tag.trim().toLowerCase();
        if (!newTag) return;
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (!node.tags) node.tags = [];
            if (!node.tags.includes(newTag)) {
                node.tags.push(newTag);
                node.tags.sort();
            }
        }));
    }, [updateActiveArcRoot]);

    const handleRemoveTag = useCallback((nodeId: string, tag: string) => {
        const tagToRemove = tag.trim().toLowerCase();
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (node.tags) node.tags = node.tags.filter(t => t !== tagToRemove);
        }));
    }, [updateActiveArcRoot]);

    const handlePasteNodeAsChild = useCallback((parentNodeId: string, copiedNodeData: Partial<StoryNodeData> | null) => {
        if (!copiedNodeData) return;
        updateActiveArcRoot(root => findNodeAndModify(root, parentNodeId, (node) => {
            if (!node.children) node.children = [];
            const newChild: StoryNodeData = {
                ...copiedNodeData,
                id: generateUUID(),
                name: copiedNodeData.name || 'Pasted Node',
                children: [],
            };
            if (newChild.translations) newChild.translations = newChild.translations.map(t => ({...t, id: generateUUID()}));
            if (newChild.blocks) newChild.blocks = newChild.blocks.map(b => ({...b, id: generateUUID()}));
            node.children.push(newChild);
            node.isCollapsed = false;
        }));
    }, [updateActiveArcRoot]);
    
    const handlePasteNodeContent = useCallback((targetNodeId: string, copiedNodeData: Partial<StoryNodeData> | null) => {
        if (!copiedNodeData) return;
        updateActiveArcRoot(root => findNodeAndModify(root, targetNodeId, (node) => {
            const { id, children, isCollapsed, width, history } = node;
            Object.assign(node, { ...node, ...copiedNodeData, id, children, isCollapsed, width: copiedNodeData.width || width, history });
            if (node.translations) node.translations = node.translations.map(t => ({...t, id: generateUUID()}));
            if (node.blocks) node.blocks = node.blocks.map(b => ({...b, id: generateUUID()}));
            if (!node.history) node.history = [];
            node.history.push({ action: 'Contenido pegado desde otro nodo', timestamp: Date.now() });
        }));
    }, [updateActiveArcRoot]);

    const handleMoveNode = useCallback((movingNodeId: string, targetParentId: string) => {
        if (movingNodeId === targetParentId) return;
        updateActiveArcRoot(currentRoot => {
            if (isDescendant(currentRoot, movingNodeId, targetParentId)) {
                alert("No se puede mover un nodo dentro de su propia rama.");
                return currentRoot;
            }
            const newRoot = safeClone(currentRoot);
            let movedNodeData: StoryNodeData | null = null;
            const queue = [{ node: newRoot, parent: null as any }];
            while (queue.length) {
                const { node, parent } = queue.shift()!;
                if (node.id === movingNodeId) {
                    if (parent && parent.children) {
                        parent.children = parent.children.filter((child: any) => child.id !== movingNodeId);
                        movedNodeData = node;
                    }
                    break;
                }
                if (node.children) for (const child of node.children) queue.push({ node: child, parent: node });
            }
            if (!movedNodeData) return currentRoot;
            const attachQueue = [newRoot];
            while(attachQueue.length) {
                const node = attachQueue.shift()!;
                if (node.id === targetParentId) {
                    if (!node.children) node.children = [];
                    node.children.push(movedNodeData);
                    node.isCollapsed = false;
                    break;
                }
                if (node.children) attachQueue.push(...node.children);
            }
            return newRoot;
        });
    }, [updateActiveArcRoot]);

    const handleDirectorMessageAdd = useCallback((nodeId: string, message: ChatMessage) => {
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (!node.directorChatHistory) node.directorChatHistory = [];
            node.directorChatHistory.push(message);
        }));
    }, [updateActiveArcRoot]);

    const handleDirectorMessageUpdate = useCallback((nodeId: string, messageId: string, newText: string, bookmarkedParagraphs?: number[]) => {
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (node.directorChatHistory) {
                const msg = node.directorChatHistory.find(m => m.id === messageId);
                if (msg) {
                    msg.text = newText;
                    if (bookmarkedParagraphs !== undefined) {
                        msg.bookmarkedParagraphs = bookmarkedParagraphs;
                    }
                }
            }
        }));
    }, [updateActiveArcRoot]);

    const handleDirectorMessageToggleBookmark = useCallback((nodeId: string, messageId: string, paragraphIndex?: number) => {
        updateActiveArcRoot(root => findNodeAndModify(root, nodeId, (node) => {
            if (node.directorChatHistory) {
                const msg = node.directorChatHistory.find(m => m.id === messageId);
                if (msg) {
                    if (paragraphIndex !== undefined) {
                        if (!msg.bookmarkedParagraphs) msg.bookmarkedParagraphs = [];
                        const index = msg.bookmarkedParagraphs.indexOf(paragraphIndex);
                        if (index > -1) {
                            msg.bookmarkedParagraphs.splice(index, 1);
                        } else {
                            msg.bookmarkedParagraphs.push(paragraphIndex);
                        }
                    } else {
                        msg.bookmark = !msg.bookmark;
                    }
                }
            }
        }));
    }, [updateActiveArcRoot]);

    const handleDirectorMessageDelete = useCallback((nodeId: string, messageId: string | string[]) => {
        const idsToRemove = Array.isArray(messageId) ? new Set(messageId) : new Set([messageId]);
        updateActiveArcRoot(root => {
            // Clonamos el árbol y buscamos el nodo
            const updatedRoot = findNodeAndModify(root, nodeId, (node) => {
                if (node.directorChatHistory) {
                    // Sustitución inmutable del array de mensajes
                    node.directorChatHistory = node.directorChatHistory.filter(m => !idsToRemove.has(m.id));
                }
            });
            return updatedRoot;
        });
    }, [updateActiveArcRoot]);

    return useMemo(() => ({
        updateActiveArcRoot,
        onUpdateNodeData,
        handleAddChild,
        handleDeleteNode,
        handlePromoteNote,
        handleSetCanonicalChild,
        handleToggleContextExclusion,
        handleUpdateNodeCharacterState, 
        handleResetNodeCharacterState,
        handleAddTag,
        handleRemoveTag,
        handlePasteNodeAsChild,
        handlePasteNodeContent,
        handleMoveNode,
        handleDirectorMessageAdd,
        handleDirectorMessageUpdate,
        handleDirectorMessageToggleBookmark,
        handleDirectorMessageDelete
    }), [
        updateActiveArcRoot,
        onUpdateNodeData,
        handleAddChild,
        handleDeleteNode,
        handlePromoteNote,
        handleSetCanonicalChild,
        handleToggleContextExclusion,
        handleUpdateNodeCharacterState, 
        handleResetNodeCharacterState,
        handleAddTag,
        handleRemoveTag,
        handlePasteNodeAsChild,
        handlePasteNodeContent,
        handleMoveNode,
        handleDirectorMessageAdd,
        handleDirectorMessageUpdate,
        handleDirectorMessageToggleBookmark,
        handleDirectorMessageDelete
    ]);
};
