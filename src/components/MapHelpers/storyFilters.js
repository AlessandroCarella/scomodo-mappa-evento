import { pairKey } from "../ConnectionHelpers/connectionUtils";
import { STORY_FILTERS_CONFIG, STORY_FILTER_MODES } from "../../config";

export function getStoryRouteKey(story) {
    if (!story?.cittaPartenza || !story?.cittaArrivo) return null;
    return pairKey(story.cittaPartenza, story.cittaArrivo);
}

function normalizeConfiguredFilter(config) {
    const allowedModes = new Set(Object.values(STORY_FILTER_MODES));
    const mode = allowedModes.has(config?.mode)
        ? config.mode
        : STORY_FILTER_MODES.city;
    const city = typeof config?.city === "string" ? config.city.trim() : "";

    return {
        mode,
        city,
        cityOverlay: {
            showDeparturesByDefault:
                config?.cityOverlay?.showDeparturesByDefault !== false,
            showArrivalsByDefault:
                config?.cityOverlay?.showArrivalsByDefault !== false,
        },
    };
}

export const CONFIGURED_STORY_FILTER =
    normalizeConfiguredFilter(STORY_FILTERS_CONFIG);

export function getDefaultCityOverlayFilters() {
    return {
        showDepartures:
            CONFIGURED_STORY_FILTER.cityOverlay.showDeparturesByDefault,
        showArrivals: CONFIGURED_STORY_FILTER.cityOverlay.showArrivalsByDefault,
    };
}

export function storyMatchesConfiguredFilter(story, filterConfig) {
    if (!filterConfig.city) return true;

    switch (filterConfig.mode) {
        case STORY_FILTER_MODES.departure:
            return story.cittaPartenza === filterConfig.city;
        case STORY_FILTER_MODES.arrival:
            return story.cittaArrivo === filterConfig.city;
        case STORY_FILTER_MODES.city:
            return (
                story.cittaPartenza === filterConfig.city ||
                story.cittaArrivo === filterConfig.city
            );
        default:
            return true;
    }
}

export function collectStoryLocations(stories) {
    const names = new Set();
    stories.forEach((story) => {
        if (story.cittaPartenza) names.add(story.cittaPartenza);
        if (story.cittaArrivo) names.add(story.cittaArrivo);
    });
    return names;
}

export function splitStoriesByCity(stories, cityName) {
    return {
        departureStories: stories.filter(
            (story) => story.cittaPartenza === cityName,
        ),
        arrivalStories: stories.filter(
            (story) => story.cittaArrivo === cityName,
        ),
    };
}
