
import { StoryBlock, BlockType } from '../../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Parses raw narrative text into semantic blocks based on common fiction syntax.
 * Syntax Rules:
 * - (...) -> Internal Thought
 * - —...— or —... -> Dialogue
 * - **...** -> Emphasis / Key Action
 * - Everything else -> Narrative Action
 */
export const parseTextToStructuredBlocks = (text: string): StoryBlock[] => {
    if (!text) return [];

    // Regex Explanation:
    // 1. (\*\*.*?\*\*) -> Bold/Emphasis
    // 2. (\(.*?\)) -> Parentheses/Thoughts
    // 3. (—.*?—) -> Enclosed Dialogue
    // 4. (—.*) -> Open-ended Dialogue (end of line)
    const regex = /(\*\*.*?\*\*|\(.*?\)|—.*?—|—.*)/g;
    
    // Split and filter empty strings
    const parts = text.split(regex).filter(p => p && p.trim().length > 0);
    
    return parts.map(part => {
        const trimmed = part.trim();
        
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            return { 
                id: generateId(),
                type: 'system', 
                text: trimmed.slice(2, -2).trim() 
            };
        }
        
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            return { 
                id: generateId(),
                type: 'thought', 
                text: trimmed.slice(1, -1).trim() 
            };
        }
        
        if (trimmed.startsWith('—')) {
            // Remove dashes for the content payload
            let content = trimmed.substring(1);
            if (content.endsWith('—')) {
                content = content.slice(0, -1);
            }
            return { 
                id: generateId(),
                type: 'dialogue', 
                text: content.trim() 
            };
        }

        return { 
            id: generateId(),
            type: 'action', 
            text: trimmed 
        };
    });
};

/**
 * Converts the structured blocks into a compact JSON string string for the AI prompt.
 * Adds labels to help the model understand the context of each block.
 */
export const formatBlocksToAiPrompt = (blocks: StoryBlock[]): string => {
    return JSON.stringify(blocks.map(b => {
        // Optimization: Simplify keys for token economy
        const content = b.text;
        const charId = b.characterId ? `|C:${b.characterId}` : '';
        
        if (b.type === 'action') return { [`A${charId}`]: content }; // Action
        if (b.type === 'dialogue') return { [`D${charId}`]: content }; // Dialogue
        if (b.type === 'thought') return { [`T${charId}`]: content }; // Thought
        if (b.type === 'system') return { [`E${charId}`]: content }; // Emphasis
        if (b.type === 'description') return { [`A${charId}`]: content }; // Description
        return { [`A${charId}`]: content };
    }));
};
