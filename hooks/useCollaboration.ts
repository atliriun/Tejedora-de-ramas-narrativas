import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db, loginWithGoogle, logout } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ProjectData } from '../types';
import { compare, applyPatch, deepClone } from 'fast-json-patch';
import { generateUUID } from '../utils/uuid';

export enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

export interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData.map(provider => ({
                providerId: provider.providerId,
                displayName: provider.displayName,
                email: provider.email,
                photoUrl: provider.photoURL
            })) || []
        },
        operationType,
        path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}

export const useCollaboration = (
    currentProjectData: ProjectData,
    projectName: string,
    onRemoteUpdate: (data: ProjectData, name: string) => void
) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [cloudProjectId, setCloudProjectId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [collaborators, setCollaborators] = useState<{ ownerId: string, editors: string[], viewers: string[] }>({ ownerId: '', editors: [], viewers: [] });
    const [lastRemoteUpdate, setLastRemoteUpdate] = useState<number>(0);

    const lastSyncedDataRef = useRef<ProjectData | null>(null);
    const currentProjectDataRef = useRef(currentProjectData);

    useEffect(() => {
        currentProjectDataRef.current = currentProjectData;
    }, [currentProjectData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // Auto-join from URL
    useEffect(() => {
        if (isAuthReady && user && !cloudProjectId) {
            const urlParams = new URLSearchParams(window.location.search);
            const projectIdFromUrl = urlParams.get('project');
            if (projectIdFromUrl) {
                loadProject(projectIdFromUrl);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, [isAuthReady, user, cloudProjectId]);

    // Listen to remote changes
    useEffect(() => {
        if (!isAuthReady || !user || !cloudProjectId) return;

        const projectRef = doc(db, 'projects', cloudProjectId);
        const unsubscribe = onSnapshot(projectRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setCollaborators({
                    ownerId: data.ownerId,
                    editors: data.editors || [],
                    viewers: data.viewers || []
                });

                // Only update local state if the change was made by someone else
                // or if it's the initial load
                const remoteUpdatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt;
                if (data.updatedBy !== user.uid || remoteUpdatedAt > lastRemoteUpdate) {
                    try {
                        const remoteData = JSON.parse(data.data);
                        
                        if (lastSyncedDataRef.current) {
                            // Calculate what changed remotely since our last sync
                            const remotePatch = compare(lastSyncedDataRef.current, remoteData);
                            
                            // Calculate what changed locally since our last sync
                            const localPatch = compare(lastSyncedDataRef.current, currentProjectDataRef.current);
                            
                            // Find paths modified locally
                            const localPaths = new Set(localPatch.map(p => p.path));
                            
                            // Filter remote patch to exclude paths modified locally (prevent overwriting active typing)
                            // BUT ONLY for text/string fields. Array structural changes (like adding/removing nodes) 
                            // should not be filtered this way to prevent duplicate keys and corrupted arrays.
                            const textFields = ['/text', '/name', '/description', '/content', '/chatDraft', '/note', '/customAiInstruction'];
                            const isTextFieldPath = (path: string) => textFields.some(field => path.endsWith(field));
                            
                            const filteredRemotePatch = remotePatch.filter(p => {
                                if (localPaths.has(p.path) && isTextFieldPath(p.path)) {
                                    return false; // Drop conflicting remote text edits (local wins)
                                }
                                return true; // Keep everything else
                            });
                            
                            // Helper to recursively deduplicate arrays by 'id'
                            const deduplicateById = (obj: any): any => {
                                if (Array.isArray(obj)) {
                                    const seenIds = new Set();
                                    const newArr = [];
                                    for (const item of obj) {
                                        if (item && typeof item === 'object' && 'id' in item) {
                                            if (!seenIds.has(item.id)) {
                                                seenIds.add(item.id);
                                                newArr.push(deduplicateById(item));
                                            } else {
                                                // Generate a new ID for the duplicate to prevent data loss
                                                const newItem = { ...item, id: generateUUID() };
                                                newArr.push(deduplicateById(newItem));
                                            }
                                        } else {
                                            newArr.push(deduplicateById(item));
                                        }
                                    }
                                    return newArr;
                                } else if (obj !== null && typeof obj === 'object') {
                                    const newObj: any = {};
                                    for (const key in obj) {
                                        newObj[key] = deduplicateById(obj[key]);
                                    }
                                    return newObj;
                                }
                                return obj;
                            };

                            if (filteredRemotePatch.length > 0) {
                                let mergedData = currentProjectDataRef.current;
                                try {
                                    // Apply non-conflicting remote changes to our CURRENT local data
                                    mergedData = applyPatch(deepClone(currentProjectDataRef.current), filteredRemotePatch, false, false).newDocument;
                                    // Clean up any duplicate IDs caused by array merge conflicts
                                    mergedData = deduplicateById(mergedData);
                                } catch (patchErr) {
                                    console.warn("Patch merge failed, falling back to remote data", patchErr);
                                    mergedData = remoteData;
                                }
                                
                                lastSyncedDataRef.current = deepClone(remoteData);
                                setLastRemoteUpdate(remoteUpdatedAt);
                                onRemoteUpdate(mergedData, data.name);
                            } else {
                                // Even if we didn't apply patches, we should update our last synced ref
                                // so future patches are calculated correctly
                                lastSyncedDataRef.current = deepClone(remoteData);
                                setLastRemoteUpdate(remoteUpdatedAt);
                            }
                        } else {
                            // First load
                            lastSyncedDataRef.current = deepClone(remoteData);
                            setLastRemoteUpdate(remoteUpdatedAt);
                            onRemoteUpdate(remoteData, data.name);
                        }
                    } catch (e) {
                        console.error("Failed to parse remote project data", e);
                    }
                }
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `projects/${cloudProjectId}`);
        });

        return () => unsubscribe();
    }, [isAuthReady, user, cloudProjectId, onRemoteUpdate, lastRemoteUpdate]);

    const shareProject = async () => {
        if (!user) {
            await loginWithGoogle();
            return;
        }

        setIsSyncing(true);
        try {
            const projectDataStr = JSON.stringify(currentProjectDataRef.current);
            
            if (cloudProjectId) {
                // Update existing
                const projectRef = doc(db, 'projects', cloudProjectId);
                await updateDoc(projectRef, {
                    name: projectName,
                    data: projectDataStr,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                });
            } else {
                // Create new
                const projectsRef = collection(db, 'projects');
                const newDoc = await addDoc(projectsRef, {
                    name: projectName,
                    ownerId: user.uid,
                    editors: [],
                    viewers: [],
                    data: projectDataStr,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                });
                setCloudProjectId(newDoc.id);
            }
            lastSyncedDataRef.current = deepClone(currentProjectDataRef.current);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, cloudProjectId ? `projects/${cloudProjectId}` : 'projects');
        } finally {
            setIsSyncing(false);
        }
    };

    const syncLocalChanges = useCallback(async (data: ProjectData, name: string) => {
        if (!user || !cloudProjectId) return;
        
        setIsSyncing(true);
        try {
            const projectRef = doc(db, 'projects', cloudProjectId);
            await updateDoc(projectRef, {
                name: name,
                data: JSON.stringify(data),
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
            });
            lastSyncedDataRef.current = deepClone(data);
        } catch (error) {
            console.error("Failed to sync local changes", error);
        } finally {
            setIsSyncing(false);
        }
    }, [user, cloudProjectId]);

    const updateRoles = async (editors: string[], viewers: string[]) => {
        if (!user || !cloudProjectId || collaborators.ownerId !== user.uid) return;
        
        try {
            const projectRef = doc(db, 'projects', cloudProjectId);
            await updateDoc(projectRef, {
                editors,
                viewers,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `projects/${cloudProjectId}`);
        }
    };

    const loadProject = async (projectId: string) => {
        if (!user) return;
        setIsSyncing(true);
        try {
            const projectRef = doc(db, 'projects', projectId);
            const snapshot = await getDoc(projectRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                setCloudProjectId(projectId);
                setCollaborators({
                    ownerId: data.ownerId,
                    editors: data.editors || [],
                    viewers: data.viewers || []
                });
                const parsedData = JSON.parse(data.data);
                const remoteUpdatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt;
                lastSyncedDataRef.current = deepClone(parsedData);
                setLastRemoteUpdate(remoteUpdatedAt);
                onRemoteUpdate(parsedData, data.name);
            } else {
                alert("Proyecto no encontrado o no tienes acceso.");
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, `projects/${projectId}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        user,
        isAuthReady,
        cloudProjectId,
        setCloudProjectId,
        isSyncing,
        collaborators,
        shareProject,
        syncLocalChanges,
        updateRoles,
        loadProject,
        loginWithGoogle,
        logout
    };
};
