"use client";

import { FormEvent, useMemo, useState } from "react";
import { DEFAULT_WEIGHTS } from "@/lib/defaults";
import { DECISION_CATEGORIES, DecisionCategory, PropertyBrief } from "@/lib/types";

type CompareResponse = {
  briefs: PropertyBrief[];
};

const categoryLabels: Record<DecisionCategory, string> = {
  priceValue: "Price Value",
  neighborhoodQuality: "Neighborhood Quality",
  schools: "Schools",
  commuteTransit: "Commute & Transit",
  groceriesAccess: "Groceries Access",
  propertyConditionRisk: "Property Condition Risk",
  climateRisk: "Climate Risk",
  investmentPotential: "Investment Potential",
};

function metricCell(value: number | null) {
  return typeof value === "number" ? value.toLocaleString() : "N/A";
}

export default function Home() {
  const [addressesText, setAddressesText] = useState(
    "123 Market St San Francisco\n450 Elm Ave Seattle",
  );
  const [expressedNeeds, setExpressedNeeds] = useState(
    "I value groceries access, school quality, and lower climate risk.",
  );
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<PropertyBrief[]>([]);

  const addresses = useMemo(
    () =>
      addressesText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 5),
    [addressesText],
  );

  async function handleCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addresses,
          preferences: {
            expressedNeeds,
            weights,
          },
        }),
      });

      const payload = (await response.json()) as CompareResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Compare API failed");
      }
      setBriefs(payload.briefs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Property Compare Brief</h1>
        <p className="mt-2 text-slate-600">
          Compare homes with reconciled multi-source data and AI-assisted scoring.
        </p>
      </header>

      <form onSubmit={handleCompare} className="grid gap-6 rounded-xl border p-5">
        <div className="grid gap-2">
          <label className="font-medium text-slate-800">
            Addresses (one per line, 2 to 5 homes)
          </label>
          <textarea
            value={addressesText}
            onChange={(event) => setAddressesText(event.target.value)}
            className="h-28 rounded-md border p-3"
          />
        </div>

        <div className="grid gap-2">
          <label className="font-medium text-slate-800">Expressed buyer needs</label>
          <textarea
            value={expressedNeeds}
            onChange={(event) => setExpressedNeeds(event.target.value)}
            className="h-24 rounded-md border p-3"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {DECISION_CATEGORIES.map((category) => (
            <label key={category} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{categoryLabels[category]}</span>
                <span className="text-slate-500">{weights[category]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={weights[category]}
                onChange={(event) =>
                  setWeights((prev) => ({
                    ...prev,
                    [category]: Number(event.target.value),
                  }))
                }
                className="w-full"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || addresses.length < 2}
          className="w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Scoring homes..." : "Compare Homes"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      {briefs.length > 0 ? (
        <section className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2 text-left">Metric</th>
                {briefs.map((brief) => (
                  <th key={brief.id} className="border p-2 text-left">
                    <div className="font-semibold">{brief.address}</div>
                    <div className="text-xs text-slate-500">Overall: {brief.overallScore}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DECISION_CATEGORIES.map((category) => (
                <tr key={category}>
                  <td className="border p-2 font-medium">{categoryLabels[category]} Score</td>
                  {briefs.map((brief) => (
                    <td key={`${brief.id}-${category}`} className="border p-2">
                      {brief.categoryScores[category]}
                      <p className="mt-1 text-xs text-slate-500">
                        {brief.categoryExplanations[category]}
                      </p>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="border p-2 font-medium">Price</td>
                {briefs.map((brief) => (
                  <td key={`${brief.id}-price`} className="border p-2">
                    ${metricCell(brief.metrics.price.value)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border p-2 font-medium">Square Feet</td>
                {briefs.map((brief) => (
                  <td key={`${brief.id}-sqft`} className="border p-2">
                    {metricCell(brief.metrics.sqft.value)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border p-2 font-medium">Schools / Walk / Groceries</td>
                {briefs.map((brief) => (
                  <td key={`${brief.id}-loc`} className="border p-2">
                    {metricCell(brief.metrics.schoolRating.value)} /{" "}
                    {metricCell(brief.metrics.walkScore.value)} /{" "}
                    {metricCell(brief.metrics.groceriesAccess.value)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border p-2 font-medium">Conflicts Flagged</td>
                {briefs.map((brief) => {
                  const conflictCount = Object.values(brief.metrics).filter(
                    (metric) => metric.conflict,
                  ).length;
                  return (
                    <td key={`${brief.id}-conflicts`} className="border p-2">
                      {conflictCount}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="border p-2 font-medium">Brief Summary</td>
                {briefs.map((brief) => (
                  <td key={`${brief.id}-summary`} className="border p-2 text-xs text-slate-600">
                    {brief.summary}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
}
