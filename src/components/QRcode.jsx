import { useState } from "react";
import "./styles/QRcode.css";
import { generateQRUrl } from "./QRcodeHelpers/generateQRUrl";

const IS_EMBEDDED = window.self !== window.top;

/**
 * QRcode
 *
 * Renders a square QR-code card fixed to the bottom-left of its positioned
 * parent (.map-root).  Clicking the card opens the encoded link in a new tab.
 *
 * Size: 1/16 of a 16:9 viewport — one cell of a 4 × 4 grid constrained to
 * the shorter axis (min(25vw, 25vh)), clamped for very small / very large
 * screens.  See QRcode.css for the full responsive breakdown.
 *
 * @param {string}  link      URL to encode (default: live deployment URL).
 * @param {number}  imgSizePx Resolution of the fetched PNG (default 512).
 */
export default function QRcode({
    link = "https://scomodo-mappa-evento.pages.dev/",
    size = "min(25vw, 25vh)",
    imgSizePx = 512,
}) {
    const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

    if (IS_EMBEDDED) return null;

    const src = generateQRUrl(link, imgSizePx);

    function handleClick() {
        window.open(link, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="qr-anchor">
            <div
                className="qr-card"
                style={{ "--qr-size": size }}
                onClick={handleClick}
                role="link"
                tabIndex={0}
                aria-label={`Open ${link}`}
                onKeyDown={(e) => e.key === "Enter" && handleClick()}
                title={link}
            >
                {/* Decorative corner marks */}
                <span className="qr-corner qr-corner--tl" aria-hidden />
                <span className="qr-corner qr-corner--tr" aria-hidden />
                <span className="qr-corner qr-corner--bl" aria-hidden />
                <span className="qr-corner qr-corner--br" aria-hidden />

                {/* Loading / error placeholder */}
                {status !== "ready" && (
                    <div className="qr-placeholder" aria-hidden>
                        {status === "loading" ? (
                            <>
                                <div className="qr-spinner" />
                                <span className="qr-placeholder-label">
                                    loading
                                </span>
                            </>
                        ) : (
                            <span className="qr-placeholder-label">
                                unavailable
                            </span>
                        )}
                    </div>
                )}

                {/* QR image — always in the DOM so the browser can pre-load */}
                <img
                    className="qr-img"
                    src={src}
                    alt={`QR code linking to ${link}`}
                    draggable={false}
                    style={{
                        opacity: status === "ready" ? 1 : 0,
                        transition: "opacity 0.4s ease",
                    }}
                    onLoad={() => setStatus("ready")}
                    onError={() => setStatus("error")}
                />
            </div>
        </div>
    );
}
