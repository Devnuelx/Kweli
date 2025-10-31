"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";

/**
 * WorldMap (Africa-focused)
 *
 * - Put your Africa-focused map file in /public/maps/africa-focused.svg (or pass mapSrc prop)
 * - Default geographic bounds (lon/lat) assume: lon [-20, 55], lat [-35, 37].
 *   If your SVG uses different bounds, pass `bounds={{ lonMin, lonMax, latMin, latMax }}`.
 */
export default function WorldMap({
  mapSrc = "/africa-map1.PNG",
  showMetrics = true,
  numPins = 60,
  bounds = { lonMin: -20, lonMax: 55, latMin: -35, latMax: 37 },
  padding = { left: 10, top: 0, right: 20, bottom: 2 },
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // mapBox = measured area (left/top/width/height) of the *visible* image inside container
  const [mapBox, setMapBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [pins, setPins] = useState([]);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const intervalRef = useRef(null);

  // Real city anchors (useful to make pins look correct)
  const anchors = useMemo(
    () => [
      { name: "Cairo", lat: 30.0444, lng: 31.2357 },
      { name: "Lagos", lat: 6.5244, lng: 3.3792 },
      { name: "Accra", lat: 5.6037, lng: -0.1870 },
      { name: "Nairobi", lat: -1.2864, lng: 36.8172 },
      { name: "Johannesburg", lat: -26.2041, lng: 28.0473 },
      { name: "Casablanca", lat: 33.5731, lng: -7.5898 },
      { name: "Dar es Salaam", lat: -6.7924, lng: 39.2083 },
      { name: "Addis Ababa", lat: 9.0320, lng: 38.7469 },
      { name: "Kinshasa", lat: -4.4419, lng: 15.2663 },
      { name: "Bamako", lat: 12.9716, lng: -5.3547 },
      { name: "Cape Town", lat: -33.9249, lng: 18.4241 },
      { name: "Harare", lat: -17.8252, lng: 31.0335 },
      { name: "Rabat", lat: 34.0209, lng: -6.8417 },
      { name: "Algiers", lat: 36.7372, lng: 3.0863 },
      { name: "Tunis", lat: 36.8065, lng: 10.1815 },
    ],
    []
  );

  // Coarse region boxes that approximate Africa's landmass for more uniform coverage
  const africaBoxes = useMemo(
    () => [
      // North Africa (avoid too far west Atlantic)
      { latMin: 8, latMax: 37, lngMin: -15, lngMax: 35 },
      // Sahel / West Africa interior
      { latMin: 8, latMax: 20, lngMin: -17, lngMax: 15 },
      // Central Africa
      { latMin: -5, latMax: 10, lngMin: 10, lngMax: 32 },
      // East / Horn of Africa
      { latMin: -2, latMax: 12, lngMin: 32, lngMax: 50 },
      // Southern Africa
      { latMin: -35, latMax: -5, lngMin: 16, lngMax: 40 },
      // Gulf of Guinea coastline band
      { latMin: 0, latMax: 8, lngMin: -5, lngMax: 8 },
    ],
    []
  );

  // Helper: convert lat/lon to percentage inside the geographic bounds
  const latLngToPercent = (lat, lng) => {
    const { lonMin, lonMax, latMin, latMax } = bounds;
    let x = ((lng - lonMin) / (lonMax - lonMin)) * 100;
    let y = ((latMax - lat) / (latMax - latMin)) * 100; // latMax at top => 0%
    // Bring pins further from edges so they sit inside the visible silhouette
    x = Math.max(6, Math.min(94, x));
    y = Math.max(8, Math.min(92, y));
    return { x, y };
  };

  // Map percent -> pixel position inside container, accounting for image letterboxing
  const percentToPixel = (pct) => {
    if (!mapBox.width || !mapBox.height) return { x: 0, y: 0 };
    // Add inner padding so pins don't hug the extreme edges of the displayed image
    const padX = mapBox.width * 0.06; // 4%
    const padY = mapBox.height * 0.08; // 5%
    const px = mapBox.left + padX + (pct.x / 110) * (mapBox.width - 2 * padX);
    const py = mapBox.top + padY + (pct.y / 100) * (mapBox.height - 2 * padY);
    return { x: Math.round(px), y: Math.round(py) };
  };

  // Measure displayed image region (handles object-fit: contain letterboxing)
  const measureMapBox = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const imgRect = img.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    setMapBox({
      left: (imgRect.left - contRect.left) + padding.left,
      top: imgRect.top - contRect.top + padding.top,
      width: imgRect.width,
      height: imgRect.height,
    });
  }, [padding]);

  // Helper to sample a random lat/lng inside the coarse Africa boxes
  const sampleAfricanLatLng = useCallback(() => {
    const b = africaBoxes[Math.floor(Math.random() * africaBoxes.length)];
    const lat = b.latMin + Math.random() * (b.latMax - b.latMin);
    const lng = b.lngMin + Math.random() * (b.lngMax - b.lngMin);
    return { lat, lng };
  }, [africaBoxes]);

  // Generate initial pins with uniform coverage across Africa (not only cities)
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < numPins; i++) {
      const { lat, lng } = sampleAfricanLatLng();
      arr.push({
        id: `pin-${i}-${Date.now()}`,
        lat,
        lng,
        delay: Math.random() * 2.5,
        duration: 1.6 + Math.random() * 1.6,
      });
    }
    setPins(arr);
    // measure after initial pins are set
    // measurement happens in onLoad and resize as well
  }, [numPins, africaBoxes, sampleAfricanLatLng]);

  // Measure on image load and window resize (keeps pin placement accurate)
  useEffect(() => {
    measureMapBox();
    const onResize = () => measureMapBox();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureMapBox]);

  // When the image finishes loading, measure it
  const onImgLoad = () => measureMapBox();

  // Animate purchase count and occasionally add pins
  useEffect(() => {
    let count = 0;
    intervalRef.current = setInterval(() => {
      count += Math.floor(Math.random() * 2) + 1;
      setPurchaseCount(count);

      if (Math.random() > 0.75) {
        setPins((prev) => {
          const { lat, lng } = sampleAfricanLatLng();
          const newPin = {
            id: `pin-new-${Date.now()}`,
            lat,
            lng,
            delay: 0,
            duration: 1.6 + Math.random() * 1.6,
          };
          return [...prev, newPin].slice(-120); // cap memory
        });
      }
    }, 2000);

    return () => clearInterval(intervalRef.current);
  }, [africaBoxes, sampleAfricanLatLng]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[420px] overflow-hidden">
      {/* background map image (use your attached map) */}
      <img
        ref={imgRef}
        src={mapSrc}
        alt="Africa-focused map"
        onLoad={onImgLoad}
        className="w-full h-full object-contain pointer-events-none select-none"
        aria-hidden
      />

      {/* pins — positioned using computed pixel coordinates */}
      <div className="absolute inset-0 pointer-events-none">
        {mapBox.width > 0 &&
          pins.map((pin) => {
            const pct = latLngToPercent(pin.lat, pin.lng);
            const pos = percentToPixel(pct);
            return (
              <div
                key={pin.id}
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: "translate(-50%, -50%)",
                  position: "absolute",
                  zIndex: 8,
                }}
                aria-hidden
              >
                {/* pulsing ring */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9999,
                    background: "rgba(239,68,68,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: `africaPing ${pin.duration}s cubic-bezier(0,0,0.2,1) infinite`,
                    animationDelay: `${pin.delay}s`,
                  }}
                />
                {/* center dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    background: "rgb(239,68,68)",
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%,-50%)",
                    boxShadow: "0 0 6px rgba(239,68,68,0.45)",
                  }}
                />
              </div>
            );
          })}
      </div>

      {/* metrics overlay */}
      {showMetrics && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm px-6 py-4 rounded-xl border border-red-500/30 z-20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-500">147+ purchases/hour</div>
              <div className="text-xs text-gray-400 mt-1">
                That&apos;s{" "}
                <span className="text-red-400 font-semibold">₦18.2M</span> stolen from legitimate businesses every hour
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-2xl font-bold text-red-400">{purchaseCount}</div>
              <div className="text-xs text-gray-500">fakes since you visited here today</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes africaPing {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          70% {
            transform: scale(2.6);
            opacity: 0.12;
          }
          100% {
            transform: scale(3.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
