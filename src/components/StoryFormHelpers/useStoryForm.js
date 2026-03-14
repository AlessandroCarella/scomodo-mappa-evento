import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";
import {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
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
 *   - EmailJS submission
 *
 * @param {{ onClose: function }} options
 * @returns {object} See return shape below.
 */
export function useStoryForm({ onClose }) {
    const [values, setValues] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState("idle"); // "idle" | "sending" | "success" | "error"
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

    // ── Handlers ─────────────────────────────────────────────

    /** Update a single field value and clear its error on change. */
    function handleChange(e) {
        const { name, value } = e.target;
        setValues((v) => ({ ...v, [name]: value }));
        if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
    }

    /** Validate and submit via EmailJS. */
    async function handleSubmit(e) {
        e.preventDefault();

        const errs = validate(values);
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setStatus("sending");

        try {
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                buildTemplateParams(values),
                EMAILJS_PUBLIC_KEY,
            );
            setStatus("success");
        } catch (err) {
            console.error("EmailJS error:", err);
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
        // Handlers
        handleChange,
        handleSubmit,
        handleReset,
        handleRetry,
        // Refs
        firstFieldRef,
    };
}
