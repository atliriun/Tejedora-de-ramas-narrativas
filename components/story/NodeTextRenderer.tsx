
import React from 'react';
import { RichTextRenderer } from '../ui/RichTextRenderer';

// Wrapper component for Nodes to maintain specific node styling context
export const NodeTextRenderer: React.FC<{ text: string }> = ({ text }) => {
    return (
        <RichTextRenderer 
            text={text} 
            className="text-base md:text-lg text-gray-200 break-words whitespace-pre-wrap pr-2 leading-relaxed font-serif tracking-wide" 
        />
    );
};
