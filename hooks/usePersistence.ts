
import { useEffect } from 'react';
import { ProjectData } from '../types';
import { set } from 'idb-keyval';

// El servidor MCP (syncPlan) solo existe cuando corres la app en local con el
// .bat. En AI Studio / nube no hay servidor: evitamos POSTs de ~20MB que fallan
// en bucle y cargan la pestania.
const isLocalServer = typeof window !== 'undefined'
    && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

export const usePersistence = (projectData: ProjectData | null, isLoaded: boolean) => {
    useEffect(() => {
        if (!isLoaded || !projectData) return;
        try {
            localStorage.removeItem('storyTree'); // Cleanup old key
            set('storyArcs', projectData.storyArcs).catch(e => console.error("Persistence Error (storyArcs):", e));
        } catch (e) { console.error("Persistence Error (storyArcs):", e); }
    }, [isLoaded, projectData?.storyArcs]);

    useEffect(() => { if (isLoaded && projectData) try { set('activeArcId', projectData.activeArcId).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (activeArcId):", e); } }, [isLoaded, projectData?.activeArcId]);
    useEffect(() => { if (isLoaded && projectData) try { set('characters', projectData.characters).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (characters):", e); } }, [isLoaded, projectData?.characters]);
    useEffect(() => { if (isLoaded && projectData) try { set('scenarios', projectData.scenarios).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (scenarios):", e); } }, [isLoaded, projectData?.scenarios]);
    useEffect(() => { if (isLoaded && projectData) try { set('psychologicalTraits', projectData.psychologicalTraits).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (psychologicalTraits):", e); } }, [isLoaded, projectData?.psychologicalTraits]);
    useEffect(() => { if (isLoaded && projectData) try { set('traitProfiles', projectData.traitProfiles).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (traitProfiles):", e); } }, [isLoaded, projectData?.traitProfiles]); 
    useEffect(() => { if (isLoaded && projectData) try { set('worldLogicRules', projectData.worldLogicRules).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (worldLogicRules):", e); } }, [isLoaded, projectData?.worldLogicRules]);
    useEffect(() => { if (isLoaded && projectData) try { set('magicSystems', projectData.magicSystems).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (magicSystems):", e); } }, [isLoaded, projectData?.magicSystems]);
    useEffect(() => { if (isLoaded && projectData) try { set('worldObjects', projectData.worldObjects).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (worldObjects):", e); } }, [isLoaded, projectData?.worldObjects]);
    useEffect(() => { if (isLoaded && projectData) try { set('species', projectData.species).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (species):", e); } }, [isLoaded, projectData?.species]);
    useEffect(() => { if (isLoaded && projectData) try { set('secrets', projectData.secrets).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (secrets):", e); } }, [isLoaded, projectData?.secrets]);
    useEffect(() => { if (isLoaded && projectData) try { set('nations', projectData.nations).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (nations):", e); } }, [isLoaded, projectData?.nations]);
    useEffect(() => { if (isLoaded && projectData) try { set('nationProfiles', projectData.nationProfiles).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (nationProfiles):", e); } }, [isLoaded, projectData?.nationProfiles]); 
    useEffect(() => { 
        if (!isLoaded || !projectData) return;
        try {
            set('tagGroups', projectData.tagGroups).catch(e => console.error(e));
            localStorage.removeItem('statusTags'); // Cleanup old key
        } catch (e) { console.error("Persistence Error (tagGroups):", e); }
    }, [isLoaded, projectData?.tagGroups]);
    useEffect(() => { if (isLoaded && projectData) try { set('loreEntries', projectData.loreEntries).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (loreEntries):", e); } }, [isLoaded, projectData?.loreEntries]);
    useEffect(() => { if (isLoaded && projectData) try { set('narrativeGoals', projectData.narrativeGoals).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (narrativeGoals):", e); } }, [isLoaded, projectData?.narrativeGoals]);
    useEffect(() => { if (isLoaded && projectData) try { set('contextPresets', projectData.contextPresets).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (contextPresets):", e); } }, [isLoaded, projectData?.contextPresets]);
    useEffect(() => { if (isLoaded && projectData) try { set('flags', projectData.flags).catch(e => console.error(e)); } catch (e) { console.error("Persistence Error (flags):", e); } }, [isLoaded, projectData?.flags]);

    // Sync to backend for MCP (solo en local; en AI Studio/nube no hay servidor)
    useEffect(() => {
        if (!isLocalServer || !isLoaded || !projectData) return;
        const timeoutId = setTimeout(() => {
            fetch('/api/syncPlan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            }).catch(e => console.error("Failed to sync plan to MCP server", e));
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [isLoaded, projectData]);
};