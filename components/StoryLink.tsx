
import React, { memo } from 'react';
import type { HierarchyPointLink } from 'd3-hierarchy';
import type { StoryNodeData } from '../types';
import { DEFAULT_NODE_WIDTH } from '../constants';

interface StoryLinkProps {
  link: HierarchyPointLink<StoryNodeData>;
  isCanonical: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  onSetCanonical: () => void;
}

export const StoryLink = memo(({ link, isCanonical, isDimmed = false, isHighlighted = false, onSetCanonical }: StoryLinkProps) => {
  const { source, target } = link;
  
  const sourceWidth = source.data.width || DEFAULT_NODE_WIDTH;
  const targetWidth = target.data.width || DEFAULT_NODE_WIDTH;
  
  const startX = source.y + sourceWidth / 2;
  const startY = source.x;
  
  const endX = target.y - targetWidth / 2;
  const endY = target.x;
  
  // Bezier curve path
  const path = `M${startX},${startY}C${(startX + endX) / 2},${startY} ${(startX + endX) / 2},${endY} ${endX},${endY}`;

  const strokeColor = isHighlighted 
    ? "#22D3EE" // Cyan for active trace
    : isCanonical 
        ? "#EAB308" // Yellow for canonical
        : "#4B5563"; // Gray for default

  const opacity = isHighlighted ? 1 : (isDimmed ? 0.1 : (isCanonical ? 0.8 : 0.5));
  const strokeWidth = isHighlighted ? 4 : (isCanonical ? 3 : 2);

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-all duration-300"
        style={{ opacity: opacity }}
      />
       {/* Invisible thicker path for easier clicking */}
       <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        className="cursor-pointer hover:stroke-yellow-500/10 transition-colors"
        onClick={(e) => {
            e.stopPropagation();
            onSetCanonical();
        }}
      >
        <title>{isCanonical ? "Canonical Path (Click to unset)" : "Set as Canonical Path"}</title>
      </path>
    </g>
  );
});
