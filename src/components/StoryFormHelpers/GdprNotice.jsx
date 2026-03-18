import { useState } from "react";
import { FORM_GDPR_NOTICE } from "@/config";

/**
 * GdprNotice
 *
 * Collapsible informativa ex art. 13 Reg. UE 2016/679.
 * Renders a toggle row labelled "Informativa GDPR"; the full
 * notice text expands below it when the user clicks.
 */
export default function GdprNotice() {
    const [open, setOpen] = useState(false);

    return (
        <div className="sf-gdpr">
            <button
                type="button"
                className="sf-gdpr-toggle"
                aria-expanded={open}
                aria-controls="sf-gdpr-body"
                onClick={() => setOpen((v) => !v)}
            >
                <span className="sf-gdpr-label">Informativa GDPR</span>
                <span
                    className={`sf-gdpr-chevron${open ? " sf-gdpr-chevron--open" : ""}`}
                    aria-hidden="true"
                >
                    ›
                </span>
            </button>

            {open && (
                <p id="sf-gdpr-body" className="sf-gdpr-body">
                    {FORM_GDPR_NOTICE}
                </p>
            )}
        </div>
    );
}
