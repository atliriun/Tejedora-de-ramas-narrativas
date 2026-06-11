
import React, { useState, useEffect } from 'react';
import { EvolutionMilestone, EvolutionCategory, EvolutionPriority, StoryArc } from '../../types';
import { StyledInput, StyledSelect, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, EditIcon, TrashIcon, TrendingUpIcon, CheckIcon, XIcon, CalendarIcon, AlertIcon, BrainCircuitIcon, UsersIcon, GlobeAltIcon, ListCheckIcon, KeyIcon, BookOpenIcon, FileTextIcon, ChevronDownIcon, SparkleIcon, CopyIcon, ClipboardPasteIcon } from '../icons';
import { uuid } from '../../utils/uuid';

interface EvolutionEditorProps {
    evolution: EvolutionMilestone[] | undefined;
    onUpdate: (newEvolution: EvolutionMilestone[]) => void;
    allArcs?: StoryArc[]; // Optional list to link milestones to specific story phases
}

// Global-like clipboard for this session to allow cross-character pasting
let evolutionClipboard: Omit<EvolutionMilestone, 'id'> | null = null;

export const EvolutionEditor: React.FC<EvolutionEditorProps> = ({ evolution = [], onUpdate, allArcs = [] }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'All' | EvolutionCategory>('All');
    const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
    const [hasClipboard, setHasClipboard] = useState(!!evolutionClipboard);
    const [justCopiedId, setJustCopiedId] = useState<string | null>(null);
    
    const defaultForm: Omit<EvolutionMilestone, 'id' | 'achieved'> = { 
        name: '', category: 'Physical', description: '', dateAchieved: '', priority: 'Medium',
        mentalState: '', roleAtMoment: '', locationAtMoment: '', 
        tacticalPoints: [], privateThoughts: '', diaryFragment: '', interestingData: '',
        arcId: ''
    };
    const [form, setForm] = useState(defaultForm);
    const [tacticalInput, setTacticalInput] = useState('');

    const handleSubmit = () => {
        if (!form.name.trim()) return;

        if (isAdding) {
            onUpdate([...evolution, { id: uuid(), ...form, achieved: true }]);
        } else if (editingId) {
            onUpdate(evolution.map(e => e.id === editingId ? { ...e, ...form } : e));
        }
        resetForm();
    };

    const resetForm = () => {
        setForm(defaultForm);
        setTacticalInput('');
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (milestone: EvolutionMilestone) => {
        setForm({ ...milestone });
        setEditingId(milestone.id);
        setIsAdding(false);
    };

    const handleCopy = (milestone: EvolutionMilestone) => {
        const { id, ...dataToCopy } = milestone;
        evolutionClipboard = JSON.parse(JSON.stringify(dataToCopy));
        setHasClipboard(true);
        setJustCopiedId(milestone.id);
        setTimeout(() => setJustCopiedId(null), 2000);
    };

    const handlePaste = () => {
        if (evolutionClipboard) {
            const pastedMilestone: EvolutionMilestone = {
                id: uuid(),
                ...JSON.parse(JSON.stringify(evolutionClipboard)),
                achieved: true // Assume pasted ones are complete or should be
            };
            onUpdate([...evolution, pastedMilestone]);
            // Optional: expand it immediately to show it's there
            setExpandedMilestoneId(pastedMilestone.id);
        }
    };

    const handleDelete = (id: string) => {
        onUpdate(evolution.filter(e => e.id !== id));
    };

    const handleAddTactical = () => {
        if (tacticalInput.trim()) {
            setForm(prev => ({ ...prev, tacticalPoints: [...(prev.tacticalPoints || []), tacticalInput.trim()] }));
            setTacticalInput('');
        }
    };

    const removeTactical = (point: string) => {
        setForm(prev => ({ ...prev, tacticalPoints: prev.tacticalPoints?.filter(p => p !== point) }));
    };

    const filteredEvolution = activeFilter === 'All' 
        ? evolution 
        : evolution.filter(e => e.category === activeFilter);

    const categoryColors: Record<EvolutionCategory, string> = {
        'Physical': 'border-red-500/50 text-red-300',
        'Psychological': 'border-blue-500/50 text-blue-300',
        'Magical': 'border-purple-500/50 text-purple-300',
        'Social': 'border-yellow-500/50 text-yellow-300'
    };

    return (
        <div className="space-y-4 animate-fade-in-fast h-full flex flex-col">
            <div className="flex justify-between items-end border-b border-gray-700 pb-2 mb-2 flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center">
                    <TrendingUpIcon className="w-3 h-3 mr-1"/> Registro de Evolución y Datos
                </h3>
            </div>

            {/* Filter Tabs - flex-shrink-0 ensures they stay visible */}
            <div className="flex space-x-1 mb-2 overflow-x-auto scrollbar-hide pb-1 flex-shrink-0">
                {['All', 'Physical', 'Psychological', 'Magical', 'Social'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveFilter(cat as any)}
                        className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                            activeFilter === cat 
                            ? 'bg-cyan-900/50 border-cyan-500 text-white' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        {cat === 'All' ? 'Todo' : cat}
                    </button>
                ))}
            </div>

            {/* Editor Form - If active, we might want it to take space, but let's keep it above the list */}
            {(isAdding || editingId) && (
                <div className="bg-gray-900/90 p-5 rounded-2xl space-y-6 border border-cyan-500/30 mb-4 animate-fade-in-fast shadow-2xl ring-1 ring-cyan-500/20 flex-shrink-0 overflow-y-auto max-h-[80vh]">
                    <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                        <div className="flex items-center space-x-2">
                            <FileTextIcon className="text-cyan-400 w-5 h-5"/>
                            <h4 className="text-sm font-black text-gray-100 uppercase tracking-widest">Editor de Archivo de Etapa</h4>
                        </div>
                        <button onClick={resetForm} className="text-gray-500 hover:text-white transition-colors"><XIcon/></button>
                    </div>

                    {/* Tip de Automatización */}
                    <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-xl flex items-start space-x-3">
                        <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400 mt-0.5">
                            <SparkleIcon className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="flex-grow">
                            <p className="text-[11px] font-bold text-cyan-100 uppercase tracking-wider mb-1">Tip de Automatización</p>
                            <p className="text-[10px] text-gray-400 leading-normal">
                                En el <strong className="text-cyan-300">Modo Director</strong>, puedes pedir: 
                                <em className="text-gray-300"> "Genera un archivo de evolución para este personaje incluyendo hechos, secretos y un fragmento de diario" </em>
                                y la IA llenará estos campos automáticamente basándose en la narrativa actual.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StyledInput label="Título de la Etapa / Dossier" value={form.name} onChange={e => setForm(v => ({...v, name: e.target.value}))} placeholder="ej. La Observadora Científica" autoFocus />
                        <StyledSelect 
                            label="Arco Relacionado" 
                            value={form.arcId || ''} 
                            onChange={e => setForm(v => ({...v, arcId: e.target.value}))} 
                            options={[{value: '', label: 'Ninguno'}, ...allArcs.map(a => ({value: a.id, label: a.name}))]} 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StyledInput label="Estado Mental" value={form.mentalState || ''} onChange={e => setForm(v => ({...v, mentalState: e.target.value}))} placeholder="[CRÍTICO] Sobrecarga..." />
                        <StyledInput label="Rol Actual" value={form.roleAtMoment || ''} onChange={e => setForm(v => ({...v, roleAtMoment: e.target.value}))} placeholder="Comandante de Inteligencia" />
                        <StyledInput label="Ubicación" value={form.locationAtMoment || ''} onChange={e => setForm(v => ({...v, locationAtMoment: e.target.value}))} placeholder="Sótano de la Biblioteca" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StyledSelect label="Categoría" value={form.category} onChange={e => setForm(v => ({...v, category: e.target.value as any}))} options={[
                            {value:'Physical',label:'Física'},{value:'Psychological',label:'Psicológica'},
                            {value:'Magical',label:'Mágica'},{value:'Social',label:'Social'}
                        ]} />
                        <StyledInput label="Línea de Tiempo / Fecha" value={form.dateAchieved || ''} onChange={e => setForm(v => ({...v, dateAchieved: e.target.value}))} placeholder="ej. Arco 2: Inicio" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black text-cyan-400 uppercase flex items-center mb-1">
                            <ListCheckIcon className="w-4 h-4 mr-2"/> Momentos Clave (Hechos Vividos)
                        </label>
                        <textarea 
                            value={form.description} 
                            onChange={e => setForm(v => ({...v, description: e.target.value}))} 
                            rows={8} 
                            className="w-full bg-gray-900 border-l-4 border-cyan-600 border-t border-r border-b border-gray-700 rounded-r-xl p-4 text-sm text-gray-200 leading-relaxed focus:ring-1 focus:ring-cyan-500 outline-none shadow-inner"
                            placeholder="Describe detalladamente los eventos de esta etapa..."
                        />
                    </div>

                    {/* Tactical Points */}
                    <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-gray-700 shadow-inner">
                        <label className="text-[10px] font-bold text-orange-400 uppercase flex items-center mb-2"><ListCheckIcon className="w-3 h-3 mr-1"/> Puntos Tácticos / Descubrimientos</label>
                        <div className="flex gap-2 mb-3">
                            <input className="flex-grow bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs outline-none focus:border-orange-500/50" value={tacticalInput} onChange={e => setTacticalInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTactical()} placeholder="Añadir observación táctica..." />
                            <button onClick={handleAddTactical} className="px-3 bg-gray-700 hover:bg-orange-600 rounded-lg transition-colors"><PlusIcon className="w-4 h-4 text-white"/></button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {form.tacticalPoints?.map(p => (
                                <span key={p} className="text-[10px] bg-orange-950/30 text-orange-200 border border-orange-800/50 px-3 py-1 rounded-lg flex items-center">
                                    {p} <button onClick={() => removeTactical(p)} className="ml-2 hover:text-red-400"><XIcon className="w-2.5 h-2.5"/></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-red-400 uppercase flex items-center mb-1">
                                <KeyIcon className="w-4 h-4 mr-2"/> Secretos y Pensamientos Privados
                            </label>
                            <textarea 
                                value={form.privateThoughts || ''} 
                                onChange={e => setForm(v => ({...v, privateThoughts: e.target.value}))} 
                                rows={10} 
                                className="w-full bg-gray-900 border-l-4 border-red-600 border-t border-r border-b border-gray-700 rounded-r-xl p-4 text-sm text-gray-200 font-mono focus:ring-1 focus:ring-red-500 outline-none shadow-inner"
                                placeholder="Datos ocultos, miedos o lógica interna..."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-yellow-500 uppercase flex items-center mb-1">
                                <BookOpenIcon className="w-4 h-4 mr-2"/> Fragmento de Diario / Monólogo Interior
                            </label>
                            <textarea 
                                value={form.diaryFragment || ''} 
                                onChange={e => setForm(v => ({...v, diaryFragment: e.target.value}))} 
                                rows={12} 
                                className="w-full bg-gray-800/50 border-l-4 border-yellow-600 border-t border-r border-b border-gray-700 rounded-r-xl p-4 text-base text-gray-100 font-serif italic focus:ring-1 focus:ring-yellow-500 outline-none shadow-inner leading-relaxed"
                                placeholder="Escribe en primera persona un fragmento de su diario..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button onClick={resetForm} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-black text-white shadow-xl shadow-cyan-900/20 uppercase tracking-widest transition-all transform active:scale-95">Guardar Archivo de Datos</button>
                    </div>
                </div>
            )}

            {/* --- SCROLLABLE MILESTONE LIST --- */}
            <div className="flex-grow overflow-y-auto max-h-[600px] pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {filteredEvolution.map((milestone) => (
                    <div key={milestone.id} className="animate-fade-in-fast">
                        <div 
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group shadow-lg ${
                                expandedMilestoneId === milestone.id 
                                ? 'bg-gray-800 border-cyan-500/50 shadow-cyan-500/5' 
                                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                            }`}
                            onClick={() => setExpandedMilestoneId(expandedMilestoneId === milestone.id ? null : milestone.id)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-4 overflow-hidden">
                                    <div className={`p-3 rounded-xl ${milestone.achieved ? 'bg-green-900/20 text-green-400 border border-green-800/30' : 'bg-gray-800 text-gray-500'}`}>
                                        <FileTextIcon className="w-6 h-6"/>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-black text-gray-100 text-base uppercase tracking-tight truncate">{milestone.name}</span>
                                            {milestone.arcId && <span className="text-[9px] bg-cyan-900/40 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800/50 font-black tracking-widest uppercase">ARC-LINK</span>}
                                        </div>
                                        <div className="flex items-center space-x-4 text-[11px] text-gray-500 mt-1 font-bold">
                                            <span className="flex items-center"><CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-cyan-700"/> {milestone.dateAchieved || 'SIN FECHA'}</span>
                                            <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wider ${categoryColors[milestone.category]}`}>{milestone.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCopy(milestone); }} 
                                        className={`p-2 transition-colors rounded-xl border border-gray-700 ${justCopiedId === milestone.id ? 'bg-green-900 text-green-400 border-green-500' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
                                        title="Copiar Dossier completo"
                                    >
                                        {justCopiedId === milestone.id ? <CheckIcon className="w-4 h-4"/> : <CopyIcon className="w-4 h-4"/>}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(milestone); }} className="p-2 bg-gray-800 hover:bg-cyan-900 text-cyan-400 rounded-xl border border-gray-700" title="Editar"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(milestone.id); }} className="p-2 bg-gray-800 hover:bg-red-900 text-red-500 rounded-xl border border-gray-700" title="Eliminar"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>

                            {/* PREVIEW: FULL WIDTH FOR ALL BLOCKS */}
                            {expandedMilestoneId !== milestone.id && (
                                <div className="mt-5 flex flex-col space-y-4 pl-1 border-l-2 border-gray-800">
                                    {milestone.description && (
                                        <div className="bg-cyan-950/10 p-4 rounded-r-2xl border-l-4 border-cyan-600 shadow-sm">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <ListCheckIcon className="w-4 h-4 text-cyan-500"/>
                                                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em]">Hechos Vividos</span>
                                            </div>
                                            <p className="text-sm text-gray-200 line-clamp-5 leading-relaxed font-sans">
                                                {milestone.description}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {milestone.privateThoughts && (
                                        <div className="bg-red-950/10 p-4 rounded-r-2xl border-l-4 border-red-600 shadow-sm">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <KeyIcon className="w-4 h-4 text-red-500"/>
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Archivo Clasificado (Secreto)</span>
                                            </div>
                                            <p className="text-sm text-red-100/70 line-clamp-5 font-mono leading-relaxed italic">
                                                {milestone.privateThoughts}
                                            </p>
                                        </div>
                                    )}

                                    {milestone.diaryFragment && (
                                        <div className="bg-yellow-950/10 p-4 rounded-r-2xl border-l-4 border-yellow-600 shadow-sm">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <BookOpenIcon className="w-4 h-4 text-yellow-500"/>
                                                <span className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em]">Fragmento de Diario</span>
                                            </div>
                                            <p className="text-base text-gray-100/80 line-clamp-5 font-serif italic leading-relaxed">
                                                "{milestone.diaryFragment}"
                                            </p>
                                        </div>
                                    )}
                                    
                                    {(!milestone.description && !milestone.privateThoughts && !milestone.diaryFragment) && (
                                        <p className="text-[10px] text-gray-600 italic py-2 pl-3">Sin registros detallados...</p>
                                    )}
                                </div>
                            )}

                            {expandedMilestoneId === milestone.id && (
                                <div className="mt-6 pt-6 border-t border-gray-700/50 space-y-10 animate-fade-in-fast text-gray-300">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-3 bg-black/30 rounded-xl border border-gray-700/50 shadow-inner">
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">Estado Mental</p>
                                            <p className="text-sm font-black text-red-400">{milestone.mentalState || 'N/A'}</p>
                                        </div>
                                        <div className="p-3 bg-black/30 rounded-xl border border-gray-700/50 shadow-inner">
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">Rol en el Arco</p>
                                            <p className="text-sm font-bold text-cyan-200">{milestone.roleAtMoment || 'N/A'}</p>
                                        </div>
                                        <div className="p-3 bg-black/30 rounded-xl border border-gray-700/50 shadow-inner">
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">Ubicación</p>
                                            <p className="text-sm text-gray-400">{milestone.locationAtMoment || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="animate-fade-in-fast">
                                        <h5 className="text-[10px] font-black text-cyan-500 uppercase mb-4 flex items-center tracking-[0.2em]">
                                            <ListCheckIcon className="w-4 h-4 mr-3"/> Crónica de Hechos Vividos
                                        </h5>
                                        <div className="text-base leading-relaxed bg-gray-900/80 p-8 rounded-2xl border-l-4 border-cyan-600 border-t border-r border-b border-gray-800 text-gray-200 shadow-2xl whitespace-pre-wrap font-sans">
                                            {milestone.description || <span className="italic opacity-30 text-sm">Sin registros detallados...</span>}
                                        </div>
                                    </div>

                                    {milestone.tacticalPoints && milestone.tacticalPoints.length > 0 && (
                                        <div>
                                            <h5 className="text-[10px] font-black text-orange-500 uppercase mb-3 flex items-center tracking-widest">
                                                <BrainCircuitIcon className="w-3.5 h-3.5 mr-2"/> Análisis Táctico y Deducciones
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {milestone.tacticalPoints.map((p, i) => (
                                                    <div key={i} className="flex items-start space-x-3 bg-orange-950/10 p-3 rounded-xl border border-orange-900/20">
                                                        <span className="text-orange-500 font-black mt-0.5">•</span>
                                                        <span className="text-xs text-orange-200/80 font-mono">{p}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-10">
                                        {milestone.privateThoughts && (
                                            <div className="animate-fade-in-fast">
                                                <h5 className="text-[10px] font-black text-red-500 uppercase mb-4 flex items-center tracking-[0.2em]">
                                                    <KeyIcon className="w-4 h-4 mr-3"/> Archivo Clasificado: Pensamientos Privados
                                                </h5>
                                                <div className="bg-red-950/10 p-8 border-l-4 border-red-600 rounded-r-2xl text-base font-mono text-gray-200 leading-loose shadow-xl ring-1 ring-red-900/20 whitespace-pre-wrap italic">
                                                    {milestone.privateThoughts}
                                                </div>
                                            </div>
                                        )}

                                        {milestone.diaryFragment && (
                                            <div className="animate-fade-in-fast">
                                                <h5 className="text-[10px] font-black text-yellow-500 uppercase mb-4 flex items-center tracking-[0.2em]">
                                                    <BookOpenIcon className="w-4 h-4 mr-3"/> Fragmento de Diario Personal
                                                </h5>
                                                <div className="font-serif text-xl italic bg-gray-800/30 p-10 rounded-2xl border-l-4 border-yellow-600 border-t border-r border-b border-yellow-900/10 text-gray-100 relative shadow-2xl min-h-[180px] leading-relaxed whitespace-pre-wrap">
                                                    <span className="absolute -top-4 -left-2 text-[140px] text-yellow-500/5 font-serif pointer-events-none select-none">"</span>
                                                    <div className="relative z-10 pl-4 pr-4">
                                                        {milestone.diaryFragment}
                                                    </div>
                                                    <span className="absolute -bottom-14 -right-2 text-[140px] text-yellow-500/5 font-serif pointer-events-none select-none">"</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Actions Bar */}
            {!isAdding && !editingId && (
                <div className="flex gap-2 mt-4 flex-shrink-0 bg-gray-900/80 backdrop-blur p-2 rounded-xl border border-gray-700/50 shadow-2xl">
                    <button onClick={() => setIsAdding(true)} className="flex-grow flex items-center justify-center space-x-3 px-4 py-4 bg-gray-800/40 hover:bg-gray-800 rounded-2xl font-black transition-all text-xs border-2 border-dashed border-gray-700 hover:border-cyan-500/50 hover:text-cyan-400 uppercase tracking-[0.2em] shadow-xl active:scale-[0.98]">
                        <PlusIcon className="w-5 h-5"/> <span>Crear Nuevo Archivo de Etapa</span>
                    </button>
                    {hasClipboard && (
                        <button onClick={handlePaste} className="flex items-center justify-center space-x-2 px-6 py-4 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 rounded-2xl font-black transition-all text-xs border-2 border-cyan-500/30 uppercase tracking-[0.1em] shadow-xl active:scale-[0.98]" title="Pegar Dossier copiado">
                            <ClipboardPasteIcon className="w-5 h-5"/>
                            <span className="hidden sm:inline">Pegar Dossier</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
