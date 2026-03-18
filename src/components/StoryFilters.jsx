import "./styles/StoryFilters.css";
import { Filter, RotateCcw, X } from "lucide-react";

export default function StoryFilters({
    isOpen = false,
    onToggle,
    departureValue = "",
    arrivalValue = "",
    cities = [],
    onDepartureChange,
    onArrivalChange,
    onReset,
    storyCount = 0,
    routeCount = 0,
}) {
    const activeFilterCount =
        Number(Boolean(departureValue)) + Number(Boolean(arrivalValue));

    return (
        <div className="story-filters">
            <button
                type="button"
                className={`story-filters__toggle${isOpen ? " story-filters__toggle--open" : ""}`}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls="story-filters-panel"
            >
                <Filter size={18} />
                <span>Filtri</span>
                {activeFilterCount > 0 && (
                    <span className="story-filters__badge">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div id="story-filters-panel" className="story-filters__panel">
                    <div className="story-filters__header">
                        <div>
                            <div className="story-filters__title">
                                Filtra le storie
                            </div>
                            <div className="story-filters__meta">
                                {storyCount} storie / {routeCount} traiettorie
                            </div>
                        </div>

                        <button
                            type="button"
                            className="story-filters__icon-btn"
                            onClick={onToggle}
                            aria-label="Chiudi filtri"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <label className="story-filters__field">
                        <span className="story-filters__label">Partenza</span>
                        <select
                            className="story-filters__select"
                            value={departureValue}
                            onChange={(e) =>
                                onDepartureChange?.(e.target.value)
                            }
                        >
                            <option value="">Tutte le partenze</option>
                            {cities.map((city) => (
                                <option key={`departure-${city}`} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="story-filters__field">
                        <span className="story-filters__label">Arrivo</span>
                        <select
                            className="story-filters__select"
                            value={arrivalValue}
                            onChange={(e) =>
                                onArrivalChange?.(e.target.value)
                            }
                        >
                            <option value="">Tutti gli arrivi</option>
                            {cities.map((city) => (
                                <option key={`arrival-${city}`} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        className="story-filters__reset"
                        onClick={onReset}
                        disabled={!activeFilterCount}
                    >
                        <RotateCcw size={15} />
                        <span>Azzera filtri</span>
                    </button>
                </div>
            )}
        </div>
    );
}
