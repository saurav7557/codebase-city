# Data architecture

## Current boundary

The current client-side renderer reads `src/data/city.ts` directly and has not been changed. The new server-only path is:

```text
PostgreSQL → Prisma → repositories/services → Route Handlers → future city-data adapter → 3D renderer
```

`getCityData()` maps normalized database records to the existing `CityData` / `CityBuilding` / `CityDistrict` TypeScript contract. Its response deliberately preserves `district`, tuple `position`, colors, height, and technology labels expected by the 3D engine.

## GitHub engineering-event integration

Phases 4A and 4B add a separate server-only public GitHub layer:

```text
GitHub public REST API → src/github → GitHubRepository → event processor → EngineeringEvent → /api/github/*
```

The event processor creates only normalized repository lifecycle and bounded commit events. It is intentionally not connected to projects or city rendering. See `docs/GITHUB_INTEGRATION.md` for API, persistence, event identity, rate-limit, and future-pipeline details.

## AI intelligence and city state

The AI layer is provider-independent and server-only:

```text
Persisted GitHubRepository + bounded EngineeringEvent context
  → AIProvider
  → strict runtime validation
  → audited AiAnalysis record
  → reviewable portfolio intelligence
  → deterministic city-state synchronization
```

`src/ai` contains the provider interface, OpenAI implementation, provider configuration, and runtime validation. `src/services/portfolio-intelligence-service.ts` creates a stable SHA-256 fingerprint of a bounded repository context; an identical provider/model/fingerprint reuses its previous analysis instead of making another API call. The service does not mutate manually curated `Project`, `Technology`, `District`, or `CityBuilding` records.

`src/services/city-state-service.ts` reads projects, technologies, engineering events, and high-confidence AI analyses. Its current safe policy creates a deterministic building only for a project that lacks one. Existing buildings—especially their manual locations, dimensions, colors, types, and statuses—are never changed. The confidence observation threshold is `0.7`; it is informational until a future review workflow maps an AI classification into clearly labeled AI-derived portfolio fields.

## Read API

| Endpoint | Response |
| --- | --- |
| `GET /api/city` | Renderer-compatible `{ districts, buildings }` city payload. |
| `GET /api/districts` | Persisted district records, including layout metadata. |
| `GET /api/projects` | Projects with district, building, and normalized technology relations. |
| `GET /api/projects/[slug]` | One project or a `404` JSON error. |
| `GET /api/achievements` | Achievements ordered newest first. |
| `GET /api/engineering-events` | Engineering events ordered newest first. |
| `POST /api/github/events/sync` | GitHub repository lifecycle and bounded commit event synchronization. |
| `GET /api/ai/status` | Reports whether a server-side AI provider is configured, without exposing secrets. |
| `POST /api/ai/analyze` | Validates an existing GitHub repository ID and returns/persists a guarded AI analysis. |
| `POST /api/city/sync` | Reconciles missing project buildings deterministically while preserving existing city data. |

All handlers run in the Node.js runtime, are explicitly dynamic, and access the database only on the server. `DATABASE_URL` is never exposed to browser code.

## Future integrations (not implemented)

GitHub OAuth and webhooks can later add repository activity into `EngineeringEvent` rows (for example `pull_request` and `pull_request_merged`). A future review workflow can map validated AI classifications into clearly labeled AI-derived portfolio fields before city synchronization consumes them. The renderer need only consume the stable city data contract.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a local PostgreSQL database.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate -- --name init`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.

Useful checks: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npx prisma validate`.

For a standard local PostgreSQL instance, create a database named `codebase_city` and use the example connection string format in `.env.example`. PostgreSQL itself is intentionally not bundled with the application.
