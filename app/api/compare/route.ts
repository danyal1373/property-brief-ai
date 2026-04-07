import { NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_WEIGHTS } from "@/lib/defaults";
import { geocodeAddress } from "@/lib/geocode";
import { getHybridSources } from "@/lib/providers/hybrid";
import { reconcileProperty } from "@/lib/reconciliation";
import { scoreProperty } from "@/lib/scoring";
import {
  BuyerPreferences,
  DECISION_CATEGORIES,
  DecisionCategory,
  PropertyBrief,
} from "@/lib/types";

const payloadSchema = z.object({
  addresses: z.array(z.string().min(3)).min(2).max(5),
  preferences: z.object({
    expressedNeeds: z.string().default(""),
    weights: z.record(z.string(), z.number().min(0).max(100)).optional(),
  }),
});

const categoryTitle: Record<DecisionCategory, string> = {
  priceValue: "Price",
  neighborhoodQuality: "Neighborhood",
  schools: "Schools",
  commuteTransit: "Commute",
  groceriesAccess: "Groceries",
  propertyConditionRisk: "Condition",
  climateRisk: "Climate",
  investmentPotential: "Investment",
};

function normalizeWeights(input: Record<string, number> | undefined) {
  const base = { ...DEFAULT_WEIGHTS };

  if (input) {
    for (const category of DECISION_CATEGORIES) {
      const nextValue = input[category];
      if (typeof nextValue === "number") {
        base[category] = nextValue;
      }
    }
  }

  const total = Object.values(base).reduce((sum, curr) => sum + curr, 0);
  const safeTotal = total === 0 ? 1 : total;

  const normalized = {} as Record<DecisionCategory, number>;
  for (const category of DECISION_CATEGORIES) {
    normalized[category] = base[category] / safeTotal;
  }
  return normalized;
}

function computeOverallScore(
  categoryScores: Record<DecisionCategory, number>,
  weights: Record<DecisionCategory, number>,
): number {
  const weighted = DECISION_CATEGORIES.reduce(
    (sum, category) => sum + categoryScores[category] * weights[category],
    0,
  );
  return Math.round(weighted);
}

function getHighlightedFeatures(
  categoryScores: Record<DecisionCategory, number>,
  weights: Record<DecisionCategory, number>,
): Array<{ tag: string; score: number }> {
  return [...DECISION_CATEGORIES]
    .sort(
      (a, b) =>
        categoryScores[b] * weights[b] - categoryScores[a] * weights[a],
    )
    .slice(0, 8)
    .map((category) => ({
      tag: categoryTitle[category],
      score: Math.round(categoryScores[category]),
    }));
}

export async function POST(req: Request) {
  const parse = payloadSchema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parse.error.flatten() },
      { status: 400 },
    );
  }

  const weights = normalizeWeights(parse.data.preferences.weights);
  const preferences: BuyerPreferences = {
    expressedNeeds: parse.data.preferences.expressedNeeds,
    weights,
  };

  const briefs: PropertyBrief[] = await Promise.all(
    parse.data.addresses.map(async (address) => {
      const [sources, location] = await Promise.all([
        getHybridSources(address),
        geocodeAddress(address),
      ]);
      const metrics = reconcileProperty(sources);
      const scored = await scoreProperty(metrics, preferences);

      return {
        id: address.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        address,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(address)}/400/220`,
        highlightedFeatures: getHighlightedFeatures(scored.categoryScores, weights),
        location,
        metrics,
        categoryScores: scored.categoryScores,
        categoryExplanations: scored.categoryExplanations,
        overallScore: computeOverallScore(scored.categoryScores, weights),
        summary: scored.summary,
      };
    }),
  );

  return NextResponse.json({ briefs, weights });
}
