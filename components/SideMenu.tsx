
import React from 'react';
import { CogIcon } from './icons';
import { SearchTab } from './sidemenu/SearchTab';
import { AiSettingsTab } from './sidemenu/AiSettingsTab';
import { ProjectTab } from './sidemenu/ProjectTab';
import { PanelShell } from './ui/PanelShell';

import { DocumentsTab } from './sidemenu/DocumentsTab';

interface SideMenuProps {
    ui: any;
    search: any;
    ai: any;
    project: any;
    actions: any;
    autoSave: any;
    nodeReadableIds: Map<string, string>;
}

export const SideMenu: React.FC<SideMenuProps> = ({ 
    ui, search, ai, project, actions, autoSave 
}) => {
    const activeTab = ui.tabs.activeSideMenuTab;

    return (
        <PanelShell
            id="sidemenu"
            side="right"
            isOpen={ui.panels.isMenuOpen}
            onClose={() => ui.panels.setIsMenuOpen(false)}
            title="Herramientas"
            icon={<CogIcon />}
            widthConfig={{ initial: 400, min: 300, max: 600 }}
        >
            <div className="flex border-b border-gray-700 flex-shrink-0">
                 {(['search', 'aiSettings', 'documents', 'project'] as const).map(tab => (
                     <button 
                        key={tab}
                        onClick={() => ui.tabs.setActiveSideMenuTab(tab)}
                        className={`flex-1 py-2 text-xs md:text-sm font-medium text-center capitalize transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-700/30' : 'text-gray-400 hover:text-white hover:bg-gray-700/20'}`}
                     >
                        {tab === 'search' ? 'Búsqueda' : 
                         tab === 'aiSettings' ? 'Ajustes' : 
                         tab === 'documents' ? 'Documentos' : 
                         'Proyecto'}
                     </button>
                 ))}
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
                {activeTab === 'search' && (
                    <SearchTab 
                        search={search}
                        projectActions={actions.project}
                        onClose={() => ui.panels.setIsMenuOpen(false)}
                    />
                )}
                {activeTab === 'aiSettings' && (
                    <AiSettingsTab 
                        settings={ai.settings} 
                        onSettingsChange={ai.setSettings} 
                    />
                )}
                {activeTab === 'documents' && (
                    <DocumentsTab 
                        documents={project.data.referenceDocuments || []} 
                        onUpdate={(docs) => actions.project.handleUpdateItem('referenceDocuments', 'all', docs)} 
                    />
                )}
                {activeTab === 'project' && (
                    <ProjectTab 
                        project={project}
                        actions={actions}
                        autoSave={autoSave}
                        openSaveAs={() => ui.modals.setIsSaveAsModalOpen(true)}
                    />
                )}
            </div>
        </PanelShell>
    )
};
