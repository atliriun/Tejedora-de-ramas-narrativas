
import { useMemo } from 'react';
import { hierarchy, tree } from 'd3';
import { StoryNodeData, StoryArc } from '../types';
import { calculateTreeLayout } from '../utils/layoutUtils';
import { generateNodeReadableIds, generateStorySummary } from '../utils/storyUtils';
import { MIN_NODE_HEIGHT, INITIAL_NODE_DATA } from '../constants';

export const useStoryLayout = (
    storyTree: StoryNodeData,
    activeArc: StoryArc | undefined,
    storyArcs: StoryArc[],
    activeArcId: string,
    nodeHeights: Record<string, number>,
    chattingNodeId: string | null,
    translatingNodeId: string | null
) => {
    // 1. Canonical Path Calculation
    const canonicalNodeIds = useMemo(() => {
        const ids = new Set<string>();
        if (!activeArc) return ids;
        const traverse = (node: StoryNodeData) => {
            if (!node) return;
            ids.add(node.id);
            if (node.children && node.children.length > 0) {
                const nextId = node.canonicalChildId || node.children[0].id;
                const nextNode = node.children.find(c => c.id === nextId);
                if (nextNode) traverse(nextNode);
            }
        };
        traverse(activeArc.rootNode);
        return ids;
    }, [activeArc]);

    // 2. D3 Hierarchy Generation
    const root = useMemo(() => hierarchy(storyTree, d => d.isCollapsed ? null : d.children), [storyTree]);
    
    // 3. Tree Layout Config
    const treeLayout = useMemo(() => tree<StoryNodeData>().nodeSize([MIN_NODE_HEIGHT + 80, 1]), []);
    
    // 4. Execute Basic Layout
    const layout = useMemo(() => treeLayout(root), [root, treeLayout]);

    // 5. Custom Layout Adjustment (Collision detection, etc.)
    const adjustedLayout = useMemo(() => {
        return calculateTreeLayout(layout, nodeHeights, chattingNodeId, translatingNodeId);
    }, [layout, nodeHeights, chattingNodeId, translatingNodeId]);

    const { nodes, links } = adjustedLayout;

    // 6. Generate Readable IDs (1.A, 1.B)
    const nodeReadableIds = useMemo(() => generateNodeReadableIds(nodes), [nodes]);

    // 7. Generate Text Summary
    const storySummary = useMemo(() => generateStorySummary(storyArcs, activeArcId), [storyArcs, activeArcId]);

    return {
        canonicalNodeIds,
        root,
        nodes,
        links,
        nodeReadableIds,
        storySummary
    };
};
