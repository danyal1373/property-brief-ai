import { RawPropertySource } from "@/lib/types";

const DEMO_SET: Record<string, RawPropertySource[]> = {
  "123 market st san francisco": [
    {
      sourceName: "Listing Feed",
      citation: "https://example.com/listings/123-market",
      data: {
        price: 1295000,
        sqft: 1780,
        beds: 3,
        baths: 2,
        schoolRating: 8.5,
        walkScore: 91,
        groceriesAccess: 90,
        floodRisk: 25,
        crimeIndex: 44,
        propertyCondition: 75,
        taxAnnual: 13800,
      },
    },
    {
      sourceName: "County Records",
      citation: "https://example.com/county/123-market",
      data: {
        sqft: 1650,
        beds: 3,
        baths: 2,
        floodRisk: 30,
        taxAnnual: 14150,
        propertyCondition: 70,
      },
    },
    {
      sourceName: "Neighborhood Data",
      citation: "https://example.com/neighborhood/market",
      data: {
        schoolRating: 8.2,
        walkScore: 89,
        groceriesAccess: 88,
        crimeIndex: 47,
      },
    },
  ],
  "450 elm ave seattle": [
    {
      sourceName: "Listing Feed",
      citation: "https://example.com/listings/450-elm",
      data: {
        price: 945000,
        sqft: 1520,
        beds: 2,
        baths: 2,
        schoolRating: 7.1,
        walkScore: 74,
        groceriesAccess: 82,
        floodRisk: 15,
        crimeIndex: 38,
        propertyCondition: 82,
        taxAnnual: 9100,
      },
    },
    {
      sourceName: "County Records",
      citation: "https://example.com/county/450-elm",
      data: {
        sqft: 1490,
        beds: 2,
        baths: 2,
        taxAnnual: 8950,
        propertyCondition: 78,
      },
    },
    {
      sourceName: "Neighborhood Data",
      citation: "https://example.com/neighborhood/elm",
      data: {
        schoolRating: 7.4,
        walkScore: 77,
        groceriesAccess: 85,
        floodRisk: 12,
        crimeIndex: 34,
      },
    },
  ],
  default: [
    {
      sourceName: "Listing Feed",
      citation: "https://example.com/listings/default",
      data: {
        price: 780000,
        sqft: 1400,
        beds: 3,
        baths: 2,
        schoolRating: 7,
        walkScore: 70,
        groceriesAccess: 72,
        floodRisk: 20,
        crimeIndex: 45,
        propertyCondition: 76,
        taxAnnual: 7200,
      },
    },
    {
      sourceName: "County Records",
      citation: "https://example.com/county/default",
      data: {
        sqft: 1340,
        beds: 3,
        baths: 2,
        taxAnnual: 7600,
        floodRisk: 24,
      },
    },
  ],
};

export function getMockSources(address: string): RawPropertySource[] {
  return DEMO_SET[address.toLowerCase().trim()] ?? DEMO_SET.default;
}
