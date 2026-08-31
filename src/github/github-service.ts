import "server-only";

import { prisma } from "@/lib/prisma";

import { getGitHubJson, GitHubClientError } from "./github-client";
import type {
  GitHubApiRepository,
  GitHubApiCommit,
  GitHubCommit,
  GitHubRepository,
  GitHubSyncSummary,
} from "./github-types";

export const GITHUB_USERNAME = "saurav7557";

export class GitHubSyncError extends Error {
  constructor() {
    super("GitHub repository synchronization could not be completed.");
    this.name = "GitHubSyncError";
  }
}

export async function getPublicGitHubRepositories(): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];
  const visitedUrls = new Set<string>();
  let nextPageUrl: string | null = createRepositoryUrl();

  while (nextPageUrl) {
    if (visitedUrls.has(nextPageUrl)) {
      throw new GitHubClientError(
        "GITHUB_MALFORMED_RESPONSE",
        502,
        "GitHub returned a repeated pagination URL.",
      );
    }

    visitedUrls.add(nextPageUrl);
    const response = await getGitHubJson(nextPageUrl);
    repositories.push(...normalizeRepositoryPage(response.body));
    nextPageUrl = response.nextPageUrl;
  }

  return repositories;
}

export async function syncGitHubRepositories(): Promise<GitHubSyncSummary> {
  const repositories = await getPublicGitHubRepositories();

  try {
    const existingRepositories = await prisma.gitHubRepository.findMany({
      where: { externalId: { in: repositories.map(({ externalId }) => externalId) } },
      select: { externalId: true },
    });
    const existingIds = new Set(existingRepositories.map(({ externalId }) => externalId));

    await prisma.$transaction(
      repositories.map((repository) =>
        prisma.gitHubRepository.upsert({
          where: { externalId: repository.externalId },
          update: toGitHubRepositoryPersistenceData(repository),
          create: toGitHubRepositoryPersistenceData(repository),
        }),
      ),
    );

    const updated = repositories.filter(({ externalId }) => existingIds.has(externalId)).length;
    return {
      fetched: repositories.length,
      created: repositories.length - updated,
      updated,
      skipped: 0,
    };
  } catch {
    throw new GitHubSyncError();
  }
}

export async function getRecentPublicGitHubCommits(
  repositoryFullName: string,
  maxPages = 1,
): Promise<GitHubCommit[]> {
  const commits: GitHubCommit[] = [];
  const visitedUrls = new Set<string>();
  let nextPageUrl: string | null = createCommitUrl(repositoryFullName);
  let pagesFetched = 0;

  while (nextPageUrl && pagesFetched < maxPages) {
    if (visitedUrls.has(nextPageUrl)) {
      throw new GitHubClientError(
        "GITHUB_MALFORMED_RESPONSE",
        502,
        "GitHub returned a repeated commit pagination URL.",
      );
    }

    visitedUrls.add(nextPageUrl);
    const response = await getGitHubJson(nextPageUrl);
    commits.push(...normalizeCommitPage(response.body));
    nextPageUrl = response.nextPageUrl;
    pagesFetched += 1;
  }

  return commits;
}

export function getGitHubErrorResponse(error: unknown): Response {
  if (error instanceof GitHubClientError) {
    const headers = new Headers();
    if (error.retryAfterSeconds !== undefined) {
      headers.set("Retry-After", String(error.retryAfterSeconds));
    }
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status, headers },
    );
  }

  if (error instanceof GitHubSyncError) {
    return Response.json(
      {
        error: {
          code: "GITHUB_SYNC_FAILED",
          message: "Repository synchronization could not be completed.",
        },
      },
      { status: 503 },
    );
  }

  return Response.json(
    { error: { code: "GITHUB_INTEGRATION_FAILED", message: "GitHub integration failed." } },
    { status: 500 },
  );
}

function createRepositoryUrl(): string {
  const params = new URLSearchParams({
    type: "owner",
    sort: "updated",
    direction: "desc",
    per_page: "100",
  });
  return `https://api.github.com/users/${GITHUB_USERNAME}/repos?${params.toString()}`;
}

