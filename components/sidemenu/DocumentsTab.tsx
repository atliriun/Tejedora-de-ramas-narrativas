import React, { useRef, useState } from 'react';
import { ReferenceDocument } from '../../types';
import { FileTextIcon, TrashIcon, UploadIcon, PlusIcon, XIcon, CheckIcon } from '../icons';
import { generateUUID } from '../../utils/uuid';

interface DocumentsTabProps {
    documents: ReferenceDocument[];
    onUpdate: (docs: ReferenceDocument[]) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editContent, setEditContent] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target?.result as string;
                if (!text) return;
                
                const newDoc: ReferenceDocument = {
                    id: generateUUID(),
                    name: file.name,
                    content: text
                };
                
                onUpdate([...documents, newDoc]);
            };
            reader.readAsText(file);
        });

        // Reset input so the same files can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar este documento de contexto?")) {
            onUpdate(documents.filter(d => d.id !== id));
        }
    };

    const startEditing = (doc: ReferenceDocument) => {
        setEditingDocId(doc.id);
        setEditName(doc.name);
        setEditContent(doc.content);
    };

    const clearEditing = () => {
        setEditingDocId(null);
        setEditName('');
        setEditContent('');
    };

    const saveEditing = () => {
        if (!editName.trim() || !editContent.trim()) {
            alert("El nombre y el contenido son obligatorios.");
            return;
        }

        if (editingDocId === 'new') {
            const newDoc: ReferenceDocument = {
                id: generateUUID(),
                name: editName,
                content: editContent
            };
            onUpdate([...documents, newDoc]);
        } else {
            onUpdate(documents.map(d => 
                d.id === editingDocId ? { ...d, name: editName, content: editContent } : d
            ));
        }
        clearEditing();
    };

    const handleCreateNew = () => {
        setEditingDocId('new');
        setEditName('Nuevo Documento');
        setEditContent('');
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-300 flex items-center mb-2">
                    <FileTextIcon className="w-5 h-5 mr-2 text-cyan-400" />
                    Documentos de Contexto
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                    Sube archivos de texto (.txt, .md) o pega contenido directamente para proporcionar contexto adicional permanente a la IA.
                </p>

                <div className="flex space-x-2">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        multiple
                        accept=".txt,.md,.csv"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded px-3 py-2 text-sm font-medium transition-colors"
                    >
                        <UploadIcon />
                        <span>Subir Archivos</span>
                    </button>
                    <button 
                        onClick={handleCreateNew}
                        className="flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 rounded px-3 py-2 text-sm font-medium transition-colors"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 space-y-2">
                {editingDocId && (
                    <div className="bg-gray-800 p-3 rounded-lg border border-cyan-500/50 mb-4 shadow-lg animate-fade-in-fast flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-cyan-300">
                                {editingDocId === 'new' ? 'Nuevo Documento' : 'Editar Documento'}
                            </h4>
                            <div className="flex space-x-1">
                                <button onClick={saveEditing} className="p-1.5 bg-green-600/30 text-green-400 hover:bg-green-600 hover:text-white rounded transition-colors" title="Guardar">
                                    <CheckIcon />
                                </button>
                                <button onClick={clearEditing} className="p-1.5 bg-gray-700 hover:bg-red-600 hover:text-white rounded transition-colors" title="Cancelar">
                                    <XIcon />
                                </button>
                            </div>
                        </div>
                        
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nombre del documento..."
                            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm w-full outline-none focus:border-cyan-500"
                        />
                        
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Pega aquí el contenido del documento. Se enviará como contexto a la IA."
                            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs w-full h-48 resize-none outline-none focus:border-cyan-500"
                        />
                    </div>
                )}

                {documents.map(doc => (
                    <div 
                        key={doc.id}
                        className={`bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-lg p-3 transition-colors cursor-pointer group ${editingDocId === doc.id ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={() => startEditing(doc)}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2 overflow-hidden pr-2">
                                <FileTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <h4 className="font-semibold text-sm text-gray-200 truncate">{doc.name}</h4>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-900 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                title="Eliminar documento"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 truncate">
                            {doc.content.substring(0, 100)}{doc.content.length > 100 ? '...' : ''}
                        </p>
                        <div className="text-[10px] text-gray-600 mt-1">
                            {doc.content.length} caracteres
                        </div>
                    </div>
                ))}

                {documents.length === 0 && !editingDocId && (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500 text-center space-y-2 border-2 border-dashed border-gray-700 rounded-lg">
                        <FileTextIcon className="w-8 h-8 opacity-50" />
                        <p className="text-sm">No hay documentos de contexto cargados.</p>
                        <p className="text-xs">Sube archivos txt o md para añadirlos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
