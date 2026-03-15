/**
 * FormField
 *
 * Renders a single labelled <input> with an optional error message below it.
 *
 * @param {object}   field         Field descriptor from FIELDS.
 * @param {string}   value         Current input value.
 * @param {string}   [error]       Validation error message (falsy = no error).
 * @param {function} onChange      Change handler — receives the native event.
 * @param {object}   [inputRef]    React ref forwarded to the <input> (used for
 *                                 auto-focusing the first field on mount).
 */
export default function FormField({ field, value, error, onChange, inputRef }) {
    const { id, label, hint, type, placeholder, autoComplete, min, max } =
        field;
    const hasError = !!error;

    return (
        <div className={`sf-field${hasError ? " sf-field--error" : ""}`}>
            <label className="sf-label" htmlFor={`sf-${id}`}>
                <span className="sf-label-text">{label}</span>
                <span className="sf-hint">{hint}</span>
            </label>

            <input
                ref={inputRef}
                id={`sf-${id}`}
                name={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete ?? "off"}
                min={min}
                max={max}
                className="sf-input"
                aria-invalid={hasError}
                aria-describedby={hasError ? `sf-err-${id}` : undefined}
            />

            {hasError && (
                <span id={`sf-err-${id}`} className="sf-error-msg" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}
