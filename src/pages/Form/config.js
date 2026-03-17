/**
 * src/pages/Form/config.js
 *
 * Page-level configuration for the standalone /form route.
 *
 * All field definitions and UI strings live in the root config.js
 * and are re-exported here so Form.jsx has a single, nearby import
 * and this file stays the right place to add any Form-page-specific
 * constants (SEO meta, redirect behaviour, etc.) in the future.
 */

// ── Re-export everything the Form page needs from the root config ──
export {
    FIELDS,
    EMPTY_FORM,
    FORM_EYEBROW,
    FORM_TITLE,
    FORM_DESC,
    FORM_SUBMIT_LABEL,
    FORM_SENDING_LABEL,
    FORM_SUCCESS_TITLE,
    FORM_SUCCESS_BODY,
    FORM_SUCCESS_RESET,
    FORM_SUCCESS_CLOSE,
    FORM_ERROR_TITLE,
    FORM_ERROR_BODY,
    FORM_ERROR_RETRY,
    FORM_STORIA_LABEL,
    FORM_STORIA_HINT,
    FORM_STORIA_PLACEHOLDER,
    FORM_STORIA_MAX_LENGTH,
    FORM_ETA_MIN,
    FORM_ETA_MAX,
} from "@/config";

// ── Page-specific constants ────────────────────────────────────────

/**
 * Where to send the user after a successful submission and "close" action.
 * Swap to "/topic" or any other route as needed.
 */
export const FORM_PAGE_CLOSE_REDIRECT = "/";

/**
 * <title> shown in the browser tab when the Form page is active.
 * Set in index.html or a future useDocumentTitle hook.
 */
export const FORM_PAGE_TITLE = "Invia la tua storia · Scomodo Mappa";
