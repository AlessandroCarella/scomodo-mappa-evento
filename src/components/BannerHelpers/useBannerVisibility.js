import { useState, useEffect, useRef, useCallback } from "react";
import { BANNER_REAPPEAR_DELAY } from "@/config";

/**
 * useBannerVisibility
 *
 * Controls the show/hide cycle of the banner panels:
 *   - Banner starts visible.
 *   - Any mousemove on the document hides it immediately.
 *   - If the mouse stops moving for BANNER_REAPPEAR_DELAY ms the
 *     banner fades back in.
 *
 * Returns { visible: boolean }
 */
export function useBannerVisibility() {
    const [visible, setVisible] = useState(true);
    const timerRef = useRef(null);

    const scheduleReappear = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setVisible(true);
        }, BANNER_REAPPEAR_DELAY);
    }, []);

    const handleMouseMove = useCallback(() => {
        setVisible(false);
        scheduleReappear();
    }, [scheduleReappear]);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove, {
            passive: true,
        });
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [handleMouseMove]);

    return { visible };
}
