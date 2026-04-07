"use client";

import dynamic from "next/dynamic";
import { FormEvent, useMemo, useState } from "react";
import { DECISION_CATEGORIES, DecisionCategory, PropertyBrief } from "@/lib/types";

type CompareResponse = {
  briefs: PropertyBrief[];
};

const DynamicCompareMap = dynamic(
  () => import("@/components/CompareMap").then((mod) => mod.CompareMap),
  { ssr: false },
);

const categoryLabels: Record<DecisionCategory, string> = {
  priceValue: "Price",
  neighborhoodQuality: "Neighborhood",
  schools: "Schools",
  commuteTransit: "Commute",
  groceriesAccess: "Groceries",
  propertyConditionRisk: "Condition",
  climateRisk: "Climate",
  investmentPotential: "Investment",
};

const ENTITY_COLORS = ["#f18187", "#67c2d8", "#8f80f7", "#f2b24d"];

const CRITERIA_BLOCKS: DecisionCategory[] = [
  "priceValue",
  "neighborhoodQuality",
  "schools",
  "commuteTransit",
  "groceriesAccess",
  "propertyConditionRisk",
  "climateRisk",
  "investmentPotential",
];

function toCompact(value: number | null, prefix = "", suffix = ""): string {
  if (typeof value !== "number") {
    return "N/A";
  }
  return `${prefix}${Math.round(value).toLocaleString()}${suffix}`;
}

