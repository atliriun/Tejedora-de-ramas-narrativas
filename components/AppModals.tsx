
import React from 'react';
import { EditModal } from './EditModal';
import { ConfirmationModal } from './ConfirmationModal';
import { SaveAsModal } from './SaveAsModal';
import { DirectorModeModal } from './DirectorModeModal';
import { EntityType } from '../types';
import { CharacterStateModal } from './CharacterStateModal';

interface Props {
    modals: any;   
    project: any;  
    actions: any;  
    ai: any;
    graphRef?: any;        
}

export const AppModals: React.FC<Props> = ({ modals, project, actions, ai, graphRef }) => {
    const { 
        editingNode, setEditingNode, 
        nodeToDelete, setNodeToDelete, 
        itemToDelete, setItemToDelete, 
        isSaveAsModalOpen, setIsSaveAsModalOpen, 
        isDirectorModalOpen, setIsDirectorModalOpen, 
        directorTargetNode,
        nodeIdToPromote, setNodeIdToPromote 
    } = modals;
    
    const { data, name, activeArc } = project;
    const { node: nodeActions, project: projectActions } = actions;
    const { actions: aiActions, loading: aiLoading } = ai;

    const getTypeLabel = (type: EntityType) => {
        switch(type) {
            case 'character': return 'Personaje';
            case 'scenario': return 'Escenario';
            case 'magic system': return 'Sistema Mágico';
            case 'world object': return 'Objeto';
            case 'species': return 'Especie';
            case 'secret': return 'Secreto';
            case 'psychological trait': return 'Rasgo';
            case 'world logic rule': return 'Regla';
            case 'tag group': return 'Grupo de Etiquetas';
            case 'lore entry': return 'Entrada de Lore';
            case 'narrative goal': return 'Objetivo';
            case 'story arc': return 'Arco Narrativo';
            case 'story flag': return 'Interruptor';
            default: return 'Elemento';
        }
    };

    return (
        <>
            {editingNode && (
                <EditModal 
                    nodeData={editingNode.data} 
                    allCharacters={data.characters}
                    onSave={(id, newName, bookmarkedParagraphs, blocks) => { nodeActions.onUpdateNodeData(id, { name: newName, bookmarkedParagraphs, blocks }); setEditingNode(null); }} 
                    onClose={() => setEditingNode(null)} 
                />
            )}
            
            <DirectorModeModal
                isOpen={isDirectorModalOpen}
                onClose={() => setIsDirectorModalOpen(false)}
                targetNode={directorTargetNode}
                onChat={aiActions.handleDirectorChat}
                onManualMessageAdd={nodeActions.handleDirectorMessageAdd}
                onCreateChild={nodeActions.handleAddChild} 
                onUpdateNodeData={nodeActions.onUpdateNodeData}
                allCharacters={data.characters}
                allScenarios={data.scenarios}
                allTagGroups={data.tagGroups}
                allDocuments={data.referenceDocuments || []}
                isGenerating={!!aiLoading.continuingPlotNodeId}
                onUpdateMessage={nodeActions.handleDirectorMessageUpdate}
                onToggleBookmark={nodeActions.handleDirectorMessageToggleBookmark}
                onDeleteMessage={nodeActions.handleDirectorMessageDelete}
                onRegenerateResponse={aiActions.handleRegenerateAiResponse}
                onUpdateCharacter={(id, u) => projectActions.handleUpdateItem('characters', id, u)}
                onStop={aiActions.handleStopGeneration}
                onLocateNode={(node) => graphRef?.current?.goToNode(node)}
                onSaveProject={() => projectActions.handleManualSave(name)} // ADDED: Save Handler
            />

            {nodeToDelete && (
                <ConfirmationModal 
                    isOpen={!!nodeToDelete} 
                    onClose={() => setNodeToDelete(null)} 
                    onConfirm={() => { if (activeArc) nodeActions.handleDeleteNode(nodeToDelete.data.id, activeArc.rootNode.id); setNodeToDelete(null); }} 
                    title="¿Eliminar Punto de Historia?"
                >
                    <p>¿Estás seguro de que quieres eliminar esta rama? Se perderán todos los nodos hijos.</p>
                </ConfirmationModal>
            )}
            
            {nodeIdToPromote && (
                <ConfirmationModal 
                    isOpen={!!nodeIdToPromote} 
                    onClose={() => setNodeIdToPromote(null)} 
                    onConfirm={() => { 
                        nodeActions.onPromoteToArc(nodeIdToPromote); 
                        setNodeIdToPromote(null); 
                    }} 
                    title="Dividir en Nuevo Arco"
                    confirmText="Crear Arco"
                >
                    <div className="space-y-2 text-sm">
                        <p>Estás a punto de cortar esta rama y convertirla en un <strong>Arco Narrativo independiente</strong>.</p>
                        <p className="text-yellow-400">⚠️ La rama se moverá del árbol actual al nuevo arco.</p>
                        <p>Esto es útil para organizar historias muy largas o gestionar subtramas complejas.</p>
                    </div>
                </ConfirmationModal>
            )}
            
            {itemToDelete && (
                <ConfirmationModal 
                    isOpen={!!itemToDelete} 
                    onClose={() => setItemToDelete(null)} 
                    onConfirm={() => { projectActions.handleDeleteItem(itemToDelete.type, itemToDelete.id); setItemToDelete(null); }} 
                    title={`¿Eliminar ${getTypeLabel(itemToDelete.type)}?`}
                >
                    <p>¿Confirmar eliminación de "{itemToDelete.name}"?</p>
                </ConfirmationModal>
            )}
            
            <SaveAsModal 
                isOpen={isSaveAsModalOpen} 
                onClose={() => setIsSaveAsModalOpen(false)} 
                onSave={(fileName) => { 
                    projectActions.handleManualSave(fileName); 
                    setIsSaveAsModalOpen(false); 
                }} 
                defaultFileName={name} 
            />
        </>
    );
};
