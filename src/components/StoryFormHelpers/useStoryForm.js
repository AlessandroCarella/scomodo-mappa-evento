import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";
import {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID_BACKUP,
    EMAILJS_TEMPLATE_ID_BACKUP,
    EMAILJS_PUBLIC_KEY_BACKUP,
    POPUP_EMAIL_FATAL_MESSAGE,
    EMPTY_FORM,
} from "@/config";
import { validate, buildTemplateParams } from "./formUtils.js";

/**
 * useStoryForm
 *
 * Encapsulates all state and side-effects for the story submission form:
 *   - Form values and per-field error messages
 *   - Submission status machine: idle → sending → success | error
 *   - First-field auto-focus on mount
 *   - Escape-key listener to call onClose
 *   - EmailJS submission with automatic backup-account fallback on 429
 *   - popup state for the fatal-failure PopUpAlert
 *
 * @param {{ onClose: function }} options
 * @returns {object} See return shape below.
 */
export function useStoryForm({ onClose }) {
    const [values, setValues] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("idle"); // "idle" | "sending" | "success" | "error"

    /**
     * popup — drives the <PopUpAlert> rendered by the parent form.
     * null  → alert hidden
     * { status, message, json } → alert visible
     *   status  — "info" | "warning" | "error"
     *   message — string shown to the user
     *   json    — pre-formatted string for the clipboard copy button (optional)
     */
    const [popup, setPopup] = useState(null);

    const firstFieldRef = useRef(null);

    // ── Side-effects ─────────────────────────────────────────

    // Focus the first input when the form mounts
    useEffect(() => {
        firstFieldRef.current?.focus();
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // ── Helpers ───────────────────────────────────────────────

    /** Returns true if the EmailJS error looks like a rate-limit (429). */
    function isRateLimitError(err) {
        return (
            err?.status === 429 ||
            err?.text?.includes("429") ||
            String(err).includes("429")
        );
    }

    /**
     * Builds the JSON string a user can paste into a manual email when
     * both EmailJS sends have failed. Mirrors the template field order:
     *   { nome, eta (number), cittaPartenza, cittaArrivo, data, storia }
     */
    function buildClipboardJson(vals) {
        return JSON.stringify(
            {
                nome: vals.nome,
                eta: vals.eta === "" ? null : Number(vals.eta),
                cittaPartenza: vals.cittaPartenza,
                cittaArrivo: vals.cittaArrivo,
                data: vals.data,
                storia: vals.storia,
            },
            null,
            2,
        );
    }

    // ── Handlers ─────────────────────────────────────────────

    /** Update a single field value and clear its error on change. */
    function handleChange(e) {
        const { name, value } = e.target;
        setValues((v) => ({ ...v, [name]: value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
    }

    /** Validate and submit via EmailJS, falling back to the backup account on 429. */
    async function handleSubmit(e) {
        e.preventDefault();

        const errs = validate(values);
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setStatus("sending");
        const params = buildTemplateParams(values);

        // // ── TEST CODE: simulate both sends failing with 429 ──────────
        // const fakeRateLimit = { status: 429, text: "Too Many Requests" };
        // const primaryErr = fakeRateLimit;
        // console.warn("Primary EmailJS failed:", primaryErr);
        // if (isRateLimitError(primaryErr)) {
        //     const backupErr = new Error("Backup also failed");
        //     console.error("Backup EmailJS also failed:", backupErr);
        // }
        // setPopup({
        //     status: "error",
        //     message: POPUP_EMAIL_FATAL_MESSAGE,
        //     json: buildClipboardJson(values),
        // });
        // setStatus("error");
        // return;
        // // ── END TEST CODE ────────────────────────────────────────────

        try {
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                params,
                EMAILJS_PUBLIC_KEY,
            );
            setStatus("success");
        } catch (primaryErr) {
            console.warn("Primary EmailJS failed:", primaryErr);

            if (isRateLimitError(primaryErr)) {
                console.info("Rate limit hit — retrying with backup account…");
                try {
                    await emailjs.send(
                        EMAILJS_SERVICE_ID_BACKUP,
                        EMAILJS_TEMPLATE_ID_BACKUP,
                        params,
                        EMAILJS_PUBLIC_KEY_BACKUP,
                    );
                    setStatus("success");
                    return;
                } catch (backupErr) {
                    console.error("Backup EmailJS also failed:", backupErr);
                }
            }

            // Both sends failed (or primary failed for a non-rate-limit reason):
            // surface the fatal popup so the user can copy their story manually.
            setPopup({
                status: "error",
                message: POPUP_EMAIL_FATAL_MESSAGE,
                json: buildClipboardJson(values),
            });
            setStatus("error");
        }
    }

    /** Reset the form back to its initial state (used after success). */
    function handleReset() {
        setValues(EMPTY_FORM);
        setErrors({});
        setStatus("idle");
    }

    /** Allow the error view to return to the form without losing values. */
    function handleRetry() {
        setStatus("idle");
    }

    /** Dismiss the fatal-failure popup without resetting the form values. */
    function handleClosePopup() {
        setPopup(null);
    }

    // ── Derived state ─────────────────────────────────────────

    return {
        // State
        values,
        errors,
        status,
        isIdle: status === "idle",
        isSending: status === "sending",
        isSuccess: status === "success",
        isError: status === "error",
        // Popup
        popup,
        handleClosePopup,
        // Handlers
        handleChange,
        handleSubmit,
        handleReset,
        handleRetry,
        // Refs
        firstFieldRef,
    };
}
