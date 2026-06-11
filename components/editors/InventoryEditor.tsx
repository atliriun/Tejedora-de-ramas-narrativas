
import React, { useState } from 'react';
import { InventoryItem, Resource, ItemType } from '../../types';
import { BackpackIcon, CoinsIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, XIcon, ArchiveIcon } from '../icons';
import { StyledInput, StyledSelect, StyledTextArea } from '../ui/Inputs';
import { uuid } from '../../utils/uuid';

interface InventoryEditorProps {
    inventory: InventoryItem[] | undefined;
    resources: Resource[] | undefined;
    onUpdateInventory: (inv: InventoryItem[]) => void;
    onUpdateResources: (res: Resource[]) => void;
}

export const InventoryEditor: React.FC<InventoryEditorProps> = ({ 
    inventory = [], 
    resources = [], 
    onUpdateInventory, 
    onUpdateResources 
}) => {
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    
    // Item Form
    const defaultItemForm: Omit<InventoryItem, 'id'> = { name: '', type: 'Misc', quantity: 1, weight: 0, equipped: false, description: '', value: '' };
    const [itemForm, setItemForm] = useState(defaultItemForm);

    // Resource Form (Inline addition)
    const [newResourceName, setNewResourceName] = useState('');

    // --- ITEM LOGIC ---
    const handleItemSubmit = () => {
        if (!itemForm.name.trim()) return;
        if (isAddingItem) {
            onUpdateInventory([...inventory, { id: uuid(), ...itemForm }]);
        } else if (editingItemId) {
            onUpdateInventory(inventory.map(i => i.id === editingItemId ? { ...i, ...itemForm } : i));
        }
        resetItemForm();
    };

    const resetItemForm = () => {
        setItemForm(defaultItemForm);
        setIsAddingItem(false);
        setEditingItemId(null);
    };

    const startEditItem = (item: InventoryItem) => {
        setItemForm({ ...item });
        setEditingItemId(item.id);
        setIsAddingItem(false);
    };

    const deleteItem = (id: string) => {
        onUpdateInventory(inventory.filter(i => i.id !== id));
    };

    const toggleEquipped = (id: string, current: boolean) => {
        onUpdateInventory(inventory.map(i => i.id === id ? { ...i, equipped: !current } : i));
    };

    const updateQuantity = (id: string, delta: number) => {
        onUpdateInventory(inventory.map(i => {
            if (i.id === id) {
                const newQ = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQ };
            }
            return i;
        }));
    };

    // --- RESOURCE LOGIC ---
    const addResource = () => {
        if (!newResourceName.trim()) return;
        const newRes: Resource = {
            id: uuid(),
            name: newResourceName.trim(),
            current: 0,
            max: 100,
            color: 'bg-yellow-500'
        };
        onUpdateResources([...resources, newRes]);
        setNewResourceName('');
    };

    const updateResource = (id: string, updates: Partial<Resource>) => {
        onUpdateResources(resources.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const deleteResource = (id: string) => {
        onUpdateResources(resources.filter(r => r.id !== id));
    };

    // Helper: Calculate Total Weight
    const totalWeight = inventory.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

    // Labels
    const typeLabels: Record<ItemType, string> = {
        'Weapon': 'Arma', 'Armor': 'Armadura', 'Consumable': 'Consumible',
        'Key': 'Clave', 'Material': 'Material', 'Tool': 'Herramienta', 'Misc': 'Otro'
    };

    return (
        <div className="space-y-6 animate-fade-in-fast">
            
            {/* --- RESOURCES SECTION --- */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1 flex items-center">
                    <CoinsIcon className="w-3 h-3 mr-1"/> Suministros y Divisas
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {resources.map(res => (
                        <div key={res.id} className="bg-gray-800/50 border border-gray-700 rounded p-2 relative group">
                            <div className="flex justify-between items-center mb-1">
                                <input 
                                    className="bg-transparent text-xs font-bold text-cyan-300 w-20 outline-none" 
                                    value={res.name} 
                                    onChange={e => updateResource(res.id, { name: e.target.value })} 
                                />
                                <button onClick={() => deleteResource(res.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"><TrashIcon className="w-3 h-3"/></button>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => updateResource(res.id, { current: Math.max(0, res.current - 1) })} className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600 text-xs font-bold">-</button>
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-900 text-center text-sm rounded border border-gray-600 py-0.5 outline-none focus:border-cyan-500"
                                    value={res.current}
                                    onChange={e => updateResource(res.id, { current: parseInt(e.target.value) || 0 })}
                                />
                                <button onClick={() => updateResource(res.id, { current: res.current + 1 })} className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600 text-xs font-bold">+</button>
                            </div>
                            <div className="mt-1 flex justify-between items-center text-[10px] text-gray-500">
                                <span>Max:</span>
                                <input 
                                    type="number" 
                                    className="w-8 bg-transparent text-right outline-none focus:text-gray-300"
                                    value={res.max}
                                    onChange={e => updateResource(res.id, { max: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    ))}
                    {/* Add Resource Mini-Form */}
                    <div className="flex items-center space-x-1 bg-gray-800/30 border border-dashed border-gray-600 rounded p-2">
                        <input 
                            placeholder="Nuevo (Oro, Flechas...)" 
                            className="w-full bg-transparent text-xs outline-none text-gray-400 focus:text-white"
                            value={newResourceName}
                            onChange={e => setNewResourceName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addResource()}
                        />
                        <button onClick={addResource} className="text-green-500 hover:text-green-400"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            </div>

            {/* --- INVENTORY SECTION --- */}
            <div>
                <div className="flex justify-between items-end mb-2 border-b border-gray-700 pb-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center">
                        <BackpackIcon className="w-3 h-3 mr-1"/> Inventario
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono">Peso Total: {totalWeight.toFixed(1)}</span>
                </div>

                {/* Add/Edit Form */}
                {(isAddingItem || editingItemId) && (
                    <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                        <div className="grid grid-cols-2 gap-2">
                            <StyledInput label="Nombre" value={itemForm.name} onChange={e => setItemForm(v => ({...v, name: e.target.value}))} autoFocus />
                            <StyledSelect label="Tipo" value={itemForm.type} onChange={e => setItemForm(v => ({...v, type: e.target.value as ItemType}))} options={[
                                {value:'Weapon',label:'Arma'},{value:'Armor',label:'Armadura'},{value:'Consumable',label:'Consumible'},
                                {value:'Tool',label:'Herramienta'},{value:'Material',label:'Material'},{value:'Key',label:'Clave'},{value:'Misc',label:'Otro'}
                            ]} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <StyledInput label="Cantidad" type="number" value={itemForm.quantity} onChange={e => setItemForm(v => ({...v, quantity: parseInt(e.target.value)}))} />
                            <StyledInput label="Peso (u)" type="number" value={itemForm.weight || 0} onChange={e => setItemForm(v => ({...v, weight: parseFloat(e.target.value)}))} />
                            <StyledInput label="Valor" value={itemForm.value || ''} onChange={e => setItemForm(v => ({...v, value: e.target.value}))} placeholder="100 oro" />
                        </div>
                        <StyledTextArea label="Descripción" value={itemForm.description || ''} onChange={e => setItemForm(v => ({...v, description: e.target.value}))} rows={2} />
                        
                        <div className="flex items-center space-x-2 mt-1">
                            <input type="checkbox" id="equip-check" checked={itemForm.equipped} onChange={e => setItemForm(v => ({...v, equipped: e.target.checked}))} className="w-4 h-4 rounded bg-gray-700 text-cyan-500 focus:ring-0" />
                            <label htmlFor="equip-check" className="text-xs text-gray-300 font-bold cursor-pointer">¿Equipado?</label>
                        </div>

                        <div className="flex justify-end space-x-2 mt-2">
                            <button onClick={resetItemForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                            <button onClick={handleItemSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                        </div>
                    </div>
                )}

                {/* Item List */}
                <div className="space-y-1">
                    {inventory.map(item => {
                        if (item.id === editingItemId) return null;
                        return (
                            <div key={item.id} className={`group flex items-center justify-between p-2 rounded border ${item.equipped ? 'bg-cyan-900/20 border-cyan-700/50' : 'bg-gray-800/50 border-gray-700'}`}>
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    <button 
                                        onClick={() => toggleEquipped(item.id, !!item.equipped)}
                                        className={`p-1 rounded-full transition-colors ${item.equipped ? 'text-cyan-400 bg-cyan-900/50' : 'text-gray-600 hover:text-gray-400'}`}
                                        title={item.equipped ? "Equipado" : "No equipado"}
                                    >
                                        <ArchiveIcon className="w-4 h-4" />
                                    </button>
                                    <div className="flex flex-col truncate">
                                        <div className="flex items-center space-x-2">
                                            <span className={`font-medium text-sm ${item.equipped ? 'text-cyan-100' : 'text-gray-300'}`}>{item.name}</span>
                                            {item.quantity > 1 && <span className="text-xs bg-gray-700 px-1.5 rounded text-gray-300">x{item.quantity}</span>}
                                        </div>
                                        <span className="text-[10px] text-gray-500">{typeLabels[item.type]} {item.weight ? `· ${item.weight}kg` : ''}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"><PlusIcon className="w-3 h-3"/></button>
                                    <button onClick={() => startEditItem(item)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"><EditIcon className="w-3 h-3"/></button>
                                    <button onClick={() => deleteItem(item.id)} className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"><TrashIcon className="w-3 h-3"/></button>
                                </div>
                            </div>
                        );
                    })}
                    {inventory.length === 0 && !isAddingItem && (
                        <div className="text-center py-3 text-gray-500 text-xs italic">Inventario vacío.</div>
                    )}
                </div>

                {!isAddingItem && !editingItemId && (
                    <button onClick={() => setIsAddingItem(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                        <PlusIcon /> <span>Añadir Objeto</span>
                    </button>
                )}
            </div>
        </div>
    );
};