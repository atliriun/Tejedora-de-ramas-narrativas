
import React, { useState } from 'react';
import { NationTreaty, NationConflict, NationPolicy, NationTechnology, NationEvent, NationRank, NationDemographic, NationValue, NationDetailItem, NationFloraFauna, NationRumor, NationUnit, NationFigure } from '../../types';
import { StyledInput, StyledTextArea, StyledSelect } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, HandshakeIcon, SwordsIcon, GavelIcon, BeakerIcon, CheckIcon, XIcon, ClockIcon, StarIcon, DnaIcon, HeartIcon, AlertIcon, BuildingIcon, SparkleIcon, BookOpenIcon, PaletteIcon, TreeIcon, ChatIcon, ShieldIcon, UsersIcon } from '../icons';
import { uuid } from '../../utils/uuid';

// --- GENERIC LIST EDITOR HELPER ---
const GenericListEditor = <T extends { id: string, name: string }>({
    items, onUpdate, title, icon, renderItem, defaultForm, renderForm
}: {
    items: T[], 
    onUpdate: (items: T[]) => void, 
    title: string, 
    icon: React.ReactNode,
    renderItem: (item: T) => React.ReactNode,
    defaultForm: Omit<T, 'id'>,
    renderForm: (form: Omit<T, 'id'>, setForm: React.Dispatch<React.SetStateAction<Omit<T, 'id'>>>) => React.ReactNode
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        if (isAdding) {
            // @ts-ignore
            onUpdate([...items, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(items.map(i => i.id === editingId ? { ...i, ...form } : i));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm(defaultForm);
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (item: T) => {
        const { id, ...rest } = item;
        setForm(rest as any);
        setEditingId(id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => onUpdate(items.filter(i => i.id !== id));

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) return;
        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        onUpdate(newItems);
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                {icon} <span className="ml-1">{title}</span>
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    {renderForm(form, setForm)}
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item, index) => {
                    if (item.id === editingId) return null;
                    return (
                        <div key={item.id} className="bg-gray-800/50 p-2 rounded border border-gray-700 flex items-start space-x-2 group">
                            <div className="flex flex-col space-y-1 mt-1">
                                <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                    {renderItem(item)}
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(item)} className="p-1 hover:bg-gray-600 rounded"><EditIcon className="w-3 h-3"/></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-500 rounded"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && !isAdding && (
                    <div className="text-center py-2 text-gray-500 text-xs italic">Lista vacía.</div>
                )}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Elemento</span>
                </button>
            )}
        </div>
    );
};

// --- SPECIFIC EDITORS ---

export const ArchitectureListEditor: React.FC<{ architecture: NationDetailItem[]; onUpdate: (a: NationDetailItem[]) => void; }> = ({ architecture, onUpdate }) => (
    <GenericListEditor<NationDetailItem>
        items={architecture}
        onUpdate={onUpdate}
        title="Arquitectura y Paisaje Urbano"
        icon={<BuildingIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Estilo Arquitectónico" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Gótico Imperial" autoFocus />
                <StyledTextArea label="Características Visuales" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="Arcos apuntados, piedra oscura..." />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <span className="font-bold text-sm text-gray-200">{item.name}</span>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
        )}
    />
);

export const ClothingListEditor: React.FC<{ clothing: NationDetailItem[]; onUpdate: (c: NationDetailItem[]) => void; }> = ({ clothing, onUpdate }) => (
    <GenericListEditor<NationDetailItem>
        items={clothing}
        onUpdate={onUpdate}
        title="Moda, Vestimenta y Apariencia"
        icon={<PaletteIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Estilo / Prenda" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Togas de Seda" autoFocus />
                <StyledTextArea label="Descripción" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="Colores, materiales, significado social..." />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <span className="font-bold text-sm text-gray-200">{item.name}</span>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
        )}
    />
);

export const CultureListEditor: React.FC<{ culture: NationDetailItem[]; onUpdate: (c: NationDetailItem[]) => void; }> = ({ culture, onUpdate }) => (
    <GenericListEditor<NationDetailItem>
        items={culture}
        onUpdate={onUpdate}
        title="Cultura y Tradiciones"
        icon={<BookOpenIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Tradición / Costumbre" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Festival de las Luces" autoFocus />
                <StyledTextArea label="Detalles" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <span className="font-bold text-sm text-gray-200">{item.name}</span>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
        )}
    />
);

