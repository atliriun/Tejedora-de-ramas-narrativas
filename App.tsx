
import React, { useEffect } from 'react';
import { AppModals } from './components/AppModals';
import { SideMenu } from './components/SideMenu';
import { PanelManager } from './components/PanelManager';
import { StoryGraph } from './components/StoryGraph';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppOrchestrator } from './hooks/useAppOrchestrator';
import { CogIcon } from './components/icons';

export default function App() {
  // Initialize the entire application logic via the Orchestrator
  const app = useAppOrchestrator();

  // Prevent accidental exit/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // It is standard practice to prevent default and return a string to trigger the browser's native confirmation dialog.
      e.preventDefault();
      e.returnValue = ''; // Setting this is required in many modern browsers to show the prompt
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen overflow-hidden bg-gray-900 flex flex-col relative">
        
        <PanelManager 
          ui={app.ui}
          projectData={app.project.data}
          projectActions={app.actions.project}
          aiSettings={app.ai.settings}
          documentContent={(app.project.data.referenceDocuments || []).map((d: any) => `## ${d.name}\n${d.content}`).join('\n\n')}
          storySummary={app.layout.storySummary}
        />

        <SideMenu 
            ui={app.ui}
            search={app.search}
            ai={app.ai}
            project={app.project}
            actions={app.actions}
            autoSave={app.autoSave}
            nodeReadableIds={app.layout.nodeReadableIds}
        />

        <TopBar 
            history={app.history}
            ui={app.ui}
            project={app.project}
            actions={app.actions}
            collab={app.collab}
        />

        <StoryGraph
          ref={app.refs.graphRef}
          nodes={app.layout.nodes} links={app.layout.links}
          nodeReadableIds={app.layout.nodeReadableIds} canonicalNodeIds={app.layout.canonicalNodeIds} 
          movingNodeId={app.ui.movingNodeId}
          characters={app.project.data.characters} scenarios={app.project.data.scenarios} tagGroups={app.project.data.tagGroups}
          aiSettings={app.ai.settings}
          onUpdateCharacter={(id, u) => app.actions.project.handleUpdateItem('characters', id, u)}
          nodeActions={{
              ...app.actions.node, 
              handleMoveNode: (targetId: string) => {
                  if (app.ui.movingNodeId) {
                      app.actions.node.handleMoveNode(app.ui.movingNodeId, targetId);
                      app.ui.setMovingNodeId(null);
                  }
              }
          }}
          aiActions={{
              ...app.ai.actions,
              handleContinuePlot: app.ui.modals.openDirectorModal 
          }}
          activeStates={{
              chattingNodeId: app.ui.chattingNodeId,
              translatingNodeId: app.ui.translatingNodeId,
              setChattingNodeId: app.ui.setChattingNodeId,
              setTranslatingNodeId: app.ui.setTranslatingNodeId
          }}
          interaction={app.ui.interaction}
          loadingStates={app.ai.loading}
          setEditingNode={app.ui.modals.setEditingNode}
          setNodeToDelete={app.ui.modals.setNodeToDelete}
          onSetMovingNodeId={app.ui.setMovingNodeId}
          onSetCopiedNodeData={app.ui.setCopiedNodeData}
          copiedNodeData={app.ui.copiedNodeData}
          onHeightChange={app.ui.handleNodeHeightChange}
          rootHierarchy={app.layout.root}
          onSearchByTag={(tag) => {
              app.search.setSearchQuery(tag);
              app.ui.panels.setIsMenuOpen(true);
              app.ui.tabs.setActiveSideMenuTab('search');
          }}
        />

        {!app.ui.panels.isMenuOpen && (
          <div className="lg:hidden fixed bottom-8 left-8 z-50">
            <button
              onClick={() => app.ui.panels.setIsMenuOpen(true)}
              className="p-5 rounded-2xl bg-cyan-600 border-2 border-cyan-400 text-white shadow-[0_10px_30px_rgba(34,211,238,0.4)] active:scale-90 transition-all flex items-center justify-center"
              title="Abrir Herramientas"
            >
              <CogIcon className="w-8 h-8" />
            </button>
          </div>
        )}

        <AppModals 
            modals={app.ui.modals}
            project={app.project}
            actions={app.actions}
            ai={app.ai}
            graphRef={app.refs.graphRef}
        />
      </div>
    </ErrorBoundary>
  );
}
