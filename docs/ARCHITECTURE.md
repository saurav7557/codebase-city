# Data architecture

## Current boundary

The current client-side renderer reads `src/data/city.ts` directly and has not been changed. The new server-only path is:

```text
PostgreSQL → Prisma → src/lib/city-repository.ts → Route Handlers → future city-data adapter → 3D renderer
```

`getCityData()` maps normalized database records to the existing `CityData` / `CityBuilding` / `CityDistrict` TypeScript contract. Its response deliberately preserves `district`, tuple `position`, colors, height, and technology labels expected by the 3D engine.

## Read API

| Endpoint | Response |
| --- | --- |
| `GET /api/city` | Renderer-compatible `{ districts, buildings }` city payload. |
| `GET /api/districts` | Persisted district records, including layout metadata. |
| `GET /api/projects` | Projects with district, building, and normalized technology relations. |
| `GET /api/projects/[slug]` | One project or a `404` JSON error. |
| `GET /api/achievements` | Achievements ordered newest first. |
| `GET /api/engineering-events` | Engineering events ordered newest first. |

All handlers run in the Node.js runtime, are explicitly dynamic, and access the database only on the server. `DATABASE_URL` is never exposed to browser code.

## Future integrations (not implemented)

GitHub OAuth and webhooks can normalize repository activity into `EngineeringEvent` rows (for example `commit`, `pull_request`, and `pull_request_merged`). A future AI classifier can consume those rows, write classification metadata and detected technologies, then create or update project/building mappings. The renderer need only consume the stable city data contract.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a local PostgreSQL database.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate -- --name init`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.

Useful checks: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npx prisma validate`.

For a standard local PostgreSQL instance, create a database named `codebase_city` and use the example connection string format in `.env.example`. PostgreSQL itself is intentionally not bundled with the application.
