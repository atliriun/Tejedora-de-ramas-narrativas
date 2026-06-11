
import { useState, useEffect, useCallback } from 'react';
import { ProjectSaveState, AutoSave, ProjectData, AiSettings } from '../types';
import { get, set, del } from 'idb-keyval';

// Helper to strip heavy data from older saves to conserve space
const optimizeStateForHistory = (state: ProjectSaveState): ProjectSaveState => {
    return {
        ...state,
    };
};

export const useAutoSave = (
    projectName: string,
    projectData: ProjectData,
    aiSettings: AiSettings,
    searchHistory: string[]
) => {
    const [autoSaves, setAutoSaves] = useState<AutoSave[]>([]);
    const [autoSaveInterval, setAutoSaveInterval] = useState<number>(5 * 60 * 1000); // Default 5 min
    const [autoDownloadEnabled, setAutoDownloadEnabled] = useState<boolean>(false);

    // Load initial data safely
    useEffect(() => {
        const loadAutoSaves = async () => {
            try {
                let saved: any = await get('autoSaves');
                if (!saved) {
                    const lsSaved = localStorage.getItem('autoSaves');
                    if (lsSaved) {
                        try { saved = JSON.parse(lsSaved); } catch (e) {}
                    }
                }
                if (Array.isArray(saved)) {
                    setAutoSaves(saved);
                } else {
                    await del('autoSaves');
                    try { localStorage.removeItem('autoSaves'); } catch {}
                    setAutoSaves([]);
                }
            } catch (e) {
                console.error("Failed to load auto-saves (Corrupt Data):", e);
                try { await del('autoSaves'); } catch {}
                try { localStorage.removeItem('autoSaves'); } catch {}
                setAutoSaves([]);
            }
        };
        loadAutoSaves();
    }, []);

    const onDownloadAutoSave = useCallback((state: any, timestamp: number) => {
        const jsonString = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date(timestamp);
        const timestampString = date.toISOString().replace(/:/g, '-').slice(0, 19);
        a.download = `${state.projectName || 'Semidios Atrapado'}-${timestampString}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const onDownloadManualSave = useCallback((state: any) => {
        const jsonString = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.projectName || 'Semidios Atrapado'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const deleteAutoSave = useCallback((timestamp: number) => {
        setAutoSaves(prev => {
            const newSaves = prev.filter(s => s.timestamp !== timestamp);
            set('autoSaves', newSaves).catch(e => console.warn("Failed to delete autoSave from DB", e));
            return newSaves;
        });
    }, []);

    const clearAllAutoSaves = useCallback(() => {
        setAutoSaves([]);
        del('autoSaves').catch(e => console.error("Failed to clear auto-saves", e));
        try { localStorage.removeItem('autoSaves'); } catch {}
    }, []);

    useEffect(() => {
        const MAX_AUTOSAVES = 15; // Limit max count
    
        const handleAutoSave = async () => {
          const currentState: ProjectSaveState = {
            ...projectData,
            projectName,
            aiSettings,
            autoSaveInterval,
            autoDownloadEnabled,
            searchHistory,
          };
    
          setAutoSaves(prevSaves => {
              const newSave: AutoSave = { timestamp: Date.now(), state: currentState };
              
              // 1. Optimize previous saves to be lightweight
              const optimizedPrevSaves = prevSaves.map(save => ({
                  ...save,
                  state: optimizeStateForHistory(save.state)
              }));

              // 2. Combine: New Full State + Optimized Old States
              let candidateList = [newSave, ...optimizedPrevSaves];
              
              if (candidateList.length > MAX_AUTOSAVES) {
                  candidateList = candidateList.slice(0, MAX_AUTOSAVES);
              }

              // 3. Save to IndexedDB
              set('autoSaves', candidateList).catch(e => {
                  console.error("Failed to save autoSaves to DB", e);
              });

              return candidateList;
          });
    
          if (autoDownloadEnabled) {
             onDownloadAutoSave(currentState, Date.now());
          }
        };
    
        const intervalId = setInterval(handleAutoSave, autoSaveInterval);
        return () => clearInterval(intervalId);
      }, [
          projectName, projectData, aiSettings, autoSaveInterval, 
          autoDownloadEnabled, searchHistory, onDownloadAutoSave
      ]);

      return {
          autoSaves,
          autoSaveInterval,
          setAutoSaveInterval,
          autoDownloadEnabled,
          setAutoDownloadEnabled,
          onDownloadAutoSave,
          onDownloadManualSave,
          deleteAutoSave,
          clearAllAutoSaves
      };
};
