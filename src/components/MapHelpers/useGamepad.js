import { useEffect, useRef } from "react";

export function useGamepad(
    mapRef,
    ready,
    {
        onPinClick,
        currentCityRef,
        isAnimatingRef,
        isStoriesOpenRef,
        onCloseStories,
        navigateToRef,
    } = {},
) {
    // Keep refs to callbacks so the rAF loop always calls the latest version
    const onPinClickRef = useRef(onPinClick);
    useEffect(() => {
        onPinClickRef.current = onPinClick;
    }, [onPinClick]);

    const onCloseStoriesRef = useRef(onCloseStories);
    useEffect(() => {
        onCloseStoriesRef.current = onCloseStories;
    }, [onCloseStories]);

    useEffect(() => {
        if (!ready || !mapRef.current) return;

        // ── Left stick / LB / RB / A / B ─────────────────────────
        const PAN_SPEED = 400;
        const DEAD_ZONE = 0.15;
        const ZOOM_COOLDOWN = 600;

        let animFrame;
        let lastTime = performance.now();
        let zoomCooldown = 0;
        let prevLB = false,
            prevRB = false,
            prevLT = false,
            prevRT = false,
            prevA = false,
            prevB = false;

        // ── Right stick navigation ────────────────────────────────
        let stickCooldown = 0;
        const STICK_THRESHOLD = 0.5;
        const STICK_COOLDOWN_MS = 400;

        const poll = (now) => {
            animFrame = requestAnimationFrame(poll);
            const map = mapRef.current;
            if (!map) return;

            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;

            const pads = navigator.getGamepads?.() ?? [];
            for (const pad of pads) {
                if (!pad) continue;

                // ── Left stick → pan ──────────────────────────────
                if (!isAnimatingRef?.current && !isStoriesOpenRef?.current) {
                    const lx =
                        Math.abs(pad.axes[0]) > DEAD_ZONE ? pad.axes[0] : 0;
                    const ly =
                        Math.abs(pad.axes[1]) > DEAD_ZONE ? pad.axes[1] : 0;
                    if (lx !== 0 || ly !== 0)
                        map.panBy([lx * PAN_SPEED * dt, ly * PAN_SPEED * dt], {
                            animate: false,
                        });
                }

                // ── LB / RB / LT / RT → zoom ─────────────────────────────
                const lb = pad.buttons[4]?.pressed ?? false;
                const rb = pad.buttons[5]?.pressed ?? false;
                const lt = (pad.buttons[6]?.value ?? 0) > 0.5;
                const rt = (pad.buttons[7]?.value ?? 0) > 0.5;
                if (now >= zoomCooldown) {
                    if ((lb && !prevLB) || (lt && !prevLT)) {
                        map.zoomOut(1, { animate: true });
                        zoomCooldown = now + ZOOM_COOLDOWN;
                    }
                    if ((rb && !prevRB) || (rt && !prevRT)) {
                        map.zoomIn(1, { animate: true });
                        zoomCooldown = now + ZOOM_COOLDOWN;
                    }
                }
                prevLB = lb;
                prevRB = rb;
                prevLT = lt;
                prevRT = rt;

                // ── Right stick → navigate to next city ──────────
                if (
                    !isAnimatingRef?.current &&
                    !isStoriesOpenRef?.current &&
                    navigateToRef?.current &&
                    now >= stickCooldown
                ) {
                    const ax = pad.axes[2] ?? 0;
                    const ay = pad.axes[3] ?? 0;
                    if (
                        Math.abs(ax) >= STICK_THRESHOLD ||
                        Math.abs(ay) >= STICK_THRESHOLD
                    ) {
                        const dir =
                            Math.abs(ax) > Math.abs(ay)
                                ? ax > 0
                                    ? { dlat: 0, dlng: 1 }
                                    : { dlat: 0, dlng: -1 }
                                : ay > 0
                                  ? { dlat: -1, dlng: 0 }
                                  : { dlat: 1, dlng: 0 };
                        navigateToRef.current(dir);
                        stickCooldown = now + STICK_COOLDOWN_MS;
                    }
                }

                // ── A → open stories (only when stories NOT open) ─
                const a = pad.buttons[0]?.pressed ?? false;
                if (a && !prevA && !isStoriesOpenRef?.current) {
                    const city = currentCityRef?.current;
                    if (city) onPinClickRef.current?.(city);
                }
                prevA = a;

                // ── B → close stories ─────────────────────────────
                const b = pad.buttons[1]?.pressed ?? false;
                if (b && !prevB) onCloseStoriesRef.current?.();
                prevB = b;

                break;
            }
        };

        animFrame = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(animFrame);
    }, [
        mapRef,
        ready,
        currentCityRef,
        isAnimatingRef,
        isStoriesOpenRef,
        navigateToRef,
    ]);
}
