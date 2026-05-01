"use client";

import { divIcon } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import type { MapObservation } from "../../lib/map-page";

type MapCategory = "all" | "flora" | "fauna";

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M4 5h16l-6.5 7.6V19l-3-1.8v-4.6L4 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M18 5c-8 .5-12 5-12 11 0 .7 0 1.4.2 2 1-1.4 2.1-2.6 3.5-3.6C13.1 12 16 11.4 18 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 18c2-2.9 4.3-4.9 7.5-6.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M7 10c-1.4 0-2.5-1.4-2.5-3.1S5.6 4 7 4s2.5 1.3 2.5 2.9S8.4 10 7 10Zm10 0c-1.4 0-2.5-1.4-2.5-3.1S15.6 4 17 4s2.5 1.3 2.5 2.9S18.4 10 17 10ZM12 8.5c-1.5 0-2.7-1.6-2.7-3.5S10.5 1.5 12 1.5 14.7 3 14.7 5 13.5 8.5 12 8.5Zm0 13c-3.7 0-6.2-2.1-6.2-4.6 0-2 1.6-3.2 3.2-3.2 1.1 0 2 .5 3 1.4 1-1 1.9-1.4 3-1.4 1.6 0 3.2 1.2 3.2 3.2 0 2.5-2.5 4.6-6.2 4.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function markerIcon(type: "Flora" | "Fauna") {
  const background = type === "Flora" ? "#3e8b29" : "#1f8f8b";
  const symbol = type === "Flora" ? "F" : "A";

  return divIcon({
    className: "biosnap-map-marker",
    html: `
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 9999px;
        background: ${background};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 12px 24px rgba(20,64,35,0.22);
        font-size: 17px;
        line-height: 1;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18],
  });
}

function MapSizeInvalidator() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize();
      });
    };

    const timeoutId = window.setTimeout(invalidate, 150);
    window.addEventListener("resize", invalidate);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  return null;
}

export default function BiodiversityMap({
  observations,
  barangays,
}: {
  observations: MapObservation[];
  barangays: string[];
}) {
  const [category, setCategory] = useState<MapCategory>("all");
  const [barangay, setBarangay] = useState("");

  const filteredObservations = useMemo(() => {
    return observations.filter((item) => {
      if (category !== "all" && item.type.toLowerCase() !== category) {
        return false;
      }

      if (barangay && item.barangay !== barangay) {
        return false;
      }

      return true;
    });
  }, [barangay, category, observations]);

  const categoryCounts = useMemo(
    () => ({
      all: observations.length,
      flora: observations.filter((item) => item.type === "Flora").length,
      fauna: observations.filter((item) => item.type === "Fauna").length,
    }),
    [observations],
  );

  return (
    <section className="px-4 py-10 sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-[1640px] gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-7 shadow-[0_18px_36px_rgba(20,64,35,0.06)]">
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <FilterIcon />
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em]">
                Map Filters
              </h2>
            </div>

            <div className="mt-8">
              <p className="text-base font-semibold text-[var(--foreground)]">
                Category
              </p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-lg font-semibold transition-colors ${
                    category === "all"
                      ? "bg-[var(--brand-700)] text-white"
                      : "bg-[#eff3ed] text-[var(--muted-foreground)] hover:text-[var(--brand-700)]"
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <EyeIcon />
                    All
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      category === "all"
                        ? "bg-white/12 text-white"
                        : "bg-white text-[var(--foreground)]"
                    }`}
                  >
                    {categoryCounts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("flora")}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-lg font-semibold transition-colors ${
                    category === "flora"
                      ? "bg-[var(--brand-700)] text-white"
                      : "bg-[#eff3ed] text-[var(--muted-foreground)] hover:text-[var(--brand-700)]"
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <LeafIcon />
                    Flora
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      category === "flora"
                        ? "bg-white/12 text-white"
                        : "bg-white text-[var(--foreground)]"
                    }`}
                  >
                    {categoryCounts.flora}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("fauna")}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-lg font-semibold transition-colors ${
                    category === "fauna"
                      ? "bg-[var(--brand-700)] text-white"
                      : "bg-[#eff3ed] text-[var(--muted-foreground)] hover:text-[var(--brand-700)]"
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <PawIcon />
                    Fauna
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      category === "fauna"
                        ? "bg-white/12 text-white"
                        : "bg-white text-[var(--foreground)]"
                    }`}
                  >
                    {categoryCounts.fauna}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-base font-semibold text-[var(--foreground)]">
                Barangay
              </p>
              <select
                value={barangay}
                onChange={(event) => setBarangay(event.target.value)}
                className="mt-4 h-12 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
              >
                <option value="">All Barangays</option>
                {barangays.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 border-t border-[var(--border-soft)] pt-6 text-lg text-[var(--muted-foreground)]">
              Showing{" "}
              <span className="font-semibold text-[var(--brand-700)]">
                {filteredObservations.length}
              </span>{" "}
              locations
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-7 shadow-[0_18px_36px_rgba(20,64,35,0.06)]">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              Legend
            </h2>
            <div className="mt-8 space-y-5 text-xl text-[var(--foreground)]">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3e8b29] text-white">
                  <LeafIcon />
                </span>
                <span>Flora (Plants)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2477c5] text-white">
                  <PawIcon />
                </span>
                <span>Fauna (Animals)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border-soft)] bg-white shadow-[0_18px_36px_rgba(20,64,35,0.06)]">
            <MapContainer
              center={[14.6507, 121.1029]}
              zoom={13}
              scrollWheelZoom
              zoomControl={false}
              className="h-[500px] w-full md:h-[620px] xl:h-[720px]"
            >
              <MapSizeInvalidator />
              <ZoomControl position="topleft" />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredObservations.map((item) => (
                <Marker
                  key={item.id}
                  position={[item.latitude, item.longitude]}
                  icon={markerIcon(item.type)}
                >
                  <Popup>
                    <div className="min-w-[220px] space-y-2">
                      <p className="text-lg font-semibold text-[#1e2e20]">
                        {item.commonName}
                      </p>
                      <p className="text-sm italic text-[#607063]">
                        {item.scientificName}
                      </p>
                      <p className="text-sm text-[#607063]">
                        {item.category} in {item.barangay}
                      </p>
                      <p className="text-sm text-[#607063]">
                        Recorded {item.dateRecorded}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-white px-6 py-5 text-lg leading-8 text-[var(--muted-foreground)] shadow-[0_18px_36px_rgba(20,64,35,0.05)]">
            <span className="font-semibold text-[var(--foreground)]">Note:</span>{" "}
            GPS coordinates are generalized to barangay level to protect
            sensitive species locations. Precise coordinates are available to
            verified CEMO staff and researchers only.
          </div>
        </div>
      </div>
    </section>
  );
}
