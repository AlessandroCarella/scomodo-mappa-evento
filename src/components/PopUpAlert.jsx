import { useEffect, useRef, useState } from "react";
import {
    POPUP_COLORS,
    POPUP_COPY_LABEL,
    POPUP_COPIED_LABEL,
    POPUP_CLOSE_LABEL,
} from "@/config";
import "./styles/popUpAlert.css";

// ── Icons ─────────────────────────────────────────────────────
// Inline SVGs so there is no icon-library dependency.

const ICONS = {
    info: (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle
                cx="10"
                cy="10"
                r="9"
                strokeWidth="1.5"
                stroke="currentColor"
            />
            <path
                d="M10 9v5"
                strokeWidth="2"
                strokeLinecap="round"
                stroke="currentColor"
            />
            <circle cx="10" cy="6.5" r="1" fill="currentColor" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
                d="M9.13 3.4 2.2 15.3A1 1 0 0 0 3.07 17h13.86a1 1 0 0 0 .87-1.7L10.87 3.4a1 1 0 0 0-1.74 0Z"
                strokeWidth="1.5"
                stroke="currentColor"
            />
            <path
                d="M10 8v4"
                strokeWidth="2"
                strokeLinecap="round"
                stroke="currentColor"
            />
            <circle cx="10" cy="14" r="1" fill="currentColor" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle
                cx="10"
                cy="10"
                r="9"
                strokeWidth="1.5"
                stroke="currentColor"
            />
            <path
                d="M7 7l6 6M13 7l-6 6"
                strokeWidth="2"
                strokeLinecap="round"
                stroke="currentColor"
            />
        </svg>
    ),
};

// ── Helpers ───────────────────────────────────────────────────

const EMAIL_RE = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;

/**
 * renderMessageWithLinks
 *
 * Splits a plain-text message on any email addresses it contains and
 * returns an array of strings / <a> elements suitable for React rendering.
 * Plain substrings are returned as-is; email addresses become mailto links.
 */
function renderMessageWithLinks(message) {
    // Split on captured group so email tokens are kept in the array
    const parts = message.split(EMAIL_RE);

    return parts.map((part, i) => {
        // Test against a fresh (non-stateful) copy to avoid lastIndex issues
        if (/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(part)) {
            return (
                <a
                    key={i}
                    href={`mailto:${part}`}
                    className="popup-alert__mailto"
                >
                    {part}
                </a>
            );
        }
        return part;
    });
}

// ── Component ─────────────────────────────────────────────────

/**
 * PopUpAlert
 *
 * A modal alert overlay with three severity levels.
 * Closes on Escape or when onClose is called.
 * Any email address found in `message` is automatically rendered as a
 * mailto link.
 *
 * Props:
 *   status   — "info" | "warning" | "error"
 *   message  — string — body text shown to the user
 *   json     — string | undefined — if provided, renders a copy-to-clipboard
 *              button with a <pre> block containing the JSON payload
 *   onClose  — function — called when the user dismisses the alert
 */
export function PopUpAlert({ status = "info", message, json, onClose }) {
    const [copied, setCopied] = useState(false);
    const closeButtonRef = useRef(null);
    const colors = POPUP_COLORS[status] ?? POPUP_COLORS.info;

    // ── Focus management ──────────────────────────────────────

    // Move focus to the close button when the alert opens
    useEffect(() => {
        closeButtonRef.current?.focus();
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // ── Clipboard ─────────────────────────────────────────────

    async function handleCopy() {
        if (!json) return;
        try {
            await navigator.clipboard.writeText(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that block clipboard access
            const el = document.createElement("textarea");
            el.value = json;
            el.style.position = "fixed";
            el.style.opacity = "0";
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    // ── Render ────────────────────────────────────────────────

    return (
        <div
            className="popup-alert-overlay"
            role="dialog"
            aria-modal="true"
            aria-live="assertive"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                className={`popup-alert popup-alert--${status}`}
                style={{
                    "--popup-accent": colors.accent,
                    "--popup-bg": colors.bg,
                    "--popup-text": colors.text,
                }}
            >
                {/* ── Header ── */}
                <div className="popup-alert__header">
                    <span className="popup-alert__icon">{ICONS[status]}</span>
                    <button
                        ref={closeButtonRef}
                        className="popup-alert__close"
                        onClick={onClose}
                        aria-label="Chiudi"
                    >
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path
                                d="M3 3l10 10M13 3L3 13"
                                strokeWidth="2"
                                strokeLinecap="round"
                                stroke="currentColor"
                            />
                        </svg>
                    </button>
                </div>

                {/* ── Message — emails rendered as mailto links ── */}
                <p className="popup-alert__message">
                    {renderMessageWithLinks(message)}
                </p>

                {/* ── JSON copy block (optional) ── */}
                {json && (
                    <div className="popup-alert__copy-block">
                        <pre className="popup-alert__json">{json}</pre>
                        <button
                            className="popup-alert__copy-btn"
                            onClick={handleCopy}
                        >
                            {copied ? POPUP_COPIED_LABEL : POPUP_COPY_LABEL}
                        </button>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="popup-alert__footer">
                    <button
                        className="popup-alert__dismiss-btn"
                        onClick={onClose}
                    >
                        {POPUP_CLOSE_LABEL}
                    </button>
                </div>
            </div>
        </div>
    );
}
