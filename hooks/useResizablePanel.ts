
import React, { useState, useEffect, useRef, useCallback } from 'react';

export const useResizablePanel = (
    panelId: string,
    initialWidth: number,
    minWidth: number,
    maxWidth: number,
    direction: 'left' | 'right'
) => {
    const [width, setWidth] = useState(() => {
        try {
            const savedWidth = localStorage.getItem(`panelWidth-${panelId}`);
            if (savedWidth) {
                const parsedWidth = parseInt(savedWidth, 10);
                return Math.max(minWidth, Math.min(parsedWidth, maxWidth));
            }
        } catch (e) {
            console.error("Failed to read panel width from localStorage", e);
        }
        return initialWidth;
    });

    const isResizingRef = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = width;
    }, [width]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            
            const deltaX = e.clientX - startXRef.current;
            let newWidth;

            if (direction === 'left') {
                newWidth = startWidthRef.current + deltaX;
            } else {
                newWidth = startWidthRef.current - deltaX;
            }

            const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
            setWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = false;
            }
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [direction, minWidth, maxWidth]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            if (!isResizingRef.current) {
                try {
                    localStorage.setItem(`panelWidth-${panelId}`, width.toString());
                } catch (e) {
                    console.error("Failed to save panel width to localStorage", e);
                }
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [width, panelId]);

    return { width, handleMouseDown };
};
