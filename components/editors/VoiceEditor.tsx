
import React, { useState } from 'react';
import { CharacterVoice } from '../../types';
import { StyledInput, StyledTextArea } from '../ui/Inputs';
import { PlusIcon, XIcon, MicIcon, QuoteIcon, BrainIcon } from '../icons';

interface VoiceEditorProps {
    voice: CharacterVoice | undefined;
    onUpdate: (newVoice: CharacterVoice) => void;
}

export const VoiceEditor: React.FC<VoiceEditorProps> = ({ voice, onUpdate }) => {
    // Initialize defaults if undefined (for legacy data migration)
    const currentVoice = voice || {
        tone: '',
        rhythm: '',
        vocabulary: '',
        style: '',
        catchphrases: [],
        sampleQuote: '',
        ideals: '',
        flaws: '',
        fears: '',
        desires: '',
        coreBeliefs: '',
        decisionMaking: '',
        innerMonologue: ''
    };

    const [activeTab, setActiveTab] = useState<'voice' | 'brain'>('brain');
    const [phraseInput, setPhraseInput] = useState('');

    const handleUpdateField = (field: keyof CharacterVoice, value: any) => {
        onUpdate({ ...currentVoice, [field]: value });
    };

    const handleAddPhrase = () => {
        if (phraseInput.trim()) {
            const newPhrases = [...(currentVoice.catchphrases || []), phraseInput.trim()];
            handleUpdateField('catchphrases', newPhrases);
            setPhraseInput('');
        }
    };

    const handleRemovePhrase = (phrase: string) => {
        const newPhrases = (currentVoice.catchphrases || []).filter(p => p !== phrase);
        handleUpdateField('catchphrases', newPhrases);
    };

    return (
        <div className="space-y-4 animate-fade-in-fast">
            <div className="flex border-b border-gray-700">
                <button
                    className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center transition-colors ${activeTab === 'brain' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('brain')}
                >
                    <BrainIcon className="w-4 h-4 mr-1.5"/> Cerebro y Personalidad
                </button>
                <button
                    className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center transition-colors ${activeTab === 'voice' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('voice')}
                >
                    <MicIcon className="w-4 h-4 mr-1.5"/> Voz y Diálogo
                </button>
            </div>

            {activeTab === 'brain' && (
                <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700 space-y-3 animate-fade-in-fast">
                    <div className="grid grid-cols-2 gap-3">
                        <StyledTextArea 
                            label="Ideales y Valores" 
                            value={currentVoice.ideals || ''} 
                            onChange={e => handleUpdateField('ideals', e.target.value)} 
                            rows={2}
                            placeholder="ej. La justicia por encima de todo, la familia es lo primero..." 
                        />
                        <StyledTextArea 
                            label="Filosofía / Creencias Centrales" 
                            value={currentVoice.coreBeliefs || ''} 
                            onChange={e => handleUpdateField('coreBeliefs', e.target.value)} 
                            rows={2}
                            placeholder="ej. El fin justifica los medios, el destino está escrito..." 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <StyledTextArea 
                            label="Deseos y Metas Ocultas" 
                            value={currentVoice.desires || ''} 
                            onChange={e => handleUpdateField('desires', e.target.value)} 
                            rows={2}
                            placeholder="ej. Quiere ser reconocido, busca venganza en secreto..." 
                        />
                        <StyledTextArea 
                            label="Miedos y Fobias" 
                            value={currentVoice.fears || ''} 
                            onChange={e => handleUpdateField('fears', e.target.value)} 
                            rows={2}
                            placeholder="ej. Miedo al fracaso, claustrofobia, terror al abandono..." 
                        />
                    </div>
                    
                    <StyledTextArea 
                        label="Defectos y Debilidades" 
                        value={currentVoice.flaws || ''} 
                        onChange={e => handleUpdateField('flaws', e.target.value)} 
                        rows={2}
                        placeholder="ej. Es demasiado confiado, tiene mal genio, egoísta..." 
                    />

                    <div className="border-t border-gray-700/50 pt-3 mt-2">
                        <StyledTextArea 
                            label="Monólogo Interno (Cómo piensa)" 
                            value={currentVoice.innerMonologue || ''} 
                            onChange={e => handleUpdateField('innerMonologue', e.target.value)} 
                            rows={2}
                            placeholder="ej. Analítico, ansioso, siempre juzgando a los demás en silencio..." 
                        />
                        <div className="mt-3">
                            <StyledTextArea 
                                label="Toma de Decisiones" 
                                value={currentVoice.decisionMaking || ''} 
                                onChange={e => handleUpdateField('decisionMaking', e.target.value)} 
                                rows={2}
                                placeholder="ej. Impulsivo, racionaliza todo, se deja llevar por las emociones..." 
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'voice' && (
                <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700 space-y-3 animate-fade-in-fast">
                    <div className="grid grid-cols-2 gap-3">
                        <StyledInput 
                            label="Tono Emocional Base" 
                            value={currentVoice.tone} 
                            onChange={e => handleUpdateField('tone', e.target.value)} 
                            placeholder="ej. Sarcástico, Tímido, Autoritario" 
                        />
                        <StyledInput 
                            label="Ritmo y Cadencia" 
                            value={currentVoice.rhythm} 
                            onChange={e => handleUpdateField('rhythm', e.target.value)} 
                            placeholder="ej. Rápido, Entrecortado, Pausado" 
                        />
                    </div>
                    
                    <StyledInput 
                        label="Nivel de Vocabulario (Léxico)" 
                        value={currentVoice.vocabulary} 
                        onChange={e => handleUpdateField('vocabulary', e.target.value)} 
                        placeholder="ej. Académico, Callejero, Arcaico" 
                    />

                    <StyledTextArea 
                        label="Estilo y Peculiaridades" 
                        value={currentVoice.style} 
                        onChange={e => handleUpdateField('style', e.target.value)} 
                        rows={2} 
                        placeholder="ej. Usa muchas metáforas, nunca hace preguntas, tartamudea si se pone nervioso..." 
                    />

                    {/* Catchphrases Tag Input */}
                    <div>
                        <label className="text-xs font-semibold text-gray-400 block mb-1">Muletillas y Frases Recurrentes</label>
                        <div className="flex space-x-2 mb-2">
                            <input 
                                className="flex-grow p-1.5 text-xs bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-cyan-500 outline-none"
                                value={phraseInput}
                                onChange={e => setPhraseInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddPhrase()}
                                placeholder="ej. 'Por las barbas de Merlin', 'En teoría...'"
                            />
                            <button onClick={handleAddPhrase} className="px-2 bg-gray-700 hover:bg-gray-600 rounded"><PlusIcon className="w-3 h-3"/></button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {(currentVoice.catchphrases || []).map((p, i) => (
                                <span key={i} className="text-[10px] bg-indigo-900/40 text-indigo-200 border border-indigo-700/50 px-2 py-0.5 rounded-full flex items-center group hover:border-indigo-500 transition-colors">
                                    "{p}"
                                    <button onClick={() => handleRemovePhrase(p)} className="ml-1 text-indigo-400 group-hover:text-white"><XIcon className="w-2 h-2"/></button>
                                </span>
                            ))}
                            {(currentVoice.catchphrases || []).length === 0 && <span className="text-[10px] text-gray-600 italic">Sin muletillas definidas.</span>}
                        </div>
                    </div>

                    {/* Sample Quote */}
                    <div className="mt-2 pt-2 border-t border-gray-700/50">
                        <label className="text-xs font-semibold text-yellow-500 block mb-1 flex items-center">
                            <QuoteIcon className="w-3 h-3 mr-1"/> Cita de Ejemplo (Referencia para IA)
                        </label>
                        <textarea 
                            className="w-full p-2 text-sm bg-black/30 border border-gray-600 rounded-md focus:ring-1 focus:ring-yellow-500 outline-none resize-y italic text-gray-300"
                            rows={3}
                            value={currentVoice.sampleQuote}
                            onChange={e => handleUpdateField('sampleQuote', e.target.value)}
                            placeholder="Escribe una frase típica que diría este personaje para que la IA imite su estilo..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
