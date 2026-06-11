
import { useState, useCallback, useRef, useEffect } from 'react';

export const useHistory = <T,>(initialState: T, maxHistory: number = 50) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  // Refs to keep track of latest state for async access without stale closures
  const historyRef = useRef(history);
  const indexRef = useRef(index);

  // Sync refs with state changes (backup, though we update them optimistically in setState)
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { indexRef.current = index; }, [index]);

  const setState = useCallback((action: T | ((prevState: T) => T), overwrite: boolean = false) => {
    // Always read from Refs to ensure we have the latest state immediately
    const currentHistory = historyRef.current;
    const currentIndex = indexRef.current;
    const currentState = currentHistory[currentIndex];

    // Safety guard
    if (currentState === undefined && typeof action === 'function') {
        console.warn("useHistory: Cannot update undefined state via function.");
        return; 
    }

    const newState = typeof action === 'function' ? (action as (prevState: T) => T)(currentState) : action;

    let newHistory;
    let newIndex;

    if (overwrite) {
        newHistory = [...currentHistory];
        newHistory[currentIndex] = newState;
        newIndex = currentIndex;
    } else {
        newHistory = currentHistory.slice(0, currentIndex + 1);
        newHistory.push(newState);
        
        // Trim history if it exceeds the limit
        while (newHistory.length > maxHistory) {
            newHistory.shift();
        }
        newIndex = newHistory.length - 1;
    }
    
    // CRITICAL: Update refs IMMEDIATELY. 
    // This allows multiple setState calls in the same tick (e.g. loops) to see the intermediate updates.
    historyRef.current = newHistory;
    indexRef.current = newIndex;

    // Trigger React Re-render
    setHistory(newHistory);
    setIndex(newIndex);
  }, [maxHistory]);

  const undo = useCallback(() => {
    setIndex(prevIndex => {
        const newIndex = prevIndex > 0 ? prevIndex - 1 : prevIndex;
        indexRef.current = newIndex; // Sync ref
        return newIndex;
    });
  }, []);

  const redo = useCallback(() => {
    setIndex(prevIndex => {
        const newIndex = prevIndex < historyRef.current.length - 1 ? prevIndex + 1 : prevIndex;
        indexRef.current = newIndex; // Sync ref
        return newIndex;
    });
  }, []);
  
  const clearHistory = useCallback((newState: T) => {
      const newHistory = [newState];
      historyRef.current = newHistory;
      indexRef.current = 0;
      setHistory(newHistory);
      setIndex(0);
  }, []);

  return {
    state: history[index],
    setState,
    undo,
    redo,
    clearHistory,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};
