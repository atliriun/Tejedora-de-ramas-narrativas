
import React, { useState } from 'react';
import { Nation, NationResource } from '../../types';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { FileTextIcon, MapIcon, CastleIcon, BookOpenIcon, ToggleLeftIcon, ToggleRightIcon, HandshakeIcon, GavelIcon, ClockIcon, PlusIcon, TrashIcon, ArrowUpIcon, EditIcon, UsersIcon, ShieldIcon } from '../icons';
import { RegionListEditor } from './RegionListEditor';
import { FactionListEditor } from './NobleHouseListEditor';
import { TreatyListEditor, ConflictListEditor, PolicyListEditor, TechnologyListEditor, HistoryListEditor, RankListEditor, DemographicListEditor, ValueListEditor, ArchitectureListEditor, ClothingListEditor, CultureListEditor, PhilosophyListEditor, FloraFaunaListEditor, RumorListEditor, UnitListEditor, FigureListEditor } from './NationExtraEditors';
import { uuid } from '../../utils/uuid';

// --- RESOURCE LIST MANAGER (Internal Component) ---
const ResourceListManager: React.FC<{ 
    title: string; 
    items: NationResource[]; 
    onUpdate: (items: NationResource[]) => void; 
    placeholderName: string;
    placeholderPartner: string;
}> = ({ title, items, onUpdate, placeholderName, placeholderPartner }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<{name: string, partner: string}>({ name: '', partner: '' });

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        if (isAdding) {
            onUpdate([...items, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(items.map(i => i.id === editingId ? { ...i, ...form } : i));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm({ name: '', partner: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (item: NationResource) => {
        setForm({ name: item.name, partner: item.partner || '' });
        setEditingId(item.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => onUpdate(items.filter(i => i.id !== id));

    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-600 pb-1">{title}</h5>
            
            {(isAdding || editingId) && (
                <div className="bg-gray-800 p-2 rounded border border-gray-600 mb-2">
                    <div className="flex gap-2 mb-2">
                        <input 
                            value={form.name} 
                            onChange={e => setForm(v => ({...v, name: e.target.value}))} 
                            placeholder={placeholderName} 
                            className="flex-grow bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-cyan-500" 
                            autoFocus 
                        />
                        <input 
                            value={form.partner} 
                            onChange={e => setForm(v => ({...v, partner: e.target.value}))} 
                            placeholder={placeholderPartner} 
                            className="flex-grow bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-cyan-500" 
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={resetForm} className="text-[10px] bg-gray-700 px-2 py-1 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="text-[10px] bg-cyan-600 px-2 py-1 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="max-h-32 overflow-y-auto space-y-1">
                {items.map(item => {
                    if (item.id === editingId) return null;
                    return (
                        <div key={item.id} className="flex justify-between items-center bg-gray-800/50 p-1.5 rounded text-xs border border-gray-700 group hover:border-gray-500">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-200">{item.name}</span>
                                {item.partner && <span className="text-[10px] text-gray-400 italic">{item.partner}</span>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(item)} className="p-1 hover:bg-gray-600 rounded"><EditIcon className="w-2 h-2"/></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-500 rounded"><TrashIcon className="w-2 h-2"/></button>
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && !isAdding && <p className="text-[10px] text-gray-600 italic text-center">Ninguno.</p>}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full py-1 text-[10px] bg-gray-800 hover:bg-gray-700 rounded border border-dashed border-gray-600 text-gray-400 flex justify-center items-center gap-1">
                    <PlusIcon className="w-2 h-2"/> Añadir
                </button>
            )}
        </div>
    );
};

interface NationDetailsEditorProps {
    nation: Nation;
    onUpdate: (id: string, u: Partial<Nation>) => void;
}

export const NationDetailsEditor: React.FC<NationDetailsEditorProps> = ({ nation, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'history' | 'culture' | 'society' | 'geo' | 'military' | 'politics' | 'tech'>('general');
    const [aliases, setAliases] = useState(nation.aliases?.join(', ') || '');

    const handleAliasesBlur = () => {
        const arr = aliases.split(',').map(s => s.trim()).filter(s => s);
        onUpdate(nation.id, { aliases: arr });
    };

    const handleUpdateField = (field: keyof Nation, value: any) => {
        onUpdate(nation.id, { [field]: value });
    };

    const handleAestheticsUpdate = (key: 'architecture' | 'clothing', value: any) => {
        onUpdate(nation.id, { aesthetics: { ...nation.aesthetics!, [key]: value } });
    };

    const TabButton: React.FC<{ id: string; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
        <button 
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-1 px-3 py-2 text-xs font-bold uppercase rounded-t-md transition-colors border-b-2 whitespace-nowrap ${
                activeTab === id 
                ? 'bg-gray-700/50 border-cyan-400 text-white' 
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="animate-fade-in-fast">
            {/* Active Toggle Header */}
            <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Configuración de Nación</span>
                <button 
                    onClick={() => onUpdate(nation.id, { active: !nation.active })}
                    className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded transition-colors ${nation.active !== false ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-800'}`}
                    title={nation.active !== false ? "Nación Activa (Visible para IA)" : "Nación Inactiva (Ignorada)"}
                >
                    <span>{nation.active !== false ? 'ACTIVA' : 'INACTIVA'}</span>
                    {nation.active !== false ? <ToggleRightIcon className="w-5 h-5" /> : <ToggleLeftIcon className="w-5 h-5" />}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-3 overflow-x-auto scrollbar-hide">
                <TabButton id="general" label="General" icon={<FileTextIcon className="w-3 h-3"/>} />
                <TabButton id="history" label="Historia" icon={<ClockIcon className="w-3 h-3"/>} />
                <TabButton id="culture" label="Cultura" icon={<BookOpenIcon className="w-3 h-3"/>} />
                <TabButton id="society" label="Sociedad" icon={<UsersIcon className="w-3 h-3"/>} />
                <TabButton id="geo" label="Geografía" icon={<MapIcon className="w-3 h-3"/>} />
                <TabButton id="military" label="Militar" icon={<ShieldIcon className="w-3 h-3"/>} />
                <TabButton id="politics" label="Política" icon={<HandshakeIcon className="w-3 h-3"/>} />
                <TabButton id="tech" label="Desarrollo" icon={<GavelIcon className="w-3 h-3"/>} />
            </div>

            {/* Content Area */}
            <div className="min-h-[200px]">
                {activeTab === 'general' && (
                    <div className="space-y-3 animate-fade-in-fast">
                        <StyledInput 
                            label="Alias / Nombres Alternativos" 
                            value={aliases} 
                            onChange={e => setAliases(e.target.value)} 
                            onBlur={handleAliasesBlur} 
                            placeholder="ej. El Imperio Dorado, Las Tierras del Rey"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <StyledInput 
                                label="Ubicación / Continente" 
                                value={nation.continent || ''} 
                                onChange={e => handleUpdateField('continent', e.target.value)} 
                                placeholder="ej. Poniente, Continente Central"
                            />
                            <StyledInput 
                                label="Capital" 
                                value={nation.capitalName || ''} 
                                onChange={e => handleUpdateField('capitalName', e.target.value)} 
                                placeholder="Ciudad Capital"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <StyledInput 
                                label="Tipo de Gobierno" 
                                value={nation.governmentType || ''} 
                                onChange={e => handleUpdateField('governmentType', e.target.value)} 
                                placeholder="ej. Monarquía, República..."
                            />
                            <StyledInput 
                                label="Gobernante / Líder" 
                                value={nation.ruler || ''} 
                                onChange={e => handleUpdateField('ruler', e.target.value)} 
                                placeholder="ej. Reina Marika"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <StyledInput 
                                label="Gentilicio (¿Cómo se les llama?)" 
                                value={nation.demonym || ''} 
                                onChange={e => handleUpdateField('demonym', e.target.value)} 
                                placeholder="ej. Gondoriano, Romano"
                            />
                            <StyledInput 
                                label="Población Estimada" 
                                value={nation.population || ''} 
                                onChange={e => handleUpdateField('population', e.target.value)} 
                                placeholder="ej. 5 Millones, Escasa"
                            />
                        </div>
                        <StyledTextArea 
                            label="Descripción General" 
                            value={nation.description} 
                            onChange={e => handleUpdateField('description', e.target.value)} 
                            rows={4} 
                            placeholder="Resumen histórico y político de la nación..." 
                        />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="animate-fade-in-fast space-y-4">
                        <HistoryListEditor
                            history={nation.history || []}
                            onUpdate={(l) => handleUpdateField('history', l)}
                        />
                    </div>
                )}

                {activeTab === 'culture' && (
                    <div className="space-y-4 animate-fade-in-fast">
                        <div className="grid grid-cols-3 gap-2">
                            <StyledInput 
                                label="Idioma Principal" 
                                value={nation.language || ''} 
                                onChange={e => handleUpdateField('language', e.target.value)} 
                                placeholder="ej. Común"
                            />
                            <StyledInput 
                                label="Moneda" 
                                value={nation.currency || ''} 
                                onChange={e => handleUpdateField('currency', e.target.value)} 
                                placeholder="ej. Dragones de Oro"
                            />
                            <StyledInput 
                                label="Religión Oficial" 
                                value={nation.religion || ''} 
                                onChange={e => handleUpdateField('religion', e.target.value)} 
                                placeholder="ej. Los Siete"
                            />
                        </div>
                        
                        {/* Values Editor */}
                        <div className="mt-2">
                            <ValueListEditor 
                                values={nation.values || []}
                                onUpdate={(l) => handleUpdateField('values', l)}
                            />
                        </div>

                        {/* Aesthetics Section */}
                        <div className="bg-gray-900/30 p-3 rounded border border-gray-700/50 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Estética Visual</h4>
                            <ArchitectureListEditor 
                                architecture={nation.aesthetics?.architecture || []}
                                onUpdate={(l) => handleAestheticsUpdate('architecture', l)}
                            />
                            <ClothingListEditor
                                clothing={nation.aesthetics?.clothing || []}
                                onUpdate={(l) => handleAestheticsUpdate('clothing', l)}
                            />
                        </div>

                        {/* Culture & Philosophy Lists */}
                        <div className="space-y-4">
                            <CultureListEditor
                                culture={nation.cultureList || []}
                                onUpdate={(l) => handleUpdateField('cultureList', l)}
                            />
                            <PhilosophyListEditor
                                philosophy={nation.philosophyList || []}
                                onUpdate={(l) => handleUpdateField('philosophyList', l)}
                            />
                        </div>
                    </div>
                )}

                {/* SOCIETY TAB with FIGURES */}
                {activeTab === 'society' && (
                    <div className="animate-fade-in-fast space-y-6">
                        <FigureListEditor
                            figures={nation.figures || []}
                            onUpdate={(l) => handleUpdateField('figures', l)}
                        />
                        <RankListEditor 
                            ranks={nation.ranks || []}
                            onUpdate={(l) => handleUpdateField('ranks', l)}
                        />
                        <DemographicListEditor 
                            demographics={nation.demographics || []}
                            onUpdate={(l) => handleUpdateField('demographics', l)}
                        />
                        <RumorListEditor
                            rumors={nation.rumors || []}
                            onUpdate={(l) => handleUpdateField('rumors', l)}
                        />
                    </div>
                )}

                {activeTab === 'geo' && (
                    <div className="animate-fade-in-fast space-y-4">
                        <StyledTextArea 
                            label="Geografía General" 
                            value={nation.geography || ''} 
                            onChange={e => handleUpdateField('geography', e.target.value)} 
                            rows={2} 
                            placeholder="Descripción del terreno, fronteras, clima general..." 
                        />
                        <RegionListEditor 
                            regions={nation.regions} 
                            onUpdate={(l) => handleUpdateField('regions', l)} 
                        />
                        <FloraFaunaListEditor
                            floraFauna={nation.floraFauna || []}
                            onUpdate={(l) => handleUpdateField('floraFauna', l)}
                        />
                    </div>
                )}

                {/* NEW MILITARY TAB */}
                {activeTab === 'military' && (
                    <div className="animate-fade-in-fast space-y-6">
                        <UnitListEditor
                            units={nation.militaryUnits || []}
                            onUpdate={(l) => handleUpdateField('militaryUnits', l)}
                        />
                        <ConflictListEditor 
                            conflicts={nation.conflicts || []}
                            onUpdate={(l) => handleUpdateField('conflicts', l)}
                        />
                    </div>
                )}

                {/* POLITICS: Factions & Treaties */}
                {activeTab === 'politics' && (
                    <div className="animate-fade-in-fast space-y-6">
                        <FactionListEditor
                            factions={nation.factions}
                            onUpdate={(l) => handleUpdateField('factions', l)}
                        />
                        <TreatyListEditor 
                            treaties={nation.treaties || []}
                            onUpdate={(l) => handleUpdateField('treaties', l)}
                        />
                    </div>
                )}

                {/* TECH & ECONOMY */}
                {activeTab === 'tech' && (
                    <div className="animate-fade-in-fast space-y-6">
                        {/* Structured Economy Section */}
                        <div className="space-y-3 bg-gray-900/30 p-3 rounded border border-gray-700/50">
                            <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center">
                                <span className="mr-2">💰</span> Motor Económico
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <ResourceListManager
                                    title="Exportaciones (Ventas)"
                                    items={nation.economy?.exports || []}
                                    onUpdate={(list) => onUpdate(nation.id, { economy: { ...nation.economy!, exports: list } })}
                                    placeholderName="Recurso (ej. Acero)"
                                    placeholderPartner="Hacia dónde (ej. Al Sur)"
                                />
                                <ResourceListManager
                                    title="Importaciones (Compras/Min)"
                                    items={nation.economy?.imports || []}
                                    onUpdate={(list) => onUpdate(nation.id, { economy: { ...nation.economy!, imports: list } })}
                                    placeholderName="Recurso (ej. Vino)"
                                    placeholderPartner="De dónde (ej. El Valle)"
                                />
                            </div>
                        </div>

                        <PolicyListEditor 
                            policies={nation.policies || []}
                            onUpdate={(l) => handleUpdateField('policies', l)}
                        />
                        <TechnologyListEditor 
                            technologies={nation.technologies || []}
                            onUpdate={(l) => handleUpdateField('technologies', l)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
