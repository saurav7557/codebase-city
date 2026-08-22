# Codebase City data model

Codebase City uses PostgreSQL through Prisma. The 3D scene remains independent from the database: `src/data/city.ts` is still the active source and `GET /api/city` exposes the compatible replacement shape for a later adapter.

## Core entities

- `District` owns projects and buildings. Along with its identity and descriptive fields, it stores the district color, center coordinates, and radius currently used by the renderer.
- `Project` represents a portfolio project. It belongs to one district and can have one city building.
- `Technology` is normalized and connected to projects through `ProjectTechnology`, whose composite primary key prevents duplicate project/technology links. `CityBuildingTechnology` covers the rare non-project building, such as the profile headquarters.
- `CityBuilding` stores renderer-specific building placement and presentation data. Its `projectId` is optional so non-project buildings, such as the profile headquarters, do not require a fictional project record.
- `Achievement` stores dated portfolio milestones. No achievement rows are seeded until a verified achievement is available.
- `EngineeringEvent` is an append-oriented event log. `metadata` is JSON for source-specific payload details while the standard fields remain queryable.

## Relationships

```text
District 1 ── * Project 1 ── * ProjectTechnology * ── 1 Technology
District 1 ── * CityBuilding * ── 0..1 Project
CityBuilding 1 ── * CityBuildingTechnology * ── 1 Technology (non-project buildings only)
```

`CityBuilding` owns world positions (`positionX`, `positionY`, `positionZ`), height, and colors. Project technologies are read through the project relationship rather than duplicated on the building; only buildings with no project use the separate building-technology mapping.

## Seed behavior

`prisma/seed.ts` imports `src/data/city.ts`, preserving the existing descriptions, positions, colors, technologies, and building statuses. It uses upserts, so it can be rerun safely without deleting local data. The headquarters is intentionally seeded as a building without a `Project`; the remaining six buildings each have a corresponding project.

No URLs, achievements, or engineering-event claims are invented by the seed.