export const PhilosophyListEditor: React.FC<{ philosophy: NationDetailItem[]; onUpdate: (p: NationDetailItem[]) => void; }> = ({ philosophy, onUpdate }) => (
    <GenericListEditor<NationDetailItem>
        items={philosophy}
        onUpdate={onUpdate}
        title="Filosofía y Creencias"
        icon={<SparkleIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Creencia / Doctrina" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. El Camino de la Espada" autoFocus />
                <StyledTextArea label="Explicación" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <span className="font-bold text-sm text-gray-200">{item.name}</span>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
        )}
    />
);

export const ValueListEditor: React.FC<{ values: NationValue[]; onUpdate: (v: NationValue[]) => void; }> = ({ values, onUpdate }) => (
    <GenericListEditor<NationValue>
        items={values}
        onUpdate={onUpdate}
        title="Valores Culturales (Virtudes y Tabúes)"
        icon={<HeartIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', type: 'Virtue', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Nombre del Valor" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Hospitalidad, Necromancia" autoFocus />
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded mt-1 border border-gray-700">
                        <label className="text-xs font-semibold text-gray-300 w-20">Tipo:</label>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setForm(v => ({...v, type: 'Virtue'}))}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${form.type === 'Virtue' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                            >
                                <HeartIcon className="inline w-3 h-3 mr-1" /> VIRTUD (Positivo)
                            </button>
                            <button 
                                onClick={() => setForm(v => ({...v, type: 'Taboo'}))}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${form.type === 'Taboo' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                            >
                                <AlertIcon className="inline w-3 h-3 mr-1" /> TABÚ (Prohibido)
                            </button>
                        </div>
                    </div>
                </div>
                <StyledTextArea label="Descripción / Consecuencias" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="¿Cómo se premia o castiga esto?" />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className={`text-[9px] px-1.5 rounded border font-bold ${item.type === 'Virtue' ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-red-900/30 text-red-300 border-red-800'}`}>
                        {item.type === 'Virtue' ? 'VIRTUD' : 'TABÚ'}
                    </span>
                    <span className="font-bold text-sm text-gray-200">{item.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
        )}
    />
);

export const TreatyListEditor: React.FC<{ treaties: NationTreaty[]; onUpdate: (t: NationTreaty[]) => void; }> = ({ treaties, onUpdate }) => (
    <GenericListEditor<NationTreaty>
        items={treaties}
        onUpdate={onUpdate}
        title="Tratados y Alianzas"
        icon={<HandshakeIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', type: 'Alliance', partner: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Nombre del Tratado" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} autoFocus />
                <div className="grid grid-cols-2 gap-2">
                    <StyledSelect label="Tipo" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value}))} options={[
                        {value:'Alliance',label:'Alianza Militar'},{value:'Trade',label:'Comercial'},
                        {value:'Non-Aggression',label:'No Agresión'},{value:'Vassalage',label:'Vasallaje'},{value:'Peace',label:'Paz'}
                    ]} />
                    <StyledInput label="Contraparte (Nación/Facción)" value={form.partner || ''} onChange={e => setForm(v => ({...v, partner: e.target.value}))} />
                </div>
                <StyledTextArea label="Condiciones" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-green-200">{item.name}</span>
                    <span className="text-[9px] bg-green-900/30 text-green-300 px-1.5 rounded border border-green-800">{item.type}</span>
                </div>
                {item.partner && <div className="text-[10px] text-gray-400">Con: <span className="text-gray-300">{item.partner}</span></div>}
                <p className="text-xs text-gray-500">{item.description}</p>
            </div>
        )}
    />
);

