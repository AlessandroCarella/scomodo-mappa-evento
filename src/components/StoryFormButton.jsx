import { useState } from "react";
import "./styles/StoryFormButton.css";
import { FORM_BUTTON_SIZE, FORM_BUTTON_TEXT_H, FORM_QR_LINK } from "../config";
import { generateQRUrl } from "./QRcodeHelpers/generateQRUrl";

const IS_EMBEDDED = window.self !== window.top;

/**
 * StoryFormButton
 *
 * A fixed card in the bottom-right corner that opens the story submission
 * form.  The card shows a label strip ("aggiungi la tua storia") on top and
 * a QR code pointing to the standalone /form page below — mirroring the
 * QRcode card on the bottom-left both in visual style and in size.
 *
 * On mobile (≤ 600 px) the QR area is hidden and the card shrinks to a
 * plain text button showing the label on two lines.
 *
 * Width  = --form-btn-size  (same as QR card, from FORM_BUTTON_SIZE)
 * Height = --form-btn-size + --form-btn-text-h  (text strip on top)
 */
export default function StoryFormButton({ onClick }) {
    const [imgStatus, setImgStatus] = useState("loading"); // "loading" | "ready" | "error"

    if (IS_EMBEDDED) return null;

    const qrSrc = generateQRUrl(FORM_QR_LINK);

    return (
        <div className="form-btn-anchor">
            <button
                className="form-btn-card"
                style={{
                    "--form-btn-size": FORM_BUTTON_SIZE,
                    "--form-btn-text-h": FORM_BUTTON_TEXT_H,
                }}
                onClick={onClick}
                aria-label="Aggiungi la tua storia"
                title="Aggiungi la tua storia"
            >
                {/* ── Decorative corner marks ── */}
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

                {/* ── Text strip (desktop) / full label (mobile) ── */}
                <div className="form-btn-label-strip">
                    <span className="form-btn-label">
                        aggiungi la
                        <br />
                        tua storia
                    </span>
                </div>

                {/* ── QR image area — hidden on mobile via CSS ── */}
                <div className="form-btn-qr-area">
                    {imgStatus !== "ready" && (
                        <div className="form-btn-qr-placeholder" aria-hidden>
                            {imgStatus === "loading" ? (
                                <div className="form-btn-qr-spinner" />
                            ) : (
                                <span className="form-btn-qr-error">QR</span>
                            )}
                        </div>
                    )}
                    <img
                        className="form-btn-qr-img"
                        src={qrSrc}
                        alt={`QR code per ${FORM_QR_LINK}`}
                        draggable={false}
                        style={{
                            opacity: imgStatus === "ready" ? 1 : 0,
                            transition: "opacity 0.4s ease",
                        }}
                        onLoad={() => setImgStatus("ready")}
                        onError={() => setImgStatus("error")}
                    />
                </div>
            </button>
        </div>
    );
}
