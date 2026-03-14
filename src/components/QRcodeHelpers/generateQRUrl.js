/**
 * generateQRUrl
 *
 * Builds a URL that resolves to a QR-code image for the given link.
 * Uses the free, no-auth qrserver.com API — no extra dependencies needed.
 *
 * @param {string} link     - The URL to encode (defaults to the live deployment).
 * @param {number} sizePx   - Pixel dimensions of the returned square image (default 512).
 * @param {object} opts     - Optional overrides.
 * @param {string} opts.color     - Foreground color without '#' (default "e0d0b0").
 * @param {string} opts.bgcolor   - Background color without '#' (default "060a14").
 * @param {string} opts.ecc       - Error-correction level: L | M | Q | H (default "M").
 * @param {number} opts.margin    - Quiet-zone modules (default 1).
 *
 * @returns {string}  Absolute URL to a PNG QR-code image.
 *
 * @example
 * import { generateQRUrl } from "./QRcodeHelpers/generateQRUrl";
 * const src = generateQRUrl("https://example.com", 256);
 */
export function generateQRUrl(
    link = "https://scomodo-mappa-evento.pages.dev/",
    sizePx = 512,
    { color = "e0d0b0", bgcolor = "060a14", ecc = "M", margin = 1 } = {},
) {
    const base = "https://api.qrserver.com/v1/create-qr-code/";

    const params = new URLSearchParams({
        data: link,
        size: `${sizePx}x${sizePx}`,
        color,
        bgcolor,
        ecc,
        margin: String(margin),
        format: "png",
    });

    return `${base}?${params.toString()}`;
}
