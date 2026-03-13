/**
 * RouteConnections
 *
 * Draws animated city-to-city routes on a canvas overlay over a Leaflet map.
 * City coordinates are read from `locationsUrl` (Locations.json).
 *
 * Props
 * ─────
 *   map              L.Map     Leaflet map instance  (required)
 *   paths            Array     [{ from: "Roma", to: "Milano" }, ...]  (required)
 *   speedMult        number    Playback speed multiplier  (default: 2)
 *   locationsUrl     string    Full URL to Locations.json, already BASE_URL-prefixed
 *                              Pass: `${import.meta.env.BASE_URL.replace(/\/$/, "")}/data/Locations.json`
 *   loop             bool      Restart each route on completion  (default: true)
 *   onParticleClick  function  Called with { from, to } when a moving dot is clicked
 */

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";

// ── Constants ────────────────────────────────────────────────────────────────

const TRAIL_LEN = 18;
const PCOLORS = [
    "#ff9aa2",
    "#ffb347",
    "#fdfd96",
    "#b5ead7",
    "#a2c4f5",
    "#c9b1ff",
    "#f7a8d8",
];
const HIT_RADIUS = 22; // px — click/hover detection distance

// ── Pure helpers ─────────────────────────────────────────────────────────────

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function routeColor(hex, t, alpha) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255,
        g = (n >> 8) & 255,
        b = n & 255;
    const gr = 150;
    return `rgba(${Math.round(lerp(gr, r, t))},${Math.round(lerp(gr, g, t))},${Math.round(lerp(gr, b, t))},${alpha})`;
}

function durationForKm(km) {
    return Math.max(5000, Math.min(30000, km * 30));
}

function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RouteConnections({
    map,
    paths,
    speedMult = 2,
    locationsUrl, // must be BASE_URL-prefixed — passed in from Map.jsx
    loop = true,
    onParticleClick,
}) {
    const canvasRef = useRef(null);
    const stateRef = useRef({
        particles: [],
        colorIdx: 0,
        locations: null,
        speedMult,
        animFrame: null,
    });

    // ── Keep speedMult live without restarting the loop ───────────────────────
    useEffect(() => {
        const S = stateRef.current;
        const now = performance.now();
        S.speedMult = speedMult;
        S.particles.forEach((p) => {
            p.lastTime = now;
        });
    }, [speedMult]);

    // ── Hit detection ─────────────────────────────────────────────────────────
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

    const handleMouseMove = useCallback(
        (e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const parent = canvas.parentElement;
            if (parent)
                parent.style.cursor = getHit(e.clientX, e.clientY)
                    ? "pointer"
                    : "";
        },
        [getHit],
    );

    const handleClick = useCallback(
        (e) => {
            const hit = getHit(e.clientX, e.clientY);
            if (hit && onParticleClick)
                onParticleClick({ from: hit.from.name, to: hit.to.name });
        },
        [getHit, onParticleClick],
    );

    const handleTouchEnd = useCallback(
        (e) => {
            const t = e.changedTouches?.[0];
            if (!t) return;
            const hit = getHit(t.clientX, t.clientY);
            if (hit && onParticleClick)
                onParticleClick({ from: hit.from.name, to: hit.to.name });
        },
        [getHit, onParticleClick],
    );

    // ── Main animation effect ─────────────────────────────────────────────────
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

        const cpt = (lat, lng) =>
            map.latLngToContainerPoint(L.latLng(lat, lng));

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
            cancelAnimationFrame(S.animFrame);
            S.particles = [];
            S.locations = null;
        };
    }, [map, paths, locationsUrl, loop]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onTouchEnd={handleTouchEnd}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "auto",
                zIndex: 450,
            }}
        />
    );
}
