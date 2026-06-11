
import React, { useState, useEffect } from 'react';
import type { NodeTranslation } from '../../types';
import { XIcon, SaveIcon, EditIcon, TrashIcon, ChevronDownIcon, CheckIcon, CopyIcon, LoaderIcon, SparkleIcon, PlusIcon } from '../icons';
import { uuid } from '../../utils/uuid';

export const TranslationsPanel: React.FC<{
  nodeId: string;
  translations: NodeTranslation[];
  onUpdate: (translations: NodeTranslation[]) => void;
  onTranslate: (translationId: string, language: string) => Promise<void>;
  defaultLanguage: string;
}> = ({ nodeId, translations, onUpdate, onTranslate, defaultLanguage }) => {
    const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  const handleAdd = () => {
    const newTranslation: NodeTranslation = { id: uuid(), language: defaultLanguage || 'Spanish', text: '', };
    onUpdate([...(translations || []), newTranslation]);
    setOpenAccordionId(newTranslation.id); setNewlyAddedId(newTranslation.id);
  };
  const handleDelete = (id: string) => { onUpdate((translations || []).filter(t => t.id !== id)); if (id === newlyAddedId) { setNewlyAddedId(null); } };
  const handleSave = (id: string, updates: Omit<NodeTranslation, 'id'>) => { onUpdate((translations || []).map(t => (t.id === id ? { id, ...updates } : t))); };
  const handleAiTranslate = async (translation: NodeTranslation) => { setTranslatingId(translation.id); await onTranslate(translation.id, translation.language); setTranslatingId(null); };
  const TranslationItem: React.FC<{ translation: NodeTranslation; isNewlyAdded: boolean; onCommitNew: () => void; }> = ({ translation, isNewlyAdded, onCommitNew }) => {
    const isOpen = openAccordionId === translation.id; const [copied, setCopied] = useState(false); const [isEditing, setIsEditing] = useState(isNewlyAdded); const [editedLanguage, setEditedLanguage] = useState(translation.language); const [editedText, setEditedText] = useState(translation.text);
    useEffect(() => { if (isNewlyAdded && !isOpen) { setOpenAccordionId(translation.id); } }, [isNewlyAdded, isOpen]);
    useEffect(() => { if (!isEditing) { setEditedLanguage(translation.language); setEditedText(translation.text); } }, [translation.language, translation.text, isEditing]);
    const handleCopy = () => { navigator.clipboard.writeText(translation.text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
    const handleEditStart = (e: React.MouseEvent) => { e.stopPropagation(); setIsEditing(true); if (!isOpen) { setOpenAccordionId(translation.id); } };
    const handleEditCancel = () => { if (isNewlyAdded) { handleDelete(translation.id); } else { setIsEditing(false); setEditedLanguage(translation.language); setEditedText(translation.text); } };
    const handleEditSave = () => { if (editedLanguage.trim()) { handleSave(translation.id, { language: editedLanguage.trim(), text: editedText.trim() }); setIsEditing(false); if (isNewlyAdded) { onCommitNew(); } } };
    return (
      <div className="bg-gray-900/50 rounded-md group">
        <div className="w-full flex justify-between items-center p-2 text-sm text-left font-semibold text-gray-300">
          {isEditing ? ( <input type="text" value={editedLanguage} onChange={e => setEditedLanguage(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') handleEditCancel(); }} className="bg-gray-900 border border-cyan-500 font-semibold focus:ring-1 focus:ring-cyan-500 rounded-md px-1 -ml-1 flex-grow" autoFocus /> ) : ( <span className="font-semibold truncate pr-2">{translation.language}</span> )}
          <div className="flex items-center space-x-1">
            {isEditing ? ( <> <button onClick={handleEditCancel} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white" title="Cancelar"><XIcon/></button> <button onClick={handleEditSave} className="p-1.5 rounded-full text-gray-400 hover:bg-green-600 hover:text-white" title="Guardar"><SaveIcon/></button> </> ) : ( <button onClick={handleEditStart} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white opacity-0 group-hover:opacity-100" title="Editar Traducción" ><EditIcon /></button> )}
            <button onClick={(e) => { e.stopPropagation(); handleDelete(translation.id); }} className="p-1.5 rounded-full text-gray-400 hover:bg-red-500 hover:text-white" title="Borrar Traducción" ><TrashIcon /></button>
            <button onClick={() => setOpenAccordionId(isOpen ? null : translation.id)} className="p-1.5 rounded-full hover:bg-gray-700"> <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /> </button>
          </div>
        </div>
        {isOpen && (
          <div className="p-2 border-t border-gray-700/50 animate-fade-in-fast">
            {isEditing ? ( <> <textarea value={editedText} onChange={e => setEditedText(e.target.value)} className="w-full h-24 p-2 text-xs bg-gray-900 border border-cyan-500 rounded-md outline-none resize-y" placeholder={`Traducción en ${editedLanguage}...`} onKeyDown={e => { if (e.key === 'Escape') handleEditCancel(); }} /> </> ) : ( <> <p className="w-full min-h-[6rem] p-2 text-xs text-gray-300 rounded-md overflow-auto break-words whitespace-pre-wrap"> {translation.text || <span className="italic text-gray-500">Sin traducción. Clic en Editar para añadir.</span>} </p> <div className="flex justify-end items-center space-x-2 mt-2"> <button onClick={handleCopy} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white" title="Copiar traducción" > {copied ? <CheckIcon /> : <CopyIcon />} </button> <button onClick={() => handleAiTranslate(translation)} disabled={translatingId === translation.id} className="flex items-center space-x-1.5 px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded-md text-xs font-semibold disabled:bg-gray-600" > {translatingId === translation.id ? <LoaderIcon /> : <SparkleIcon />} <span>Traducir con IA</span> </button> </div> </> )}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-2">
        {(translations || []).map(t => ( <TranslationItem key={t.id} translation={t} isNewlyAdded={t.id === newlyAddedId} onCommitNew={() => setNewlyAddedId(null)} /> ))}
        <button onClick={handleAdd} className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-md font-semibold transition-colors text-sm" > <PlusIcon /> <span>Añadir Traducción</span> </button>
    </div>
  );
};
