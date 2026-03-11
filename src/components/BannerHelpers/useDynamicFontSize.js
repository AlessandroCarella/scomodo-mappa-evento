import { useState, useEffect, useRef, useCallback } from "react";
import {
    BANNER_FONT_WEIGHT,
    BANNER_LETTER_SPACING,
    BANNER_FONT_FILL_RATIO,
} from "@/config";

/**
 * useDynamicFontSize
 *
 * Computes the largest font size (in px) at which the longest word in
 * `text` fits within `containerRef`'s inner width, multiplied by
 * BANNER_FONT_FILL_RATIO so there is a small breathing margin.
 *
 * Uses an off-screen Canvas for measurement (no DOM reflows).
 * Re-runs whenever the container is resized via ResizeObserver.
 *
 * @param {React.RefObject} containerRef  ref attached to the inner wrapper
 * @param {string}          text          full banner text
 * @param {string}          fontFamily    CSS font-family string
 * @returns {string}  font-size as a CSS pixel string e.g. "42px"
 *                    or "" while the first measurement is pending
 */
export function useDynamicFontSize(containerRef, text, fontFamily) {
    const [fontSize, setFontSize] = useState("");
    const canvasRef = useRef(document.createElement("canvas"));

    const longestWord = (text || "")
        .split(/\s+/)
        .reduce((a, b) => (b.length > a.length ? b : a), "");

    const compute = useCallback(() => {
        const el = containerRef.current;
        if (!el || !longestWord) return;

        const availableWidth = el.offsetWidth * BANNER_FONT_FILL_RATIO;
        if (availableWidth <= 0) return;

        const ctx = canvasRef.current.getContext("2d");

        // Measure at a large reference size then scale linearly.
        const REF_SIZE = 200;

        // letter-spacing in em → add it per character gap (n-1 gaps for n chars)
        const letterSpacingEm = parseFloat(BANNER_LETTER_SPACING) || 0;
        const letterSpacingPx = letterSpacingEm * REF_SIZE;
        const extraSpacing = letterSpacingPx * (longestWord.length - 1);

        ctx.font = `${BANNER_FONT_WEIGHT} ${REF_SIZE}px ${fontFamily}`;
        const refWidth = ctx.measureText(longestWord).width + extraSpacing;

        if (refWidth <= 0) return;

        const optimal = Math.floor((REF_SIZE * availableWidth) / refWidth);
        setFontSize(`${optimal}px`);
    }, [containerRef, longestWord, fontFamily]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        compute();

        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, [containerRef, compute]);

    return fontSize;
}