export const ConflictListEditor: React.FC<{ conflicts: NationConflict[]; onUpdate: (c: NationConflict[]) => void; }> = ({ conflicts, onUpdate }) => (
    <GenericListEditor<NationConflict>
        items={conflicts}
        onUpdate={onUpdate}
        title="Conflictos y Guerras"
        icon={<SwordsIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', type: 'War', opponent: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Nombre del Conflicto" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} autoFocus />
                <div className="grid grid-cols-2 gap-2">
                    <StyledSelect label="Tipo" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value}))} options={[
                        {value:'War',label:'Guerra Total'},{value:'Cold War',label:'Guerra Fría'},
                        {value:'Embargo',label:'Bloqueo/Embargo'},{value:'Dispute',label:'Disputa Fronteriza'},{value:'Civil War',label:'Guerra Civil'}
                    ]} />
                    <StyledInput label="Adversario" value={form.opponent || ''} onChange={e => setForm(v => ({...v, opponent: e.target.value}))} />
                </div>
                <StyledTextArea label="Detalles" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-red-200">{item.name}</span>
                    <span className="text-[9px] bg-red-900/30 text-red-300 px-1.5 rounded border border-red-800">{item.type}</span>
                </div>
                {item.opponent && <div className="text-[10px] text-gray-400">Vs: <span className="text-gray-300">{item.opponent}</span></div>}
                <p className="text-xs text-gray-500">{item.description}</p>
            </div>
        )}
    />
);

export const PolicyListEditor: React.FC<{ policies: NationPolicy[]; onUpdate: (p: NationPolicy[]) => void; }> = ({ policies, onUpdate }) => (
    <GenericListEditor<NationPolicy>
        items={policies}
        onUpdate={onUpdate}
        title="Políticas y Leyes"
        icon={<GavelIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', type: 'Social', description: '', active: true }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Nombre de la Política" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} autoFocus />
                <div className="grid grid-cols-2 gap-2">
                    <StyledSelect label="Ámbito" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value}))} options={[
                        {value:'Social',label:'Social'},{value:'Economic',label:'Económico'},
                        {value:'Military',label:'Militar'},{value:'Religious',label:'Religioso'}
                    ]} />
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded border border-gray-700 h-9 mt-6">
                        <input type="checkbox" checked={form.active} onChange={e => setForm(v => ({...v, active: e.target.checked}))} className="w-4 h-4 rounded bg-gray-700 text-cyan-500 focus:ring-0 cursor-pointer" />
                        <label className="text-xs text-gray-300 font-bold">¿Vigente?</label>
                    </div>
                </div>
                <StyledTextArea label="Efecto / Descripción" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className={`font-bold text-sm ${item.active ? 'text-gray-200' : 'text-gray-500 line-through'}`}>{item.name}</span>
                    <span className="text-[9px] bg-gray-700 px-1.5 rounded text-gray-300">{item.type}</span>
                    {!item.active && <span className="text-[9px] text-red-400 font-bold">DEROGADA</span>}
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
            </div>
        )}
    />
);

export const TechnologyListEditor: React.FC<{ technologies: NationTechnology[]; onUpdate: (t: NationTechnology[]) => void; }> = ({ technologies, onUpdate }) => (
    <GenericListEditor<NationTechnology>
        items={technologies}
        onUpdate={onUpdate}
        title="Tecnología y Progreso"
        icon={<BeakerIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', level: 'Experimental', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Tecnología / Avance" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} autoFocus />
                <StyledSelect label="Nivel de Desarrollo" value={form.level} onChange={e => setForm(v => ({...v, level: e.target.value}))} options={[
                    {value:'Experimental',label:'Experimental / Prototipo'},
                    {value:'Widespread',label:'Generalizado / Común'},
                    {value:'Secret',label:'Secreto de Estado'},
                    {value:'Forbidden',label:'Prohibido / Tabú'},
                    {value:'Lost',label:'Tecnología Perdida'}
                ]} />
                <StyledTextArea label="Uso y Capacidades" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-cyan-200">{item.name}</span>
                    <span className="text-[9px] bg-cyan-900/30 text-cyan-300 px-1.5 rounded border border-cyan-800">{item.level}</span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
            </div>
        )}
    />
);

