import { useEffect, useRef } from 'react';
import { ProjectData, StoryNodeData, ChatMessage } from '../types';
import { generateUUID, safeClone } from '../utils/uuid';

// Bandeja de entrada de Claude Desktop (via MCP).
// El servidor encola "ordenes" de escritura que Claude emite con sus herramientas
// (responder_modo_director, crear_escena, escribir_expediente_arco). Este hook
// las consulta cada pocos segundos, las aplica al estado React (fuente de verdad)
// y confirma (ack) para que no se re-apliquen.

interface ClaudeInboxItem {
    id: string;
    type: 'respuesta_director' | 'nueva_escena' | 'expediente_arco';
    payload: Record<string, any>;
}

const POLL_INTERVAL_MS = 4000;

// Busca un nodo por id en TODOS los arcos (no solo el activo) y lo modifica in-place.
const modifyNodeAcrossArcs = (data: ProjectData, nodeId: string, action: (n: StoryNodeData) => void): boolean => {
    for (const arc of data.storyArcs || []) {
        const queue: StoryNodeData[] = arc.rootNode ? [arc.rootNode] : [];
        while (queue.length > 0) {
            const node = queue.shift()!;
            if (node.id === nodeId) { action(node); return true; }
            if (node.children) queue.push(...node.children);
        }
    }
    return false;
};

const applyItem = (data: ProjectData, item: ClaudeInboxItem): boolean => {
    switch (item.type) {
        case 'respuesta_director': {
            const { nodeId, texto } = item.payload;
            if (!nodeId || !texto) return false;
            return modifyNodeAcrossArcs(data, nodeId, n => {
                if (!n.directorChatHistory) n.directorChatHistory = [];
                const msg: ChatMessage = { id: generateUUID(), role: 'model', text: `[Claude]: ${texto}` };
                n.directorChatHistory.push(msg);
            });
        }
        case 'nueva_escena': {
            const { parentNodeId, texto } = item.payload;
            if (!parentNodeId || !texto) return false;
            return modifyNodeAcrossArcs(data, parentNodeId, parent => {
                if (!parent.children) parent.children = [];
                parent.children.push({ id: generateUUID(), name: texto, children: [] });
            });
        }
        case 'expediente_arco': {
            const { arcId, expediente } = item.payload;
            if (!arcId || !expediente) return false;
            const arc = (data.storyArcs || []).find(a => a.id === arcId);
            if (!arc) return false;
            arc.summary = expediente;
            return true;
        }
        default:
            return false;
    }
};

export const useClaudeInbox = (
    setProjectData: (action: ProjectData | ((prev: ProjectData) => ProjectData), overwrite?: boolean) => void,
    isLoaded: boolean
) => {
    const processedIds = useRef<Set<string>>(new Set());
    const isFetching = useRef(false);

    useEffect(() => {
        if (!isLoaded) return;
        let cancelled = false;

        const tick = async () => {
            if (isFetching.current) return;
            isFetching.current = true;
            try {
                const res = await fetch('/api/claude/inbox');
                if (!res.ok || cancelled) return;
                const { items } = await res.json() as { items: ClaudeInboxItem[] };
                const fresh = (items || []).filter(i => !processedIds.current.has(i.id));
                if (fresh.length === 0) return;

                setProjectData(current => {
                    if (!current) return current;
                    const next = safeClone(current);
                    let changed = false;
                    for (const item of fresh) {
                        try {
                            if (applyItem(next, item)) changed = true;
                        } catch (e) {
                            console.error('Claude inbox: fallo aplicando item', item, e);
                        }
                    }
                    return changed ? next : current;
                });

                fresh.forEach(i => processedIds.current.add(i.id));
                await fetch('/api/claude/inbox/ack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: fresh.map(i => i.id) }),
                });
            } catch {
                // Servidor local apagado o sin red: silencioso, se reintenta en el proximo tick.
            } finally {
                isFetching.current = false;
            }
        };

        const intervalId = setInterval(tick, POLL_INTERVAL_MS);
        tick();
        return () => { cancelled = true; clearInterval(intervalId); };
    }, [isLoaded, setProjectData]);
};
