import { useEffect } from "react";
import L from "leaflet";
import {
    ROUTE_TRAIL_LEN as TRAIL_LEN,
    ROUTE_PCOLORS as PCOLORS,
} from "../../config";
import {
    lerp,
    ease,
    routeColor,
    durationForKm,
    haversineKm,
} from "./routeUtils";

/**
 * useRouteCanvas
 *
 * Owns the canvas side-effect: resize sync, pointer-event listeners,
 * location fetch, particle construction, and the rAF render loop.
 *
 * All React state (refs, speedMult sync, hit detection) lives in the
 * RouteConnections component; this hook just receives them as params.
 *
 * @param {object} params
 * @param {L.Map}              params.map                 Leaflet map instance
 * @param {Array}              params.paths               [{ from, to }, ...]
 * @param {string}             params.locationsUrl        URL to Locations.json
 * @param {boolean}            params.loop                Restart routes on completion
 * @param {React.RefObject}    params.canvasRef           Ref to the <canvas> element
 * @param {React.RefObject}    params.stateRef            Shared mutable animation state
 * @param {function}           params.getHit              (clientX, clientY) → particle | null
 * @param {React.RefObject}    params.onParticleClickRef  Stable ref to the click callback
 * @param {React.RefObject}    params.trackedRouteRef     {from,to} for camera follow (optional)
 * @param {React.RefObject}    params.onTrackedPositionRef Stable ref to camera-follow callback
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
    trackedRouteRef,
    onTrackedPositionRef,
}) {
    useEffect(() => {
        if (!map || !locationsUrl) return;
        const S = stateRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = map.getContainer();

        // ── Canvas resize sync ────────────────────────────────────────────────
        const syncSize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };
        syncSize();
        window.addEventListener("resize", syncSize);
        map.on("resize", syncSize);

        // ── Native pointer listeners on the map container ─────────────────────
        // Attached here (not in the component) so they share the same cleanup.
        const onMouseMove = (e) => {
            container.style.cursor = getHit(e.clientX, e.clientY)
                ? "pointer"
                : "";
        };

        const onClick = (e) => {
            const hit = getHit(e.clientX, e.clientY);
            if (hit && onParticleClickRef.current) {
                onParticleClickRef.current({
                    from: hit.from.name,
                    to: hit.to.name,
                });
            }
        };

        const onTouchEnd = (e) => {
            const t = e.changedTouches?.[0];
            if (!t) return;
            const hit = getHit(t.clientX, t.clientY);
            if (hit && onParticleClickRef.current) {
                onParticleClickRef.current({
                    from: hit.from.name,
                    to: hit.to.name,
                });
            }
        };

        container.addEventListener("mousemove", onMouseMove);
        container.addEventListener("click", onClick);
        container.addEventListener("touchend", onTouchEnd);

        // ── Geo → canvas pixel ────────────────────────────────────────────────
        const cpt = (lat, lng) =>
            map.latLngToContainerPoint(L.latLng(lat, lng));

        // ── Build particles ───────────────────────────────────────────────────
        const buildParticles = (locations) => {
            S.particles = [];
            const byName = Object.fromEntries(
                locations.map((l) => [l.name, l]),
            );
            paths.forEach(({ from, to }) => {
                const a = byName[from];
                const b = byName[to];
                if (!a || !b) {
                    console.warn(
                        `RouteConnections: city not found — "${from}", "${to}"`,
                    );
                    return;
                }
                const km = Math.round(haversineKm(a, b));
                const col = PCOLORS[S.colorIdx++ % PCOLORS.length];
                S.particles.push({
                    from: a,
                    to: b,
                    km,
                    color: col,
                    t: 0,
                    baseDur: durationForKm(km),
                    elapsed: 0,
                    lastTime: performance.now(),
                    paused: false,
                    trail: [],
                    _hx: null,
                    _hy: null,
                    _et: 0,
                    _curLat: a.lat,
                    _curLng: a.lng,
                });
            });
        };

        // ── rAF render loop ───────────────────────────────────────────────────
        const render = (now) => {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!S.locations) {
                S.animFrame = requestAnimationFrame(render);
                return;
            }

            // Advance particles
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

            // Camera-follow callback: report the tracked route's current lat/lng
            if (trackedRouteRef?.current && onTrackedPositionRef?.current) {
                const { from, to } = trackedRouteRef.current;
                const tracked = S.particles.find(
                    (p) => p.from.name === from && p.to.name === to,
                );
                if (tracked) {
                    onTrackedPositionRef.current({
                        lat: tracked._curLat,
                        lng: tracked._curLng,
                        isPlaying: !tracked.paused && tracked.t < 1,
                    });
                }
            }

            // Ghost route + coloured progress line
            ctx.save();
            ctx.setLineDash([6, 5]);
            for (const p of S.particles) {
                const fp = cpt(p.from.lat, p.from.lng);
                const tp = cpt(p.to.lat, p.to.lng);
                const cur = cpt(p._curLat, p._curLng);

                ctx.strokeStyle = "rgba(150,150,150,0.22)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(fp.x, fp.y);
                ctx.lineTo(tp.x, tp.y);
                ctx.stroke();

                ctx.strokeStyle = routeColor(p.color, p._et, 0.82);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(fp.x, fp.y);
                ctx.lineTo(cur.x, cur.y);
                ctx.stroke();
            }
            ctx.restore();

            // Trail + dot
            for (let i = 0; i < S.particles.length; i++) {
                const p = S.particles[i];
                const px = p._hx;
                const py = p._hy;

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
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = frac * 5;
                        ctx.globalAlpha = frac * 0.7;
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                ctx.globalAlpha = 1;
                if (p.paused) {
                    ctx.beginPath();
                    ctx.arc(px, py, 8, 0, Math.PI * 2);
                    ctx.fillStyle = "#fff";
                    ctx.strokeStyle = "#111";
                    ctx.lineWidth = 2;
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = "#111";
                    ctx.fillRect(px - 3.5, py - 3.5, 2.5, 7);
                    ctx.fillRect(px + 1, py - 3.5, 2.5, 7);
                } else {
                    const pulse = 1 + 0.1 * Math.sin(now / 400 + i * 1.3);
                    const r = 6 * pulse;
                    ctx.beginPath();
                    ctx.arc(px, py, r, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(px, py, r, 0, Math.PI * 2);
                    ctx.strokeStyle = "#111";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            S.animFrame = requestAnimationFrame(render);
        };

        // ── Fetch locations → build particles → start loop ────────────────────
        fetch(locationsUrl)
            .then((r) => {
                if (!r.ok)
                    throw new Error(
                        `Locations fetch failed: ${r.status} ${r.url}`,
                    );
                return r.json();
            })
            .then((locations) => {
                S.locations = locations;
                buildParticles(locations);
                S.animFrame = requestAnimationFrame(render);
            })
            .catch((err) =>
                console.error(
                    "RouteConnections: failed to load locations —",
                    err,
                ),
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
        trackedRouteRef,
        onTrackedPositionRef,
    ]); // eslint-disable-line react-hooks-exhaustive-deps
}
