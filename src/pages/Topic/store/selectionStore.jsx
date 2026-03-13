/**
 * selectionStore.jsx
 *
 * React Context that acts as the single source of truth for the currently
 * selected keyword.  Any component can READ the selection (useSelection) or
 * WRITE it (useSelectKeyword).  This replaces the original pub-sub callbacks
 * and gives both visualizations + the answers panel a clean synchronisation
 * mechanism without prop-drilling.
 *
 * Usage
 * ─────
 *   // wrap the app (or the relevant subtree)
 *   <SelectionProvider>…</SelectionProvider>
 *
 *   // inside any component
 *   const { selectedKeyword }   = useSelection();       // read
 *   const { selectKeyword }     = useSelectKeyword();   // write
 *
 * Keyword shape
 * ─────────────
 * {
 *   name:         string   // display name (capitalised)
 *   originalName: string   // raw keyword string
 *   value:        number   // response count
 *   responses:    Array    // array of response objects
 *   topic:        string   // parent topic name
 *   topicColor:   string   // same as topic – used as color-scale key
 * }
 */

import { createContext, useContext, useState, useCallback } from "react";

// ─── contexts ────────────────────────────────────────────────────────────────

const SelectionReadContext = createContext(null);
const SelectionWriteContext = createContext(null);

// ─── provider ────────────────────────────────────────────────────────────────

export function SelectionProvider({ children }) {
    const [selectedKeyword, setSelectedKeyword] = useState(null);

    /**
     * Accept either a raw D3 node (from circle-packing) or a pre-shaped object
     * (from the treemap or programmatic auto-select).
     */
    const selectKeyword = useCallback((input) => {
        if (!input) {
            setSelectedKeyword(null);
            return;
        }

        let keywordData;

        if (input.data && input.parent) {
            // D3 hierarchy node from circle-packing (depth === 2)
            keywordData = {
                ...input.data,
                topic: input.parent.data.name,
                topicColor: input.parent.data.name,
            };
        } else if (input.topic) {
            // Already properly shaped (treemap leaf or programmatic call)
            keywordData = input;
        } else {
            keywordData = input;
        }

        setSelectedKeyword(keywordData);
    }, []);

    /**
     * Auto-select the keyword with the most responses across all topics.
     * Safe to call on every data refresh; a no-op if hierarchicalData is null.
     */
    const autoSelectTop = useCallback((hierarchicalData) => {
        if (!hierarchicalData?.children?.length) return;

        let topKeyword = null;
        let maxValue = 0;

        hierarchicalData.children.forEach((topic) => {
            topic.children?.forEach((kw) => {
                if (kw.value > maxValue) {
                    maxValue = kw.value;
                    topKeyword = {
                        ...kw,
                        topic: topic.name,
                        topicColor: topic.name,
                    };
                }
            });
        });

        if (topKeyword) setSelectedKeyword(topKeyword);
    }, []);

    /**
     * Try to re-select a previous keyword in a (possibly changed) dataset.
     * Falls back to auto-selecting the top keyword.
     */
    const restoreOrAutoSelect = useCallback(
        (previousSelection, hierarchicalData) => {
            if (previousSelection && hierarchicalData?.children) {
                for (const topic of hierarchicalData.children) {
                    if (topic.name !== previousSelection.topic) continue;
                    const match = topic.children?.find(
                        (kw) => kw.name === previousSelection.name,
                    );
                    if (match) {
                        setSelectedKeyword({
                            ...match,
                            topic: topic.name,
                            topicColor: topic.name,
                        });
                        return;
                    }
                }
            }
            // fallback
            autoSelectTop(hierarchicalData);
        },
        [autoSelectTop],
    );

    return (
        <SelectionReadContext.Provider value={{ selectedKeyword }}>
            <SelectionWriteContext.Provider
                value={{ selectKeyword, autoSelectTop, restoreOrAutoSelect }}
            >
                {children}
            </SelectionWriteContext.Provider>
        </SelectionReadContext.Provider>
    );
}

// ─── hooks ───────────────────────────────────────────────────────────────────

/** Read the currently selected keyword. */
export function useSelection() {
    const ctx = useContext(SelectionReadContext);
    if (!ctx)
        throw new Error("useSelection must be inside <SelectionProvider>");
    return ctx;
}

/** Get write actions: selectKeyword, autoSelectTop, restoreOrAutoSelect. */
export function useSelectKeyword() {
    const ctx = useContext(SelectionWriteContext);
    if (!ctx)
        throw new Error("useSelectKeyword must be inside <SelectionProvider>");
    return ctx;
}
