
import React, { useRef, useState } from 'react';
import { ImageIcon, TrashIcon, UploadIcon, PlusIcon } from '../icons';
import { processImageFile } from '../../utils/imageUtils';

interface ImageUploaderProps {
    images: string[];
    onUpdate: (images: string[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images = [], onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            // Compress and resize image before storing to avoid bloating JSON
            const base64Image = await processImageFile(file);
            onUpdate([...images, base64Image]);
        } catch (error) {
            console.error("Error processing image:", error);
            alert("Error al procesar la imagen. Intenta con un archivo más pequeño o formato estándar (JPG/PNG).");
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onUpdate(newImages);
    };

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-700 pb-1 flex items-center">
                <ImageIcon className="w-3 h-3 mr-1"/> Imágenes y Referencias
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((imgSrc, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-700 bg-black/50 aspect-square">
                        <img 
                            src={imgSrc} 
                            alt={`Reference ${index + 1}`} 
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                        />
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                            className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar imagen"
                        >
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                
                {/* Upload Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-cyan-500 hover:bg-gray-800/50 transition-all text-gray-500 hover:text-cyan-400"
                >
                    {isProcessing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                    ) : (
                        <>
                            <UploadIcon className="w-6 h-6 mb-1" />
                            <span className="text-[9px] font-bold uppercase">Subir</span>
                        </>
                    )}
                </button>
            </div>

            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden" 
            />
            
            <p className="text-[9px] text-gray-600 italic">
                Las imágenes se guardan dentro del proyecto. Se redimensionan automáticamente para ahorrar espacio.
            </p>
        </div>
    );
};
