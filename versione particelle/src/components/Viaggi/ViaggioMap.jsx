import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_URL, TILE_ATTRIBUTION, ITALY_BOUNDS } from "../../config";
import "./ViaggioMap.css";

const BASE     = import.meta.env.BASE_URL.replace(/\/$/, "");
const DATA_URL = `${BASE}/data/viaggi.json`;

const DEFAULT_MAX_P = 10;
const DEFAULT_SPEED = 2;
const PCOLORS  = ["#ff9aa2","#ffb347","#fdfd96","#b5ead7","#a2c4f5","#c9b1ff","#f7a8d8"];
const TRAIL_LEN = 18;

function durationForKm(km) { return Math.max(5000, Math.min(30000, km * 30)); }
function getKm(a, b, dist)  { return dist[`${a.name}-${b.name}`] || dist[`${b.name}-${a.name}`] || 400; }
function fillStory(tpl, from, to, km) {
    return tpl.replace(/{from}/g, from).replace(/{to}/g, to)
              .replace(/{km}/g, km).replace(/{hours}/g, Math.round(km / 100));
}
const lerp = (a, b, t) => a + (b - a) * t;
const ease  = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
function routeColor(hex, t, alpha) {
    const n  = parseInt(hex.slice(1), 16);
    const r  = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const gr = 150;
    return `rgba(${Math.round(lerp(gr,r,t))},${Math.round(lerp(gr,g,t))},${Math.round(lerp(gr,b,t))},${alpha})`;
}

