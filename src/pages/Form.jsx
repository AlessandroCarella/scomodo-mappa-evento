/**
 * src/pages/Form.jsx
 *
 * Standalone story-submission page at /form.
 * Reuses all the form logic (useStoryForm) and sub-components
 * (FormField, FormFeedback) from the existing StoryForm feature,
 * but renders without the full-screen overlay — it IS the page.
 */
import { useNavigate } from "react-router-dom";

import { useStoryForm } from "../components/StoryFormHelpers/useStoryForm";
import FormField from "../components/StoryFormHelpers/FormField";
import FormFeedback from "../components/StoryFormHelpers/FormFeedback";
import { PopUpAlert } from "../components/PopUpAlert";
import GdprNotice from "../components/StoryFormHelpers/GdprNotice.jsx";
import MapBackground from "./Form/MapBackground";

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
    NAV_FORM_BACK,
    NAV_FORM_AFTER_SUBMIT,
} from "@/config";

// Page-level layout
import styles from "./styles/Form.module.css";

// Reuse the existing StoryForm field / panel styles (no duplication)
import "../components/styles/StoryForm.css";

export default function FormPage() {
    const navigate = useNavigate();

    // useStoryForm expects an `onClose` callback; on this page "close" means
    // navigating home once the user explicitly dismisses a success state.
    const handleClose = () => navigate(NAV_FORM_AFTER_SUBMIT);

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
    } = useStoryForm({ onClose: handleClose });

    const storiaHint = FORM_STORIA_HINT.replace(
        "{max}",
        FORM_STORIA_MAX_LENGTH,
    );

    return (
        <>
            {/* ── map backdrop + dim — fixed, outside the scroll container
                 so they are never trapped by its stacking context ── */}
            <MapBackground className={styles.mapBg} />
            <div className={styles.mapOverlay} aria-hidden="true" />

            <div className={styles.page}>
                {/* ── top bar ── */}
                <header className={styles.topBar}>
                    <button
                        className={styles.backBtn}
                        onClick={() => navigate(NAV_FORM_BACK)}
                        aria-label="Torna alla mappa"
                    >
                        <span className={styles.backArrow}>←</span>
                        Mappa
                    </button>

                    <div className={styles.topBarMeta}>
                        <p className={styles.eyebrow}>{FORM_EYEBROW}</p>
                        <h1 className={styles.pageTitle}>{FORM_TITLE}</h1>
                    </div>

                    {/* spacer mirrors the back-button width so the title stays centred */}
                    <div className={styles.topBarSpacer} />
                </header>

                {/* ── card ── */}
                <main className={styles.main}>
                    <div className={styles.card}>
                        {/* description — hidden on mobile to save space */}
                        <p className={styles.desc}>
                            {FORM_DESC}
                            {/* <strong> Tutti i campi sono obbligatori.</strong> */}
                            {/* GDPR notice — art. 13 Reg. UE 2016/679 */}
                            <GdprNotice />
                        </p>

                        {/* ── feedback states ── */}
                        {(isSuccess || isError) && (
                            <FormFeedback
                                type={isSuccess ? "success" : "error"}
                                onReset={handleReset}
                                onClose={handleClose}
                                onRetry={handleRetry}
                            />
                        )}

                        {/* ── form ── */}
                        {!isSuccess && !isError && (
                            <form
                                className="sf-form"
                                onSubmit={handleSubmit}
                                noValidate
                            >
                                {/* short fields — two-column grid */}
                                <div className="sf-grid">
                                    {FIELDS.map((field, i) => (
                                        <FormField
                                            key={field.id}
                                            field={field}
                                            value={values[field.id]}
                                            error={errors[field.id]}
                                            onChange={handleChange}
                                            inputRef={
                                                i === 0
                                                    ? firstFieldRef
                                                    : undefined
                                            }
                                        />
                                    ))}
                                </div>

                                {/* storia textarea — full width */}
                                <div
                                    className={`sf-field sf-field--full${
                                        errors.storia ? " sf-field--error" : ""
                                    }`}
                                >
                                    <label
                                        className="sf-label"
                                        htmlFor="sf-storia"
                                    >
                                        <span className="sf-label-text">
                                            {FORM_STORIA_LABEL}
                                        </span>
                                        <span className="sf-hint">
                                            {storiaHint}
                                        </span>
                                    </label>
                                    <textarea
                                        id="sf-storia"
                                        name="storia"
                                        value={values.storia}
                                        onChange={handleChange}
                                        placeholder={FORM_STORIA_PLACEHOLDER}
                                        className="sf-textarea"
                                        rows={6}
                                        maxLength={FORM_STORIA_MAX_LENGTH}
                                        aria-invalid={!!errors.storia}
                                        aria-describedby={
                                            errors.storia
                                                ? "sf-err-storia"
                                                : undefined
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

                                {/* submit */}
                                <div className="sf-submit-row">
                                    <button
                                        type="submit"
                                        className={`sf-btn-submit${
                                            isSending
                                                ? " sf-btn-submit--sending"
                                                : ""
                                        }`}
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
                </main>

                {/* fatal-failure popup */}
                {popup && (
                    <PopUpAlert
                        status={popup.status}
                        message={popup.message}
                        json={popup.json}
                        onClose={handleClosePopup}
                    />
                )}
            </div>
        </>
    );
}
