# Public GitHub integration (Phases 4A and 4B)

Codebase City reads public repository metadata and bounded recent commit activity for GitHub user `saurav7557`. The integration is read-only with respect to GitHub: it does not use OAuth, webhooks, mutations, pull-request or issue synchronization, AI classification, or city generation.

## GitHub API usage

The integration calls `GET https://api.github.com/users/saurav7557/repos` with `type=owner`, `sort=updated`, `direction=desc`, and `per_page=100`. It follows GitHub's `Link` response header until no `rel="next"` URL remains. For commit activity it calls `GET https://api.github.com/repos/{owner}/{repo}/commits` with `per_page=30`; the client understands `Link` pagination, while Phase 4B intentionally reads one page per repository per synchronization run. Requests use GitHub's recommended JSON `Accept` header and API-version header.

Public repositories work without a token. `GITHUB_TOKEN` is optional, is read only by the server-side client, and must never be renamed to a `NEXT_PUBLIC_*` variable.

## Internal shape and persistence

`src/github/github-types.ts` keeps GitHub's wire payload separate from the normalized `GitHubRepository` used by Codebase City. The normalized model preserves an external ID, names, URLs, language, topics, engagement counts, timestamps, fork/archive flags, and visibility without inventing missing values.

The `GitHubRepository` Prisma model is an integration record, separate from `Project`. `externalId` and `fullName` are unique, so `syncGitHubRepositories()` can upsert safely on repeated runs.

Phase 4B uses that integration record as the comparison point for `syncGitHubEngineeringEvents()`. It writes the existing `EngineeringEvent` table, with types `repository_created`, `repository_updated`, `repository_archived`, and `commit`. No new event table was introduced. Repository events use deterministic IDs built from the GitHub repository ID and lifecycle timestamp where applicable. Commit events use a repository-qualified GitHub SHA (`repository:{GitHub repository ID}:commit:{SHA}`) as `sourceId`; it is stable and also lets a retry detect whether a specific repository has completed its commit ingestion. All GitHub events have `source = "github"`, a populated `occurredAt`, and structured repository/commit metadata.

The database has a unique constraint on `(source, sourceId, type)`. Event writes use `createMany({ skipDuplicates: true })`, which makes repeated calls and concurrent retries idempotent. A repository update gets a timestamp-qualified source ID, allowing distinct GitHub update timestamps to remain distinct events without recording the same update twice.

## Application API

| Endpoint | Behavior |
| --- | --- |
| `GET /api/github/repositories` | Fetches and returns normalized public repositories. Successful responses may be cached by an HTTP client for 60 seconds. |
| `POST /api/github/sync` | Fetches repositories, upserts integration records, and returns `{ fetched, created, updated, skipped }`. |
| `POST /api/github/events/sync` | Synchronizes repository lifecycle events and bounded commit events, returning `{ repositoriesFetched, repositoriesCreated, repositoriesUpdated, commitsFetched, eventsCreated, eventsSkipped }`. |

Errors return structured JSON. The service handles request timeouts, unavailable GitHub responses, malformed payloads/pagination links, rate limits, unknown users, and database sync failures without returning stack traces or credentials.

## Rate limits

GitHub allows unauthenticated public REST requests, currently with a primary limit of 60 requests/hour per originating IP. Repository sync requests 100 repositories per page and only follows pagination when GitHub provides a next link. Commit sync fetches at most 30 recent commits and one page per repository. After the initial event sync, commit requests are skipped for repositories whose `pushedAt` timestamp has not changed and which already have commit events, avoiding needless repeat traffic while allowing a failed initial repository to recover on retry. The client rejects malformed pagination, applies a request timeout, handles empty repositories, and surfaces 403, 404, and rate-limit responses without exposing credentials. Sync runs only when its POST endpoint is called; there is no background polling or scheduler.

## Future architecture (not implemented)

```text
GitHub repositories and commits
  → EngineeringEvent
  → AI classification
  → Project / Technology / District
  → CityBuilding
  → City API
  → 3D City
```

AI classification can later consume these normalized, deduplicated `EngineeringEvent` records and suggest project, technology, district, and building changes. Webhooks may later add near-real-time GitHub activity, but are intentionally not implemented in this phase.
