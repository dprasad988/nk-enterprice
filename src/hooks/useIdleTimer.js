import { useEffect, useRef, useCallback } from 'react';

export const useIdleTimer = ({ timeout = 36000000, onIdle, isActive = true }) => {
    const timerRef = useRef(null);
    const onIdleRef = useRef(onIdle);

    // Update ref if callback changes to avoid effect re-run
    useEffect(() => {
        onIdleRef.current = onIdle;
    }, [onIdle]);

    useEffect(() => {
        if (!isActive) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click', 'contextmenu'];

        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                if (onIdleRef.current) {
                    onIdleRef.current();
                }
            }, timeout);
        };

        const handleActivity = () => {
            resetTimer();
        };

        // Initial start
        resetTimer();

        // Add Listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [timeout, isActive]);
};
