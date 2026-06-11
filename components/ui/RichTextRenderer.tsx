
import React from 'react';

interface RichTextRendererProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    preserveSyntax?: boolean;
}

// Unifies the text formatting logic for the entire app.
// Handles:
// **Bold** -> Yellow
// (Italic/Thoughts) -> Cyan
// — Dialogue — -> Rose
// ¿Questions? -> Indigo
// Lists; -> Orange
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ text, className = "", style, preserveSyntax = false }) => {
    if (!text) return null;
    
    // Split regex looks for:
    // 1. (**...**) Bold
    // 2. ((...)) Parentheses
    // 3. (—...—) Em dashes enclosing text
    // 4. (—) Single Em dash
    // 5. (¿...?) Spanish questions
    // 6. (text;) Text ending in semicolon (excluding other format chars to avoid breaking nesting)
    // 7. (;) Standalone semicolon
    const parts = text.split(/(\*\*.*?\*\*|\(.*?\)|—.*?—|—|¿.*?\?|[^;\n\*\(\)—¿]+;)/g);

    return (
        <div className={className} style={style}>
            {parts.map((part, index) => {
                // Bold: **text**
                if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                    return <span key={index} className="font-bold text-yellow-400">{preserveSyntax ? part : part.slice(2, -2)}</span>;
                }
                // Parentheses: (text)
                if (part.startsWith('(') && part.endsWith(')') && part.length > 2) {
                    return <span key={index} className="italic text-cyan-300">{part}</span>;
                }
                // Em dashes enclosing: — text —
                if (part.startsWith('—') && part.endsWith('—') && part.length > 2) {
                    return <span key={index} className="text-rose-300">{part}</span>;
                }
                // Single Em dash
                if (part === '—') {
                    // REMOVED mx-1 to prevent text layout shift in Editor
                    return <span key={index} className="text-rose-400 font-bold">—</span>;
                }
                // Spanish Questions: ¿text?
                if (part.startsWith('¿') && part.endsWith('?')) {
                    return <span key={index} className="font-medium text-indigo-300 italic">{part}</span>;
                }
                // List items/Stats ending in semicolon: text;
                if (part.endsWith(';') && part.length > 1) {
                    return <span key={index} className="font-semibold text-orange-300">{part}</span>;
                }
                // Semicolon fallback
                if (part === ';') {
                    // REMOVED mx-0.5 to prevent text layout shift in Editor
                    return <span key={index} className="font-bold text-orange-500">;</span>;
                }
                // Normal text
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
};
