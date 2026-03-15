import "./styles/StoryFormButton.css";
import { FORM_BUTTON_SIZE } from "../config";

/**
 * StoryFormButton
 *
 * A fixed card in the bottom-right corner that opens the story submission
 * form. Size and positioning mirror the QRcode card (bottom-left) so the
 * two cards balance each other visually.
 *
 * Size is driven by --form-btn-size, defaulting to FORM_BUTTON_SIZE from
 * config.js — change it there, nothing else needs to be touched.
 */
export default function StoryFormButton({ onClick }) {
    return (
        <div className="form-btn-anchor">
            <button
                className="form-btn-card"
                style={{ "--form-btn-size": FORM_BUTTON_SIZE }}
                onClick={onClick}
                aria-label="Aggiungi la tua storia"
                title="Aggiungi la tua storia"
            >
                {/* Decorative corner marks — same as QRcode */}
                <span
                    className="form-btn-corner form-btn-corner--tl"
                    aria-hidden
                />
                <span
                    className="form-btn-corner form-btn-corner--tr"
                    aria-hidden
                />
                <span
                    className="form-btn-corner form-btn-corner--bl"
                    aria-hidden
                />
                <span
                    className="form-btn-corner form-btn-corner--br"
                    aria-hidden
                />

                <div className="form-btn-content">
                    <div className="form-btn-plus" aria-hidden>
                        +
                    </div>
                    <span className="form-btn-label">
                        la tua
                        <br />
                        storia
                    </span>
                </div>
            </button>
        </div>
    );
}
