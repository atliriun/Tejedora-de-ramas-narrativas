
import * as d3 from 'd3';
import { HierarchyPointNode, HierarchyPointLink } from 'd3-hierarchy';
import { StoryNodeData } from '../types';
import { MIN_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../constants';

export const calculateTreeLayout = (
    rootNode: HierarchyPointNode<StoryNodeData>,
    nodeHeights: Record<string, number>,
    chattingNodeId: string | null,
    translatingNodeId: string | null
): { nodes: HierarchyPointNode<StoryNodeData>[]; links: HierarchyPointLink<StoryNodeData>[] } => {
    
    const initialNodes = rootNode.descendants();
    if (initialNodes.length === 0) return { nodes: [], links: [] };

    // Intelligent padding that adapts slightly, but base is robust
    const BASE_VERTICAL_PADDING = 60; 
    const HORIZONTAL_GAP = 150; 
    
    // Reset root horizontal position
    rootNode.y = 0;
    
    // 1. Calculate Horizontal Positions (Y axis in D3 Tree terms)
    // We determine Y based on the widths of parents and children to ensure text doesn't overlap horizontally.
    rootNode.eachBefore(node => {
        if (node.parent) {
            const parentWidth = node.parent.data.width || DEFAULT_NODE_WIDTH;
            const childWidth = node.data.width || DEFAULT_NODE_WIDTH;
            // Position children to the right of parents with a gap
            node.y = node.parent.y + (parentWidth / 2) + (childWidth / 2) + HORIZONTAL_GAP;
        }
    });

    // Helper to get the dynamic height of a node
    const getNodeHeight = (node: HierarchyPointNode<StoryNodeData>) => {
        return nodeHeights[node.data.id] || MIN_NODE_HEIGHT;
    };

    // Helper to vertically shift a node and its entire subtree (X axis in D3 Tree terms)
    function shiftSubtree(node: HierarchyPointNode<StoryNodeData>, shift: number) {
        node.x += shift;
        if (node.children) {
            node.children.forEach((child) => shiftSubtree(child, shift));
        }
    }

    // Helper to calculate the vertical boundaries (Top/Bottom X) of a subtree
    // This is the "Intelligent" part: it looks at the entire branch shape, not just the immediate node.
    function getSubtreeVerticalBounds(node: HierarchyPointNode<StoryNodeData>): { top: number, bottom: number } {
        const height = getNodeHeight(node);
        let top = node.x - height / 2;
        let bottom = node.x + height / 2;

        if (node.children) {
            node.children.forEach(child => {
                const childBounds = getSubtreeVerticalBounds(child);
                if (childBounds.top < top) top = childBounds.top;
                if (childBounds.bottom > bottom) bottom = childBounds.bottom;
            });
        }
        return { top, bottom };
    }

    // 2. Post-Order Traversal for Vertical Collision Resolution
    // We process leaves first, moving up to the root. This treats subtrees as rigid bodies.
    function layoutNode(node: HierarchyPointNode<StoryNodeData>) {
        if (!node.children || node.children.length === 0) return;

        // Recursive step: Layout children first
        node.children.forEach(layoutNode);

        // Solve collisions between adjacent sibling subtrees
        for (let i = 1; i < node.children.length; i++) {
            const prevChild = node.children[i - 1];
            const currChild = node.children[i];

            // Get the full vertical footprint of the previous sibling's subtree
            const prevBounds = getSubtreeVerticalBounds(prevChild);
            // Get the full vertical footprint of the current sibling's subtree
            const currBounds = getSubtreeVerticalBounds(currChild);

            // Calculate distance between the bottom of the previous subtree and top of the current one
            const dist = currBounds.top - prevBounds.bottom;
            
            // If they overlap or are too close, shift the current child (and its subtree) down
            const requiredShift = BASE_VERTICAL_PADDING - dist;

            if (requiredShift > 0) {
                shiftSubtree(currChild, requiredShift);
            }
        }

        // Re-center the parent node vertically relative to its children's new positions
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        const childrenCenter = (firstChild.x + lastChild.x) / 2;
        
        node.x = childrenCenter;
    }

    // Start the layout calculation from the root
    layoutNode(rootNode);

    const finalLinks = initialNodes
      .slice(1)
      .map(node => ({
        source: node.parent!,
        target: node,
      })) as HierarchyPointLink<StoryNodeData>[];
      
    return { nodes: initialNodes, links: finalLinks };
};
