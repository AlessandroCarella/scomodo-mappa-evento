import {
    FORM_SUCCESS_TITLE,
    FORM_SUCCESS_BODY,
    FORM_SUCCESS_RESET,
    FORM_SUCCESS_CLOSE,
    FORM_ERROR_TITLE,
    FORM_ERROR_BODY,
    FORM_ERROR_RETRY,
} from "@/config";

/**
 * FormFeedback
 *
 * Renders the post-submission feedback panel — either the success or error
 * state — replacing the form body while keeping the header visible.
 *
 * @param {"success"|"error"} type       Which feedback variant to show.
 * @param {function}          onReset    Called when the user wants to submit another story.
 * @param {function}          onClose    Called when the user closes the overlay.
 * @param {function}          onRetry    Called when the user wants to try again after an error.
 */
export default function FormFeedback({ type, onReset, onClose, onRetry }) {
    if (type === "success") {
        return (
            <div className="sf-feedback sf-feedback--success">
                <div className="sf-feedback-icon">✓</div>
                <p className="sf-feedback-title">{FORM_SUCCESS_TITLE}</p>
                <p className="sf-feedback-body">{FORM_SUCCESS_BODY}</p>
                <div className="sf-feedback-actions">
                    <button
                        type="button"
                        className="sf-btn-secondary"
                        onClick={onReset}
                    >
                        {FORM_SUCCESS_RESET}
                    </button>
                    <button
                        type="button"
                        className="sf-btn-primary"
                        onClick={onClose}
                    >
                        {FORM_SUCCESS_CLOSE}
                    </button>
                </div>
            </div>
        );
    }

    if (type === "error") {
        return (
            <div className="sf-feedback sf-feedback--error">
                <div className="sf-feedback-icon">!</div>
                <p className="sf-feedback-title">{FORM_ERROR_TITLE}</p>
                <p className="sf-feedback-body">{FORM_ERROR_BODY}</p>
                <div className="sf-feedback-actions">
                    <button
                        type="button"
                        className="sf-btn-primary"
                        onClick={onRetry}
                    >
                        {FORM_ERROR_RETRY}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
