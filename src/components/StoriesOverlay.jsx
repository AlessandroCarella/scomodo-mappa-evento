import "./styles/StoriesOverlay.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { PARTENZE_ARRIVI } from "../config";
import { X } from "lucide-react";

const FOLLOW_INTERVAL_MS = 350;

function truncate(text, maxLen) {
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen).trimEnd()}...`;
}

function abbrCity(name) {
    const safe = (name || "").trim();
    if (!safe) return "---";
    return safe.slice(0, 3).toUpperCase();
}

function getStoryKey(story, index = 0) {
    return [
        story?.nome || "anonimo",
        story?.cittaPartenza || "partenza",
        story?.cittaArrivo || "arrivo",
        story?.data || "data",
        index,
    ].join("::");
}

export function SplitFlapText({ text = "" }) {
    const chars = useMemo(() => String(text).split(""), [text]);
    return (
        <span className="splitflap">
            {chars.map((ch, i) => (
                <span key={`${ch}-${i}`} className="splitflap__char">
                    {ch === " " ? "\u00A0" : ch}
                </span>
            ))}
        </span>
    );
}

export function StoryPostIt({ story }) {
    if (!story) return null;

    const passenger =
        (story.nome && String(story.nome).trim().toUpperCase()) ||
        "ANONIMO";

    const eta = story.eta != null ? String(story.eta) : "---";

    const partenza = (story.cittaPartenza || "---").toUpperCase();
    const arrivo = (story.cittaArrivo || "---").toUpperCase();

    const dataText =
        (story.data && String(story.data).trim()) ||
        (story.anno && String(story.anno).trim()) ||
        "---";

    const body = truncate(story.storia || story.testo || "", 500);

    return (
        <article className="story-postit">
            <div className="story-postit__meta">
                <div className="story-postit__row">
                    <div className="story-postit__label">Passeggero</div>
                    <div className="story-postit__value">{passenger}</div>
                </div>
                <div className="story-postit__row">
                    <div className="story-postit__label">Età</div>
                    <div className="story-postit__value">{eta}</div>
                </div>
                <div className="story-postit__row">
                    <div className="story-postit__label">Partenza</div>
                    <div className="story-postit__value">{partenza}</div>
                </div>
                <div className="story-postit__row">
                    <div className="story-postit__label">Arrivo</div>
                    <div className="story-postit__value">{arrivo}</div>
                </div>
                <div className="story-postit__row">
                    <div className="story-postit__label">Data</div>
                    <div className="story-postit__value">{dataText}</div>
                </div>
            </div>

            <div className="story-postit__text">{body}</div>
        </article>
    );
}

export default function StoriesOverlay({
    isOpen = false,
    mode = "route",
    stories = [],
    cityName = "",
    departureStories = [],
    arrivalStories = [],
    showDepartures = true,
    showArrivals = true,
    onToggleDepartures: _onToggleDepartures,
    onToggleArrivals: _onToggleArrivals,
    onClose,
    currentLatLng,
    focusTrackedLatLng,
    isPlaying = false,
    initialIndex = 0,
    onStoryChange,
}) {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
    const currentLatLngRef = useRef(currentLatLng);
    const isRouteMode = mode === "route";
    const isCityMode = mode === "city";

    const visibleCitySections = useMemo(() => {
        if (!isCityMode) return [];

        const sections = [];

        if (showDepartures && departureStories.length > 0) {
            sections.push({
                id: "departures",
                label: "Partenze",
                stories: departureStories,
            });
        }

        if (showArrivals && arrivalStories.length > 0) {
            sections.push({
                id: "arrivals",
                label: "Arrivi",
                stories: arrivalStories,
            });
        }

        return sections;
    }, [
        arrivalStories,
        departureStories,
        isCityMode,
        showArrivals,
        showDepartures,
    ]);

    useEffect(() => {
        currentLatLngRef.current = currentLatLng;
    }, [currentLatLng]);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !isRouteMode) return;

        const lastIndex = Math.max(stories.length - 1, 0);
        const nextIndex = Math.min(Math.max(initialIndex, 0), lastIndex);
        setCurrentStoryIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    }, [initialIndex, isOpen, isRouteMode, stories]);

    useEffect(() => {
        if (!isOpen || !isRouteMode || !onStoryChange) return;

        const story = stories[currentStoryIndex];
        if (story) {
            onStoryChange({ index: currentStoryIndex, story });
        }
    }, [currentStoryIndex, isOpen, isRouteMode, onStoryChange, stories]);

    useEffect(() => {
        if (
            !isOpen ||
            !isRouteMode ||
            !isPlaying ||
            !focusTrackedLatLng
        ) {
            return;
        }

        const intervalId = setInterval(() => {
            const coords = currentLatLngRef.current;
            if (!coords || coords.lat == null || coords.lng == null) return;

            focusTrackedLatLng(coords);
        }, FOLLOW_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [focusTrackedLatLng, isOpen, isPlaying, isRouteMode]);

    if (!isOpen) return null;

    return (
        <div
            className="stories-overlay"
            role="dialog"
            aria-modal="true"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                className="stories-overlay__panel stories-overlay__panel--floating"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="stories-overlay__close"
                    aria-label="Chiudi"
                    onClick={() => onClose?.()}
                >
                    <X size={20} />
                </button>

                {isCityMode ? (
                    <>
                        <header className="stories-overlay__header">
                            <div className="stories-overlay__title">
                                {cityName || "Storie"}
                            </div>
                            <div className="stories-overlay__subtitle">
                                Partenze {departureStories.length} · Arrivi{" "}
                                {arrivalStories.length}
                            </div>
                        </header>

                        {PARTENZE_ARRIVI === "All" && (
                            <div
                                className="stories-overlay__toggles"
                                role="group"
                                aria-label={`Mostra le storie per ${cityName || "questa citta"}`}
                            >
                                <button
                                    type="button"
                                    className={`stories-overlay__toggle${showDepartures ? " stories-overlay__toggle--active" : ""}`}
                                    onClick={() => _onToggleDepartures?.()}
                                    aria-pressed={showDepartures}
                                >
                                    <span>Partenze</span>
                                    <span className="stories-overlay__toggle-count">
                                        {departureStories.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`stories-overlay__toggle${showArrivals ? " stories-overlay__toggle--active" : ""}`}
                                    onClick={() => _onToggleArrivals?.()}
                                    aria-pressed={showArrivals}
                                >
                                    <span>Arrivi</span>
                                    <span className="stories-overlay__toggle-count">
                                        {arrivalStories.length}
                                    </span>
                                </button>
                            </div>
                        )}

                        <div className="stories-overlay__content stories-overlay__content--stacked">
                            {visibleCitySections.map((section) => (
                                <section
                                    key={section.id}
                                    className="stories-overlay__section"
                                >
                                    <div className="stories-overlay__section-header">
                                        <div className="stories-overlay__section-title">
                                            {section.label}
                                        </div>
                                        <div className="stories-overlay__section-count">
                                            {section.stories.length}
                                        </div>
                                    </div>

                                    <div className="stories-overlay__section-list">
                                        {section.stories.map((story, index) => (
                                            <div
                                                key={getStoryKey(story, index)}
                                                className="stories-overlay__story-slide"
                                            >
                                                <StoryPostIt story={story} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <header className="stories-overlay__header">
                            <div className="stories-overlay__title">Storie</div>
                            <div className="stories-overlay__subtitle">
                                {stories.length > 0
                                    ? `${stories.length} post-it`
                                    : "0 post-it"}
                            </div>
                        </header>

                        <div className="stories-overlay__content stories-overlay__content--stacked">
                            <div className="stories-overlay__section-list">
                                {stories.map((story, index) => (
                                    <div
                                        key={getStoryKey(story, index)}
                                        className="stories-overlay__story-slide"
                                    >
                                        <StoryPostIt story={story} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
