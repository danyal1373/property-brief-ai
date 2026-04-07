"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";

interface MapPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
}

export function CompareMap({ points }: { points: MapPoint[] }) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapDivRef.current, {
      zoomControl: true,
    }).setView([39.5, -98.35], 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) {
      return;
    }

    layerRef.current.clearLayers();

    if (points.length === 0) {
      mapRef.current.setView([39.5, -98.35], 4);
      return;
    }

    const latLngs: L.LatLngExpression[] = points.map((point) => {
      const latLng: L.LatLngExpression = [point.lat, point.lng];
      L.circleMarker(latLng, {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: point.color,
        fillOpacity: 0.95,
      })
        .bindTooltip(point.label)
        .addTo(layerRef.current!);
      return latLng;
    });

    if (latLngs.length === 1) {
      mapRef.current.setView(latLngs[0] as L.LatLngTuple, 11);
    } else {
      mapRef.current.fitBounds(L.latLngBounds(latLngs), {
        padding: [24, 24],
      });
    }
  }, [points]);

  return (
    <div className="relative h-[260px] overflow-hidden rounded-xl border bg-white">
      <div ref={mapDivRef} className="h-full w-full" />
      {points.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">
          Map will appear once at least one address resolves to coordinates.
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-2 top-2 rounded bg-white/80 px-2 py-1 text-[11px] text-slate-600">
        Map of compared properties
      </div>
    </div>
  );
}
