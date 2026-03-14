import { useEffect } from "react";

/**
 * useGamepad
 *
 * Maps Xbox controller to Leaflet map:
 *   Left stick  (axes 0/1) → pan  (like arrow keys)
 *   Right stick (axes 2/3) → WASD city navigation (handled in useWasdNavigation)
 *   LB (button 4)          → zoom out
 *   RB (button 5)          → zoom in
 *
 * Pan uses continuous rAF polling with velocity proportional to stick deflection.
 * Zoom fires once per button press (with a small cooldown).
 */
export function useGamepad(mapRef, ready) {
    useEffect(() => {
        if (!ready || !mapRef.current) return;

        const PAN_SPEED = 400; // pixels per second at full deflection
        const DEAD_ZONE = 0.12;
        const ZOOM_COOLDOWN = 600; // ms between zoom steps
        const STICK_THRESHOLD = 0.12;

        let animFrame;
        let lastTime = performance.now();
        let zoomCooldown = 0;

        // Track which buttons were pressed last frame to detect edges
        const prevButtons = {};

        const poll = (now) => {
            animFrame = requestAnimationFrame(poll);
            const map = mapRef.current;
            if (!map) return;

            const dt = (now - lastTime) / 1000; // seconds
            lastTime = now;

            const pads = navigator.getGamepads?.() ?? [];
            for (const pad of pads) {
                if (!pad) continue;

                // ── Left stick → pan ──────────────────────────────
                const lx = Math.abs(pad.axes[0]) > DEAD_ZONE ? pad.axes[0] : 0;
                const ly = Math.abs(pad.axes[1]) > DEAD_ZONE ? pad.axes[1] : 0;

                if (lx !== 0 || ly !== 0) {
                    const dx = lx * PAN_SPEED * dt;
                    const dy = ly * PAN_SPEED * dt;
                    map.panBy([dx, dy], { animate: false });
                }

                // ── LB (4) / RB (5) → zoom ────────────────────────
                const lb = pad.buttons[4]?.pressed ?? false;
                const rb = pad.buttons[5]?.pressed ?? false;

                if (now >= zoomCooldown) {
                    if (lb && !prevButtons[4]) {
                        map.zoomOut(1, { animate: true });
                        zoomCooldown = now + ZOOM_COOLDOWN;
                    }
                    if (rb && !prevButtons[5]) {
                        map.zoomIn(1, { animate: true });
                        zoomCooldown = now + ZOOM_COOLDOWN;
                    }
                }

                prevButtons[4] = lb;
                prevButtons[5] = rb;
                break; // first connected pad wins
            }
        };

        animFrame = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(animFrame);
    }, [mapRef, ready]);
}
