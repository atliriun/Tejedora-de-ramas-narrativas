
import React, { useState, useEffect } from 'react';
import { SaveIcon } from './icons';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fileName: string) => void;
  defaultFileName: string;
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({ isOpen, onClose, onSave, defaultFileName }) => {
  const [fileName, setFileName] = useState(defaultFileName);

  useEffect(() => {
    if (isOpen) {
      // Set filename when modal opens, removing .json if present
      setFileName(defaultFileName.replace(/\.json$/, ''));
    }
  }, [isOpen, defaultFileName]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (fileName.trim()) {
      onSave(fileName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveClick();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in-fast">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-cyan-400 flex items-center space-x-2">
          <SaveIcon />
          <span>Guardar Proyecto Como...</span>
        </h2>
        
        <label htmlFor="filename-input" className="text-sm font-medium text-gray-300">Nombre del archivo:</label>
        <div className="relative mt-1">
          <input
            id="filename-input"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 pr-12 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">.json</span>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!fileName.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
