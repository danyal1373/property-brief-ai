# Property Compare Brief

End-to-end property comparison feature with hybrid data ingestion, reconciliation, buyer-priority weighting, AI scoring, and a lo-fi driven compare UI.

## Current Product Scope

This implementation focuses on the assignment's "scattered + inconsistent + incomplete" data problem:

- Aggregate multi-source property signals (mock-first hybrid providers)
- Reconcile conflicts and attach confidence-aware values
- Score each home against buyer priorities (LLM + fallback strategy)
- Show side-by-side compare cards with highlighted features and match score
- Plot color-coded homes on a map using the same per-home color identity

## What Changed In This Build

- Reworked UI to match the lo-fi compare layout:
  - top criteria block with circle-based importance selectors
  - four compare cards with color-coded top bars
  - right-side lane chart for category score comparison
  - map block under cards
- Card model updates:
  - primary metric: price
  - secondary metric: sq. ft
  - highlighted feature chips with `tag` on left and `score` on right
  - match score panel per card
- Added image support per property card (`imageUrl`, currently seeded demo images).
- Added deterministic geocodes for demo addresses (SF, Seattle, NYC, Austin) plus Nominatim fallback.
- Hardened map rendering using Leaflet in a client-only component to avoid map container lifecycle issues.
- Added multi-model scoring path:
  - Claude -> Google Gemini -> heuristic fallback

## Tech Stack

- Next.js 13 (App Router, TypeScript)
- Tailwind CSS
- API route: `app/api/compare/route.ts`
- Validation: `zod`
- LLM providers:
  - Anthropic (`@anthropic-ai/sdk`)
  - Google Gemini (REST call with API key)
- Mapping: Leaflet + OpenStreetMap tiles

## Data and Scoring Flow

```mermaid
flowchart TD
  A[User input\naddresses + expressed needs + category weights] --> B[POST /api/compare]
  B --> C[Hybrid source fetch\nmock records + optional provider adapters]
  B --> D[Geocode address\ndeterministic demo coords -> Nominatim fallback]
  C --> E[Reconcile metrics\nblend values, detect conflicts, confidence score]
  E --> F[Score categories]
  F --> F1[Claude scorer\nif ANTHROPIC_API_KEY]
  F --> F2[Google scorer\nif GOOGLE_API_KEY]
  F --> F3[Heuristic scorer\nfallback]
  F1 --> G[categoryScores + explanations]
  F2 --> G
  F3 --> G
  G --> H[Overall weighted score]
  H --> I[Highlighted features\n(top weighted categories)]
  D --> J[location lat/lng]
  I --> K[PropertyBrief payload]
  J --> K
  K --> L[UI render\ncards + side compare lanes + map markers]
```

## Scoring Logic (High-Level)

1. Compute normalized category weights from buyer preferences.
2. Generate per-category scores through LLM or fallback heuristics.
3. Compute `overallScore` as weighted sum of category scores.
4. Select top weighted-category contributors as `highlightedFeatures`.

## Decision Categories

- Price Value
- Neighborhood Quality
- Schools
- Commute
- Groceries Access
- Property Condition Risk
- Climate Risk
- Investment Potential

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env:
   ```bash
   # macOS/Linux
   cp .env.example .env.local
   # Windows PowerShell
   Copy-Item .env.example .env.local
   ```
3. Start:
   ```bash
   npm run dev -- --port 3012
   ```
4. Open:
   - [http://localhost:3012](http://localhost:3012)

## Environment Variables

See `.env.example`.

- `ANTHROPIC_API_KEY` (optional but preferred)
- `ANTHROPIC_MODEL` (optional, default: `claude-3-5-sonnet-latest`)
- `GOOGLE_API_KEY` (optional fallback scorer)
- `GOOGLE_MODEL` (optional, default: `gemini-1.5-flash`)
- `RENTCAST_API_KEY` (placeholder adapter)
- `WALKSCORE_API_KEY` (placeholder adapter)

## Current Trade-offs

- Mock-first sources keep demo reliability high but are not production-fresh.
- Geocoding includes deterministic demo mappings to avoid unstable address ambiguity.
- LLM output uses strict JSON prompts with fallback protection, but no formal eval harness yet.
- Card images are demo placeholders rather than listing-provider photos.

## Next Steps

- Wire real listing photos and provider-backed property records.
- Add cached geocoding and provider response caching.
- Add unit tests for reconciliation, weighted scoring, and feature selection.
- Add persisted compare sessions and scenario presets.