function createCommitUrl(repositoryFullName: string): string {
  const [owner, repository, ...rest] = repositoryFullName.split("/");
  if (!owner || !repository || rest.length > 0) {
    throw new GitHubClientError(
      "GITHUB_MALFORMED_RESPONSE",
      502,
      "GitHub returned an invalid repository name.",
    );
  }
  const params = new URLSearchParams({ per_page: "30" });
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits?${params.toString()}`;
}

function normalizeRepositoryPage(value: unknown): GitHubRepository[] {
  if (!Array.isArray(value) || !value.every(isGitHubApiRepository)) {
    throw new GitHubClientError(
      "GITHUB_MALFORMED_RESPONSE",
      502,
      "GitHub returned an unexpected repository response.",
    );
  }

  return value.map((repository) => ({
    externalId: String(repository.id),
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    url: repository.html_url,
    homepage: repository.homepage || null,
    primaryLanguage: repository.language,
    topics: repository.topics,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    createdAt: parseGitHubDate(repository.created_at, "created_at"),
    updatedAt: parseGitHubDate(repository.updated_at, "updated_at"),
    pushedAt: repository.pushed_at
      ? parseGitHubDate(repository.pushed_at, "pushed_at")
      : null,
    isFork: repository.fork,
    isArchived: repository.archived,
    visibility: repository.visibility ?? null,
  }));
}

function normalizeCommitPage(value: unknown): GitHubCommit[] {
  if (!Array.isArray(value) || !value.every(isGitHubApiCommit)) {
    throw new GitHubClientError(
      "GITHUB_MALFORMED_RESPONSE",
      502,
      "GitHub returned an unexpected commit response.",
    );
  }

  return value.map((commit) => ({
    sha: commit.sha,
    url: commit.html_url,
    message: commit.commit.message,
    authorLogin: commit.author?.login ?? null,
    authorName: commit.commit.author?.name ?? null,
    committedAt: parseGitHubDate(commit.commit.author.date, "commit.author.date"),
  }));
}

function isGitHubApiRepository(value: unknown): value is GitHubApiRepository {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.full_name === "string" &&
    isNullableString(value.description) &&
    typeof value.html_url === "string" &&
    isNullableString(value.homepage) &&
    isNullableString(value.language) &&
    Array.isArray(value.topics) &&
    value.topics.every((topic) => typeof topic === "string") &&
    typeof value.stargazers_count === "number" &&
    typeof value.forks_count === "number" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string" &&
    isNullableString(value.pushed_at) &&
    typeof value.fork === "boolean" &&
    typeof value.archived === "boolean" &&
    (value.visibility === undefined || isNullableString(value.visibility))
  );
}

function isGitHubApiCommit(value: unknown): value is GitHubApiCommit {
  if (!isRecord(value) || !isRecord(value.commit)) {
    return false;
  }

  return (
    typeof value.sha === "string" &&
    typeof value.html_url === "string" &&
    typeof value.commit.message === "string" &&
    isRecord(value.commit.author) &&
    typeof value.commit.author.name === "string" &&
    typeof value.commit.author.date === "string" &&
    (value.author === null ||
      (isRecord(value.author) && typeof value.author.login === "string"))
  );
}

export function toGitHubRepositoryPersistenceData(repository: GitHubRepository) {
  return {
    externalId: repository.externalId,
    ownerLogin: GITHUB_USERNAME,
    name: repository.name,
    fullName: repository.fullName,
    description: repository.description,
    url: repository.url,
    homepage: repository.homepage,
    primaryLanguage: repository.primaryLanguage,
    topics: repository.topics,
    stars: repository.stars,
    forks: repository.forks,
    githubCreatedAt: repository.createdAt,
    githubUpdatedAt: repository.updatedAt,
    pushedAt: repository.pushedAt,
    isFork: repository.isFork,
    isArchived: repository.isArchived,
    visibility: repository.visibility,
    syncedAt: new Date(),
  };
}

function parseGitHubDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new GitHubClientError(
      "GITHUB_MALFORMED_RESPONSE",
      502,
      `GitHub returned an invalid ${field} timestamp.`,
    );
  }
  return date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}
