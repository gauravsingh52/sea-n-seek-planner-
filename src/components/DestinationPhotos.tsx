import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, ExternalLink } from "lucide-react";
import type { ItineraryData } from "@/types/itinerary";

const imageCache = new Map<string, { thumb: string; full: string } | null>();

function extractPlaceName(dest: string): string {
  return dest
    .replace(/\(.*?\)/g, "")
    .replace(/\b(bus stand|railway station|airport|junction|terminal|station|stop|city|isbt|cantonment|cantt|depot|main|central|sector)\b/gi, "")
    .replace(/\d+/g, "")
    .replace(/[\/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWikipediaImage(name: string): Promise<{ thumb: string; full: string } | null> {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
    const data = await r.json();
    const thumb = data.thumbnail?.source;
    const full = data.originalimage?.source || thumb;
    if (thumb) return { thumb, full: full || thumb };
    return null;
  } catch {
    return null;
  }
}

function DestinationCard({
  dest,
  onOpen,
}: {
  dest: string;
  onOpen: (dest: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const name = extractPlaceName(dest);
    const cacheKey = name.toLowerCase();

    if (imageCache.has(cacheKey)) {
      const cached = imageCache.get(cacheKey);
      if (cached) setImageUrl(cached.thumb);
      else setImgError(true);
      return;
    }

    (async () => {
      let result = await fetchWikipediaImage(name);

      // Fallback: retry with just the first word (core city name)
      if (!result) {
        const simpler = name.split(" ")[0];
        if (simpler && simpler.toLowerCase() !== name.toLowerCase()) {
          result = await fetchWikipediaImage(simpler);
        }
      }

      if (result) {
        imageCache.set(cacheKey, result);
        setImageUrl(result.thumb);
      } else {
        imageCache.set(cacheKey, null);
        setImgError(true);
      }
    })();
  }, [dest]);

  return (
    <button
      onClick={() => onOpen(dest)}
      className="flex-shrink-0 w-36 group text-left cursor-pointer"
    >
      <div className="relative w-36 h-24 rounded-xl overflow-hidden transition-transform duration-200 group-hover:scale-105">
        {imageUrl && !imgError ? (
          <>
            <img
              src={imageUrl}
              alt={dest}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <span className="text-white text-xs font-semibold leading-tight drop-shadow-sm flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {dest}
              </span>
            </div>
          </>
        ) : imgError ? (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
            <MapPin className="w-5 h-5 text-muted-foreground mb-1" />
            <span className="text-muted-foreground text-xs font-semibold text-center px-2 leading-tight">
              {dest}
            </span>
          </div>
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </div>
    </button>
  );
}

export function DestinationPhotos({ itinerary }: { itinerary: ItineraryData }) {
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  const destinations = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const leg of itinerary.legs) {
      for (const place of [leg.to, leg.from]) {
        if (place && !seen.has(place.toLowerCase())) {
          seen.add(place.toLowerCase());
          result.push(place);
        }
      }
    }
    return result.slice(0, 6);
  }, [itinerary.legs]);

  const selectedImage = useMemo(() => {
    if (!selectedDest) return null;
    const name = extractPlaceName(selectedDest).toLowerCase();
    return imageCache.get(name) || null;
  }, [selectedDest]);

  const mapsUrl = selectedDest
    ? `https://www.google.com/maps/search/${encodeURIComponent(extractPlaceName(selectedDest))}`
    : "";

  if (destinations.length === 0) return null;

  return (
    <>
      <Card className="glass-strong gradient-border">
        <CardHeader className="py-3 px-5">
          <CardTitle className="text-sm font-display gradient-text mb-2 flex items-center gap-1.5">
            <Camera className="w-4 h-4" /> Destination Photos
          </CardTitle>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {destinations.map((dest) => (
                <DestinationCard
                  key={dest}
                  dest={dest}
                  onOpen={setSelectedDest}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardHeader>
      </Card>

      <Dialog open={!!selectedDest} onOpenChange={(open) => !open && setSelectedDest(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background">
          <DialogTitle className="sr-only">{selectedDest || "Destination"}</DialogTitle>
          {selectedImage?.full ? (
            <img
              src={selectedImage.full}
              alt={selectedDest || ""}
              className="w-full max-h-[70vh] object-contain bg-black"
              referrerPolicy="no-referrer"
              
            />
          ) : (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{selectedDest}</h3>
            <Button variant="outline" size="sm" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open in Google Maps
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
