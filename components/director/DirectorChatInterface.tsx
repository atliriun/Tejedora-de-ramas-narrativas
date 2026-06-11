
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ChatMessage, AiRoleType, Character } from '../../types';
import { 
    SendIcon, LoaderIcon, SparkleIcon, XIcon, CheckIcon, CopyIcon, EditIcon, RefreshIcon, TrashIcon, FeatherIcon, FileTextIcon, CogIcon, ActivityIcon, SquareIcon, ListCheckIcon, BookOpenIcon, UsersIcon, ScaleIcon, ChevronDownIcon, ClipboardPasteIcon, MinusIcon, TargetIcon, StarIcon, TrendingUpIcon, SplitIcon
} from '../icons';
import { RichTextRenderer } from '../ui/RichTextRenderer';

interface DirectorChatInterfaceProps {
    messages: ChatMessage[];
    onChatSubmit: (message: string, isSystemMode: boolean) => Promise<void>;
    onManualMessageAdd?: (role: 'user' | 'model' | 'system', text: string) => void;
    onTransferChat?: () => void;
    isChatting: boolean;
    isGenerating: boolean;
    onUpdateMessage?: (msgId: string, text: string, bookmarkedParagraphs?: number[]) => void;
    onToggleBookmark?: (msgId: string, paragraphIndex?: number) => void;
    onDeleteMessage?: (msgId: string | string[]) => void;
    onRegenerateResponse?: () => void;
    initialInput?: string;
    onStop?: () => void; 
    onSplitChat?: (msgId: string) => void;
    
    currentRole?: AiRoleType;
    currentCustomInstr?: string;
    onUpdateRoleSettings?: (role: AiRoleType, instr: string) => void;
    isSystemModeExternal?: boolean;
    
    chatDraft?: string;
    onUpdateDraft?: (text: string) => void;

    allCharacters?: Character[];
    focalCharacterIds?: string[];
    
    streamingText?: string;
    onAddToEvolution?: (characterId: string, category: string, text: string) => void;
}

