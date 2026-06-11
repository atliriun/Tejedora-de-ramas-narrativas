
import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { SaveIcon, EditIcon, TrashIcon, ChevronDownIcon, ToggleLeftIcon, ToggleRightIcon, UploadIcon } from '../icons';
import { processImageFile } from '../../utils/imageUtils';

interface AccordionTab {
    id: string;
    label: string;
    icon?: ReactNode;
    count?: number;
}

interface EntityAccordionShellProps {
    // Identity
    name: string;
    icon?: ReactNode; // Header icon
    avatar?: string; // Optional avatar image base64
    nameColor?: string; // NEW: Tailwild text class or CSS color
    
    // State
    isOpen: boolean;
    onToggle: () => void;
    
    // CRUD Actions
    onUpdateName: (newName: string) => void;
    onDelete: () => void;
    onUpdateAvatar?: (newAvatarBase64: string) => void;
    
    // Optional: Toggle Active State (for Traits/Flags)
    isActive?: boolean;
    onToggleActive?: () => void;
    
    // Configuration
    isInitiallyEditing?: boolean;
    defaultNameCheck?: string; // e.g. "New Character" - triggers auto-edit if matches
    
    // Tabs System
    tabs?: AccordionTab[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    
    // Content
    children: ReactNode;
}

export const EntityAccordionShell: React.FC<EntityAccordionShellProps> = ({
    name, icon, avatar, nameColor, isOpen, onToggle,
    onUpdateName, onDelete, onUpdateAvatar,
    isActive, onToggleActive,
    isInitiallyEditing = false, defaultNameCheck,
    tabs = [], activeTab, onTabChange,
    children
}) => {
    const [isEditingName, setIsEditingName] = useState(isInitiallyEditing || (defaultNameCheck ? name === defaultNameCheck : false));
    const [tempName, setTempName] = useState(name);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpdateAvatar) return;
        
        setIsUploading(true);
        try {
            const base64Image = await processImageFile(file);
            onUpdateAvatar(base64Image);
        } catch (error) {
            console.error("Error processing avatar:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        setTempName(name);
    }, [name]);

    const handleNameSave = () => {
        if (tempName.trim()) {
            onUpdateName(tempName.trim());
            setIsEditingName(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleNameSave();
        if (e.key === 'Escape') {
            setTempName(name);
            setIsEditingName(false);
        }
    };

    return (
        <div className="border-b border-gray-700">
            <h2 onClick={onToggle} className="cursor-pointer group">
                <div className="flex items-center justify-between w-full p-3 font-medium text-left text-gray-300 hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-2 flex-grow min-w-0">
                        {onUpdateAvatar && (
                            <div 
                                className="relative flex-shrink-0 w-8 h-8 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center overflow-hidden group/avatar cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                title="Cambiar Avatar"
                            >
                                {isUploading ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-500"></div>
                                ) : avatar ? (
                                    <img src={avatar} alt={name} className="w-full h-full object-cover transition-opacity group-hover/avatar:opacity-50" />
                                ) : (
                                    <UploadIcon className="w-3 h-3 text-gray-500 opacity-50 group-hover/avatar:opacity-100" />
                                )}
                                {!isUploading && avatar && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 bg-black/50 transition-opacity">
                                        <EditIcon className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleAvatarSelect}
                                    accept="image/png, image/jpeg, image/webp, image/gif"
                                    className="hidden" 
                                />
                            </div>
                        )}
                        {!onUpdateAvatar && icon && <span className="text-gray-500 flex-shrink-0">{icon}</span>}
                        {isEditingName ? (
                            <input 
                                type="text" 
                                value={tempName} 
                                onChange={(e) => setTempName(e.target.value)} 
                                onKeyDown={handleKeyDown} 
                                onBlur={handleNameSave} 
                                className={`bg-gray-900 border border-cyan-500 rounded px-1 text-sm w-full font-bold ${nameColor || 'text-white'}`} 
                                autoFocus 
                                onClick={(e) => e.stopPropagation()} 
                            />
                        ) : (
                            <span className={`truncate font-bold ${isActive === false ? 'text-gray-500 line-through decoration-gray-500' : (nameColor || 'text-gray-200')}`}>
                                {name}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {onToggleActive && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
                                className={`p-1 rounded hover:bg-gray-600 mr-1 ${isActive !== false ? 'text-green-500' : 'text-gray-500'}`}
                                title={isActive !== false ? "Active" : "Inactive"}
                            >
                                {isActive !== false ? <ToggleRightIcon className="w-5 h-5"/> : <ToggleLeftIcon className="w-5 h-5"/>}
                            </button>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); isEditingName ? handleNameSave() : setIsEditingName(true); }} 
                            className="p-1.5 rounded-full hover:bg-gray-600 text-gray-400 hover:text-white"
                        >
                            {isEditingName ? <SaveIcon className="w-4 h-4" /> : <EditIcon className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                            className="p-1.5 rounded-full hover:bg-red-500 text-gray-400 hover:text-white"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </h2>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[120rem] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-3">
                    {/* Tabs Render */}
                    {tabs.length > 0 && onTabChange && (
                        <div className="border-b border-gray-600 flex space-x-1 overflow-x-auto scrollbar-hide mb-3">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-bold uppercase rounded-t-md border-b-2 transition-colors whitespace-nowrap ${
                                        activeTab === tab.id 
                                        ? 'bg-gray-700/50 border-cyan-400 text-white' 
                                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-700/30'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span> 
                                    {typeof tab.count !== 'undefined' && <span className="text-[10px] opacity-70 ml-1">({tab.count})</span>}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {/* Body Content */}
                    <div className="animate-fade-in-fast">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
