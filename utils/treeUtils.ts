
import { StoryNodeData } from '../types';
import { safeClone, generateUUID } from './uuid';

export const findNodeAndModify = (root: StoryNodeData, nodeId: string, action: (node: StoryNodeData, parent: StoryNodeData | null) => void): StoryNodeData => {
    // Use JSON serialization for safety. structuredClone can throw DataCloneError if the state 
    // inadvertently contains non-clonable objects (like Proxies or functions), causing the app to crash.
    const newRoot = safeClone(root);
    
    const queue: { node: StoryNodeData, parent: StoryNodeData | null }[] = [{ node: newRoot, parent: null }];
    
    while (queue.length > 0) {
        const { node, parent } = queue.shift()!;
        if (node.id === nodeId) {
            action(node, parent);
            return newRoot;
        }
        if (node.children) {
            for (const child of node.children) {
                queue.push({ node: child, parent: node });
            }
        }
    }
    return newRoot;
};

export const cloneTreeWithNewIds = (node: StoryNodeData): StoryNodeData => {
    const newNode: StoryNodeData = {
        ...node,
        id: generateUUID(),
        children: node.children ? node.children.map(cloneTreeWithNewIds) : [],
        // Ensure we don't carry over specific session states that shouldn't be duplicated
        chatHistory: [], 
        translations: node.translations ? node.translations.map(t => ({...t, id: generateUUID()})) : [],
        blocks: node.blocks ? node.blocks.map(b => ({...b, id: generateUUID()})) : undefined,
        // Clear director history on clone to give a fresh start
        directorChatHistory: []
    };
    return newNode;
};

/**
 * Checks if a target node is a descendant of a specific ancestor node.
 * Useful for preventing cycles when moving nodes (e.g. moving a parent into its own child).
 */
export const isDescendant = (root: StoryNodeData, ancestorId: string, targetId: string): boolean => {
    if (ancestorId === targetId) return true;
    
    let ancestorNode: StoryNodeData | null = null;
    
    // 1. Find the ancestor node first
    const queue = [root];
    while(queue.length > 0) {
        const current = queue.shift()!;
        if (current.id === ancestorId) {
            ancestorNode = current;
            break;
        }
        if (current.children) queue.push(...current.children);
    }

    if (!ancestorNode) return false; // Ancestor not found in tree

    // 2. Search subtree of ancestor for target
    const subQueue = [ancestorNode];
    while(subQueue.length > 0) {
        const current = subQueue.shift()!;
        if (current.id === targetId) return true;
        if (current.children) subQueue.push(...current.children);
    }

    return false;
};
