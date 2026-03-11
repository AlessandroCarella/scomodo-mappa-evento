import "./styles/Map.css";
import Pin from "./Pin";
import Connection from "./Connection";
import ConnectionAlt from "./ConnectionAlt";
import ConnectionSwitcher from "./ConnectionSwitcher";
import { useMapInit }  from "./MapHelpers/useMapInit";
import { useMapSync }  from "./MapHelpers/useMapSync";
import { processConnections } from "./connectionUtils";
import { useState, useRef } from "react";
import rawLocations   from "../data/locations.json";
import rawConnections from "../data/connections.json";

// Build lookup and process once at module level (data never changes at runtime)
const locByName = {};
rawLocations.forEach((l) => { locByName[l.name] = l; });
const { connections, maxCount } = processConnections(rawConnections, locByName);

export default function Map() {
  const containerRef = useRef(null);

  const { mapRef, ready }     = useMapInit(containerRef);
  const { toPoint }           = useMapSync(mapRef, ready);

  const [shape, setShape]       = useState("arc");   // "arc" | "line"
  const [encoding, setEncoding] = useState("width"); // "width" | "opacity"

  const w = containerRef.current?.offsetWidth  || 0;
  const h = containerRef.current?.offsetHeight || 0;

  const ConnectionComponent = encoding === "width" ? Connection : ConnectionAlt;
  // Key change forces re-mount → entrance animations replay on mode switch
  const modeKey = `${shape}-${encoding}`;

  return (
    <div className="map-root">
      <div ref={containerRef} className="map-container" />

      {ready && (
        <svg
          className="map-svg-overlay"
          width={w}
          height={h}
          style={{ pointerEvents: "none" }}
        >
          {connections.map((conn, i) => {
            const from = toPoint(conn.from.lat, conn.from.lng);
            const to   = toPoint(conn.to.lat,   conn.to.lng);
            return (
              <ConnectionComponent
                key={`${conn.from.name}-${conn.to.name}-${modeKey}`}
                from={from}
                to={to}
                count={conn.count}
                maxCount={maxCount}
                shape={shape}
                index={i}
              />
            );
          })}
        </svg>
      )}

      {ready && rawLocations.map((loc) => (
        <Pin key={loc.name} map={mapRef.current} location={loc} />
      ))}

      <ConnectionSwitcher
        shape={shape}
        encoding={encoding}
        onShape={setShape}
        onEncoding={setEncoding}
      />
    </div>
  );
}
