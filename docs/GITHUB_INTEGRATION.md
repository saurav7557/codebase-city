# Public GitHub integration (Phase 4A)

Codebase City reads public repository metadata for GitHub user `saurav7557`. This phase is read-only with respect to GitHub: it does not use OAuth, webhooks, mutations, pull-request synchronization, commit synchronization, issue synchronization, AI classification, or city generation.

## GitHub API usage

The integration calls `GET https://api.github.com/users/saurav7557/repos` with `type=owner`, `sort=updated`, `direction=desc`, and `per_page=100`. It follows GitHub's `Link` response header until no `rel="next"` URL remains. Requests use GitHub's recommended JSON `Accept` header and API-version header.

Public repositories work without a token. `GITHUB_TOKEN` is optional, is read only by the server-side client, and must never be renamed to a `NEXT_PUBLIC_*` variable.

## Internal shape and persistence

`src/github/github-types.ts` keeps GitHub's wire payload separate from the normalized `GitHubRepository` used by Codebase City. The normalized model preserves an external ID, names, URLs, language, topics, engagement counts, timestamps, fork/archive flags, and visibility without inventing missing values.

The `GitHubRepository` Prisma model is an integration record, separate from `Project`. `externalId` and `fullName` are unique, so `syncGitHubRepositories()` can upsert safely on repeated runs. It deliberately has no relation to `EngineeringEvent`, `Project`, `Technology`, or `CityBuilding` yet.

## Application API

| Endpoint | Behavior |
| --- | --- |
| `GET /api/github/repositories` | Fetches and returns normalized public repositories. Successful responses may be cached by an HTTP client for 60 seconds. |
| `POST /api/github/sync` | Fetches repositories, upserts integration records, and returns `{ fetched, created, updated, skipped }`. |

Errors return structured JSON. The service handles request timeouts, unavailable GitHub responses, malformed payloads/pagination links, rate limits, unknown users, and database sync failures without returning stack traces or credentials.

## Rate limits

GitHub allows unauthenticated public REST requests, currently with a primary limit of 60 requests/hour per originating IP. This integration requests 100 repositories per page and only follows pagination when GitHub provides a next link. Sync runs only when its POST endpoint is called; there is no background polling or scheduler in Phase 4A. A server-side token can raise the available quota when later operational needs require it.

## Future architecture (not implemented)

```text
GitHub repositories, pull requests, commits, and issues
  → EngineeringEvent
  → AI classification
  → Project / Technology / District
  → CityBuilding
  → City API
  → 3D City
```

Webhooks can later authenticate and normalize GitHub events into `EngineeringEvent`; an AI classifier can then interpret those events and suggest project, technology, district, and building changes. Phase 4A only persists repository metadata and intentionally leaves each later arrow unimplemented.
