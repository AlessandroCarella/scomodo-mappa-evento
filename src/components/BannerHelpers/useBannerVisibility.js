import { useState, useEffect, useRef, useCallback } from "react";
import { BANNER_REAPPEAR_DELAY } from "@/config";

/**
 * useBannerVisibility
 *
 * Manages two independent visibility axes:
 *
 *   mouseVisible  — toggled by mousemove / inactivity timer
 *   consoleVisible — toggled by the window.__banner console API
 *
 * The banner is shown only when BOTH are true.
 *
 * ── Console API ───────────────────────────────────────────────
 * Open the browser DevTools console and type:
 *
 *   __banner.hide()    // permanently hide until shown again
 *   __banner.show()    // re-enable
 *   __banner.toggle()  // flip current state
 *   __banner.status()  // print current state
 *
 * The API is attached to window.__banner and is removed when the
 * component unmounts.
 * ─────────────────────────────────────────────────────────────
 */
export function useBannerVisibility() {
    const [mouseVisible, setMouseVisible] = useState(true);
    const [consoleVisible, setConsoleVisible] = useState(true);

    const timerRef = useRef(null);

    // ── Mouse inactivity timer ──────────────────────────────
    const scheduleReappear = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(
            () => setMouseVisible(true),
            BANNER_REAPPEAR_DELAY,
        );
    }, []);

    const handleMouseMove = useCallback(() => {
        setMouseVisible(false);
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

    // ── Console API ─────────────────────────────────────────
    useEffect(() => {
        window.__banner = {
            hide() {
                setConsoleVisible(false);
                console.info("[Banner] hidden");
            },
            show() {
                setConsoleVisible(true);
                console.info("[Banner] visible");
            },
            toggle() {
                setConsoleVisible((v) => {
                    console.info(`[Banner] ${v ? "hidden" : "visible"}`);
                    return !v;
                });
            },
            status() {
                // reads current state from closure snapshot — call .status() to refresh
                console.info(
                    `[Banner] consoleVisible=${consoleVisible}  mouseVisible=${mouseVisible}`,
                );
            },
        };
        return () => {
            delete window.__banner;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { visible: mouseVisible && consoleVisible };
}
