const GITHUB_API_ORIGIN = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 10_000;

export type GitHubErrorCode =
  | "GITHUB_API_UNAVAILABLE"
  | "GITHUB_MALFORMED_RESPONSE"
  | "GITHUB_RATE_LIMITED"
  | "GITHUB_REQUEST_TIMEOUT"
  | "GITHUB_USER_NOT_FOUND"
  | "GITHUB_FORBIDDEN"
  | "GITHUB_REPOSITORY_EMPTY";

export class GitHubClientError extends Error {
  constructor(
    public readonly code: GitHubErrorCode,
    public readonly status: number,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "GitHubClientError";
  }
}

interface GitHubClientResponse {
  body: unknown;
  nextPageUrl: string | null;
}

export async function getGitHubJson(url: string): Promise<GitHubClientResponse> {
  assertGitHubApiUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: createHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw createGitHubResponseError(response);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new GitHubClientError(
        "GITHUB_MALFORMED_RESPONSE",
        502,
        "GitHub returned an invalid JSON response.",
      );
    }

    return { body, nextPageUrl: getNextPageUrl(response.headers.get("link")) };
  } catch (error: unknown) {
    if (error instanceof GitHubClientError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new GitHubClientError(
        "GITHUB_REQUEST_TIMEOUT",
        504,
        "GitHub did not respond before the request timeout.",
      );
    }

    throw new GitHubClientError(
      "GITHUB_API_UNAVAILABLE",
      502,
      "GitHub is currently unavailable.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function createHeaders(): Headers {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
  });
  const token = process.env.GITHUB_TOKEN;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function createGitHubResponseError(response: Response): GitHubClientError {
  const retryAfterSeconds = getRetryAfterSeconds(response.headers);
  const isRateLimited =
    response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0";

  if (isRateLimited) {
    return new GitHubClientError(
      "GITHUB_RATE_LIMITED",
      429,
      "GitHub API rate limit reached. Try again later.",
      retryAfterSeconds,
    );
  }

  if (response.status === 404) {
    return new GitHubClientError(
      "GITHUB_USER_NOT_FOUND",
      404,
      "GitHub user was not found.",
    );
  }

  if (response.status === 409) {
    return new GitHubClientError(
      "GITHUB_REPOSITORY_EMPTY",
      409,
      "GitHub repository has no commits yet.",
    );
  }

  if (response.status === 403) {
    return new GitHubClientError(
      "GITHUB_FORBIDDEN",
      403,
      "GitHub denied this request.",
    );
  }

  return new GitHubClientError(
    "GITHUB_API_UNAVAILABLE",
    502,
    "GitHub could not complete the request.",
  );
}

function getNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }

  const nextLink = linkHeader
    .split(",")
    .map((link) => link.trim())
    .find((link) => /rel="next"/.test(link));
  const url = nextLink?.match(/^<([^>]+)>/)?.[1];

  return url ?? null;
}

function getRetryAfterSeconds(headers: Headers): number | undefined {
  const retryAfter = headers.get("retry-after");
  if (retryAfter && /^\d+$/.test(retryAfter)) {
    return Number(retryAfter);
  }

  const resetAt = Number(headers.get("x-ratelimit-reset"));
  if (Number.isFinite(resetAt)) {
    return Math.max(0, resetAt - Math.floor(Date.now() / 1000));
  }

  return undefined;
}

function assertGitHubApiUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new GitHubClientError(
      "GITHUB_MALFORMED_RESPONSE",
      502,
      "GitHub returned an invalid pagination URL.",
    );
  }

  if (parsed.origin !== GITHUB_API_ORIGIN) {
    throw new GitHubClientError(
      "GITHUB_MALFORMED_RESPONSE",
      502,
      "GitHub returned an unexpected pagination URL.",
    );
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
