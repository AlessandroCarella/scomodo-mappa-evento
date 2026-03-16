import "./styles/StoriesOverlay.css";
import { useEffect, useMemo } from "react";

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

            <div className="story-postit__text">
                {body}
            </div>
        </article>
    );
}

export default function StoriesOverlay({ stories = [], onClose }) {
    const isOpen = Array.isArray(stories) && stories.length > 0;

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="stories-overlay" role="dialog" aria-modal="true">
            <div className="stories-overlay__panel">
                <button
                    type="button"
                    className="stories-overlay__close"
                    aria-label="Chiudi"
                    onClick={() => onClose?.()}
                >
                    ×
                </button>

                <div className="stories-overlay__header">
                    <div className="stories-overlay__title">Storie</div>
                    <div className="stories-overlay__subtitle">
                        {stories.length}{" "}
                        {stories.length === 1 ? "post-it" : "post-it"}
                    </div>
                </div>

                <div className="stories-overlay__list">
                    {stories.map((s) => (
                        <StoryPostIt key={s.id} story={s} />
                    ))}
                </div>
            </div>
        </div>
    );
}

