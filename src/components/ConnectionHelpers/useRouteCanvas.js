import { useEffect } from "react";
import L from "leaflet";
import {
    ROUTE_TRAIL_LEN as TRAIL_LEN,
    ROUTE_PCOLORS as PCOLORS,
    ROUTE_DOT_STROKE as DOT_STROKE,
    ROUTE_DOT_STROKE_WIDTH as DOT_STROKE_WIDTH,
} from "../../config";
import {
    lerp,
    ease,
    hexToRgba,
    mixHex,
    routeColor,
    durationForKm,
    haversineKm,
} from "./routeUtils";
import { pairKey } from "./connectionUtils";

/**
 * useRouteCanvas
 *
 * Owns the canvas side-effect: resize sync, pointer-event listeners,
 * location fetch, particle construction, and the rAF render loop.
 *
 * All React state (refs, speedMult sync, hit detection) lives in the
 * RouteConnections component; this hook just receives them as params.
 */
export function useRouteCanvas({
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
}) {
    useEffect(() => {
        if (!map || !locationsUrl) return;
        const S = stateRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = map.getContainer();

        const syncSize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };
        syncSize();
        window.addEventListener("resize", syncSize);
        map.on("resize", syncSize);

        const onMouseMove = (e) => {
            container.style.cursor = getHit(e.clientX, e.clientY)
                ? "pointer"
                : "";
        };

        const onClick = (e) => {
            const hoveredCity = hoveredCityRef?.current;
            if (hoveredCity && onCityClickRef?.current) {
                onCityClickRef.current(hoveredCity);
                return;
            }
            const hit = getHit(e.clientX, e.clientY);
            if (hit && onParticleClickRef.current) {
                onParticleClickRef.current({
                    from: hit.from.name,
                    to: hit.to.name,
                    routeKey: hit.routeKey,
                });
            }
        };

        const onTouchEnd = (e) => {
            const hoveredCity = hoveredCityRef?.current;
            if (hoveredCity && onCityClickRef?.current) {
                onCityClickRef.current(hoveredCity);
                return;
            }
            const t = e.changedTouches?.[0];
            if (!t) return;
            const hit = getHit(t.clientX, t.clientY);
            if (hit && onParticleClickRef.current) {
                onParticleClickRef.current({
                    from: hit.from.name,
                    to: hit.to.name,
                    routeKey: hit.routeKey,
                });
            }
        };

        container.addEventListener("mousemove", onMouseMove);
        container.addEventListener("click", onClick);
        container.addEventListener("touchend", onTouchEnd);

        const cpt = (lat, lng) =>
            map.latLngToContainerPoint(L.latLng(lat, lng));

        const buildParticles = (locations) => {
            S.particles = [];
            const byName = Object.fromEntries(
                locations.map((location) => [location.name, location]),
            );

            paths.forEach(({ from, to }) => {
                const a = byName[from];
                const b = byName[to];
                if (!a || !b) {
                    console.warn(
                        `RouteConnections: city not found - "${from}", "${to}"`,
                    );
                    return;
                }

                const km = Math.round(haversineKm(a, b));
                const color = PCOLORS[S.colorIdx++ % PCOLORS.length];
                S.particles.push({
                    from: a,
                    to: b,
                    routeKey: pairKey(a.name, b.name),
                    km,
                    color,
                    t: 0,
                    baseDur: durationForKm(km),
                    elapsed: 0,
                    lastTime: performance.now(),
                    paused: false,
                    trail: [],
                    _hx: null,
                    _hy: null,
                    _fx: null,
                    _fy: null,
                    _tx: null,
                    _ty: null,
                    _et: 0,
                    _curLat: a.lat,
                    _curLng: a.lng,
                });
            });
        };

        const render = (now) => {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!S.locations) {
                S.animFrame = requestAnimationFrame(render);
                return;
            }

            const alive = [];
            for (const p of S.particles) {
                const dt = now - p.lastTime;
                p.lastTime = now;

                if (!p.paused) p.elapsed += dt * S.speedMult;

                p.t = Math.min(p.elapsed / p.baseDur, 1);
                p._et = ease(p.t);
                p._curLat = lerp(p.from.lat, p.to.lat, p._et);
                p._curLng = lerp(p.from.lng, p.to.lng, p._et);

                const cur = cpt(p._curLat, p._curLng);
                p._hx = cur.x;
                p._hy = cur.y;

                if (!p.paused) {
                    p.trail.push({ lat: p._curLat, lng: p._curLng });
                    if (p.trail.length > TRAIL_LEN) p.trail.shift();
                }

                if (p.t < 1) {
                    alive.push(p);
                } else if (loop) {
                    p.t = 0;
                    p.elapsed = 0;
                    p.trail = [];
                    p.lastTime = now;
                    alive.push(p);
                }
            }
            S.particles = alive;

            if (activeRouteKeyRef?.current && onTrackedPositionRef?.current) {
                const tracked = S.particles.find(
                    (p) => p.routeKey === activeRouteKeyRef.current,
                );
                if (tracked) {
                    onTrackedPositionRef.current({
                        lat: tracked._curLat,
                        lng: tracked._curLng,
                        isPlaying: !tracked.paused && tracked.t < 1,
                    });
                }
            }

            const visibleRouteKeys = visibleRouteKeysRef?.current;
            const filtersActive = hasActiveFiltersRef?.current;
            const activeRouteKey = activeRouteKeyRef?.current;

            ctx.save();
            ctx.setLineDash([6, 5]);
            for (const p of S.particles) {
                const fp = cpt(p.from.lat, p.from.lng);
                const tp = cpt(p.to.lat, p.to.lng);
                const cur = cpt(p._curLat, p._curLng);
                p._fx = fp.x; p._fy = fp.y;
                p._tx = tp.x; p._ty = tp.y;
                const isVisible =
                    !filtersActive ||
                    !visibleRouteKeys ||
                    visibleRouteKeys.has(p.routeKey);
                const isSelected = activeRouteKey === p.routeKey;
                const ghostAlpha = isSelected
                    ? 0.42
                    : isVisible
                      ? 0.22
                      : 0.05;
                const progressAlpha = isSelected
                    ? 0.95
                    : isVisible
                      ? 0.82
                      : 0.08;
                const lineWidth = isSelected ? 2.8 : 2;
                const routeTone = isSelected
                    ? mixHex(p.color, "#09131c", 0.26)
                    : p.color;

                ctx.strokeStyle = `rgba(150,150,150,${ghostAlpha})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(fp.x, fp.y);
                ctx.lineTo(tp.x, tp.y);
                ctx.stroke();

                ctx.strokeStyle = routeColor(routeTone, p._et, progressAlpha);
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.moveTo(fp.x, fp.y);
                ctx.lineTo(cur.x, cur.y);
                ctx.stroke();
            }
            ctx.restore();

            for (let i = 0; i < S.particles.length; i++) {
                const p = S.particles[i];
                const px = p._hx;
                const py = p._hy;
                const isVisible =
                    !filtersActive ||
                    !visibleRouteKeys ||
                    visibleRouteKeys.has(p.routeKey);
                const isSelected = activeRouteKey === p.routeKey;
                const routeTone = isSelected
                    ? mixHex(p.color, "#09131c", 0.45)
                    : p.color;

                if (p.trail.length > 1) {
                    ctx.save();
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    for (let j = 1; j < p.trail.length; j++) {
                        const frac = j / p.trail.length;
                        const pa = cpt(p.trail[j - 1].lat, p.trail[j - 1].lng);
                        const pb = cpt(p.trail[j].lat, p.trail[j].lng);
                        ctx.beginPath();
                        ctx.moveTo(pa.x, pa.y);
                        ctx.lineTo(pb.x, pb.y);
                        ctx.strokeStyle = routeTone;
                        ctx.lineWidth = frac * (isSelected ? 6.5 : 5);
                        ctx.globalAlpha =
                            frac * (isSelected ? 0.9 : isVisible ? 0.7 : 0.08);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                ctx.globalAlpha = 1;
                if (p.paused) {
                    ctx.beginPath();
                    ctx.arc(px, py, isSelected ? 9 : 8, 0, Math.PI * 2);
                    ctx.fillStyle = "#fff";
                    ctx.strokeStyle = isSelected ? "#f2f6fb" : "#111";
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = isVisible ? 1 : 0.14;
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = "#111";
                    ctx.fillRect(px - 3.5, py - 3.5, 2.5, 7);
                    ctx.fillRect(px + 1, py - 3.5, 2.5, 7);
                } else {
                    const pulse = 1 + 0.1 * Math.sin(now / 400 + i * 2.5);
                    const radius = (isSelected ? 8.5 : 6) * pulse;
                    ctx.beginPath();
                    ctx.arc(px, py, radius, 0, Math.PI * 2);
                    ctx.fillStyle = hexToRgba(
                        routeTone,
                        isVisible ? 1 : 0.14,
                    );
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(px, py, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = isSelected
                        ? DOT_STROKE
                        : `rgba(17,17,17,${isVisible ? 1 : 0.18})`;
                    ctx.lineWidth = isSelected ? DOT_STROKE_WIDTH * 1.2 : DOT_STROKE_WIDTH;
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            S.animFrame = requestAnimationFrame(render);
        };

        fetch(locationsUrl)
            .then((r) => {
                if (!r.ok) {
                    throw new Error(
                        `Locations fetch failed: ${r.status} ${r.url}`,
                    );
                }
                return r.json();
            })
            .then((locations) => {
                S.locations = locations;
                buildParticles(locations);
                S.animFrame = requestAnimationFrame(render);
            })
            .catch((err) =>
                console.error("RouteConnections: failed to load locations -", err),
            );

        return () => {
            window.removeEventListener("resize", syncSize);
            map.off("resize", syncSize);
            container.removeEventListener("mousemove", onMouseMove);
            container.removeEventListener("click", onClick);
            container.removeEventListener("touchend", onTouchEnd);
            container.style.cursor = "";
            cancelAnimationFrame(S.animFrame);
            S.particles = [];
            S.locations = null;
        };
    }, [
        map,
        paths,
        locationsUrl,
        loop,
        canvasRef,
        stateRef,
        getHit,
        onParticleClickRef,
        activeRouteKeyRef,
        visibleRouteKeysRef,
        hasActiveFiltersRef,
        onTrackedPositionRef,
    ]); // eslint-disable-line react-hooks/exhaustive-deps
}
