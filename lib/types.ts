export const DECISION_CATEGORIES = [
  "priceValue",
  "neighborhoodQuality",
  "schools",
  "commuteTransit",
  "groceriesAccess",
  "propertyConditionRisk",
  "climateRisk",
  "investmentPotential",
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

export type CategoryWeights = Record<DecisionCategory, number>;

export interface BuyerPreferences {
  expressedNeeds: string;
  weights: CategoryWeights;
}

export interface SourceObservation<T> {
  source: string;
  value: T | null;
  citation?: string;
}

export interface ReconciledValue<T> {
  value: T | null;
  confidence: number;
  conflict: boolean;
  missing: boolean;
  observations: SourceObservation<T>[];
  rationale: string;
}

export interface PropertyMetrics {
  price: ReconciledValue<number>;
  sqft: ReconciledValue<number>;
  beds: ReconciledValue<number>;
  baths: ReconciledValue<number>;
  schoolRating: ReconciledValue<number>;
  walkScore: ReconciledValue<number>;
  groceriesAccess: ReconciledValue<number>;
  floodRisk: ReconciledValue<number>;
  crimeIndex: ReconciledValue<number>;
  propertyCondition: ReconciledValue<number>;
  taxAnnual: ReconciledValue<number>;
}

export interface RawPropertySource {
  sourceName: string;
  citation?: string;
  data: Partial<Record<keyof PropertyMetrics, number>>;
}

export interface PropertyBrief {
  id: string;
  address: string;
  imageUrl: string;
  highlightedFeatures: Array<{
    tag: string;
    score: number;
  }>;
  location: {
    lat: number;
    lng: number;
  } | null;
  metrics: PropertyMetrics;
  overallScore: number;
  categoryScores: Record<DecisionCategory, number>;
  categoryExplanations: Record<DecisionCategory, string>;
  summary: string;
}
