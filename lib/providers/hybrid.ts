import { getMockSources } from "@/lib/mockData";
import { RawPropertySource } from "@/lib/types";

async function getRentCastSource(address: string): Promise<RawPropertySource | null> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return null;
  }

  // Placeholder integration point. Add real RentCast endpoint call when key is available.
  return {
    sourceName: "RentCast",
    citation: "https://www.rentcast.io/",
    data: {},
  };
}

async function getWalkabilitySource(address: string): Promise<RawPropertySource | null> {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) {
    return null;
  }

  // Placeholder integration point. Add real walkability call when key is available.
  return {
    sourceName: "Walkability API",
    citation: "https://www.walkscore.com/professional/",
    data: {},
  };
}

export async function getHybridSources(address: string): Promise<RawPropertySource[]> {
  const [rentCast, walkability] = await Promise.all([
    getRentCastSource(address),
    getWalkabilitySource(address),
  ]);

  const realSources = [rentCast, walkability].filter(
    (value): value is RawPropertySource => value !== null,
  );

  return [...getMockSources(address), ...realSources];
}
