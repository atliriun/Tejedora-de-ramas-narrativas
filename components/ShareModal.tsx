import React, { useState } from 'react';
import { XIcon } from './icons';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    collab: any;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, collab }) => {
    const [editorUid, setEditorUid] = useState('');
    const [viewerUid, setViewerUid] = useState('');
    const [joinProjectId, setJoinProjectId] = useState('');
    const [activeTab, setActiveTab] = useState<'current' | 'join'>('current');

    if (!isOpen) return null;

    const handleShare = async () => {
        await collab.shareProject();
    };

    const handleAddEditor = async () => {
        if (!editorUid) return;
        const newEditors = [...new Set([...collab.collaborators.editors, editorUid])];
        await collab.updateRoles(newEditors, collab.collaborators.viewers);
        setEditorUid('');
    };

    const handleAddViewer = async () => {
        if (!viewerUid) return;
        const newViewers = [...new Set([...collab.collaborators.viewers, viewerUid])];
        await collab.updateRoles(collab.collaborators.editors, newViewers);
        setViewerUid('');
    };

    const handleRemoveEditor = async (uid: string) => {
        const newEditors = collab.collaborators.editors.filter((id: string) => id !== uid);
        await collab.updateRoles(newEditors, collab.collaborators.viewers);
    };

    const handleRemoveViewer = async (uid: string) => {
        const newViewers = collab.collaborators.viewers.filter((id: string) => id !== uid);
        await collab.updateRoles(collab.collaborators.editors, newViewers);
    };

    const handleJoinProject = async () => {
        if (!joinProjectId) return;
        await collab.loadProject(joinProjectId);
        setJoinProjectId('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-lg font-bold text-gray-100">Colaboración en Tiempo Real</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors">
                        <XIcon />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {!collab.user ? (
                        <div className="text-center space-y-4">
                            <p className="text-gray-300 text-sm">Inicia sesión para habilitar la colaboración en la nube y compartir tu proyecto con otros.</p>
                            <button 
                                onClick={collab.loginWithGoogle}
                                className="w-full py-2 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Iniciar sesión con Google
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                                <div className="flex items-center space-x-3">
                                    <img src={collab.user.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="text-sm font-medium text-white">{collab.user.displayName}</p>
                                        <p className="text-xs text-gray-400">{collab.user.email}</p>
                                    </div>
                                </div>
                                <button onClick={collab.logout} className="text-xs text-red-400 hover:text-red-300">Cerrar sesión</button>
                            </div>

                            <div className="flex border-b border-gray-700">
                                <button 
                                    onClick={() => setActiveTab('current')}
                                    className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${activeTab === 'current' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Proyecto Actual
                                </button>
                                <button 
                                    onClick={() => setActiveTab('join')}
                                    className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${activeTab === 'join' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Unirse a Proyecto
                                </button>
                            </div>

                            {activeTab === 'current' && (
                                <>
                                    {!collab.cloudProjectId ? (
                                        <div className="text-center space-y-4 mt-4">
                                            <p className="text-gray-300 text-sm">Tu proyecto actualmente solo se guarda en tu dispositivo. Súbelo a la nube para colaborar.</p>
                                            <button 
                                                onClick={handleShare}
                                                disabled={collab.isSyncing}
                                                className="w-full py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                                            >
                                                {collab.isSyncing ? 'Sincronizando...' : 'Subir a la nube y Compartir'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 mt-4">
                                            <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                                                <p className="text-sm text-green-400 font-medium">Proyecto sincronizado en la nube</p>
                                                <p className="text-xs text-gray-400 mt-1">ID del Proyecto: <span className="font-mono text-gray-300 select-all">{collab.cloudProjectId}</span></p>
                                                <p className="text-xs text-gray-400 mt-1">Tu UID: <span className="font-mono text-gray-300 select-all">{collab.user.uid}</span></p>
                                                <div className="mt-3 pt-3 border-t border-green-500/30">
                                                    <p className="text-xs text-gray-400 mb-1">Enlace para compartir:</p>
                                                    <div className="flex space-x-2">
                                                        <input 
                                                            type="text" 
                                                            readOnly 
                                                            value={`${window.location.origin}${window.location.pathname}?project=${collab.cloudProjectId}`}
                                                            className="flex-1 bg-black/50 border border-green-500/30 rounded px-2 py-1 text-xs text-green-400 font-mono focus:outline-none"
                                                        />
                                                        <button 
                                                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?project=${collab.cloudProjectId}`)}
                                                            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors"
                                                        >
                                                            Copiar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {collab.collaborators.ownerId === collab.user.uid && (
                                                <>
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold text-gray-300">Editores (UIDs)</h3>
                                                        <div className="flex space-x-2">
                                                            <input 
                                                                type="text" 
                                                                value={editorUid}
                                                                onChange={(e) => setEditorUid(e.target.value)}
                                                                placeholder="UID del usuario..." 
                                                                className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                                            />
                                                            <button onClick={handleAddEditor} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm font-medium">Añadir</button>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {collab.collaborators.editors.map((uid: string) => (
                                                                <li key={uid} className="flex justify-between items-center bg-gray-900/50 px-3 py-2 rounded-md border border-gray-700">
                                                                    <span className="text-xs font-mono text-gray-300">{uid}</span>
                                                                    <button onClick={() => handleRemoveEditor(uid)} className="text-red-400 hover:text-red-300"><XIcon className="w-3 h-3" /></button>
                                                                </li>
                                                            ))}
                                                            {collab.collaborators.editors.length === 0 && <li className="text-xs text-gray-500 italic">No hay editores.</li>}
                                                        </ul>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold text-gray-300">Visualizadores (UIDs)</h3>
                                                        <div className="flex space-x-2">
                                                            <input 
                                                                type="text" 
                                                                value={viewerUid}
                                                                onChange={(e) => setViewerUid(e.target.value)}
                                                                placeholder="UID del usuario..." 
                                                                className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                                            />
                                                            <button onClick={handleAddViewer} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm font-medium">Añadir</button>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {collab.collaborators.viewers.map((uid: string) => (
                                                                <li key={uid} className="flex justify-between items-center bg-gray-900/50 px-3 py-2 rounded-md border border-gray-700">
                                                                    <span className="text-xs font-mono text-gray-300">{uid}</span>
                                                                    <button onClick={() => handleRemoveViewer(uid)} className="text-red-400 hover:text-red-300"><XIcon className="w-3 h-3" /></button>
                                                                </li>
                                                            ))}
                                                            {collab.collaborators.viewers.length === 0 && <li className="text-xs text-gray-500 italic">No hay visualizadores.</li>}
                                                        </ul>
                                                    </div>
                                                </>
                                            )}
                                            {collab.collaborators.ownerId !== collab.user.uid && (
                                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                                    <p className="text-sm text-gray-300">No eres el propietario de este proyecto. Solo el propietario puede gestionar los roles.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'join' && (
                                <div className="space-y-4 mt-4">
                                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                        <p className="text-sm text-gray-300">Para unirte a un proyecto, el propietario debe añadir tu UID a la lista de colaboradores.</p>
                                        <p className="text-xs text-gray-400 mt-2">Tu UID para compartir:</p>
                                        <p className="font-mono text-cyan-400 text-sm select-all bg-black/50 p-2 rounded mt-1">{collab.user.uid}</p>
                                    </div>
                                    <p className="text-sm text-gray-300">Pega aquí el ID del proyecto al que fuiste invitado:</p>
                                    <div className="space-y-2">
                                        <input 
                                            type="text" 
                                            value={joinProjectId}
                                            onChange={(e) => setJoinProjectId(e.target.value)}
                                            placeholder="ID del Proyecto..." 
                                            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                        <button 
                                            onClick={handleJoinProject}
                                            disabled={!joinProjectId || collab.isSyncing}
                                            className="w-full py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                                        >
                                            {collab.isSyncing ? 'Conectando...' : 'Unirse al Proyecto'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
