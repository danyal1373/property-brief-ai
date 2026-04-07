import {
  PropertyMetrics,
  RawPropertySource,
  ReconciledValue,
  SourceObservation,
} from "@/lib/types";

const METRIC_KEYS: (keyof PropertyMetrics)[] = [
  "price",
  "sqft",
  "beds",
  "baths",
  "schoolRating",
  "walkScore",
  "groceriesAccess",
  "floodRisk",
  "crimeIndex",
  "propertyCondition",
  "taxAnnual",
];

function reconcileMetric(
  metric: keyof PropertyMetrics,
  sources: RawPropertySource[],
): ReconciledValue<number> {
  const observations: SourceObservation<number>[] = sources.map((source) => ({
    source: source.sourceName,
    value: source.data[metric] ?? null,
    citation: source.citation,
  }));

  const numericValues = observations
    .map((item) => item.value)
    .filter((value): value is number => typeof value === "number");

  if (numericValues.length === 0) {
    return {
      value: null,
      confidence: 0,
      conflict: false,
      missing: true,
      observations,
      rationale: "No source reported this metric.",
    };
  }

  const average =
    numericValues.reduce((sum, current) => sum + current, 0) / numericValues.length;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const spreadRatio = average === 0 ? 0 : (max - min) / average;
  const conflict = spreadRatio > 0.12;
  const confidence = Math.max(
    25,
    Math.round(100 - spreadRatio * 100 - (3 - numericValues.length) * 10),
  );

  return {
    value: Math.round(average * 100) / 100,
    confidence,
    conflict,
    missing: false,
    observations,
    rationale: conflict
      ? "Sources disagree materially; value uses blended average."
      : "Sources are mostly aligned; value uses blended average.",
  };
}

export function reconcileProperty(sources: RawPropertySource[]): PropertyMetrics {
  return METRIC_KEYS.reduce((acc, metric) => {
    acc[metric] = reconcileMetric(metric, sources);
    return acc;
  }, {} as PropertyMetrics);
}
