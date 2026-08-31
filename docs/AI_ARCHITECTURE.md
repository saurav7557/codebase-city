# AI intelligence architecture

## Boundary and provider configuration

AI is an optional, server-only interpretation layer. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` to enable the supplied OpenAI Responses API provider; `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`. No API key is required to build, lint, migrate, or run the rest of Codebase City. `GET /api/ai/status` reports configuration only and never returns a secret.

`src/ai/ai-types.ts` defines the replaceable `AIProvider` contract. Future Gemini, Anthropic, or local implementations can implement the same interface without altering route handlers or persistence services.

## Controlled analysis flow

```text
POST /api/ai/analyze { repositoryId }
  → persisted GitHubRepository only
  → bounded recent GitHub EngineeringEvents
  → canonical context + SHA-256 fingerprint
  → configured AIProvider
  → strict JSON-schema request + runtime validation
  → AiAnalysis audit record
```

The endpoint does not accept a free-form prompt or arbitrary data. Runtime validation rejects unexpected keys, malformed values, confidence/importance outside `0..1`, technologies not found in the supplied source data, and evidence not copied exactly from the bounded fact list. Unknown classifications use `null`; no result is fabricated when a provider is missing or unavailable.

## Auditing, idempotency, and confidence

`AiAnalysis` is unique by `(sourceType, sourceId, fingerprint, provider, model)`. Identical input data therefore reuses the existing record and avoids a repeat API call. Evidence, provider, model, original strict result, and generation time remain queryable for review.

The city-state service counts analyses with confidence at least `0.7`, but current backend behavior deliberately does not turn AI output into database mutations for manually curated projects, technologies, districts, or existing buildings. A future review workflow must explicitly persist separately labeled AI-derived mappings before AI interpretation can influence those entities.

## Future event ingestion

Polling remains the active ingestion path. Future GitHub webhooks can call the same normalized event-ingestion boundary that writes `EngineeringEvent`; pull-request, issue, and release normalizers should follow the existing raw-GitHub-to-application-type pattern. Webhooks, OAuth, RAG, recruiter mode, interview mode, and automatic city evolution are not implemented here.
