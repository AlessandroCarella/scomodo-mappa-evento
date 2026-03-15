import "./styles/StoryForm.css";
import {
    FORM_EYEBROW,
    FORM_TITLE,
    FORM_DESC,
    FORM_SUBMIT_LABEL,
    FORM_SENDING_LABEL,
    FORM_STORIA_LABEL,
    FORM_STORIA_HINT,
    FORM_STORIA_PLACEHOLDER,
    FORM_STORIA_MAX_LENGTH,
    FIELDS,
} from "@/config";
import { useStoryForm } from "./StoryFormHelpers/useStoryForm.js";
import FormField from "./StoryFormHelpers/FormField.jsx";
import FormFeedback from "./StoryFormHelpers/FormFeedback.jsx";
import { PopUpAlert } from "./PopUpAlert.jsx";

/**
 * StoryForm
 *
 * Full-screen overlay for submitting a travel story.
 * All state logic lives in useStoryForm; all field definitions live in
 * This component is responsible only for layout and wiring.
 *
 * @param {function} onClose  Called when the user dismisses the overlay.
 */
export default function StoryForm({ onClose }) {
    const {
        values,
        errors,
        isSuccess,
        isError,
        isSending,
        handleChange,
        handleSubmit,
        handleReset,
        handleRetry,
        firstFieldRef,
        popup,
        handleClosePopup,
    } = useStoryForm({ onClose });

    const storiaHint = FORM_STORIA_HINT.replace(
        "{max}",
        FORM_STORIA_MAX_LENGTH,
    );

    return (
        <div
            className="sf-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Invia la tua storia"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="sf-panel">
                {/* ── Header — always visible ── */}
                <div className="sf-header">
                    <div className="sf-header-meta">
                        <p className="sf-eyebrow">{FORM_EYEBROW}</p>
                        <h2 className="sf-title">{FORM_TITLE}</h2>
                        <p className="sf-desc">
                            {FORM_DESC}
                            <strong> Tutti i campi sono obbligatori.</strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        className="sf-close"
                        aria-label="Chiudi"
                        onClick={() => onClose?.()}
                    >
                        ×
                    </button>
                </div>

                {/* ── Feedback (success / error) ── */}
                {(isSuccess || isError) && (
                    <FormFeedback
                        type={isSuccess ? "success" : "error"}
                        onReset={handleReset}
                        onClose={onClose}
                        onRetry={handleRetry}
                    />
                )}

                {/* ── Form ── */}
                {!isSuccess && !isError && (
                    <form
                        className="sf-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        {/* Short fields — two-column grid */}
                        <div className="sf-grid">
                            {FIELDS.map((field, i) => (
                                <FormField
                                    key={field.id}
                                    field={field}
                                    value={values[field.id]}
                                    error={errors[field.id]}
                                    onChange={handleChange}
                                    inputRef={
                                        i === 0 ? firstFieldRef : undefined
                                    }
                                />
                            ))}
                        </div>

                        {/* Storia textarea — full width */}
                        <div
                            className={`sf-field sf-field--full${errors.storia ? " sf-field--error" : ""}`}
                        >
                            <label className="sf-label" htmlFor="sf-storia">
                                <span className="sf-label-text">
                                    {FORM_STORIA_LABEL}
                                </span>
                                <span className="sf-hint">{storiaHint}</span>
                            </label>
                            <textarea
                                id="sf-storia"
                                name="storia"
                                value={values.storia}
                                onChange={handleChange}
                                placeholder={FORM_STORIA_PLACEHOLDER}
                                className="sf-textarea"
                                rows={5}
                                maxLength={FORM_STORIA_MAX_LENGTH}
                                aria-invalid={!!errors.storia}
                                aria-describedby={
                                    errors.storia ? "sf-err-storia" : undefined
                                }
                            />
                            <div className="sf-textarea-footer">
                                {errors.storia && (
                                    <span
                                        id="sf-err-storia"
                                        className="sf-error-msg"
                                        role="alert"
                                    >
                                        {errors.storia}
                                    </span>
                                )}
                                <span className="sf-char-count">
                                    {values.storia.length} /{" "}
                                    {FORM_STORIA_MAX_LENGTH}
                                </span>
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="sf-submit-row">
                            <button
                                type="submit"
                                className={`sf-btn-submit${isSending ? " sf-btn-submit--sending" : ""}`}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <>
                                        <span
                                            className="sf-spinner"
                                            aria-hidden
                                        />
                                        {FORM_SENDING_LABEL}
                                    </>
                                ) : (
                                    FORM_SUBMIT_LABEL
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ── Fatal-failure popup — rendered inside the overlay so it
                 sits above the form panel but within the same stacking context ── */}
            {popup && (
                <PopUpAlert
                    status={popup.status}
                    message={popup.message}
                    json={popup.json}
                    onClose={handleClosePopup}
                />
            )}
        </div>
    );
}
