import { useEffect, useState, RefObject } from 'react';

const observerCallbacks = new WeakMap<Element, (isVisible: boolean) => void>();

let observer: IntersectionObserver | null = null;

const getObserver = () => {
    if (typeof window === 'undefined') return null;
    if (!observer) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const callback = observerCallbacks.get(entry.target);
                if (callback) {
                    callback(entry.isIntersecting); // Can use entry.isIntersecting
                }
            });
        }, {
            // Extend viewport by 1000px in all directions to buffer rendering
            rootMargin: '1000px 1000px 1000px 1000px',
            threshold: 0
        });
    }
    return observer;
};

export const useVisibility = (ref: RefObject<Element | null>) => {
    // Start visible to compute initial layout/height
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const obs = getObserver();
        if (obs) {
            observerCallbacks.set(el, setIsVisible);
            obs.observe(el);
        }

        return () => {
            if (obs && el) {
                obs.unobserve(el);
                observerCallbacks.delete(el);
            }
        };
    }, [ref]);

    return isVisible;
};