export const HistoryListEditor: React.FC<{ history: NationEvent[]; onUpdate: (h: NationEvent[]) => void; }> = ({ history, onUpdate }) => (
    <GenericListEditor<NationEvent>
        items={history}
        onUpdate={onUpdate}
        title="Línea Temporal Histórica"
        icon={<ClockIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', year: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                        <StyledInput label="Año/Era" value={form.year} onChange={e => setForm(v => ({...v, year: e.target.value}))} placeholder="100 AC" autoFocus />
                    </div>
                    <div className="col-span-2">
                        <StyledInput label="Nombre del Evento" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="La Gran Guerra" />
                    </div>
                </div>
                <StyledTextArea label="Descripción del Evento" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full flex">
                <div className="w-16 flex-shrink-0 text-xs font-mono text-cyan-400 pt-0.5">{item.year}</div>
                <div className="flex-grow pl-2 border-l border-gray-700">
                    <span className="font-bold text-sm text-gray-200 block">{item.name}</span>
                    <p className="text-xs text-gray-500">{item.description}</p>
                </div>
            </div>
        )}
    />
);

export const RankListEditor: React.FC<{ ranks: NationRank[]; onUpdate: (r: NationRank[]) => void; }> = ({ ranks, onUpdate }) => (
    <GenericListEditor<NationRank>
        items={ranks}
        onUpdate={onUpdate}
        title="Jerarquía y Rangos Sociales"
        icon={<StarIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', title: '', level: 10 }}
        renderForm={(form, setForm) => (
            <>
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <StyledInput label="Nombre del Rango" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Duque" autoFocus />
                    </div>
                    <div className="col-span-1">
                        <StyledInput label="Nivel (1=Alto)" type="number" value={form.level} onChange={e => setForm(v => ({...v, level: parseInt(e.target.value)}))} />
                    </div>
                </div>
                <StyledInput label="Título de Cortesía" value={form.title} onChange={e => setForm(v => ({...v, title: e.target.value}))} placeholder="ej. Su Excelencia" />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-yellow-200">{item.name}</span>
                    <span className="text-[10px] text-gray-400 italic">{item.title}</span>
                </div>
                <span className="text-xs font-bold text-cyan-400 border border-cyan-800 rounded px-2">Nvl {item.level}</span>
            </div>
        )}
    />
);

export const DemographicListEditor: React.FC<{ demographics: NationDemographic[]; onUpdate: (d: NationDemographic[]) => void; }> = ({ demographics, onUpdate }) => (
    <GenericListEditor<NationDemographic>
        items={demographics}
        onUpdate={onUpdate}
        title="Demografía y Especies"
        icon={<DnaIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', percentage: '', status: '' }}
        renderForm={(form, setForm) => (
            <>
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <StyledInput label="Especie / Grupo" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Elfos" autoFocus />
                    </div>
                    <div className="col-span-1">
                        <StyledInput label="Porcentaje" value={form.percentage} onChange={e => setForm(v => ({...v, percentage: e.target.value}))} placeholder="20%" />
                    </div>
                </div>
                <StyledInput label="Estatus Social" value={form.status} onChange={e => setForm(v => ({...v, status: e.target.value}))} placeholder="ej. Ciudadanos de Segunda Clase" />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex justify-between">
                    <span className="font-bold text-sm text-gray-200">{item.name}</span>
                    <span className="font-mono text-xs text-cyan-300">{item.percentage}</span>
                </div>
                <p className="text-[10px] text-gray-500">{item.status}</p>
                <div className="w-full h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-cyan-600" style={{ width: item.percentage.includes('%') ? item.percentage : '0%' }}></div>
                </div>
            </div>
        )}
    />
);

export const FloraFaunaListEditor: React.FC<{ floraFauna: NationFloraFauna[]; onUpdate: (items: NationFloraFauna[]) => void; }> = ({ floraFauna, onUpdate }) => (
    <GenericListEditor<NationFloraFauna>
        items={floraFauna}
        onUpdate={onUpdate}
        title="Flora, Fauna y Ecosistema"
        icon={<TreeIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', type: 'Fauna', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <div className="grid grid-cols-2 gap-2">
                    <StyledInput label="Nombre de la Criatura/Planta" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Lobo Gigante, Flor de Fuego" autoFocus />
                    {/* Fix: cast e.target.value to any to avoid union type mismatch error */}
                    <StyledSelect label="Tipo" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value as any}))} options={[
                        {value:'Fauna',label:'Animal / Fauna'},
                        {value:'Flora',label:'Planta / Flora'},
                        {value:'Monster',label:'Monstruo / Bestia'},
                        {value:'Resource',label:'Recurso Natural'}
                    ]} />
                </div>
                <StyledTextArea label="Descripción / Hábitat" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-green-200">{item.name}</span>
                    <span className="text-[9px] bg-green-900/30 text-green-300 px-1.5 rounded border border-green-800">{item.type}</span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
            </div>
        )}
    />
);