function formatPrice(value: number | null): string {
  if (typeof value !== "number") {
    return "N/A";
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${Math.round(value)}`;
}

function CircleImportance({
  value,
  onSelect,
}: {
  value: number;
  onSelect: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, idx) => {
        const level = idx + 1;
        const active = level <= value;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onSelect(level)}
            className={`h-3.5 w-3.5 rounded-full border transition duration-150 hover:scale-110 hover:shadow ${
              active
                ? "border-slate-900 bg-slate-700"
                : "border-slate-300 bg-slate-100 hover:bg-slate-200"
            }`}
            aria-label={`Set importance to ${level}`}
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  const [addresses, setAddresses] = useState([
    "123 Market St San Francisco",
    "450 Elm Ave Seattle",
    "88 Broadway New York",
    "17 Lakeshore Dr Austin",
  ]);
  const [expressedNeeds, setExpressedNeeds] = useState(
    "Prioritize groceries access, good schools, and lower climate risk.",
  );
  const [weights, setWeights] = useState<Record<DecisionCategory, number>>({
    priceValue: 4,
    neighborhoodQuality: 3,
    schools: 4,
    commuteTransit: 3,
    groceriesAccess: 5,
    propertyConditionRisk: 3,
    climateRisk: 4,
    investmentPotential: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<PropertyBrief[]>([]);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const activeAddresses = useMemo(
    () => addresses.map((value) => value.trim()).filter(Boolean).slice(0, 4),
    [addresses],
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
          addresses: activeAddresses,
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

  const propertySlots = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, idx) => ({
        brief: briefs[idx] ?? null,
        color: ENTITY_COLORS[idx],
        slot: idx,
      })),
    [briefs],
  );

  const mapPoints = useMemo(
    () =>
      propertySlots
        .filter((slot) => slot.brief?.location)
        .map((slot) => ({
          id: slot.brief!.id,
          label: slot.brief!.address,
          lat: slot.brief!.location!.lat,
          lng: slot.brief!.location!.lng,
          color: slot.color,
        })),
    [propertySlots],
  );

  return (
    <main className="mx-auto min-h-screen max-w-[1300px] bg-[#ececec] p-4 text-slate-900">
      <form onSubmit={handleCompare} className="grid gap-4 lg:grid-cols-[4fr_1.2fr]">
        <section className="space-y-2">
          <div className="rounded-lg bg-[#cfcfcf] p-3">
            <div className="mb-2 text-base">What&apos;s important to you:</div>
            <div className="grid grid-cols-4 gap-2">
              {CRITERIA_BLOCKS.map((category) => (
                <div key={category} className="h-[56px] rounded-lg bg-[#8d8789] p-2 text-white">
                  <div className="mb-1 text-sm">{categoryLabels[category]}</div>
                  <CircleImportance
                    value={weights[category]}
                    onSelect={(next) => setWeights((prev) => ({ ...prev, [category]: next }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#d3d3d3] p-2">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <input
                  key={idx}
                  value={addresses[idx] ?? ""}
                  onChange={(event) =>
                    setAddresses((prev) =>
                      prev.map((item, itemIdx) => (itemIdx === idx ? event.target.value : item)),
                    )
                  }
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                  placeholder={`Address ${idx + 1}`}
                />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={expressedNeeds}
                onChange={(event) => setExpressedNeeds(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                placeholder="Buyer needs"
              />
              <button
                type="submit"
                disabled={loading || activeAddresses.length < 2}
                className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Scoring" : "Compare"}
              </button>
            </div>
            {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {propertySlots.map((slot) => {
              const brief = slot.brief;
              const isActive = Boolean(brief && hoveredCardId === brief.id);
              const isDimmed = Boolean(brief && hoveredCardId && hoveredCardId !== brief.id);
              return (
                <div
                  key={slot.slot}
                  className={`rounded-lg bg-[#d2d2d2] p-1 transition duration-200 ${
                    isActive ? "z-10 -translate-y-1 shadow-xl ring-1 ring-black/10" : "shadow-sm"
                  }`}
                  onMouseEnter={() => setHoveredCardId(brief?.id ?? null)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <div
                    className="h-[5px] rounded-full transition"
                    style={{ backgroundColor: isDimmed ? "#a3a3a3" : slot.color }}
                  />
                  {brief ? (
                    <div className="mt-1 rounded-md bg-[#eeeeee] p-2">
                      <img
                        src={brief.imageUrl}
                        alt={brief.address}
                        className="mb-2 h-16 w-full rounded-md object-cover"
                      />
                      <div className="flex items-start justify-between">
                        <div className="max-w-[72%] text-[13px]">{brief.address}</div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 items-start">
                        <div>
                          <div className="text-[30px] leading-none">
                            {formatPrice(brief.metrics.price.value)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[30px] leading-none">
                            {toCompact(brief.metrics.sqft.value)}
                          </div>
                          <div className="text-[11px]">sq. ft</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 text-center">
                        <div>
                          <div className="text-2xl leading-none">{toCompact(brief.metrics.beds.value)}</div>
                          <div className="text-xs">Beds</div>
                        </div>
                        <div>
                          <div className="text-2xl leading-none">{toCompact(brief.metrics.baths.value)}</div>
                          <div className="text-xs">Baths</div>
                        </div>
                        <div>
                          <div className="text-2xl leading-none">
                            {toCompact(brief.metrics.schoolRating.value)}
                          </div>
                          <div className="text-xs">Schools</div>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {brief.highlightedFeatures.map((feature) => (
                          <div
                            key={`${brief.id}-${feature.tag}`}
                            className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-700"
                          >
                            <div className="flex items-center justify-between">
                              <span>{feature.tag}</span>
                              <span>{feature.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-md bg-[#79cce0] px-2 py-2 text-center">
                        <div className="text-4xl leading-none">{brief.overallScore}</div>
                        <div className="text-sm leading-4">Match Score</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 h-[280px] rounded-md bg-[#eeeeee]" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-[#d3d3d3] p-1">
            <DynamicCompareMap points={mapPoints} activePointId={hoveredCardId} />
          </div>
        </section>

        <aside className="rounded-lg bg-[#8d8789] p-2">
          <div className="space-y-2">
            {CRITERIA_BLOCKS.map((category, idx) => (
              <div key={category} className="rounded-lg bg-[#efefef] p-2">
                <div className="mb-1 text-xs">{categoryLabels[category]}</div>
                <div className="space-y-1">
                  {propertySlots.map((slot) => {
                    const value = slot.brief?.categoryScores[category] ?? 0;
                    return (
                      <div key={`${category}-${slot.slot}`} className="h-2 rounded-full bg-[#b9b9b9]">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max(8, value)}%`,
                            backgroundColor:
                              hoveredCardId && slot.brief && hoveredCardId !== slot.brief.id
                                ? "#9ca3af"
                                : slot.color,
                            opacity: idx === 0 ? 1 : 0.95,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </form>
    </main>
  );
}