export default function ViaggioMap() {
    const mapContainerRef = useRef(null);
    const wrapperRef      = useRef(null);
    const canvasRef       = useRef(null);

    // shared mutable state — never triggers re-render
    const stateRef = useRef({
        map:          null,
        data:         null,
        particles:    [],
        cityMarkers:  [],
        colorIdx:     0,
        maxParticles: DEFAULT_MAX_P,
        speedMult:    DEFAULT_SPEED,
        selectedP:    null,
        animFrame:    null,
        spawnTimer:   null,
    });

    const [maxParticles, setMaxParticles] = useState(DEFAULT_MAX_P);
    const [speedMult,    setSpeedMult]    = useState(DEFAULT_SPEED);
    const [cursor,       setCursor]       = useState("default");
    const [modalOpen,    setModalOpen]    = useState(false);
    const [modalData,    setModalData]    = useState(null);
    const [, forceModalTick]              = useState(0);

    const handleMaxP  = useCallback(v => { stateRef.current.maxParticles = v; setMaxParticles(v); }, []);
    const handleSpeed = useCallback(v => {
        stateRef.current.speedMult = v; setSpeedMult(v);
        const now = performance.now();
        stateRef.current.particles.forEach(p => { p.lastTime = now; });
    }, []);

    // ── Everything in ONE effect — no ordering issues ─────────────
    useEffect(() => {
        const S = stateRef.current;

        // 1. Init map
        const map = L.map(mapContainerRef.current, {
            zoomControl: true, attributionControl: false,
            dragging: true, scrollWheelZoom: true,
            doubleClickZoom: true, touchZoom: true,
            keyboard: true, boxZoom: true,
        });
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
        map.fitBounds(ITALY_BOUNDS, { padding: [32, 32], animate: false });
        S.map = map;

        // 2. Sync canvas size
        const syncCanvas = () => {
            const cv = canvasRef.current;
            const el = mapContainerRef.current;
            if (!cv || !el) return;
            cv.width  = el.offsetWidth;
            cv.height = el.offsetHeight;
        };
        syncCanvas();
        window.addEventListener("resize", syncCanvas);
        map.on("resize", syncCanvas);

        // 3. Spawn helpers
        const spawnParticle = () => {
            const { data, particles, maxParticles: maxP } = S;
            if (!data || particles.length >= maxP) return;
            const cities = data.cities;
            let a, b;
            do {
                a = cities[Math.floor(Math.random() * cities.length)];
                b = cities[Math.floor(Math.random() * cities.length)];
            } while (a === b);
            const km  = getKm(a, b, data.distances);
            const col = PCOLORS[S.colorIdx++ % PCOLORS.length];
            const tpl = data.stories[Math.floor(Math.random() * data.stories.length)];
            particles.push({
                from: a, to: b, km, color: col,
                story: fillStory(tpl.template, a.name, b.name, km),
                t: 0, baseDur: durationForKm(km),
                elapsed: 0, lastTime: performance.now(), paused: false,
                trail: [], _hx: null, _hy: null, _et: 0,
                _curLat: a.lat, _curLng: a.lng,
            });
        };

        const startSpawnLoop = () => {
            if (!S.data) { S.spawnTimer = setTimeout(startSpawnLoop, 200); return; }
            for (let i = 0; i < DEFAULT_MAX_P; i++) setTimeout(spawnParticle, i * 250);
            const loop = () => {
                const needed = S.maxParticles - S.particles.length;
                for (let i = 0; i < needed; i++) spawnParticle();
                S.spawnTimer = setTimeout(loop, 800 + Math.random() * 1400);
            };
            S.spawnTimer = setTimeout(loop, DEFAULT_MAX_P * 250 + 400);
        };

        // 4. Render loop
        const render = now => {
            const cv = canvasRef.current;
            if (!cv || !S.map) { S.animFrame = requestAnimationFrame(render); return; }
            const ctx = cv.getContext("2d");
            ctx.clearRect(0, 0, cv.width, cv.height);
            if (!S.data) { S.animFrame = requestAnimationFrame(render); return; }

            const cpt = (lat, lng) => S.map.latLngToContainerPoint(L.latLng(lat, lng));

            // Advance particles
            const alive = [];
            for (const p of S.particles) {
                const dt = now - p.lastTime; p.lastTime = now;
                if (!p.paused) p.elapsed += dt * S.speedMult;
                p.t    = Math.min(p.elapsed / p.baseDur, 1);
                p._et  = ease(p.t);
                p._curLat = lerp(p.from.lat, p.to.lat, p._et);
                p._curLng = lerp(p.from.lng, p.to.lng, p._et);
                const cur = cpt(p._curLat, p._curLng);
                p._hx = cur.x; p._hy = cur.y;
                if (!p.paused) {
                    p.trail.push({ lat: p._curLat, lng: p._curLng });
                    if (p.trail.length > TRAIL_LEN) p.trail.shift();
                }
                if (p.t < 1) alive.push(p);
            }
            S.particles = alive;

            // Route lines
            ctx.save();
            ctx.setLineDash([6, 5]);
            for (const p of S.particles) {
                const fp  = cpt(p.from.lat, p.from.lng);
                const tp  = cpt(p.to.lat,   p.to.lng);
                const cur = cpt(p._curLat,  p._curLng);
                ctx.strokeStyle = "rgba(150,150,150,0.22)";
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(fp.x, fp.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
                ctx.strokeStyle = routeColor(p.color, p._et, 0.82);
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(fp.x, fp.y); ctx.lineTo(cur.x, cur.y); ctx.stroke();
            }
            ctx.restore();

            // Trail + dot
            for (let i = 0; i < S.particles.length; i++) {
                const p  = S.particles[i];
                const px = p._hx, py = p._hy;
                if (p.trail.length > 1) {
                    ctx.save();
                    ctx.lineCap = "round"; ctx.lineJoin = "round";
                    for (let j = 1; j < p.trail.length; j++) {
                        const frac = j / p.trail.length;
                        const pa = cpt(p.trail[j-1].lat, p.trail[j-1].lng);
                        const pb = cpt(p.trail[j].lat,   p.trail[j].lng);
                        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth   = frac * 5;
                        ctx.globalAlpha = frac * 0.7;
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                if (p.paused) {
                    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2);
                    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = "#111";
                    ctx.fillRect(px-3.5, py-3.5, 2.5, 7);
                    ctx.fillRect(px+1,   py-3.5, 2.5, 7);
                } else {
                    const pulse = 1 + 0.1 * Math.sin(now / 400 + i * 1.3);
                    const r = 6 * pulse;
                    ctx.globalAlpha = 1;
                    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
                    ctx.fillStyle = p.color; ctx.fill();
                    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
                    ctx.strokeStyle = "#111"; ctx.lineWidth = 1.5; ctx.stroke();
                }
            }

            S.animFrame = requestAnimationFrame(render);
        };

        // 5. Load data → add city markers → start loops
        fetch(DATA_URL).then(r => r.json()).then(data => {
            S.data = data;

            // L.circleMarker: DOM element in overlayPane,
            // CSS-transformed with tiles → perfectly smooth on zoom
            S.cityMarkers = data.cities.flatMap(c => {
                const outer = L.circleMarker([c.lat, c.lng], {
                    radius: 5, weight: 1.5,
                    color: "#111", fillColor: "#fff", fillOpacity: 1,
                    interactive: false,
                }).addTo(map);
                const inner = L.circleMarker([c.lat, c.lng], {
                    radius: 2, weight: 0,
                    color: "#111", fillColor: "#111", fillOpacity: 1,
                    interactive: false,
                }).addTo(map);
                outer.bindTooltip(c.name.toUpperCase(), {
                    permanent: true, direction: "bottom",
                    offset: [0, 6], className: "vg-city-tooltip",
                    interactive: false,
                });
                return [outer, inner];
            });

            startSpawnLoop();
            S.animFrame = requestAnimationFrame(render);
        }).catch(err => console.error("viaggi.json:", err));

        // Cleanup
        return () => {
            window.removeEventListener("resize", syncCanvas);
            cancelAnimationFrame(S.animFrame);
            clearTimeout(S.spawnTimer);
            S.cityMarkers.forEach(m => m.remove());
            S.cityMarkers  = [];
            S.particles    = [];
            S.data         = null;
            S.map          = null;
            map.remove();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Hit detection ─────────────────────────────────────────────
    const getHit = useCallback((clientX, clientY) => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return null;
        const rect = wrapper.getBoundingClientRect();
        const mx = clientX - rect.left, my = clientY - rect.top;
        let hit = null, best = 22;
        for (const p of stateRef.current.particles) {
            if (p._hx == null) continue;
            const d = Math.hypot(p._hx - mx, p._hy - my);
            if (d < best) { best = d; hit = p; }
        }
        return hit;
    }, []);

    const openModal = useCallback(p => {
        const S = stateRef.current;
        if (S.selectedP && S.selectedP !== p) {
            S.selectedP.paused   = false;
            S.selectedP.lastTime = performance.now();
        }
        p.paused = true;
        S.selectedP = p;
        setModalData({...p});
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        const S = stateRef.current;
        if (S.selectedP) {
            S.selectedP.paused   = false;
            S.selectedP.lastTime = performance.now();
            S.selectedP          = null;
        }
        setModalData(null);
        setModalOpen(false);
    }, []);

    const handleMouseMove = useCallback(e => {
        const p = getHit(e.clientX, e.clientY);
        setCursor(c => { const n = p ? "pointer" : "default"; return c === n ? c : n; });
    }, [getHit]);
    const handleClick = useCallback(e => { const p = getHit(e.clientX, e.clientY); if (p) openModal(p); }, [getHit, openModal]);
    const handleTouch = useCallback(e => {
        const t = e.changedTouches[0];
        if (t) { const p = getHit(t.clientX, t.clientY); if (p) openModal(p); }
    }, [getHit, openModal]);

    // Progress bar tick
    useEffect(() => {
        if (!modalOpen) return;
        const iv = setInterval(() => forceModalTick(n => n + 1), 500);
        return () => clearInterval(iv);
    }, [modalOpen]);

    const speedLabel = speedMult === 1 ? "1×" : speedMult === 4 ? "4×" : `${speedMult}×`;
    const liveT = modalOpen ? (stateRef.current.selectedP?.t ?? modalData?.t ?? 0) : 0;

    return (
        <div className="vg-root">
            <header className="vg-header">
                <Link to="/" className="vg-back">← Mappa</Link>
                <div className="vg-title-block">
                    <span className="vg-eyebrow">Scomodo</span>
                    <h1 className="vg-title">Viaggi d'Italia</h1>
                </div>
                <div className="vg-header-spacer" />
            </header>

            <div ref={wrapperRef} className="vg-map-wrapper" style={{ cursor }}
                onMouseMove={handleMouseMove} onClick={handleClick} onTouchEnd={handleTouch}>
                <div ref={mapContainerRef} className="vg-leaflet" />
                <canvas ref={canvasRef} className="vg-canvas" style={{ pointerEvents: "none" }} />
            </div>

            <div className="vg-controls">
                <div className="vg-slider-row">
                    <span className="vg-slider-label">Velocità</span>
                    <input type="range" min={1} max={4} step={0.5} value={speedMult}
                        onChange={e => handleSpeed(parseFloat(e.target.value))} className="vg-slider" />
                    <span className="vg-slider-val">{speedLabel}</span>
                </div>
                <div className="vg-slider-row">
                    <span className="vg-slider-label">Rotte</span>
                    <input type="range" min={5} max={15} step={1} value={maxParticles}
                        onChange={e => handleMaxP(parseInt(e.target.value))} className="vg-slider" />
                    <span className="vg-slider-val">{maxParticles}</span>
                </div>
            </div>

            <div className="vg-hint">clicca sui punti in movimento</div>

            {modalOpen && modalData && (
                <div className="vg-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="vg-modal">
                        <button className="vg-modal-close" onClick={closeModal}>✕</button>
                        <div className="vg-modal-tag">Reportage di viaggio</div>
                        <h2 className="vg-modal-route">
                            {modalData.from.name}<span>—</span>{modalData.to.name}
                        </h2>
                        <div className="vg-modal-meta">{modalData.km} km</div>
                        <div className="vg-modal-divider" />
                        <p className="vg-modal-story">{modalData.story}</p>
                        <div className="vg-modal-prog">
                            <div className="vg-modal-prog-bar" style={{ width: `${(liveT * 100).toFixed(1)}%` }} />
                        </div>
                        <div className="vg-modal-prog-label">
                            viaggio in corso — {(liveT * 100).toFixed(0)}%
                            {modalData.paused && <span className="vg-modal-paused"> · in pausa</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
