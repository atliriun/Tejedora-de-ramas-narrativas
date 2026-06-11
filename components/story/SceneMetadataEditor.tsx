
import React, { useMemo, useState, useEffect } from 'react';
import type { HierarchyPointNode } from 'd3-hierarchy';
import type { StoryNodeData, Character, Scenario, TagGroup } from '../../types';
import { CalendarIcon, UndoIcon, TagIcon, XIcon, GlobeAltIcon, UsersIcon, SearchIcon, PlusIcon } from '../icons';

export const SceneMetadataEditor: React.FC<{
    node: HierarchyPointNode<StoryNodeData>;
    allCharacters: Character[];
    allScenarios: Scenario[];
    allTagGroups: TagGroup[];
    onUpdateData: (data: Partial<StoryNodeData>) => void;
}> = ({ node, allCharacters, allScenarios, allTagGroups, onUpdateData }) => {
    
    // State for searchable dropdowns
    const [charSearch, setCharSearch] = useState('');
    const [isCharDropdownOpen, setIsCharDropdownOpen] = useState(false);

    const getInheritedValue = (key: keyof StoryNodeData): string[] => { let current = node.parent; while (current) { if (current.data[key] !== undefined) { return current.data[key] as string[]; } current = current.parent; } return []; };
    const ownCharIds = node.data.charactersInScene; const inheritedCharIds = useMemo(() => getInheritedValue('charactersInScene'), [node]); const effectiveCharIds = ownCharIds !== undefined ? ownCharIds : inheritedCharIds; const isCharsInherited = ownCharIds === undefined;
    const povCharId = node.data.pointOfViewCharacterId;
    const ownScenarioIds = node.data.scenariosInScene; const inheritedScenarioIds = useMemo(() => getInheritedValue('scenariosInScene'), [node]); const effectiveScenarioIds = ownScenarioIds !== undefined ? ownScenarioIds : inheritedScenarioIds; const isScenariosInherited = ownScenarioIds === undefined;
    const ownStatusTagIds = node.data.statusTagIds; const inheritedStatusTagIds = useMemo(() => getInheritedValue('statusTagIds'), [node]); const effectiveStatusTagIds = ownStatusTagIds !== undefined ? ownStatusTagIds : inheritedStatusTagIds; const isTagsInherited = ownStatusTagIds === undefined;
    const fantasyDate = node.data.fantasyDate || '';
    const sceneCharacters = effectiveCharIds.map(id => allCharacters.find(c => c.id === id)).filter(Boolean) as Character[]; 
    
    // Filter characters for dropdown based on search
    const availableCharactersToAdd = useMemo(() => {
        const available = allCharacters.filter(c => !effectiveCharIds.includes(c.id));
        if (!charSearch) return available;
        const lower = charSearch.toLowerCase();
        return available.filter(c => c.name.toLowerCase().includes(lower));
    }, [allCharacters, effectiveCharIds, charSearch]);

    const sceneScenarios = effectiveScenarioIds.map(id => allScenarios.find(s => s.id === id)).filter(Boolean) as Scenario[]; const availableScenariosToAdd = allScenarios.filter(s => !effectiveScenarioIds.includes(s.id));
    const { sceneTags, availableTagsByGroup } = useMemo(() => { const sceneTags: { group: TagGroup, tag: any }[] = []; const availableTagsByGroup: { group: TagGroup, tags: any[] }[] = []; allTagGroups.forEach(group => { const groupAvailableTags: any[] = []; group.tags.forEach(tag => { if (effectiveStatusTagIds.includes(tag.id)) { sceneTags.push({ group, tag }); } else { groupAvailableTags.push(tag); } }); if (groupAvailableTags.length > 0) { availableTagsByGroup.push({ group, tags: groupAvailableTags }); } }); return { sceneTags, availableTagsByGroup }; }, [allTagGroups, effectiveStatusTagIds]);
    const inheritedDate = useMemo(() => { let current = node.parent; while (current) { if (current.data.fantasyDate) { return current.data.fantasyDate; } current = current.parent; } return ''; }, [node]);
    
    const handleUpdate = (updates: Partial<StoryNodeData>) => onUpdateData(updates);

    const handleAddCharacter = (charId: string) => { 
        if (charId) { 
            handleUpdate({ charactersInScene: [...effectiveCharIds, charId] }); 
            setCharSearch(''); // Reset search after add
            setIsCharDropdownOpen(false); // Close dropdown
        } 
    };
    
    const handleRemoveCharacter = (charId: string) => { handleUpdate({ charactersInScene: effectiveCharIds.filter(id => id !== charId) }); };
    const handleResetCharacters = () => { handleUpdate({ charactersInScene: undefined }); };
    
    const handleAddScenario = (e: React.ChangeEvent<HTMLSelectElement>) => { const scenarioId = e.target.value; if (scenarioId) { handleUpdate({ scenariosInScene: [...effectiveScenarioIds, scenarioId] }); e.target.value = ""; } };
    const handleRemoveScenario = (scenarioId: string) => { handleUpdate({ scenariosInScene: effectiveScenarioIds.filter(id => id !== scenarioId) }); };
    const handleResetScenarios = () => { handleUpdate({ scenariosInScene: undefined }); };
    
    const handleAddStatusTag = (e: React.ChangeEvent<HTMLSelectElement>) => { const tagId = e.target.value; if (tagId) { handleUpdate({ statusTagIds: [...effectiveStatusTagIds, tagId] }); e.target.value = ""; } };
    const handleRemoveStatusTag = (tagId: string) => { handleUpdate({ statusTagIds: effectiveStatusTagIds.filter(id => id !== tagId) }); };
    const handleResetStatusTags = () => { handleUpdate({ statusTagIds: undefined }); };
    
    const [localFantasyDate, setLocalFantasyDate] = useState(node.data.fantasyDate || '');

    useEffect(() => {
        setLocalFantasyDate(node.data.fantasyDate || '');
    }, [node.data.fantasyDate]);

    const handleFantasyDateBlur = () => {
        if (localFantasyDate !== (node.data.fantasyDate || '')) {
            handleUpdate({ fantasyDate: localFantasyDate });
        }
    };

    const handlePovChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const charId = e.target.value; handleUpdate({ pointOfViewCharacterId: charId === 'narrator' ? undefined : charId }); };
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div className="text-xs text-gray-400 border-b border-gray-700/50 mb-2 pb-2" onMouseDown={stopPropagation}>
            <div className="flex items-center space-x-2 mb-1.5 relative group/date">
                <label className="font-semibold whitespace-nowrap pt-0.5 flex items-center space-x-1" title="Fecha/Hora de Fantasía"><CalendarIcon className="w-3 h-3" /><span>Fecha:</span></label>
                <input type="text" value={localFantasyDate} onChange={(e) => setLocalFantasyDate(e.target.value)} onBlur={handleFantasyDateBlur} placeholder={inheritedDate || "ej. Año 500, Era de la Luz"} className="bg-transparent text-gray-300 border-b border-gray-700/50 focus:border-cyan-500 outline-none text-xs w-full hover:text-white placeholder-gray-600" />
                {!localFantasyDate && inheritedDate && ( <span className="absolute right-0 top-0 h-full flex items-center pr-2 pointer-events-none"> <span className="text-[10px] text-gray-500 italic bg-gray-800/80 px-1 rounded">(Heredado)</span> </span> )}
            </div>
            
            <div className="flex items-start space-x-2 mb-1.5">
                <div className="flex items-center space-x-1"> <label className="font-semibold whitespace-nowrap pt-0.5 flex items-center space-x-1"><TagIcon className="w-3 h-3" /><span>Etiquetas:</span></label> {isTagsInherited ? ( <span className="text-[9px] bg-gray-700 text-gray-400 px-1 rounded cursor-help" title="Heredado del nodo padre">(Heredado)</span> ) : ( <button onClick={handleResetStatusTags} className="text-gray-500 hover:text-cyan-400" title="Resetear a herencia"><UndoIcon /></button> )} </div>
                <div className="flex flex-wrap items-center gap-1 flex-grow"> {sceneTags.map(({ group, tag }, index) => ( <div key={`${tag.id}-${index}`} className={`flex items-center text-gray-200 px-1.5 py-0.5 rounded-full ${isTagsInherited ? 'bg-gray-700/50 border border-gray-600 border-dashed' : 'bg-gray-700'}`} title={`${group.name}: ${tag.description || 'Sin descripción'}`}> <span>{tag.name}</span> <button onClick={() => handleRemoveStatusTag(tag.id)} className="ml-1 -mr-0.5 p-0.5 rounded-full hover:bg-red-500/50"> <XIcon className="h-2.5 w-2.5" /> </button> </div> ))} {availableTagsByGroup.length > 0 && ( <select onChange={handleAddStatusTag} value="" className="bg-transparent text-gray-400 border-none outline-none focus:ring-0 text-xs p-0 appearance-none cursor-pointer hover:text-white"> <option value="" disabled>+ Añadir</option> {availableTagsByGroup.map(({ group, tags }) => ( <optgroup key={group.id} label={group.name} className="bg-gray-800"> {tags.map(tag => ( <option key={tag.id} value={tag.id} className="bg-gray-800 text-white">{tag.name}</option> ))} </optgroup> ))} </select> )} </div>
            </div>
            
            <div className="flex items-start space-x-2 mb-1.5">
                <div className="flex items-center space-x-1"> <label className="font-semibold whitespace-nowrap pt-0.5 flex items-center space-x-1"><GlobeAltIcon className="w-3 h-3" /><span>Escenarios:</span></label> {isScenariosInherited ? ( <span className="text-[9px] bg-gray-700 text-gray-400 px-1 rounded cursor-help" title="Heredado del nodo padre">(Heredado)</span> ) : ( <button onClick={handleResetScenarios} className="text-gray-500 hover:text-cyan-400" title="Resetear a herencia"><UndoIcon /></button> )} </div>
                <div className="flex flex-wrap items-center gap-1 flex-grow"> {sceneScenarios.map((scenario, index) => ( <div key={`${scenario.id}-${index}`} className={`flex items-center text-gray-200 px-1.5 py-0.5 rounded-full ${isScenariosInherited ? 'bg-gray-700/50 border border-gray-600 border-dashed' : 'bg-gray-700'}`}> <span>{scenario.name}</span> <button onClick={() => handleRemoveScenario(scenario.id)} className="ml-1 -mr-0.5 p-0.5 rounded-full hover:bg-red-500/50"> <XIcon className="h-2.5 w-2.5" /> </button> </div> ))} {availableScenariosToAdd.length > 0 && ( <select onChange={handleAddScenario} value="" className="bg-transparent text-gray-400 border-none outline-none focus:ring-0 text-xs p-0 appearance-none cursor-pointer hover:text-white"> <option value="" disabled>+ Añadir</option> {availableScenariosToAdd.map(scenario => ( <option key={scenario.id} value={scenario.id} className="bg-gray-800 text-white">{scenario.name}</option> ))} </select> )} </div>
            </div>
            
            {/* Searchable Character List */}
            <div className="flex flex-col space-y-1 mb-1.5 relative">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1"> 
                        <label className="font-semibold whitespace-nowrap pt-0.5 flex items-center space-x-1">
                            <UsersIcon className="w-3 h-3" /><span>Personajes:</span>
                        </label> 
                        {isCharsInherited ? ( 
                            <span className="text-[9px] bg-gray-700 text-gray-400 px-1 rounded cursor-help" title="Heredado del nodo padre">(Heredado)</span> 
                        ) : ( 
                            <button onClick={handleResetCharacters} className="text-gray-500 hover:text-cyan-400" title="Resetear a herencia"><UndoIcon /></button> 
                        )} 
                    </div>
                    
                    {/* Add Character Button/Dropdown Trigger */}
                    {!isCharDropdownOpen && (
                        <button 
                            onClick={() => setIsCharDropdownOpen(true)}
                            className="flex items-center text-gray-400 hover:text-white text-[10px] bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 hover:border-gray-500 transition-colors"
                        >
                            <PlusIcon className="w-2.5 h-2.5 mr-1" /> Añadir
                        </button>
                    )}
                </div>

                {/* Character Chips */}
                <div className="flex flex-wrap items-center gap-1"> 
                    {sceneCharacters.map((char, index) => ( 
                        <div key={`${char.id}-${index}`} className={`flex items-center px-1.5 py-0.5 rounded-full ${isCharsInherited ? 'bg-gray-700/50 border border-gray-600 border-dashed' : 'bg-gray-700'} ${char.color || 'text-gray-200'}`}> 
                            <span>{char.name}</span> 
                            <button onClick={() => handleRemoveCharacter(char.id)} className="ml-1 -mr-0.5 p-0.5 rounded-full hover:bg-red-500/50"> <XIcon className="h-2.5 w-2.5" /> </button> 
                        </div> 
                    ))} 
                </div>

                {/* Searchable Dropdown Popup */}
                {isCharDropdownOpen && (
                    <div className="absolute top-full left-0 z-50 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl mt-1 p-2 flex flex-col space-y-2 animate-fade-in-fast">
                        <div className="flex items-center border-b border-gray-700 pb-1">
                            <SearchIcon className="w-3 h-3 text-gray-500 mr-2" />
                            <input 
                                type="text"
                                value={charSearch}
                                onChange={(e) => setCharSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="bg-transparent text-white text-xs outline-none w-full placeholder-gray-500"
                                autoFocus
                            />
                            <button onClick={() => setIsCharDropdownOpen(false)} className="text-gray-500 hover:text-white ml-1">
                                <XIcon className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 space-y-0.5">
                            {availableCharactersToAdd.map(char => (
                                <button 
                                    key={char.id}
                                    onClick={() => handleAddCharacter(char.id)}
                                    className="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-cyan-900/50 hover:text-white rounded flex items-center"
                                >
                                    <div className={`w-2 h-2 rounded-full mr-2 ${char.color ? char.color.replace('text-', 'bg-') : 'bg-gray-500'}`} />
                                    {char.name}
                                </button>
                            ))}
                            {availableCharactersToAdd.length === 0 && (
                                <div className="text-[10px] text-gray-500 italic p-2 text-center">No encontrado.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <label className="font-semibold whitespace-nowrap">Punto de Vista:</label>
                <select value={povCharId || 'narrator'} onChange={handlePovChange} className="bg-transparent text-gray-300 border-none outline-none focus:ring-0 text-xs p-0 appearance-none cursor-pointer w-full hover:text-white"> <option value="narrator" className="bg-gray-800 text-white">Narrador</option> {sceneCharacters.length > 0 && <option disabled className="bg-gray-800">---</option>} {sceneCharacters.map(char => ( <option key={char.id} value={char.id} className={`${char.color || 'text-white'} bg-gray-800`}>{char.name}</option> ))} </select>
            </div>
        </div>
    );
};