export const RumorListEditor: React.FC<{ rumors: NationRumor[]; onUpdate: (items: NationRumor[]) => void; }> = ({ rumors, onUpdate }) => (
    <GenericListEditor<NationRumor>
        items={rumors}
        onUpdate={onUpdate}
        title="Rumores y Cotilleos (Voz del Pueblo)"
        icon={<ChatIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <StyledInput label="Tema / Título del Rumor" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. El Rey está Enfermo" autoFocus />
                <StyledTextArea label="Lo que se dice (Detalle)" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="'Dicen que tose sangre por las noches...'" />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <span className="font-bold text-sm text-yellow-200">"{item.name}"</span>
                <p className="text-xs text-gray-400 italic mt-1 border-l-2 border-yellow-700/50 pl-2">{item.description}</p>
            </div>
        )}
    />
);

// --- NEW MILITARY & FIGURES EDITORS ---

export const UnitListEditor: React.FC<{ units: NationUnit[]; onUpdate: (u: NationUnit[]) => void; }> = ({ units, onUpdate }) => (
    <GenericListEditor<NationUnit>
        items={units}
        onUpdate={onUpdate}
        title="Unidades Militares y Fuerzas"
        icon={<ShieldIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', type: 'Infantry', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <div className="grid grid-cols-2 gap-2">
                    <StyledInput label="Nombre de la Unidad" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Guardia de Hierro" autoFocus />
                    <StyledSelect label="Tipo" value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value}))} options={[
                        {value:'Infantry',label:'Infantería'}, {value:'Cavalry',label:'Caballería'},
                        {value:'Ranged',label:'A Distancia / Arqueros'}, {value:'Mage',label:'Mágica'},
                        {value:'Navy',label:'Naval'}, {value:'Monster',label:'Bestias de Guerra'},
                        {value:'Elite',label:'Elite / Guardia Real'}, {value:'Siege',label:'Asedio'}
                    ]} />
                </div>
                <StyledTextArea label="Equipo y Tácticas" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="Armadura pesada, escudos torre..." />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-gray-200">{item.name}</span>
                    <span className="text-[9px] bg-gray-700 px-1.5 rounded text-gray-300 border border-gray-600">{item.type}</span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
            </div>
        )}
    />
);

export const FigureListEditor: React.FC<{ figures: NationFigure[]; onUpdate: (f: NationFigure[]) => void; }> = ({ figures, onUpdate }) => (
    <GenericListEditor<NationFigure>
        items={figures}
        onUpdate={onUpdate}
        title="Figuras Notables (NPCs Clave)"
        icon={<UsersIcon className="w-3 h-3"/>}
        defaultForm={{ name: '', role: '', description: '' }}
        renderForm={(form, setForm) => (
            <>
                <div className="grid grid-cols-2 gap-2">
                    <StyledInput label="Nombre" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. Lord Tywin" autoFocus />
                    <StyledInput label="Cargo / Título" value={form.role} onChange={e => setForm(v => ({...v, role: e.target.value}))} placeholder="ej. Mano del Rey" />
                </div>
                <StyledTextArea label="Descripción Breve" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="Personalidad, apariencia..." />
            </>
        )}
        renderItem={(item) => (
            <div className="w-full">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-cyan-200">{item.name}</span>
                    <span className="text-[9px] bg-cyan-900/30 text-cyan-400 px-1.5 rounded border border-cyan-800">{item.role}</span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
            </div>
        )}
    />
);
