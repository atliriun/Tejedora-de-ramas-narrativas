
import React, { useMemo, useState } from 'react';
import { Character, Scenario, TagGroup } from '../../types';
import { CalendarIcon, UsersIcon, GlobeAltIcon, TagIcon, EyeIcon, XIcon, ChevronDownIcon, CogIcon, EditIcon, TargetIcon, BanIcon, ActivityIcon } from '../icons';

interface DirectorContextEditorProps {
    fantasyDate: string;
    setFantasyDate: (date: string) => void;
    characterIds: string[];
    setCharacterIds: (list: string[]) => void;
    focalCharacterIds?: string[]; 
    setFocalCharacterIds?: React.Dispatch<React.SetStateAction<string[]>>; 
    strictFocus?: boolean; 
    setStrictFocus?: (val: boolean) => void; 
    scenarioIds: string[];
    setScenarioIds: (list: string[]) => void;
    tagIds: string[];
    setTagIds: (list: string[]) => void;
    povCharId: string | undefined;
    setPovCharId: (id: string | undefined) => void;
    allCharacters: Character[];
    allScenarios: Scenario[];
    allTagGroups: TagGroup[];
    onEditCharacter?: (id: string) => void;
}

export const DirectorContextEditor: React.FC<DirectorContextEditorProps> = ({
    fantasyDate, setFantasyDate,
    characterIds, setCharacterIds,
    focalCharacterIds = [], setFocalCharacterIds,
    strictFocus = false, setStrictFocus,
    scenarioIds, setScenarioIds,
    tagIds, setTagIds,
    povCharId, setPovCharId,
    allCharacters, allScenarios, allTagGroups,
    onEditCharacter
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const [localDate, setLocalDate] = useState(fantasyDate);

    React.useEffect(() => {
        setLocalDate(fantasyDate);
    }, [fantasyDate]);

    const handleAddId = (id: string, list: string[], updateFn: (l: string[]) => void) => {
        if (!list.includes(id)) updateFn([...list, id]);
    };

    const handleRemoveId = (id: string, list: string[], updateFn: (l: string[]) => void) => {
        updateFn(list.filter(item => item !== id));
        if (setFocalCharacterIds) {
            setFocalCharacterIds(prev => prev.filter(item => item !== id));
        }
    };

    const toggleFocalId = (id: string) => {
        if (focalCharacterIds.includes(id)) {
            setFocalCharacterIds?.(focalCharacterIds.filter(item => item !== id));
        } else {
            setFocalCharacterIds?.([...focalCharacterIds, id]);
        }
    };

    const selectedCharacters = useMemo(() => characterIds.map(id => allCharacters.find(c => c.id === id)).filter(Boolean) as Character[], [characterIds, allCharacters]);
    const availableCharacters = useMemo(() => allCharacters.filter(c => !characterIds.includes(c.id)), [characterIds, allCharacters]);
    
    const selectedScenarios = useMemo(() => scenarioIds.map(id => allScenarios.find(s => s.id === id)).filter(Boolean) as Scenario[], [scenarioIds, allScenarios]);
    const availableScenarios = useMemo(() => allScenarios.filter(s => !scenarioIds.includes(s.id)), [scenarioIds, allScenarios]);

    const allTagsFlat = useMemo(() => allTagGroups.flatMap(g => g.tags.map(t => ({...t, groupName: g.name}))), [allTagGroups]);
    const selectedTags = useMemo(() => tagIds.map(id => allTagsFlat.find(t => t.id === id)).filter(Boolean), [tagIds, allTagsFlat]);
    const availableTags = useMemo(() => allTagsFlat.filter(t => !tagIds.includes(t.id)), [tagIds, allTagsFlat]);

    return (
        <div className={`
            relative flex flex-col bg-gray-900/50 border-gray-800 transition-all duration-500 ease-in-out flex-shrink-0 z-[65]
            ${isCollapsed ? 'lg:w-14 w-full h-[48px] lg:h-full border-b lg:border-b-0 lg:border-r' : 'lg:w-1/4 w-full h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r shadow-2xl'}
        `}>
            
            {/* MOBILE TRIGGER TAB */}
            {isCollapsed && (
                <div 
                    onClick={() => setIsCollapsed(false)}
                    className="lg:hidden absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-28 h-5 bg-cyan-600 rounded-b-xl flex items-center justify-center cursor-pointer shadow-lg border-x border-b border-cyan-400/30 z-20 active:scale-95 transition-transform"
                >
                    <div className="flex items-center space-x-1">
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">AJUSTES ESCENA</span>
                        <ChevronDownIcon className="w-2.5 h-2.5 text-cyan-200" />
                    </div>
                </div>
            )}

            {/* HEADER AREA */}
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`
                    flex items-center justify-between px-4 py-2 cursor-pointer relative
                    ${isCollapsed ? 'lg:flex-col lg:h-full lg:justify-start lg:pt-4 bg-gray-950/40' : 'border-b border-gray-800 bg-gray-900/95 backdrop-blur-md'}
                `}
            >
                <div className={`flex items-center ${isCollapsed ? 'lg:hidden' : ''}`}>
                    <div className={`p-1.5 rounded-lg mr-2 border border-white/5 transition-colors ${isCollapsed ? 'bg-cyan-900/30 text-cyan-400' : 'bg-gray-800 text-gray-400'}`}>
                        <CogIcon className="w-3.5 h-3.5"/>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-100 uppercase tracking-widest">Contexto</span>
                        {isCollapsed && (
                            <div className="flex items-center space-x-2 text-[8px] text-gray-500 font-bold uppercase">
                                <span>{selectedCharacters.length} Actores</span>
                                <span className="opacity-30">•</span>
                                <span>{selectedScenarios.length} Loc</span>
                            </div>
                        )}
                    </div>
                </div>

                {isCollapsed && (
                    <div className="hidden lg:block lg:rotate-180 lg:[writing-mode:vertical-rl] text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] cursor-pointer select-none hover:text-cyan-400 transition-colors mt-4" onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}>
                        SETUP
                    </div>
                )}

                <button 
                    className={`p-1 rounded-lg transition-all ${isCollapsed ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-500 ${
                        isCollapsed 
                            ? 'rotate-0 lg:-rotate-90' 
                            : 'rotate-180 lg:rotate-90' 
                    }`} />
                </button>
            </div>

            {!isCollapsed && (
                <div className="flex-grow overflow-y-auto p-4 md:p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 animate-fade-in-fast bg-gray-950/40">
                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center"><CalendarIcon className="w-3 h-3 mr-2 text-cyan-500"/> Tiempo</label>
                        <input 
                            type="text" 
                            value={localDate} 
                            onChange={(e) => setLocalDate(e.target.value)}
                            onBlur={() => setFantasyDate(localDate)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setFantasyDate(localDate); }}
                            placeholder="Día, Hora..."
                            className="w-full bg-gray-900 border border-white/5 rounded-xl p-2.5 text-xs text-gray-200 focus:border-cyan-500/50 outline-none transition-all"
                        />
                    </div>

                    {/* Characters */}
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center"><UsersIcon className="w-3 h-3 mr-2 text-cyan-500"/> Elenco</label>
                            <div className="flex items-center space-x-1.5">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setStrictFocus?.(!strictFocus); }}
                                    className={`p-1.5 rounded-lg border transition-all ${strictFocus ? 'bg-amber-600 border-amber-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                                    title="Modo Aislamiento"
                                >
                                    <BanIcon className="w-3 h-3" />
                                </button>
                                <select 
                                    onClick={e => e.stopPropagation()}
                                    onChange={(e) => { if(e.target.value) handleAddId(e.target.value, characterIds, setCharacterIds); e.target.value = ''; }} 
                                    className="bg-gray-800 text-[9px] font-bold text-gray-300 border border-gray-700 rounded-lg p-1 outline-none max-w-[90px]"
                                >
                                    <option value="">+ ADD</option>
                                    {availableCharacters.map(c => <option key={c.id} value={c.id} className={c.color || 'text-white'}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                            {selectedCharacters.map(c => {
                                const isFocal = focalCharacterIds.includes(c.id);
                                const isPov = povCharId === c.id;
                                return (
                                    <div key={c.id} className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs border transition-all ${isFocal ? 'bg-cyan-900/40 border-cyan-400' : (isPov ? 'bg-cyan-900/20 border-cyan-500/40' : 'bg-gray-800/40 border-white/5')}`}>
                                        <div className="flex items-center space-x-2 overflow-hidden flex-grow min-w-0">
                                            <button onClick={(e) => { e.stopPropagation(); toggleFocalId(c.id); }} className={`shrink-0 ${isFocal ? 'text-cyan-400' : 'text-gray-600'}`}>
                                                <TargetIcon className={`w-3.5 h-3.5 ${isFocal ? 'animate-pulse' : ''}`} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setPovCharId(isPov ? undefined : c.id); }} className="shrink-0">
                                                <EyeIcon className={`w-3.5 h-3.5 ${isPov ? 'text-cyan-400' : 'text-gray-600'}`} />
                                            </button>
                                            <span className={`truncate text-[11px] ${isFocal ? 'font-black text-white' : 'font-medium'} ${c.color || 'text-gray-200'}`}>
                                                {c.name}
                                            </span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveId(c.id, characterIds, setCharacterIds); }} className="text-gray-600 hover:text-red-400 ml-1">
                                            <XIcon className="w-3 h-3"/>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Scenarios */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center"><GlobeAltIcon className="w-3 h-3 mr-2 text-cyan-500"/> Escenarios</label>
                            <select 
                                onClick={e => e.stopPropagation()}
                                onChange={(e) => { if(e.target.value) handleAddId(e.target.value, scenarioIds, setScenarioIds); e.target.value = ''; }} 
                                className="bg-gray-800 text-[9px] font-bold text-gray-300 border border-gray-700 rounded-lg p-1 outline-none max-w-[90px]"
                            >
                                <option value="">+ ADD</option>
                                {availableScenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedScenarios.map(s => (
                                <div key={s.id} className="flex items-center px-2 py-1 rounded-lg text-[10px] bg-gray-950/60 border border-white/5 text-gray-300">
                                    <span className="truncate max-w-[80px] mr-1.5">{s.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveId(s.id, scenarioIds, setScenarioIds); }} className="text-gray-500 hover:text-red-400"><XIcon className="w-2.5 h-2.5"/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center"><TagIcon className="w-3 h-3 mr-2 text-cyan-500"/> Flags Mundo</label>
                            <select 
                                onClick={e => e.stopPropagation()}
                                onChange={(e) => { if(e.target.value) handleAddId(e.target.value, tagIds, setTagIds); e.target.value = ''; }} 
                                className="bg-gray-800 text-[9px] font-bold text-gray-300 border border-gray-700 rounded-lg p-1 outline-none max-w-[90px]"
                            >
                                <option value="">+ ADD</option>
                                {availableTags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTags.map(t => (
                                <div key={t.id} className="flex items-center px-2 py-1 rounded-full text-[9px] bg-gray-800/60 border border-dashed border-gray-600 text-gray-400 uppercase">
                                    <span className="mr-1.5 font-black">{t.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveId(t.id, tagIds, setTagIds); }} className="text-gray-600 hover:text-red-400"><XIcon className="w-2.5 h-2.5"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
