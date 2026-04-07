import Anthropic from "@anthropic-ai/sdk";
import { BuyerPreferences, DecisionCategory, PropertyMetrics } from "@/lib/types";

type ScoreResult = {
  categoryScores: Record<DecisionCategory, number>;
  categoryExplanations: Record<DecisionCategory, string>;
  summary: string;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function v(num: number | null, fallback: number): number {
  return num ?? fallback;
}

function heuristicScores(metrics: PropertyMetrics): ScoreResult {
  const priceValue = clamp(
    100 - (v(metrics.price.value, 900000) / Math.max(v(metrics.sqft.value, 1400), 700)) / 20,
  );
  const neighborhoodQuality = clamp(100 - v(metrics.crimeIndex.value, 50));
  const schools = clamp(v(metrics.schoolRating.value, 6.5) * 10);
  const commuteTransit = clamp(v(metrics.walkScore.value, 65));
  const groceriesAccess = clamp(v(metrics.groceriesAccess.value, 60));
  const propertyConditionRisk = clamp(v(metrics.propertyCondition.value, 70));
  const climateRisk = clamp(100 - v(metrics.floodRisk.value, 30));
  const investmentPotential = clamp(
    0.35 * priceValue + 0.25 * schools + 0.25 * neighborhoodQuality + 0.15 * climateRisk,
  );

  const categoryScores: Record<DecisionCategory, number> = {
    priceValue,
    neighborhoodQuality,
    schools,
    commuteTransit,
    groceriesAccess,
    propertyConditionRisk,
    climateRisk,
    investmentPotential,
  };

  const categoryExplanations: Record<DecisionCategory, string> = {
    priceValue: "Based on blended price-per-square-foot across sources.",
    neighborhoodQuality: "Derived from crime index and neighborhood stability signals.",
    schools: "Derived from blended school ratings from available sources.",
    commuteTransit: "Derived from walkability and transit-proxy metrics.",
    groceriesAccess: "Based on proximity and walkability to grocery amenities.",
    propertyConditionRisk: "Estimated using condition/permit-style health signals.",
    climateRisk: "Based on flood and environmental risk (lower risk scores higher).",
    investmentPotential: "Composite of value, schools, neighborhood, and climate outlook.",
  };

  return {
    categoryScores,
    categoryExplanations,
    summary:
      "Heuristic scoring mode was used because Claude API credentials were not provided.",
  };
}

function parseClaudeJson(raw: string): ScoreResult | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as ScoreResult;
    return parsed;
  } catch {
    return null;
  }
}

async function claudeScores(
  metrics: PropertyMetrics,
  preferences: BuyerPreferences,
): Promise<ScoreResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
    max_tokens: 900,
    temperature: 0.2,
    system:
      "You score homes for buyers. Output strict JSON only with keys: categoryScores, categoryExplanations, summary.",
    messages: [
      {
        role: "user",
        content: `Score this property from 0-100 per category and explain each category in one short sentence.
Categories: priceValue, neighborhoodQuality, schools, commuteTransit, groceriesAccess, propertyConditionRisk, climateRisk, investmentPotential.
Use this buyer needs text: "${preferences.expressedNeeds}".
Use weights as a priority hint: ${JSON.stringify(preferences.weights)}.
Property metrics: ${JSON.stringify(metrics)}.
Return JSON only.`,
      },
    ],
  });

  const text = message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  return parseClaudeJson(text);
}

export async function scoreProperty(
  metrics: PropertyMetrics,
  preferences: BuyerPreferences,
): Promise<ScoreResult> {
  const claude = await claudeScores(metrics, preferences);
  if (claude) {
    return claude;
  }
  return heuristicScores(metrics);
}
