import "./styles/StoriesOverlay.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

function truncate(text, maxLen) {
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen).trimEnd()}…`;
}

function abbrCity(name) {
    const safe = (name || "").trim();
    if (!safe) return "—";
    return safe.slice(0, 3).toUpperCase();
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

    // Map real JSON shape → display-safe fields
    const passenger =
        (story.nome && String(story.nome).trim()) ||
        (story.eta != null ? `Anon (${story.eta})` : "Anonimo");

    const tratta = `${abbrCity(story.cittaPartenza)}-${abbrCity(
        story.cittaArrivo,
    )}`;

    const dataText =
        (story.data && String(story.data).trim()) ||
        (story.anno && String(story.anno).trim()) ||
        "—";

    const body = truncate(story.storia || story.testo || "", 500);

    return (
        <article className="story-postit">
            <div className="story-postit__meta">
                <div className="story-postit__row">
                    <div className="story-postit__label">Passeggero</div>
                    <SplitFlapText text={passenger} />
                </div>
                <div className="story-postit__row">
                    <div className="story-postit__label">Tratta</div>
                    <SplitFlapText text={tratta} />
                </div>
                <div className="story-postit__row">
                    <div className="story-postit__label">Data</div>
                    <SplitFlapText text={dataText} />
                </div>
            </div>

            <div className="story-postit__text">{body}</div>
        </article>
    );
}

/**
 * Floating stories panel with glassmorphism backdrop and story navigation.
 *
 * Extra optional props for map tracking:
 * - mapRef: React ref to Leaflet map instance
 * - currentLatLng: { lat, lng } of moving dot
 * - isPlaying: whether the route animation is active
 * - initialIndex: starting story index
 * - onStoryChange: callback when current story changes
 */
export default function StoriesOverlay({
    stories = [],
    onClose,
    mapRef,
    currentLatLng,
    isPlaying = false,
    initialIndex = 0,
    onStoryChange,
}) {
    const isOpen = Array.isArray(stories) && stories.length > 0;
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
    const currentLatLngRef = useRef(currentLatLng);

    // keep latest coords in a ref so interval sees fresh values
    useEffect(() => {
        currentLatLngRef.current = currentLatLng;
    }, [currentLatLng]);

    // close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    // clamp index when stories change
    useEffect(() => {
        if (!isOpen) return;
        setCurrentStoryIndex((prev) =>
            Math.min(prev, Math.max(stories.length - 1, 0)),
        );
    }, [isOpen, stories.length]);

    // notify parent when story changes (optional)
    useEffect(() => {
        if (!isOpen || !onStoryChange) return;
        const story = stories[currentStoryIndex];
        if (story) {
            onStoryChange({ index: currentStoryIndex, story });
        }
    }, [currentStoryIndex, isOpen, onStoryChange, stories]);

    // continuous map tracking: panTo every second while animation is playing
    useEffect(() => {
        if (!isOpen || !isPlaying) return;
        if (!mapRef?.current) return;

        const map = mapRef.current;
        const intervalId = setInterval(() => {
            const coords = currentLatLngRef.current;
            if (!coords || coords.lat == null || coords.lng == null) return;

            map.panTo([coords.lat, coords.lng], {
                animate: true,
                duration: 1,
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isOpen, isPlaying, mapRef]);

    if (!isOpen) return null;

    const hasMultipleStories = stories.length > 1;
    const currentStory = stories[currentStoryIndex];

    const handleNextStory = () => {
        if (!hasMultipleStories) return;
        setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
    };

    return (
        <div
            className="stories-overlay"
            role="dialog"
            aria-modal="true"
        >
            <div className="stories-overlay__backdrop" />

            <div className="stories-overlay__panel stories-overlay__panel--floating">
                <button
                    type="button"
                    className="stories-overlay__close"
                    aria-label="Chiudi"
                    onClick={() => onClose?.()}
                >
                    <X size={20} />
                </button>

                <header className="stories-overlay__header">
                    <div className="stories-overlay__title">Storie</div>
                    <div className="stories-overlay__subtitle">
                        {currentStoryIndex + 1} / {stories.length} post-it
                    </div>
                </header>

                <div className="stories-overlay__content">
                    <div
                        key={currentStory?.id ?? currentStoryIndex}
                        className="stories-overlay__story-slide"
                    >
                        <StoryPostIt story={currentStory} />
                    </div>
                </div>

                {hasMultipleStories && (
                    <button
                        type="button"
                        className="stories-overlay__next"
                        onClick={handleNextStory}
                        aria-label="Prossima storia"
                    >
                        <ChevronDown size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}

