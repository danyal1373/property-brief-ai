export interface Coordinate {
  lat: number;
  lng: number;
}

const DEMO_COORDS: Record<string, Coordinate> = {
  "123 market st san francisco": { lat: 37.7937, lng: -122.3965 },
  "450 elm ave seattle": { lat: 47.6205, lng: -122.3493 },
  "88 broadway new york": { lat: 40.7128, lng: -74.006 },
  "17 lakeshore dr austin": { lat: 30.2672, lng: -97.7431 },
};

type NominatimRecord = {
  lat: string;
  lon: string;
};

function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
}

export async function geocodeAddress(address: string): Promise<Coordinate | null> {
  const normalized = normalizeAddress(address);
  if (DEMO_COORDS[normalized]) {
    return DEMO_COORDS[normalized];
  }

  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(
    `${address}, USA`,
  )}`;

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "property-brief-ai/1.0 (local-development)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as NominatimRecord[];
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const first = data[0];
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}