export const DirectorChatInterface: React.FC<DirectorChatInterfaceProps> = ({
    messages, onChatSubmit, onManualMessageAdd, onTransferChat, isChatting, isGenerating,
    onUpdateMessage, onToggleBookmark, onDeleteMessage, onRegenerateResponse, initialInput = '', onStop, onSplitChat,
    currentRole = 'co-writer', currentCustomInstr = '', onUpdateRoleSettings, isSystemModeExternal = false,
    chatDraft = '', onUpdateDraft,
    allCharacters = [], focalCharacterIds = [],
    streamingText = '', onAddToEvolution
}) => {
    const [input, setInput] = useState(chatDraft || initialInput);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [isSystemMode, setIsSystemMode] = useState(isSystemModeExternal);
    
    const [editingBlockKey, setEditingBlockKey] = useState<string | null>(null); 
    const [blockEditText, setBlockEditText] = useState('');

    const [addingEvolutionText, setAddingEvolutionText] = useState<string | null>(null);
    const [selectedEvolutionCharId, setSelectedEvolutionCharId] = useState<string>('');
    const [selectedEvolutionCategory, setSelectedEvolutionCategory] = useState<string>('Psychological');

    const [selectedRole, setSelectedRole] = useState<AiRoleType>(currentRole);
    const [customInstr, setCustomInstr] = useState(currentCustomInstr);
    const [showRoleConfig, setShowRoleConfig] = useState(false);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const initializedRef = useRef(false);
    const prevMessagesLengthRef = useRef(0);
    const initializedScrollRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current) {
            setInput(chatDraft || initialInput);
            initializedRef.current = true;
        }
    }, [chatDraft, initialInput]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (onUpdateDraft) {
                onUpdateDraft(input);
            }
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [input, onUpdateDraft]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    useEffect(() => {
        const isNewMessage = messages.length > prevMessagesLengthRef.current;
        prevMessagesLengthRef.current = messages.length;

        if (!initializedScrollRef.current || isNewMessage || isChatting || streamingText) {
            if (!editingMessageId && !isSelectionMode && !editingBlockKey) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                initializedScrollRef.current = true;
            }
        }
    }, [messages.length, isChatting, editingMessageId, isSelectionMode, editingBlockKey, streamingText]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSubmit = async () => {
        if (!input.trim() || isChatting || isGenerating) return;
        const textToSubmit = input.trim();
        setShowBookmarksOnly(false);
        await onChatSubmit(textToSubmit, isSystemMode);
        setInput('');
        if (onUpdateDraft) {
            onUpdateDraft('');
        }
    };

    const handleInjectData = () => {
        if (onManualMessageAdd) {
            setShowBookmarksOnly(false);
            onManualMessageAdd('system', '');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 1500);
    };

    const handleStartFullEdit = (msg: ChatMessage) => {
        if (isSelectionMode) return;
        setEditingMessageId(msg.id);
        setEditText(msg.text);
    };

    const handleSaveFullEdit = (msgId: string) => {
        if (onUpdateMessage && editText.trim()) onUpdateMessage(msgId, editText.trim());
        setEditingMessageId(null);
    };

    const handleStartBlockEdit = (msgId: string, index: number, content: string) => {
        setEditingBlockKey(`${msgId}-${index}`);
        setBlockEditText(content);
    };

    const handleCancelBlockEdit = () => {
        setEditingBlockKey(null);
        setBlockEditText('');
    };

    const handleSaveBlockEdit = (msgId: string, index: number) => {
        if (!onUpdateMessage) return;
        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;
        const paragraphs = msg.text.split(/\n\n+/);
        
        const newText = blockEditText.trim();
        const newParagraphs = newText.split(/\n\n+/);
        const diff = newParagraphs.length - 1;
        
        paragraphs.splice(index, 1, ...newParagraphs);
        const updatedFullText = paragraphs.join('\n\n');
        
        let newBookmarks = msg.bookmarkedParagraphs ? [...msg.bookmarkedParagraphs] : [];
        if (diff !== 0) {
            newBookmarks = newBookmarks.map(i => i > index ? i + diff : i);
        }
        
        onUpdateMessage(msgId, updatedFullText, newBookmarks);
        handleCancelBlockEdit();
    };

    const handleQuickDeleteBlock = (msgId: string, index: number) => {
        if (!onUpdateMessage) return;
        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;
        const paragraphs = msg.text.split(/\n\n+/);
        paragraphs.splice(index, 1);
        const updatedFullText = paragraphs.join('\n\n');
        
        if (updatedFullText.trim() === '') {
            if (onDeleteMessage) onDeleteMessage(msgId);
        } else {
            let newBookmarks = msg.bookmarkedParagraphs ? [...msg.bookmarkedParagraphs] : [];
            newBookmarks = newBookmarks.filter(i => i !== index).map(i => i > index ? i - 1 : i);
            onUpdateMessage(msgId, updatedFullText, newBookmarks);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === messages.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(messages.map(m => m.id)));
        }
    };

    const handleSingleDelete = useCallback((e: React.MouseEvent, msgId: string) => {
        e.stopPropagation();
        e.preventDefault();
        if (onDeleteMessage) {
            onDeleteMessage(msgId);
        }
    }, [onDeleteMessage]);

    const handleBulkDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!onDeleteMessage || selectedIds.size === 0) return;
        const idsArray = Array.from(selectedIds);
        onDeleteMessage(idsArray);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    }, [onDeleteMessage, selectedIds]);

    const toggleSelectionMode = () => {
        const newMode = !isSelectionMode;
        setIsSelectionMode(newMode);
        if (!newMode) setSelectedIds(new Set());
    };

    const handleSaveRoleSettings = () => {
        if (onUpdateRoleSettings) onUpdateRoleSettings(selectedRole, customInstr);
        setShowRoleConfig(false);
    };

    const ROLE_LABELS: Record<AiRoleType, {label: string, icon: any, desc: string}> = {
        'co-writer': { label: 'Co-Escritor', icon: <FeatherIcon className="w-3 h-3"/>, desc: 'Equilibrio entre ayuda creativa y coherencia.' },
        'dm': { label: 'Dungeon Master', icon: <UsersIcon className="w-3 h-3"/>, desc: 'Enfoque en reglas, retos y azar lógico.' },
        'editor': { label: 'Editor Crítico', icon: <EditIcon className="w-3 h-3"/>, desc: 'Analiza tu prosa y sugiere mejoras estructurales.' },
        'lore-master': { label: 'Guardián del Lore', icon: <BookOpenIcon className="w-3 h-3"/>, desc: 'Evita contradicciones y expande la historia.' },
        'chronicler': { label: 'Cronista', icon: <FileTextIcon className="w-3 h-3"/>, desc: 'Crea resúmenes complejos y detallados sin límite de tamaño.' },
        'custom': { label: 'Personalizado', icon: <CogIcon className="w-3 h-3"/>, desc: 'Tú defines las instrucciones maestras.' }
    };

    const focalActors = allCharacters.filter(c => focalCharacterIds.includes(c.id));

    const safeRole = ROLE_LABELS[selectedRole] ? selectedRole : 'co-writer';

    return (
        <div className={`flex-1 w-full min-w-0 flex flex-col relative h-full transition-colors duration-500 ${isSystemMode ? 'bg-purple-950/20' : 'bg-gray-900/10'}`}>
            
            {/* TOOLBAR SUPERIOR RESPONSIVO */}
            <div className={`flex-shrink-0 border-b p-2 px-3 md:px-6 flex items-center justify-between z-[60] transition-all h-12 md:h-14 ${isSelectionMode ? 'bg-cyan-900/90 border-cyan-500/50' : (isSystemMode ? 'bg-purple-900/80 border-purple-800' : 'bg-gray-950/40 border-white/5 backdrop-blur-md')}`}>
                
                {isSelectionMode ? (
                    <div className="flex items-center justify-between w-full animate-fade-in-fast">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <button onClick={toggleSelectionMode} className="p-1.5 rounded-lg bg-gray-800 text-white"><XIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                            <span className="text-[8px] md:text-xs font-black text-white uppercase tracking-widest">{selectedIds.size} Marcados</span>
                        </div>
                        <div className="flex items-center space-x-1 md:space-x-2">
                            <button onClick={handleSelectAll} className="px-2 py-1 md:px-4 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black bg-cyan-700 text-white border border-cyan-400/50 uppercase">Todos</button>
                            <button onClick={handleBulkDelete} disabled={selectedIds.size === 0} className="p-1.5 rounded-lg bg-red-600 text-white disabled:opacity-30"><TrashIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
                            <button 
                                onClick={() => setShowRoleConfig(!showRoleConfig)}
                                disabled={isSystemMode}
                                className={`flex items-center space-x-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-xl text-[8px] md:text-[10px] font-black tracking-widest transition-all border shadow-lg truncate ${isSystemMode ? 'opacity-30 grayscale cursor-not-allowed' : (showRoleConfig ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-gray-800 border-white/10 text-gray-400')}`}
                            >
                                {ROLE_LABELS[safeRole].icon}
                                <span className="hidden xs:inline">{ROLE_LABELS[safeRole].label.toUpperCase()}</span>
                                <ChevronDownIcon className={`w-3 h-3 transition-transform ${showRoleConfig ? 'rotate-180' : ''}`} />
                            </button>
                            {isSystemMode && (
                                <div className="flex items-center space-x-1.5 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-500/30">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                                    <span className="text-[7px] md:text-[9px] text-purple-200 font-black uppercase">SINC DATOS</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-1.5">
                            <button 
                                onClick={() => setIsSystemMode(!isSystemMode)}
                                className={`px-2 py-1 md:px-3 md:py-1.5 rounded-xl text-[8px] md:text-[9px] font-black transition-all border shadow-xl flex items-center space-x-1.5 ${isSystemMode ? 'bg-purple-600 text-white border-purple-400 scale-105' : 'bg-gray-800 text-gray-500 border-white/5 hover:text-purple-300'}`}
                            >
                                <ActivityIcon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isSystemMode ? 'animate-spin-slow' : ''}`} />
                                <span className="hidden xxs:inline">SISTEMA</span>
                            </button>

                            <button 
                                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                                title="Mostrar solo marcadores" 
                                className={`p-1.5 md:p-2 rounded-xl border transition-all ${showBookmarksOnly ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-gray-800 text-gray-500 border-white/5 hover:text-yellow-400'}`}
                            >
                                <StarIcon className={`w-4 h-4 ${showBookmarksOnly ? 'fill-yellow-400' : ''}`} />
                            </button>

                            <button onClick={toggleSelectionMode} title="Seleccionar mensajes" className="p-1.5 md:p-2 rounded-xl border bg-gray-800 text-gray-500 border-white/5 hover:text-cyan-400"><ListCheckIcon className="w-4 h-4" /></button>
                        </div>
                    </>
                )}
            </div>

            {/* CONFIGURACIÓN DE ROL FLOTANTE */}
            {showRoleConfig && (
                <div className="absolute top-12 left-2 right-2 md:top-14 md:left-4 md:right-4 z-[70] bg-gray-800 border border-cyan-500/30 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-3 md:p-5 animate-fade-in-fast ring-1 ring-white/5">
                    <h3 className="text-[10px] font-black text-cyan-400 mb-3 uppercase tracking-widest">Personalidad del Asistente</h3>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {(Object.entries(ROLE_LABELS) as [AiRoleType, any][]).map(([key, data]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedRole(key)}
                                className={`flex flex-col p-2 rounded-xl border-2 text-left transition-all ${selectedRole === key ? 'bg-cyan-900/20 border-cyan-500' : 'bg-gray-900/50 border-white/5 opacity-50'}`}
                            >
                                <div className="flex items-center space-x-1.5 mb-0.5">
                                    <span className={selectedRole === key ? 'text-cyan-400' : 'text-gray-400'}>{data.icon}</span>
                                    <span className="text-[9px] font-black text-gray-100 uppercase truncate">{data.label}</span>
                                </div>
                                <p className="text-[7px] md:text-[9px] text-gray-500 leading-tight hidden xs:block">{data.desc}</p>
                            </button>
                        ))}
                    </div>
                    {selectedRole === 'custom' && (
                        <textarea value={customInstr} onChange={(e) => setCustomInstr(e.target.value)} placeholder="Instrucciones maestras..." className="w-full bg-gray-950 border border-white/10 rounded-xl p-2 text-[10px] md:text-xs text-gray-300 outline-none h-16 md:h-24 resize-none font-mono" />
                    )}
                    <div className="flex justify-end space-x-2 mt-3">
                        <button onClick={() => setShowRoleConfig(false)} className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-700 rounded-lg text-[9px] font-black uppercase">Cancelar</button>
                        <button onClick={handleSaveRoleSettings} className="px-5 py-1.5 md:px-6 md:py-2 bg-cyan-600 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">Aplicar</button>
                    </div>
                </div>
            )}

            {/* ÁREA DE MENSAJES OPTIMIZADA */}
            <div className={`flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 space-y-4 md:space-y-10 transition-all duration-500 ${showRoleConfig || editingMessageId ? 'blur-2xl grayscale opacity-10 pointer-events-none' : 'opacity-100'}`}>
                {messages.length === 0 && !showBookmarksOnly && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-20">
                        <FeatherIcon className="w-12 h-12 md:w-16 md:h-16 mb-4 text-gray-700"/>
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Asistente de Escena</p>
                    </div>
                )}

                {showBookmarksOnly && messages.filter(m => m.bookmark || (m.bookmarkedParagraphs && m.bookmarkedParagraphs.length > 0)).length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-yellow-500 opacity-20">
                        <StarIcon className="w-12 h-12 md:w-16 md:h-16 mb-4 text-yellow-700"/>
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Sin Marcadores</p>
                    </div>
                )}
                
                {useMemo(() => messages.filter(msg => !showBookmarksOnly || msg.bookmark || (msg.bookmarkedParagraphs && msg.bookmarkedParagraphs.length > 0)).map((msg, index) => {
                    const isSelected = selectedIds.has(msg.id);
                    const isSystemResult = msg.text.includes('[Sistema]');
                    const isManualSystem = msg.role === 'system';
                    const paragraphs = (msg.role === 'model' || msg.role === 'system') ? msg.text.split(/\n\n+/) : [msg.text];

                    return (
                        <div key={`${msg.id}-${index}`} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : isManualSystem ? 'justify-center' : 'justify-start'}`}>
                            <div className={`group relative flex flex-col transition-all duration-300 ${msg.role === 'user' ? 'items-end max-w-[95%] md:max-w-[85%]' : isManualSystem ? 'items-center w-full' : 'items-start w-full'} ${isSelectionMode ? 'cursor-pointer hover:translate-x-1' : ''}`} onClick={() => isSelectionMode && toggleSelection(msg.id)}>
                                {isSelectionMode && (
                                    <div className={`absolute -left-6 md:-left-10 top-1/2 -translate-y-1/2 z-30 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 md:border-4 flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-gray-800 border-gray-700 text-transparent'}`}>
                                        <CheckIcon className="w-3.5 h-3.5 md:w-5 md:h-5 p-0.5" />
                                    </div>
                                )}
                                
                                <div className={`
                                    rounded-xl md:rounded-2xl px-3 py-3 md:px-6 md:py-5 text-sm md:text-xl leading-[1.6] md:leading-[1.8] transition-all border relative
                                    ${isSelectionMode && isSelected ? 'ring-2 md:ring-4 ring-cyan-500/30 border-cyan-500/50 bg-gray-800/80 shadow-2xl' : 
                                      isSelectionMode ? 'opacity-40 grayscale border-transparent' : 
                                      msg.role === 'user' ? 'bg-cyan-900/40 text-cyan-50 border-cyan-500/10 rounded-br-none' : 
                                      isManualSystem ? 'bg-gray-950/40 text-cyan-400 border-dashed border-cyan-500/20 w-full max-w-[98%] font-mono' : 
                                      isSystemResult ? 'bg-purple-900/10 text-purple-200 border-purple-500/20 w-full font-sans' : 
                                      'bg-gray-800/20 text-gray-100 rounded-bl-none border-white/5 backdrop-blur-sm w-full'}
                                `}>
                                    <div className={`font-black text-[7px] md:text-[9px] opacity-30 mb-2 md:mb-3 uppercase tracking-[0.2em] md:tracking-[0.4em] flex justify-between items-center ${isManualSystem ? 'text-cyan-500' : isSystemResult ? 'text-purple-400' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <span>{msg.role === 'user' ? 'AUTOR' : isManualSystem ? 'INYECCIÓN' : isSystemResult ? 'SISTEMA' : 'INTELIGENCIA'}</span>
                                            {msg.bookmark && <StarIcon className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />}
                                        </div>
                                        {!isSelectionMode && (
                                            <div className="flex items-center gap-1.5 md:gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                {onToggleBookmark && (
                                                    <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(msg.id); }} className={`p-1 ${msg.bookmark ? 'text-yellow-400 hover:text-yellow-300' : 'hover:text-yellow-400'}`}>
                                                        <StarIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${msg.bookmark ? 'fill-yellow-400' : ''}`} />
                                                    </button>
                                                )}
                                                {onSplitChat && (
                                                    <button onClick={(e) => { e.stopPropagation(); onSplitChat(msg.id); }} className="p-1 hover:text-purple-400" title="Dividir chat desde aquí">
                                                        <SplitIcon className="w-3.5 h-3.5 md:w-4 md:h-4"/>
                                                    </button>
                                                )}
                                                {onAddToEvolution && (
                                                    <button onClick={(e) => { e.stopPropagation(); setAddingEvolutionText(msg.text); setSelectedEvolutionCharId(focalCharacterIds[0] || (allCharacters[0] ? allCharacters[0].id : '')); }} className="p-1 hover:text-green-400" title="Agregar a Evolución / Expediente">
                                                        <TrendingUpIcon className="w-3.5 h-3.5 md:w-4 md:h-4"/>
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handleCopy(msg.text, msg.id); }} className="p-1 hover:text-cyan-400">{copiedMessageId === msg.id ? <CheckIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400"/> : <CopyIcon className="w-3.5 h-3.5 md:w-4 md:h-4"/>}</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleStartFullEdit(msg); }} className="p-1 hover:text-white"><FileTextIcon className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                                                {onDeleteMessage && <button onClick={(e) => handleSingleDelete(e, msg.id)} className="p-1 hover:text-red-400"><TrashIcon className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4 md:space-y-6 w-full">
                                        {paragraphs.map((pText, pIndex) => {
                                            const isEditingThisBlock = editingBlockKey === `${msg.id}-${pIndex}`;
                                            const isBookmarked = msg.bookmarkedParagraphs?.includes(pIndex);
                                            
                                            if (showBookmarksOnly && !isBookmarked) return null;

                                            // Extract character dialogue for visual novel style "game" rendering
                                            let charAvatarMatch = null;
                                            if (msg.role === 'model' || msg.role === 'system' || msg.role === 'user') {
                                                const match = pText.match(/^(?:\*\*)?([A-Za-zÀ-ÿ0-9 _\-./(),'|]+)(?:\*\*)?:\s*(.*)/s);
                                                if (match) {
                                                    const namePart = match[1].trim();
                                                    const contentPart = match[2].trim();
                                                    
                                                    let char = null;
                                                    const cleanNamePart = namePart.toLowerCase();

                                                    // 1. Exact match on name
                                                    char = allCharacters.find(c => c.name.toLowerCase() === cleanNamePart);
                                                    
                                                    // 2. Exact match on alias
                                                    if (!char) {
                                                        char = allCharacters.find(c => c.aliases && c.aliases.some(a => {
                                                            const parts = a.split(/[,/;|]+/).map(p => p.trim().toLowerCase());
                                                            return parts.includes(cleanNamePart) || a.toLowerCase() === cleanNamePart;
                                                        }));
                                                    }

                                                    // 3. Substring match (longest names first)
                                                    if (!char) {
                                                        const sorted = [...allCharacters].sort((a,b) => b.name.length - a.name.length);
                                                        char = sorted.find(c => 
                                                            cleanNamePart.includes(c.name.toLowerCase()) || 
                                                            c.name.toLowerCase().includes(cleanNamePart) ||
                                                            (c.aliases && c.aliases.some(a => a.toLowerCase().includes(cleanNamePart)))
                                                        );
                                                    }

                                                    if (char) {
                                                        let expressionImg = char.avatar;
                                                        let cleanText = contentPart;
                                                        
                                                        const exprMatch = contentPart.match(/^(?:—|-|–|\s)*[\(（\[]([A-Za-zÀ-ÿ0-9 _\-]+)[\)）\]]\s*(.*)/s);
                                                        
                                                        if (exprMatch) {
                                                            const exprName = exprMatch[1].trim().toLowerCase();
                                                            const restOfText = exprMatch[2].trim();
                                                            
                                                            const foundExpr = char.expressions?.find(e => e.name.toLowerCase() === exprName);
                                                            if (foundExpr) {
                                                                expressionImg = foundExpr.imageUrl;
                                                                
                                                                const trimmedContent = contentPart.trim();
                                                                const dashMatch = trimmedContent.match(/^((?:—|-|–|\s)+)/);
                                                                cleanText = dashMatch ? `${dashMatch[1].trim()} ${restOfText}` : `— ${restOfText}`;
                                                            }
                                                        }

                                                        charAvatarMatch = { character: char, text: cleanText, nameMatched: namePart, expressionImg: expressionImg };
                                                    }
                                                }
                                            }

                                            return (
                                                <div key={pIndex} className={`relative group/block min-h-[1em] flex flex-col ${isBookmarked ? 'border-l-2 border-yellow-500 pl-3 md:pl-4' : ''}`}>
                                                    {isEditingThisBlock ? (
                                                        <div className="bg-black/95 rounded-xl p-3 md:p-6 border-2 border-cyan-500 shadow-2xl animate-fade-in-fast relative z-50">
                                                            <textarea className="w-full bg-transparent text-gray-100 outline-none resize-y font-sans p-1 min-h-[150px] md:min-h-[200px] text-base md:text-xl leading-relaxed" value={blockEditText} onChange={(e) => setBlockEditText(e.target.value)} autoFocus />
                                                            <div className="flex justify-end space-x-2 mt-4 md:mt-6">
                                                                <button onClick={handleCancelBlockEdit} className="px-3 py-1.5 bg-gray-800 text-[8px] md:text-[10px] font-black uppercase rounded-lg">Cancelar</button>
                                                                <button onClick={() => handleSaveBlockEdit(msg.id, pIndex)} className="px-4 py-1.5 bg-cyan-600 text-[8px] md:text-[10px] font-black text-white uppercase rounded-lg">Confirmar</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {!isSelectionMode && (msg.role === 'model' || msg.role === 'system') && !editingBlockKey && !charAvatarMatch && (
                                                                <div className="flex flex-row space-x-2 mb-2 opacity-100 lg:opacity-0 lg:group-hover/block:opacity-100 transition-all pointer-events-auto bg-gray-900/60 p-1 rounded-lg backdrop-blur-sm w-fit z-10">
                                                                    {onToggleBookmark && (
                                                                        <button onClick={() => onToggleBookmark(msg.id, pIndex)} className={`p-2 md:p-2 bg-gray-800 rounded-lg shadow-lg ${isBookmarked ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700' : 'text-gray-400 hover:text-yellow-400 hover:bg-gray-700'}`}>
                                                                            <StarIcon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isBookmarked ? 'fill-yellow-400' : ''}`}/>
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => handleStartBlockEdit(msg.id, pIndex, pText)} className="p-2 md:p-2 bg-gray-800 hover:bg-cyan-600 text-gray-400 hover:text-white rounded-lg shadow-lg">
                                                                        <EditIcon className="w-3 h-3 md:w-3.5 md:h-3.5"/>
                                                                    </button>
                                                                    <button onClick={() => handleQuickDeleteBlock(msg.id, pIndex)} className="p-2 md:p-2 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg shadow-lg">
                                                                        <TrashIcon className="w-3 h-3 md:w-3.5 md:h-3.5"/>
                                                                    </button>
                                                                </div>
                                                            )}
                                                            
                                                            {charAvatarMatch ? (
                                                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-start bg-gray-900/40 p-4 sm:p-5 rounded-2xl border border-white/5 mt-1 mb-3 relative overflow-hidden group/dialogue shadow-lg">
                                                                    {/* Decorative gradient based on character color */}
                                                                    <div className={`absolute -left-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${charAvatarMatch.character.color || 'bg-cyan-500'}`}></div>
                                                                    
                                                                    {/* Portrait */}
                                                                    <div className={`shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 bg-black shadow-2xl relative z-10 ${
                                                                        charAvatarMatch.character.color ? 
                                                                        charAvatarMatch.character.color.replace('bg-', 'border-').replace('text-', '') : 'border-cyan-500/30'
                                                                    }`}>
                                                                        {charAvatarMatch.expressionImg ? (
                                                                            <img src={charAvatarMatch.expressionImg} alt={charAvatarMatch.nameMatched} className="w-full h-full object-cover transition-transform duration-500 group-hover/dialogue:scale-105" />
                                                                        ) : (
                                                                            <div className={`w-full h-full flex items-center justify-center text-4xl sm:text-5xl font-black ${charAvatarMatch.character.color || 'bg-gray-800 text-white'}`}>
                                                                                {charAvatarMatch.nameMatched.charAt(0)}
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-1 sm:p-1.5 translate-y-1 group-hover/dialogue:translate-y-0 transition-transform">
                                                                            <span className="text-[9px] sm:text-[10px] font-black text-white px-1 uppercase tracking-[0.2em] block text-center truncate">{charAvatarMatch.nameMatched}</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Dialogue Content */}
                                                                    <div className="flex-grow z-10 w-full pt-1">
                                                                        <div className={`font-black text-xs sm:text-sm uppercase tracking-widest mb-2 flex flex-wrap items-center gap-2 ${charAvatarMatch.character.color ? charAvatarMatch.character.color.replace('bg-', 'text-') : 'text-cyan-400'}`}>
                                                                            <span>{charAvatarMatch.nameMatched}</span>
                                                                            
                                                                            {!isSelectionMode && (msg.role === 'model' || msg.role === 'system') && !editingBlockKey && (
                                                                                <div className="flex flex-row space-x-1 opacity-100 lg:opacity-0 lg:group-hover/dialogue:opacity-100 transition-all pointer-events-auto shrink-0 bg-gray-900/60 p-0.5 rounded-lg">
                                                                                    {onToggleBookmark && (
                                                                                        <button onClick={() => onToggleBookmark(msg.id, pIndex)} className={`p-1 md:p-1.5 rounded-md hover:bg-gray-800 ${isBookmarked ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'}`}>
                                                                                            <StarIcon className={`w-3 h-3 md:w-3.5 md:h-3.5 text-current ${isBookmarked ? 'fill-yellow-400' : ''}`}/>
                                                                                        </button>
                                                                                    )}
                                                                                    <button onClick={() => handleStartBlockEdit(msg.id, pIndex, pText)} className="p-1 md:p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
                                                                                        <EditIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-current"/>
                                                                                    </button>
                                                                                    <button onClick={() => handleQuickDeleteBlock(msg.id, pIndex)} className="p-1 md:p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-md">
                                                                                        <TrashIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-current"/>
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                            
                                                                            <div className={`h-[1px] flex-grow opacity-20 hidden sm:block ${charAvatarMatch.character.color || 'bg-cyan-400'}`}></div>
                                                                        </div>
                                                                        <RichTextRenderer text={charAvatarMatch.text} className="whitespace-pre-wrap font-serif text-sm md:text-xl text-gray-200 leading-relaxed" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <RichTextRenderer text={pText} className="whitespace-pre-wrap font-serif text-sm md:text-xl" />
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }), [
                    messages, showBookmarksOnly, selectedIds, isSelectionMode,
                    editingBlockKey, blockEditText, copiedMessageId,
                    allCharacters, focalCharacterIds, onToggleBookmark, 
                    onAddToEvolution, onDeleteMessage, onUpdateMessage
                ])}

                {streamingText && (
                    <div className="flex justify-start">
                        <div className="max-w-[100%] md:max-w-[85%] rounded-3xl p-3 md:p-6 bg-gray-800/80 text-gray-100 border border-t-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                            <div className="flex justify-between items-start mb-2 md:mb-3">
                                <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-green-400 flex items-center">
                                    <SparkleIcon className="w-3.5 h-3.5 md:w-5 md:h-5 mr-1 md:mr-2" /> AI (Escribiendo...)
                                </span>
                            </div>
                            <div className="space-y-2 md:space-y-4 font-serif text-sm md:text-xl">
                                <RichTextRenderer text={streamingText} className="whitespace-pre-wrap font-serif text-sm md:text-xl" />
                            </div>
                        </div>
                    </div>
                )}
                
                {isChatting && !streamingText && (
                    <div className="flex justify-start">
                        <div className="px-4 py-2 bg-gray-800/40 rounded-full flex items-center space-x-1.5 border border-white/5">
                            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce"></div>
                            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce delay-150"></div>
                            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce delay-300"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4 md:h-10" />
            </div>

            {/* BARRA INFERIOR RESPONSIVA */}
            <div className={`flex-shrink-0 p-2 md:p-3 border-t border-white/5 bg-gray-950/80 backdrop-blur-3xl transition-all duration-500 ${isSelectionMode || editingMessageId || editingBlockKey ? 'opacity-10 pointer-events-none blur-md' : 'opacity-100'}`}>
                <div className="max-w-[95vw] md:max-w-[90vw] mx-auto w-full">
                    {focalActors.length > 0 && !isSystemMode && (
                        <div className="flex items-center space-x-2 mb-2 px-2 animate-fade-in-fast overflow-x-auto scrollbar-hide">
                            <div className="flex items-center space-x-1.5 py-1 px-2 bg-cyan-900/30 border border-cyan-500/30 rounded-full shrink-0">
                                <TargetIcon className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                                <div className="flex -space-x-1">
                                    {focalActors.map((actor, index) => (
                                        <div key={`${actor.id}-${index}`} className={`w-4 h-4 rounded-full border border-cyan-500/50 flex items-center justify-center text-[7px] font-black shadow-lg ${actor.color || 'bg-gray-700 text-white'}`} title={actor.name}>
                                            {actor.name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-1.5 px-1.5">
                        <div className="flex items-center space-x-2">
                            {onTransferChat && messages.length > 0 && !isSystemMode && (
                                <button onClick={onTransferChat} className="p-1 rounded-lg text-gray-500 hover:text-cyan-400" title="Eyectar Chat a Nodo (Borrar Interfaz)">
                                    <FileTextIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button onClick={handleInjectData} className="p-1 rounded-lg text-gray-500 hover:text-cyan-400"><ClipboardPasteIcon className="w-3.5 h-3.5" /></button>
                        </div>
                        <span className="text-[7px] font-black text-gray-700 uppercase tracking-widest">{safeRole} ACTIVE</span>
                    </div>

                    {allCharacters && allCharacters.length > 0 && !isSystemMode && (
                        <div className="flex overflow-x-auto space-x-2 mb-2 pb-1 scrollbar-hide">
                            {allCharacters.map(c => (
                                <button 
                                    key={`quick-insert-${c.id}`}
                                    onClick={() => {
                                        const prefix = input.length > 0 && !input.endsWith('\n') ? '\n' : '';
                                        setInput(prev => prev + prefix + `${c.name}: —`);
                                        setTimeout(() => textareaRef.current?.focus(), 10);
                                    }}
                                    className="shrink-0 flex items-center space-x-1.5 px-2 py-1.5 rounded-lg bg-gray-900/80 border border-white/5 hover:bg-gray-800 transition-colors shadow-sm"
                                    title={`Insertar diálogo para ${c.name}`}
                                >
                                    {c.avatar ? (
                                        <img src={c.avatar} alt={c.name} className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${c.color || 'bg-gray-700 text-white'}`}>
                                            {c.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <div className="flex-grow relative">
                            <textarea 
                                ref={textareaRef} 
                                value={input} 
                                onChange={handleInputChange} 
                                onKeyDown={handleKeyDown} 
                                placeholder={isSystemMode ? "Datos RAW..." : "Mensaje..."} 
                                className={`w-full bg-gray-900 border rounded-xl p-2.5 md:p-3 pr-10 text-sm md:text-base text-white outline-none resize-none transition-all ${isSystemMode ? 'border-purple-500/30' : 'border-white/10'}`} 
                                rows={1} 
                                disabled={isChatting || isGenerating} 
                            />
                        </div>
                        <div className="flex items-center">
                             {(isChatting || isGenerating) ? (
                                <button onClick={onStop} className="p-3 text-white rounded-xl bg-red-600 shadow-lg"><SquareIcon className="w-4 h-4 fill-white" /></button>
                            ) : (
                                <button onClick={handleSubmit} disabled={!input.trim()} className={`p-3 text-white rounded-xl shadow-xl ${isSystemMode ? 'bg-purple-600' : 'bg-cyan-600'}`}>
                                    <SendIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* EVOLUTION POPOVER */}
            {addingEvolutionText !== null && (
                <div className="absolute inset-0 z-[110] bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-fast">
                    <div className="bg-gray-900 border border-green-500/30 w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col">
                        <div className="flex items-center space-x-2 mb-4 text-green-400">
                            <TrendingUpIcon className="w-5 h-5" />
                            <h3 className="font-black tracking-widest uppercase text-sm">Transferir a Expediente</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 line-clamp-3 italic opacity-80 border-l-2 border-green-500/30 pl-3">"{addingEvolutionText}"</p>
                        
                        <div className="space-y-4 flex-grow">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Personaje</label>
                                <select 
                                    value={selectedEvolutionCharId} 
                                    onChange={(e) => setSelectedEvolutionCharId(e.target.value)}
                                    className="w-full bg-gray-950 border border-white/10 rounded-xl p-2 text-sm text-gray-200 outline-none focus:border-green-500"
                                >
                                    <option value="" disabled>Selecciona un personaje</option>
                                    {allCharacters.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Categoría de Evolución</label>
                                <select 
                                    value={selectedEvolutionCategory} 
                                    onChange={(e) => setSelectedEvolutionCategory(e.target.value)}
                                    className="w-full bg-gray-950 border border-white/10 rounded-xl p-2 text-sm text-gray-200 outline-none focus:border-green-500"
                                >
                                    <option value="Psychological">Psicológica (Diario/Pensamientos)</option>
                                    <option value="Physical">Física (Hitos/Heridas)</option>
                                    <option value="Social">Social (Relaciones/Alianzas)</option>
                                    <option value="Magical">Mágica (Poder/Corrupción)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <button onClick={() => setAddingEvolutionText(null)} className="px-4 py-2 bg-gray-800 text-xs font-black rounded-xl uppercase text-gray-400 hover:text-white">Cancelar</button>
                            <button 
                                onClick={() => {
                                    if (onAddToEvolution && selectedEvolutionCharId) {
                                        onAddToEvolution(selectedEvolutionCharId, selectedEvolutionCategory, addingEvolutionText);
                                        setAddingEvolutionText(null);
                                    }
                                }} 
                                disabled={!selectedEvolutionCharId}
                                className="px-5 py-2 bg-green-600 hover:bg-green-500 text-xs font-black text-white rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <span>Transferir</span>
                                <TrendingUpIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL EDIT OVERLAY */}
            {editingMessageId && (
                <div className="absolute inset-0 z-[100] bg-gray-950 flex flex-col animate-fade-in-fast">
                    <div className="flex justify-between items-center p-3 border-b border-white/5 bg-gray-900">
                        <span className="text-[9px] font-black uppercase text-orange-400">Edición Directa</span>
                        <div className="flex space-x-2">
                            <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 bg-gray-800 text-[8px] font-black rounded-lg uppercase">Salir</button>
                            <button onClick={() => handleSaveFullEdit(editingMessageId)} className="px-4 py-1.5 bg-green-600 text-[8px] font-black text-white rounded-lg uppercase">Guardar</button>
                        </div>
                    </div>
                    <div className="flex-grow p-4 md:p-20 overflow-y-auto">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full h-full bg-transparent text-gray-100 text-base md:text-2xl font-serif leading-relaxed outline-none resize-none" autoFocus spellCheck={false} />
                    </div>
                </div>
            )}
        </div>
    );
};
