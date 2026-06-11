
import React, { useState } from 'react';
import { Region, City, Landmark } from '../../types';
import { StyledInput, StyledTextArea, StyledSelect } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, MapIcon, ArrowUpIcon, StarIcon, BuildingIcon, XIcon, TreeIcon } from '../icons';
import { uuid } from '../../utils/uuid';

interface RegionListEditorProps {
    regions: Region[] | undefined;
    onUpdate: (newRegions: Region[]) => void;
}

// --- SUB-COMPONENT: CITY LIST EDITOR (NESTED) ---
const CityListEditor: React.FC<{ cities: City[] | undefined; onUpdate: (c: City[]) => void; }> = ({ cities = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<City, 'id'>>({ name: '', description: '', population: '', type: 'City', isCapital: false });

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        if (isAdding) {
            onUpdate([...cities, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(cities.map(c => c.id === editingId ? { ...c, ...form } : c));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm({ name: '', description: '', population: '', type: 'City', isCapital: false });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (city: City) => {
        setForm({ ...city });
        setEditingId(city.id);
        setIsAdding(false);
    };

    return (
        <div className="mt-2 pl-3 border-l-2 border-gray-700">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center">
                <BuildingIcon className="w-3 h-3 mr-1"/> Asentamientos / Ciudades
            </h4>
            
            {(isAdding || editingId) && (
                <div className="bg-gray-900 p-2 rounded border border-gray-600 mb-2">
                    <div className="flex space-x-2 mb-2">
                        <StyledInput value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="Nombre" autoFocus className="flex-grow"/>
                        <div className="flex items-center space-x-1 bg-gray-800 p-1 rounded border border-gray-700">
                            <input type="checkbox" checked={form.isCapital} onChange={e => setForm(v => ({...v, isCapital: e.target.checked}))} className="cursor-pointer"/>
                            <label className="text-[10px] text-yellow-500 font-bold">Capital?</label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <StyledSelect value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value as any}))} options={[
                            {value:'City',label:'Ciudad'}, {value:'Town',label:'Pueblo'}, 
                            {value:'Village',label:'Aldea'}, {value:'Fortress',label:'Fortaleza'}, {value:'Port',label:'Puerto'}
                        ]} />
                        <StyledInput value={form.population || ''} onChange={e => setForm(v => ({...v, population: e.target.value}))} placeholder="Población" />
                    </div>
                    <StyledTextArea value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="Descripción breve..." />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-[10px] bg-gray-700 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-[10px] bg-cyan-600 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {cities.map(city => {
                    if (city.id === editingId) return null;
                    return (
                        <div key={city.id} className="flex justify-between items-center bg-gray-800/50 p-1.5 rounded text-xs border border-gray-700 group hover:border-gray-500">
                            <div className="flex items-center space-x-2">
                                <span className={`font-bold ${city.isCapital ? 'text-yellow-200' : 'text-gray-300'}`}>{city.name}</span>
                                <span className="text-[9px] bg-black/30 px-1 rounded text-gray-500">{city.type}</span>
                                {city.population && <span className="text-[9px] text-gray-500">Pop: {city.population}</span>}
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(city)} className="p-1 hover:bg-gray-600 rounded"><EditIcon className="w-2 h-2"/></button>
                                <button onClick={() => onUpdate(cities.filter(c => c.id !== city.id))} className="p-1 hover:bg-red-500 rounded"><TrashIcon className="w-2 h-2"/></button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="mt-1 text-[10px] flex items-center text-gray-500 hover:text-cyan-400">
                    <PlusIcon className="w-3 h-3 mr-1"/> Añadir Asentamiento
                </button>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: LANDMARK LIST EDITOR (NESTED) ---
const LandmarkListEditor: React.FC<{ landmarks: Landmark[] | undefined; onUpdate: (l: Landmark[]) => void; }> = ({ landmarks = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<Landmark, 'id'>>({ name: '', type: 'Point of Interest', description: '' });

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        if (isAdding) {
            onUpdate([...landmarks, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(landmarks.map(l => l.id === editingId ? { ...l, ...form } : l));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm({ name: '', type: 'Point of Interest', description: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (lm: Landmark) => {
        setForm({ ...lm });
        setEditingId(lm.id);
        setIsAdding(false);
    };

    return (
        <div className="mt-2 pl-3 border-l-2 border-gray-700">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center">
                <TreeIcon className="w-3 h-3 mr-1"/> Puntos de Interés (Landmarks)
            </h4>
            
            {(isAdding || editingId) && (
                <div className="bg-gray-900 p-2 rounded border border-gray-600 mb-2">
                    <StyledInput value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="Nombre (Bosque de...)" autoFocus className="mb-2"/>
                    <StyledInput value={form.type} onChange={e => setForm(v => ({...v, type: e.target.value}))} placeholder="Tipo (Ruinas, Montaña, Lago...)" className="mb-2"/>
                    <StyledTextArea value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} placeholder="Descripción..." />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-[10px] bg-gray-700 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-[10px] bg-cyan-600 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {landmarks.map(lm => {
                    if (lm.id === editingId) return null;
                    return (
                        <div key={lm.id} className="flex justify-between items-center bg-gray-800/50 p-1.5 rounded text-xs border border-gray-700 group hover:border-gray-500">
                            <div className="flex items-center space-x-2">
                                <span className="font-bold text-green-200">{lm.name}</span>
                                <span className="text-[9px] bg-green-900/30 text-green-300 px-1 rounded">{lm.type}</span>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(lm)} className="p-1 hover:bg-gray-600 rounded"><EditIcon className="w-2 h-2"/></button>
                                <button onClick={() => onUpdate(landmarks.filter(l => l.id !== lm.id))} className="p-1 hover:bg-red-500 rounded"><TrashIcon className="w-2 h-2"/></button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="mt-1 text-[10px] flex items-center text-gray-500 hover:text-cyan-400">
                    <PlusIcon className="w-3 h-3 mr-1"/> Añadir Lugar Notable
                </button>
            )}
        </div>
    );
};

export const RegionListEditor: React.FC<RegionListEditorProps> = ({ regions = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<Region, 'id'>>({ name: '', description: '', capital: false, climate: '', resources: '', cities: [], landmarks: [] });

    const handleSubmit = () => {
        if (!form.name.trim()) return;

        if (isAdding) {
            onUpdate([...regions, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(regions.map(r => r.id === editingId ? { ...r, ...form } : r));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm({ name: '', description: '', capital: false, climate: '', resources: '', cities: [], landmarks: [] });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (region: Region) => {
        setForm({ ...region });
        setEditingId(region.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(regions.filter(r => r.id !== id));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === regions.length - 1)) return;
        const newRegions = [...regions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newRegions[index], newRegions[targetIndex]] = [newRegions[targetIndex], newRegions[index]];
        onUpdate(newRegions);
    };

    // Sub-update for nested cities when NOT in full edit mode (inline expansion)
    const handleUpdateCities = (regionId: string, newCities: City[]) => {
        onUpdate(regions.map(r => r.id === regionId ? { ...r, cities: newCities } : r));
    };

    // Sub-update for nested landmarks
    const handleUpdateLandmarks = (regionId: string, newLandmarks: Landmark[]) => {
        onUpdate(regions.map(r => r.id === regionId ? { ...r, landmarks: newLandmarks } : r));
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                <MapIcon className="w-3 h-3 mr-1"/> Provincias y Regiones
            </h3>

            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <div className="flex space-x-2">
                        <StyledInput 
                            label="Nombre" 
                            value={form.name} 
                            onChange={e => setForm(v => ({...v, name: e.target.value}))} 
                            placeholder="ej. El Norte" 
                            autoFocus 
                        />
                        <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded mt-6 border border-gray-700 h-9">
                            <input type="checkbox" checked={form.capital} onChange={e => setForm(v => ({...v, capital: e.target.checked}))} className="w-4 h-4 rounded bg-gray-700 text-yellow-500 focus:ring-0 cursor-pointer" />
                            <label className="text-xs text-gray-300 font-bold">¿Capital?</label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <StyledInput label="Clima/Bioma" value={form.climate || ''} onChange={e => setForm(v => ({...v, climate: e.target.value}))} placeholder="Frío..." />
                        <StyledInput label="Recursos" value={form.resources || ''} onChange={e => setForm(v => ({...v, resources: e.target.value}))} placeholder="Hierro..." />
                    </div>
                    <StyledTextArea label="Descripción" value={form.description} onChange={e => setForm(v => ({...v, description: e.target.value}))} rows={2} />

                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {regions.map((region, index) => {
                    if (region.id === editingId) return null;
                    return (
                        <div key={region.id} className="bg-gray-800/50 p-2 rounded border border-gray-700 flex flex-col group">
                            <div className="flex items-start space-x-2">
                                <div className="flex flex-col space-y-1 mt-1">
                                    <button onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3" /></button>
                                    <button onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-cyan-400"><ArrowUpIcon className="w-3 h-3 rotate-180" /></button>
                                </div>
                                <div className="w-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`font-bold text-sm ${region.capital ? 'text-yellow-400' : 'text-gray-200'}`}>{region.name}</span>
                                            {region.capital && <StarIcon className="w-3 h-3 text-yellow-500" />}
                                        </div>
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(region)} className="p-1 hover:bg-gray-600 rounded"><EditIcon className="w-3 h-3"/></button>
                                            <button onClick={() => handleDelete(region.id)} className="p-1 hover:bg-red-500 rounded"><TrashIcon className="w-3 h-3"/></button>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mb-1 flex space-x-2">
                                        {region.climate && <span className="bg-gray-700 px-1.5 rounded">{region.climate}</span>}
                                        {region.resources && <span className="bg-gray-700 px-1.5 rounded">{region.resources}</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">{region.description}</p>
                                </div>
                            </div>
                            
                            {/* Nested Editors - Always visible for quick access */}
                            <CityListEditor 
                                cities={region.cities} 
                                onUpdate={(newCities) => handleUpdateCities(region.id, newCities)} 
                            />
                            <LandmarkListEditor 
                                landmarks={region.landmarks}
                                onUpdate={(newLandmarks) => handleUpdateLandmarks(region.id, newLandmarks)}
                            />
                        </div>
                    );
                })}
                {regions.length === 0 && !isAdding && (
                    <div className="text-center py-2 text-gray-500 text-xs italic">No hay regiones definidas.</div>
                )}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Región</span>
                </button>
            )}
        </div>
    );
};
