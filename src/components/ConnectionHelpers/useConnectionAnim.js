import { useEffect, useRef } from "react";
import {
    ANIM_BASE_DELAY,
    ANIM_STAGGER_DELAY,
    ANIM_DURATION,
    ANIM_EASING,
} from "../../config";

/**
 * Animates an SVG path element using a stroke-dashoffset draw-on effect.
 *
 * Attaches a ref to an SVG `<path>` and triggers a CSS transition that
 * "draws" the path from hidden to fully visible. Animation start is staggered
 * based on the element's index so multiple connections animate in sequence.
 *
 * Resets cleanly on unmount, making it safe for React StrictMode's
 * double-invocation of effects.
 *
 * @param {number} arcLen - Total length of the SVG path in pixels, used to
 *   initialise `strokeDasharray` and `strokeDashoffset`.
 * @param {number} index - Zero-based position of this connection in the
 *   render list; multiplied by `ANIM_STAGGER_DELAY` to offset the start time.
 * @returns {React.RefObject<SVGPathElement>} Ref to attach to the target
 *   `<path>` element: `<path ref={pathRef} ... />`.
 *
 * @example
 * function Connection({ length, index }) {
 *   const pathRef = useConnectionAnim(length, index);
 *   return <path ref={pathRef} d="..." stroke="white" fill="none" />;
 * }
 */
export function useConnectionAnim(arcLen, index) {
    const pathRef = useRef(null);

    useEffect(() => {
        const el = pathRef.current;
        if (!el) return;

        // Reset to hidden state
        el.style.transition = "none";
        el.style.strokeDasharray = arcLen;
        el.style.strokeDashoffset = arcLen;

        const delay = ANIM_BASE_DELAY + index * ANIM_STAGGER_DELAY;

        const timer = setTimeout(() => {
            // Double rAF ensures the browser has committed the reset styles
            // before starting the transition, preventing a flash of the
            // fully-drawn path on the first frame.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!pathRef.current) return;
                    pathRef.current.style.transition = `stroke-dashoffset ${ANIM_DURATION} ${ANIM_EASING}`;
                    pathRef.current.style.strokeDashoffset = "0";
                });
            });
        }, delay);

        return () => {
            clearTimeout(timer);
            // Reset on cleanup so second StrictMode mount starts fresh
            if (pathRef.current) {
                pathRef.current.style.transition = "none";
                pathRef.current.style.strokeDashoffset = arcLen;
            }
        };
    }, [arcLen, index]);

    return pathRef;
}
