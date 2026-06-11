
import React from 'react';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { XIcon } from '../icons';

interface PanelShellProps {
    id: string; // For localStorage persistence
    side: 'left' | 'right';
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: React.ReactNode;
    widthConfig?: { initial: number; min: number; max: number };
    headerContent?: React.ReactNode; // Extra buttons in header
    children: React.ReactNode;
    className?: string;
}

export const PanelShell: React.FC<PanelShellProps> = ({
    id, side, isOpen, onClose, title, icon,
    widthConfig = { initial: 400, min: 300, max: 800 },
    headerContent, children, className = ""
}) => {
    // Determine resize direction based on side
    // If panel is on Left, resizer is on Right. Dragging Right increases width.
    // If panel is on Right, resizer is on Left. Dragging Left increases width.
    const resizeDir = side === 'left' ? 'left' : 'right'; 
    
    const { width, handleMouseDown } = useResizablePanel(id, widthConfig.initial, widthConfig.min, widthConfig.max, resizeDir);

    // Determine positioning classes
    const positionClass = side === 'left' ? 'left-0 border-r' : 'right-0 border-l';
    const resizerClass = side === 'left' ? 'right-0 cursor-col-resize' : 'left-0 cursor-col-resize';
    
    // For SideMenu (right), we might use display:none instead of transform for some legacy reasons in your app, 
    // but transform is smoother. Let's support the transform style transition used in StoryArcsPanel.
    // Note: SideMenu currently uses display: none. StoryArcs uses translate.
    // We will use a consistent transform approach if isOpen is managed by parent, but for now let's stick to the
    // visibility toggle prop or conditional rendering from parent.
    
    // Actually, most panels return null if !isOpen. Let's keep that pattern for performance (unmounting).
    if (!isOpen) return null;

    return (
        <aside 
            style={{ width }} 
            className={`absolute top-0 ${positionClass} h-full bg-gray-800 border-gray-700 text-white z-40 flex flex-col shadow-2xl ${className}`}
        >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-700 p-3 flex justify-between items-center bg-gray-800">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center space-x-2 truncate mr-2">
                    {icon} <span>{title}</span>
                </h2>
                <div className="flex items-center space-x-2">
                    {headerContent}
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-600 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow flex flex-col overflow-hidden relative">
                {children}
            </div>

            {/* Resizer */}
            <div
                className={`absolute top-0 ${resizerClass} w-1.5 h-full hover:bg-cyan-500/50 transition-colors z-50 opacity-0 hover:opacity-100`}
                onMouseDown={handleMouseDown}
            />
        </aside>
    );
};
