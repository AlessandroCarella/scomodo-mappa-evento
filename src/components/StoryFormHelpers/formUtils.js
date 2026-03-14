import {
    FORM_ETA_MIN,
    FORM_ETA_MAX,
    FORM_STORIA_MAX_LENGTH,
    EMAILJS_TO_EMAIL,
    FIELDS,
} from "@/config";

/**
 * formatDate
 *
 * Converts a native date-input value (YYYY-MM-DD) to the Italian format
 * used in storie.json (DD-MM-YYYY).
 *
 * @param   {string} isoDate  Value from an <input type="date">
 * @returns {string}          Formatted date string, or "" if input is falsy.
 */
export function formatDate(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y}`;
}

/**
 * validate
 *
 * Validates the form values object and returns a map of field id → error
 * message. An empty object means the form is valid.
 *
 * Rules:
 *   - Every FIELD id and `storia` are required.
 *   - `eta` must be a number within [FORM_ETA_MIN, FORM_ETA_MAX].
 *   - `storia` must not exceed FORM_STORIA_MAX_LENGTH characters.
 *
 * @param   {{ [key: string]: string }} vals  Current form values.
 * @returns {{ [key: string]: string }}       Map of field id → error string.
 */
export function validate(vals) {
    const errs = {};

    // Required check for all named fields
    FIELDS.forEach(({ id }) => {
        if (!vals[id] || !String(vals[id]).trim()) {
            errs[id] = "Campo obbligatorio";
        }
    });

    // Required check for storia (rendered separately)
    if (!vals.storia || !vals.storia.trim()) {
        errs.storia = "Campo obbligatorio";
    }

    // Numeric range check for eta
    if (vals.eta !== "" && vals.eta !== undefined) {
        const n = Number(vals.eta);
        if (n < FORM_ETA_MIN || n > FORM_ETA_MAX) {
            errs.eta = `Età non valida (${FORM_ETA_MIN}–${FORM_ETA_MAX})`;
        }
    }

    // Max-length check for storia
    if (vals.storia && vals.storia.length > FORM_STORIA_MAX_LENGTH) {
        errs.storia = `Massimo ${FORM_STORIA_MAX_LENGTH} caratteri`;
    }

    return errs;
}

/**
 * buildTemplateParams
 *
 * Assembles the object passed to emailjs.send(). All string values are
 * trimmed; the date is converted to Italian format.
 *
 * @param   {{ [key: string]: string }} vals  Validated form values.
 * @returns {object}                          EmailJS template parameters.
 */
export function buildTemplateParams(vals) {
    return {
        to_email: EMAILJS_TO_EMAIL,
        nome: vals.nome.trim(),
        eta: Number(vals.eta),
        cittaPartenza: vals.cittaPartenza.trim(),
        cittaArrivo: vals.cittaArrivo.trim(),
        data: formatDate(vals.data),
        storia: vals.storia.trim(),
    };
}
