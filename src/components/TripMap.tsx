import { useEffect, useRef, useState } from "react";
import type { ItineraryData } from "@/types/itinerary";

// Dynamically import leaflet + react-leaflet to avoid SSR/init issues
let leafletReady = false;
let L: any = null;

function TripMapInner({ itinerary }: { itinerary: ItineraryData }) {
  const [modules, setModules] = useState<any>(null);
  const fitted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [leafletMod, rlMod] = await Promise.all([
          import("leaflet"),
          import("react-leaflet"),
        ]);
        // Also load CSS
        await import("leaflet/dist/leaflet.css");

        L = leafletMod.default || leafletMod;

        // Fix default marker icons (only once)
        if (!leafletReady) {
          leafletReady = true;
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          });
        }

        if (!cancelled) setModules(rlMod);
      } catch (err) {
        console.error("Failed to load map modules:", err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const allCoords: [number, number][] = [];
  const polylineCoords: [number, number][] = [];

  itinerary.legs.forEach((leg) => {
    if (leg.fromCoords) {
      allCoords.push([leg.fromCoords.lat, leg.fromCoords.lng]);
      polylineCoords.push([leg.fromCoords.lat, leg.fromCoords.lng]);
    }
    if (leg.toCoords) {
      allCoords.push([leg.toCoords.lat, leg.toCoords.lng]);
      polylineCoords.push([leg.toCoords.lat, leg.toCoords.lng]);
    }
  });

  if (!modules || allCoords.length === 0) {
    return (
      <div className="w-full h-full rounded-2xl glass-strong flex items-center justify-center">
        <p className="text-muted-foreground text-sm animate-pulse">
          {allCoords.length === 0 ? "No map coordinates available" : "Loading map..."}
        </p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline } = modules;
  const center = allCoords[0];

  // FitBounds as inline effect
  function FitBoundsEffect({ coords }: { coords: [number, number][] }) {
    const map = modules.useMap();
    const didFit = useRef(false);
    useEffect(() => {
      if (coords.length > 0 && !didFit.current && L) {
        didFit.current = true;
        const bounds = L.latLngBounds(coords.map(([lat, lng]: [number, number]) => [lat, lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }, [coords, map]);
    return null;
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden glass-strong gradient-border">
      <MapContainer
        center={center}
        zoom={6}
        className="w-full h-full"
        style={{ background: "hsl(var(--background))" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsEffect coords={allCoords} />

        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: "hsl(25, 75%, 47%)",
              weight: 3,
              opacity: 0.8,
              dashArray: "8 6",
            }}
          />
        )}

        {itinerary.legs.map((leg) => {
          const markers: any[] = [];
          if (leg.fromCoords) {
            markers.push(
              <Marker key={`${leg.id}-from`} position={[leg.fromCoords.lat, leg.fromCoords.lng]}>
                <Popup>
                  <div className="text-sm">
                    <strong>{leg.title}</strong>
                    <br />
                    {leg.description}
                    {leg.time && <><br />{leg.time}</>}
                    {leg.cost > 0 && <><br />Cost: {leg.cost}</>}
                  </div>
                </Popup>
              </Marker>
            );
          }
          if (leg.toCoords && leg.type === "transport") {
            markers.push(
              <Marker key={`${leg.id}-to`} position={[leg.toCoords.lat, leg.toCoords.lng]}>
                <Popup>
                  <div className="text-sm">
                    <strong>{leg.to || "Destination"}</strong>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return markers;
        })}
      </MapContainer>
    </div>
  );
}

export function TripMap({ itinerary }: { itinerary: ItineraryData }) {
  return <TripMapInner itinerary={itinerary} />;
}
