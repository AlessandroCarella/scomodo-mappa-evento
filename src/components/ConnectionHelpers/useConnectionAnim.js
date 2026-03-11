import { useEffect, useRef } from "react";
import {
  ANIM_BASE_DELAY,
  ANIM_STAGGER_DELAY,
  ANIM_DURATION,
  ANIM_EASING,
} from "../../config";

/**
 * useConnectionAnim
 *
 * Attaches a CSS stroke-dashoffset "draw-on" animation to an SVG path element.
 * Runs only once per mount (animRef guards against re-triggering on re-renders).
 *
 * @param {number} arcLen  — total stroke length (dasharray value)
 * @param {number} index   — render order, used to stagger the animation delay
 *
 * @returns {React.RefObject}  ref to attach to the <path> element
 */
export function useConnectionAnim(arcLen, index) {
  const pathRef = useRef(null);
  const animRef = useRef(false);

  useEffect(() => {
    const el = pathRef.current;
    if (!el || animRef.current) return;
    animRef.current = true;

    el.style.strokeDasharray  = arcLen;
    el.style.strokeDashoffset = arcLen;

    const delay = ANIM_BASE_DELAY + index * ANIM_STAGGER_DELAY;
    const timer = setTimeout(() => {
      el.style.transition    = `stroke-dashoffset ${ANIM_DURATION} ${ANIM_EASING}`;
      el.style.strokeDashoffset = "0";
    }, delay);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return pathRef;
}
