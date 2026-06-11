
import React, { useState } from 'react';
import { NarrativeGoal, GoalType, GoalStatus, GoalPriority } from '../../types';
import { StyledInput, StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, TargetIcon, ArrowUpIcon, CheckIcon, XIcon, ToggleLeftIcon, ToggleRightIcon } from '../icons';
import { DEFAULT_NARRATIVE_GOAL } from '../../constants';
import { uuid } from '../../utils/uuid';

interface ObjectiveListEditorProps {
    goals: NarrativeGoal[] | undefined;
    onUpdate: (newGoals: NarrativeGoal[]) => void;
}

export const ObjectiveListEditor: React.FC<ObjectiveListEditorProps> = ({ goals = [], onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [form, setForm] = useState<Omit<NarrativeGoal, 'id'>>(DEFAULT_NARRATIVE_GOAL as Omit<NarrativeGoal, 'id'>);

    const handleSubmit = () => {
        if (!form.description.trim()) return;

        if (isAdding) {
            onUpdate([...goals, { id: uuid(), ...form }]);
        } else if (editingId) {
            onUpdate(goals.map(g => g.id === editingId ? { ...g, ...form } : g));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm(DEFAULT_NARRATIVE_GOAL as Omit<NarrativeGoal, 'id'>);
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (goal: NarrativeGoal) => {
        setForm({ ...goal });
        setEditingId(goal.id);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        onUpdate(goals.filter(g => g.id !== id));
    };

    const handleToggleStatus = (id: string, currentStatus: GoalStatus) => {
        let newStatus: GoalStatus = 'Active';
        if (currentStatus === 'Active') newStatus = 'Completed';
        else if (currentStatus === 'Completed') newStatus = 'Failed';
        else if (currentStatus === 'Failed') newStatus = 'Active';
        else newStatus = 'Active'; // Default cycle

        onUpdate(goals.map(g => g.id === id ? { ...g, status: newStatus, progress: newStatus === 'Completed' ? 100 : g.progress } : g));
    };

    const handleToggleActive = (id: string, currentActive: boolean) => {
        onUpdate(goals.map(g => g.id === id ? { ...g, active: !currentActive } : g));
    };

    const getPriorityColor = (priority: GoalPriority) => {
        switch(priority) {
            case 'High': return 'text-red-400';
            case 'Medium': return 'text-yellow-400';
            case 'Low': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusColor = (status: GoalStatus) => {
        switch(status) {
            case 'Active': return 'bg-green-900/30 text-green-300 border-green-700';
            case 'Completed': return 'bg-blue-900/30 text-blue-300 border-blue-700';
            case 'Failed': return 'bg-red-900/30 text-red-300 border-red-700';
            case 'Pending': return 'bg-gray-700 text-gray-400 border-gray-600';
            case 'Abandoned': return 'bg-black/50 text-gray-600 border-gray-800';
            default: return 'bg-gray-800';
        }
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            {(isAdding || editingId) && (
                <div className="bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700 mb-2">
                    <div className="grid grid-cols-2 gap-2">
                        <StyledSelect 
                            label="Tipo" 
                            value={form.type} 
                            onChange={e => setForm(v => ({...v, type: e.target.value as GoalType}))} 
                            options={[
                                {value:'Plot',label:'Trama Principal'},{value:'Character',label:'Arco de Personaje'},
                                {value:'World',label:'Mundo / Lore'},{value:'Theme',label:'Temático'}
                            ]} 
                        />
                        <StyledSelect 
                            label="Prioridad" 
                            value={form.priority} 
                            onChange={e => setForm(v => ({...v, priority: e.target.value as GoalPriority}))} 
                            options={[
                                {value:'High',label:'Alta (Crucial)'},{value:'Medium',label:'Media (Importante)'},
                                {value:'Low',label:'Baja (Opcional)'}
                            ]} 
                        />
                    </div>
                    <StyledTextArea 
                        label="Descripción del Objetivo" 
                        value={form.description} 
                        onChange={e => setForm(v => ({...v, description: e.target.value}))} 
                        rows={3} 
                        autoFocus 
                        placeholder="¿Qué debe ocurrir para cumplir esto?" 
                    />
                    
                    <div className="grid grid-cols-2 gap-2 items-end">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 block mb-1">Progreso: {form.progress}%</label>
                            <input 
                                type="range" min="0" max="100" step="5" 
                                value={form.progress} 
                                onChange={e => setForm(v => ({...v, progress: parseInt(e.target.value)}))} 
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <StyledSelect 
                            label="Estado" 
                            value={form.status} 
                            onChange={e => setForm(v => ({...v, status: e.target.value as GoalStatus}))} 
                            options={[
                                {value:'Active',label:'En Curso'},{value:'Completed',label:'Completado'},
                                {value:'Failed',label:'Fallido'},{value:'Pending',label:'Pendiente'},
                                {value:'Abandoned',label:'Abandonado'}
                            ]} 
                        />
                    </div>

                    <StyledTextArea 
                        label="Notas Adicionales (Contexto)" 
                        value={form.notes || ''} 
                        onChange={e => setForm(v => ({...v, notes: e.target.value}))} 
                        rows={2} 
                        placeholder="Detalles extra para la IA..." 
                    />

                    {/* Active Toggle in Form */}
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded mt-1 border border-gray-700">
                        <label className="text-xs font-semibold text-gray-300">Sistema (Contexto IA):</label>
                        <button 
                            onClick={() => setForm(v => ({...v, active: !v.active}))}
                            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-bold transition-colors ${form.active !== false ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-gray-600 text-gray-400 hover:bg-gray-500'}`}
                        >
                            {form.active !== false ? <><CheckIcon className="w-3 h-3"/> <span>ACTIVO</span></> : <><XIcon className="w-3 h-3"/> <span>INACTIVO</span></>}
                        </button>
                    </div>

                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={resetForm} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Cancelar</button>
                        <button onClick={handleSubmit} className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded">Guardar</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {goals.map((goal) => {
                    if (goal.id === editingId) return null;
                    const isActive = goal.active !== false;
                    return (
                        <div key={goal.id} className={`p-3 rounded-md border flex flex-col gap-2 group ${isActive ? getStatusColor(goal.status) : 'bg-gray-900 border-gray-800 opacity-60 grayscale'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleToggleStatus(goal.id, goal.status)}
                                        className="p-1 rounded hover:bg-white/10"
                                        title={`Estado Narrativo: ${goal.status} (Click para cambiar)`}
                                    >
                                        {goal.status === 'Completed' ? <CheckIcon className="w-4 h-4 text-green-400"/> : 
                                         goal.status === 'Failed' ? <XIcon className="w-4 h-4 text-red-400"/> : 
                                         <TargetIcon className={`w-4 h-4 ${getPriorityColor(goal.priority)}`}/>}
                                    </button>
                                    <span className="font-bold text-sm">{goal.type}</span>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${getPriorityColor(goal.priority)}`}>{goal.priority}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    {/* Active Toggle Button */}
                                    <button
                                        onClick={() => handleToggleActive(goal.id, isActive)}
                                        className={`p-1 rounded hover:bg-black/20 mr-1 ${isActive ? 'text-green-300' : 'text-gray-500'}`}
                                        title={isActive ? "Sistema: ACTIVO (Visible para IA)" : "Sistema: INACTIVO (Ignorado por IA)"}
                                    >
                                        {isActive ? <ToggleRightIcon className="w-5 h-5"/> : <ToggleLeftIcon className="w-5 h-5"/>}
                                    </button>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(goal)} className="p-1 hover:bg-white/20 rounded"><EditIcon/></button>
                                        <button onClick={() => handleDelete(goal.id)} className="p-1 hover:bg-red-500/50 rounded"><TrashIcon/></button>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-200 leading-snug">{goal.description}</p>
                            
                            {goal.notes && <p className="text-xs text-white/60 italic border-l-2 border-white/20 pl-2">{goal.notes}</p>}

                            <div className="w-full h-1.5 bg-gray-900/50 rounded-full overflow-hidden mt-1">
                                <div 
                                    className={`h-full transition-all duration-500 ${goal.status === 'Completed' ? 'bg-green-500' : goal.status === 'Failed' ? 'bg-red-500' : 'bg-cyan-500'}`} 
                                    style={{ width: `${goal.progress}%` }} 
                                />
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && !isAdding && (
                    <div className="text-center py-4 text-gray-500 text-xs italic">No hay objetivos definidos.</div>
                )}
            </div>

            {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-sm border border-dashed border-gray-500">
                    <PlusIcon /> <span>Añadir Objetivo</span>
                </button>
            )}
        </div>
    );
};
