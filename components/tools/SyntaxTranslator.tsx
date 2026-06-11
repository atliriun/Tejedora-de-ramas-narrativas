
import React, { useState, useEffect } from 'react';
import { parseTextToStructuredBlocks, formatBlocksToAiPrompt } from '../../utils/ai/textParser';
import { CopyIcon, CheckIcon, RefreshIcon, ArrowUpIcon } from '../icons';

export const SyntaxTranslator: React.FC = () => {
    const [input, setInput] = useState('—Hola, viajero.— dijo el anciano. (No parece de fiar...) **CRACK**\nUna rama se rompió.');
    const [jsonOutput, setJsonOutput] = useState('');
    const [aiPromptOutput, setAiPromptOutput] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const blocks = parseTextToStructuredBlocks(input);
        // Formato legible para humanos
        setJsonOutput(JSON.stringify(blocks, null, 2));
        // Formato comprimido para la IA
        setAiPromptOutput(formatBlocksToAiPrompt(blocks));
    }, [input]);

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in-fast">
            <div className="bg-cyan-900/20 border border-cyan-500/30 p-3 rounded-lg text-xs text-cyan-200">
                <p className="font-bold mb-1">Reglas de Sintaxis:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-400">
                    <li><span className="text-rose-400">—Diálogo—</span> (Guiones largos)</li>
                    <li><span className="text-cyan-400">(Pensamiento Interno)</span> (Paréntesis)</li>
                    <li><span className="text-yellow-400">**Énfasis / Acción Clave**</span> (Asteriscos dobles)</li>
                    <li>Texto normal = Acción Narrativa</li>
                </ul>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Entrada de Texto Narrativo</label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-1 focus:ring-cyan-500 outline-none resize-none font-serif leading-relaxed"
                    placeholder="Escribe tu historia aquí..."
                />
            </div>

            <div className="flex justify-center">
                <ArrowUpIcon className="w-5 h-5 text-gray-600 rotate-180" />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Salida Estructurada (JSON)</label>
                    <button 
                        onClick={handleCopy} 
                        className="text-[10px] flex items-center space-x-1 text-cyan-500 hover:text-cyan-400"
                    >
                        {copied ? <CheckIcon className="w-3 h-3"/> : <CopyIcon className="w-3 h-3"/>}
                        <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
                    </button>
                </div>
                <div className="relative flex-1 bg-black/50 border border-gray-800 rounded-lg overflow-hidden">
                    <pre className="absolute inset-0 p-3 text-[10px] font-mono text-green-400 overflow-auto scrollbar-thin scrollbar-thumb-gray-700">
                        {jsonOutput}
                    </pre>
                </div>
            </div>
            
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Prompt Real enviado a IA (Minificado)</label>
                <code className="text-[9px] font-mono text-gray-400 break-all">
                    {aiPromptOutput}
                </code>
            </div>
        </div>
    );
};
