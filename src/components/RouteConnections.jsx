/**
 * RouteConnections
 *
 * Draws animated city-to-city routes on a canvas overlay over a Leaflet map.
 * City coordinates are read from `locationsUrl` (Locations.json).
 *
 * Props
 * ─────
 *   map               L.Map       Leaflet map instance  (required)
 *   paths             Array       [{ from: "Roma", to: "Milano" }, ...]  (required)
 *   speedMult         number      Playback speed multiplier  (default: 2)
 *   locationsUrl      string      Full URL to Locations.json, already BASE_URL-prefixed
 *   loop              bool        Restart each route on completion  (default: true)
 *   onParticleClick   function    Called with { from, to } when a moving dot is clicked
 *   trackedRoute      {from,to}?  Optional route to track for camera follow
 *   onTrackedPosition function?   Called with {lat,lng,isPlaying} for tracked route
 */

import { useEffect, useRef, useCallback } from "react";
import {
    ROUTE_HIT_RADIUS as HIT_RADIUS,
    ROUTE_GHOST_COLOR,
    ROUTE_GHOST_WIDTH,
    ROUTE_COLOR_GREY,
    ROUTE_PROGRESS_WIDTH,
    ROUTE_PROGRESS_ALPHA,
    ROUTE_DASH_ON,
    ROUTE_DASH_OFF,
    ROUTE_TRAIL_WIDTH_MAX,
    ROUTE_TRAIL_ALPHA_MAX,
    ROUTE_DOT_RADIUS,
    ROUTE_DOT_PULSE_AMP,
    ROUTE_DOT_PULSE_SPEED,
    ROUTE_DOT_STROKE,
    ROUTE_DOT_STROKE_WIDTH,
    ROUTE_DOT_PAUSED_RADIUS,
    ROUTE_DOT_PAUSED_FILL,
    ROUTE_DOT_PAUSED_STROKE,
    ROUTE_DOT_PAUSED_WIDTH,
    ROUTE_PAUSE_BAR_X1,
    ROUTE_PAUSE_BAR_X2,
    ROUTE_PAUSE_BAR_Y,
    ROUTE_PAUSE_BAR_W,
    ROUTE_PAUSE_BAR_H,
} from "../config";
import { useRouteCanvas } from "./ConnectionHelpers/useRouteCanvas";
import "./styles/RouteConnections.css";

// CSS custom properties populated from config — consumed by useRouteCanvas
// via getComputedStyle, keeping all visual values in one place.
const CANVAS_STYLE = {
    "--route-ghost-color": ROUTE_GHOST_COLOR,
    "--route-ghost-width": ROUTE_GHOST_WIDTH,
    "--route-color-grey": ROUTE_COLOR_GREY,
    "--route-progress-width": ROUTE_PROGRESS_WIDTH,
    "--route-progress-alpha": ROUTE_PROGRESS_ALPHA,
    "--route-dash-on": ROUTE_DASH_ON,
    "--route-dash-off": ROUTE_DASH_OFF,
    "--route-trail-width-max": ROUTE_TRAIL_WIDTH_MAX,
    "--route-trail-alpha-max": ROUTE_TRAIL_ALPHA_MAX,
    "--route-dot-radius": ROUTE_DOT_RADIUS,
    "--route-dot-pulse-amp": ROUTE_DOT_PULSE_AMP,
    "--route-dot-pulse-speed": ROUTE_DOT_PULSE_SPEED,
    "--route-dot-stroke": ROUTE_DOT_STROKE,
    "--route-dot-stroke-width": ROUTE_DOT_STROKE_WIDTH,
    "--route-dot-paused-radius": ROUTE_DOT_PAUSED_RADIUS,
    "--route-dot-paused-fill": ROUTE_DOT_PAUSED_FILL,
    "--route-dot-paused-stroke": ROUTE_DOT_PAUSED_STROKE,
    "--route-dot-paused-width": ROUTE_DOT_PAUSED_WIDTH,
    "--route-pause-bar-x1": ROUTE_PAUSE_BAR_X1,
    "--route-pause-bar-x2": ROUTE_PAUSE_BAR_X2,
    "--route-pause-bar-y": ROUTE_PAUSE_BAR_Y,
    "--route-pause-bar-w": ROUTE_PAUSE_BAR_W,
    "--route-pause-bar-h": ROUTE_PAUSE_BAR_H,
};

export default function RouteConnections({
    map,
    paths,
    speedMult = 2,
    locationsUrl,
    loop = true,
    onParticleClick,
    trackedRoute,
    onTrackedPosition,
}) {
    const canvasRef = useRef(null);

    // Mutable animation state — never triggers re-renders
    const stateRef = useRef({
        particles: [],
        colorIdx: 0,
        locations: null,
        speedMult,
        animFrame: null,
    });

    // Stable refs so event-listener / rAF closures always see the latest
    // callbacks and tracked route without needing to re-register.
    const onParticleClickRef = useRef(onParticleClick);
    useEffect(() => {
        onParticleClickRef.current = onParticleClick;
    }, [onParticleClick]);

    const trackedRouteRef = useRef(trackedRoute);
    useEffect(() => {
        trackedRouteRef.current = trackedRoute || null;
    }, [trackedRoute]);

    const onTrackedPositionRef = useRef(onTrackedPosition);
    useEffect(() => {
        onTrackedPositionRef.current = onTrackedPosition || null;
    }, [onTrackedPosition]);

    // Patch speedMult into shared state without restarting the render loop.
    // Reset lastTime on all particles so dt stays accurate after a speed change.
    useEffect(() => {
        const S = stateRef.current;
        const now = performance.now();
        S.speedMult = speedMult;
        S.particles.forEach((p) => {
            p.lastTime = now;
        });
    }, [speedMult]);

    // Hit-test the nearest particle to a pointer position.
    // Reads canvasRef for the bounding rect; safe to call from any listener.
    const getHit = useCallback((clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        let hit = null,
            best = HIT_RADIUS;
        for (const p of stateRef.current.particles) {
            if (p._hx == null) continue;
            const d = Math.hypot(p._hx - mx, p._hy - my);
            if (d < best) {
                best = d;
                hit = p;
            }
        }
        return hit;
    }, []);

    // Attach the canvas lifecycle: resize sync, pointer events, fetch, rAF loop.
    useRouteCanvas({
        map,
        paths,
        locationsUrl,
        loop,
        canvasRef,
        stateRef,
        getHit,
        onParticleClickRef,
        trackedRouteRef,
        onTrackedPositionRef,
    });

    // pointer-events: none → all events fall through to Leaflet beneath
    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="routeCanvas"
            style={CANVAS_STYLE}
        />
    );
}
