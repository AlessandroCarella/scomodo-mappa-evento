import "./styles/Banner.css";
import { useBannerVisibility } from "./BannerHelpers/useBannerVisibility";
import {
    BANNER_ENABLED,
    BANNER_TEXT_LEFT,
    BANNER_TEXT_RIGHT,
    BANNER_WIDTH_PERCENT,
} from "@/config";

/**
 * Banner — two frosted-glass side panels that frame the map.
 *
 * Behaviour
 * ─────────
 * • Visible on load.
 * • Fades out immediately on any mousemove.
 * • Fades back in BANNER_REAPPEAR_DELAY ms after the last mousemove.
 * • Hidden on viewports narrower than 1024 px (CSS media query).
 * • Entirely disabled when VITE_BANNER_ENABLED=false at build/dev time.
 *
 * Width is controlled by BANNER_WIDTH_PERCENT in config.js and is
 * injected as the CSS custom property --banner-width so the stylesheet
 * never needs to be edited directly.
 */
export default function Banner() {
    const { visible } = useBannerVisibility();

    if (!BANNER_ENABLED) return null;

    const hiddenClass = visible ? "" : " banner-hidden";
    const widthVar = { "--banner-width": `${BANNER_WIDTH_PERCENT}%` };

    return (
        <>
            <aside
                className={`banner-panel banner-panel--left${hiddenClass}`}
                style={widthVar}
                aria-hidden="true"
            >
                <div className="banner-inner">
                    <span className="banner-text">{BANNER_TEXT_LEFT}</span>
                </div>
            </aside>

            <aside
                className={`banner-panel banner-panel--right${hiddenClass}`}
                style={widthVar}
                aria-hidden="true"
            >
                <div className="banner-inner">
                    <span className="banner-text">{BANNER_TEXT_RIGHT}</span>
                </div>
            </aside>
        </>
    );
}
