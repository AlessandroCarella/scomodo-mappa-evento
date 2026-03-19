/**
 * RouteConnections
 *
 * Draws animated city-to-city routes on a canvas overlay over a Leaflet map.
 * City coordinates are read from `locationsUrl` (Locations.json).
 *
 * Props
 * -----
 *   map               L.Map       Leaflet map instance (required)
 *   paths             Array       [{ from: "Roma", to: "Milano" }, ...] (required)
 *   speedMult         number      Playback speed multiplier (default: 2)
 *   locationsUrl      string      Full URL to Locations.json, already BASE_URL-prefixed
 *   loop              bool        Restart each route on completion (default: true)
 *   onParticleClick   function    Called with { from, to, routeKey } on route click
 *   activeRouteKey    string?     Selected/tracked route key
 *   visibleRouteKeys  Set<string> Route keys that should stay fully visible
 *   hasActiveFilters  boolean     Whether non-matching routes should be dimmed
 *   onTrackedPosition function?   Called with {lat,lng,isPlaying} for the tracked route
 */

import { useEffect, useRef, useCallback } from "react";
import {
    ROUTE_HIT_RADIUS as HIT_RADIUS,
    ROUTE_LINE_HIT_DOT_RADIUS as LINE_HIT_DOT_RADIUS,
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
    activeRouteKey,
    visibleRouteKeys,
    hasActiveFilters = false,
    onTrackedPosition,
    hoveredCityRef,
    onCityClick,
}) {
    const canvasRef = useRef(null);

    const stateRef = useRef({
        particles: [],
        colorIdx: 0,
        locations: null,
        speedMult,
        animFrame: null,
    });

    const onParticleClickRef = useRef(onParticleClick);
    useEffect(() => {
        onParticleClickRef.current = onParticleClick;
    }, [onParticleClick]);

    const onCityClickRef = useRef(onCityClick);
    useEffect(() => {
        onCityClickRef.current = onCityClick;
    }, [onCityClick]);

    const activeRouteKeyRef = useRef(activeRouteKey);
    useEffect(() => {
        activeRouteKeyRef.current = activeRouteKey || null;
    }, [activeRouteKey]);

    const visibleRouteKeysRef = useRef(visibleRouteKeys);
    useEffect(() => {
        visibleRouteKeysRef.current = visibleRouteKeys;
    }, [visibleRouteKeys]);

    const hasActiveFiltersRef = useRef(hasActiveFilters);
    useEffect(() => {
        hasActiveFiltersRef.current = hasActiveFilters;
    }, [hasActiveFilters]);

    const onTrackedPositionRef = useRef(onTrackedPosition);
    useEffect(() => {
        onTrackedPositionRef.current = onTrackedPosition || null;
    }, [onTrackedPosition]);

    useEffect(() => {
        const S = stateRef.current;
        const now = performance.now();
        S.speedMult = speedMult;
        S.particles.forEach((p) => {
            p.lastTime = now;
        });
    }, [speedMult]);

    useEffect(() => {
        if (!map || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const container = map.getContainer();

        // Create a pane inside map-pane at z-index 420:
        // above tiles (200) + overlay (400), below markers (600) + tooltips (650)
        const PANE = "routeCanvas";
        if (!map.getPane(PANE)) map.createPane(PANE);
        const pane = map.getPane(PANE);
        pane.style.zIndex = "420";
        pane.style.pointerEvents = "none";
        pane.appendChild(canvas);

        // map-pane gets CSS translate during panning.
        // We counter it so latLngToContainerPoint coordinates draw correctly,
        // and explicitly size the canvas since the pane has no intrinsic dimensions.
        const sync = () => {
            const w = container.offsetWidth;
            const h = container.offsetHeight;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            const offset = map.containerPointToLayerPoint([0, 0]);
            canvas.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
        };
        sync();
        map.on("move zoom viewreset resize", sync);
        window.addEventListener("resize", sync);

        return () => {
            map.off("move zoom viewreset resize", sync);
            window.removeEventListener("resize", sync);
        };
    }, [map]);

    // Distance from point (px,py) to segment (ax,ay)→(bx,by).
    const distToSegment = useCallback((px, py, ax, ay, bx, by) => {
        const dx = bx - ax, dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - ax, py - ay);
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }, []);

    // Hit-test the nearest particle to a pointer position.
    // Checks both the moving dot and the full from→to line segment.
    const getHit = useCallback((clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        let hit = null;
        let best = HIT_RADIUS;
        const filtersActive = hasActiveFiltersRef.current;
        const routeKeys = visibleRouteKeysRef.current;

        for (const p of stateRef.current.particles) {
            if (filtersActive && routeKeys && !routeKeys.has(p.routeKey)) {
                continue;
            }
            if (p._hx == null) continue;
            // Dot hit (original behaviour)
            const dDot = Math.hypot(p._hx - mx, p._hy - my);
            // Line segment hit — only counts when the moving dot is within LINE_HIT_DOT_RADIUS
            const dLine = (p._fx != null && dDot <= LINE_HIT_DOT_RADIUS)
                ? distToSegment(mx, my, p._fx, p._fy, p._tx, p._ty)
                : Infinity;
            const d = Math.min(dDot, dLine);
            if (d < best) {
                best = d;
                hit = p;
            }
        }
        return hit;
    }, [distToSegment]);

    useRouteCanvas({
        map,
        paths,
        locationsUrl,
        loop,
        canvasRef,
        stateRef,
        getHit,
        onParticleClickRef,
        onCityClickRef,
        hoveredCityRef,
        activeRouteKeyRef,
        visibleRouteKeysRef,
        hasActiveFiltersRef,
        onTrackedPositionRef,
    });

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="routeCanvas"
            style={CANVAS_STYLE}
        />
    );
}
