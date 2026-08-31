import "server-only";

import { prisma } from "@/lib/prisma";

import { GitHubClientError } from "./github-client";
import {
  getPublicGitHubRepositories,
  getRecentPublicGitHubCommits,
  toGitHubRepositoryPersistenceData,
} from "./github-service";
import type {
  GitHubCommit,
  GitHubEngineeringEventSyncSummary,
  GitHubRepository,
} from "./github-types";

const EVENT_SOURCE = "github";
const COMMIT_PAGES_PER_REPOSITORY = 1;

type RepositorySnapshot = {
  externalId: string;
  githubUpdatedAt: Date;
  pushedAt: Date | null;
  isArchived: boolean;
};

type NewEngineeringEvent = {
  type: "repository_created" | "repository_updated" | "repository_archived" | "commit";
  sourceId: string;
  title: string;
  description: string;
  metadata: object;
  occurredAt: Date;
};

/**
 * Synchronizes GitHub repository lifecycle and bounded commit activity into the
 * append-only EngineeringEvent stream. Event identities are unique in the database,
 * so a retry or concurrent request cannot create duplicates.
 */
export async function syncGitHubEngineeringEvents(): Promise<GitHubEngineeringEventSyncSummary> {
  const repositories = await getPublicGitHubRepositories();
  const existingRepositories = await prisma.gitHubRepository.findMany({
    where: { externalId: { in: repositories.map(({ externalId }) => externalId) } },
    select: {
      externalId: true,
      githubUpdatedAt: true,
      pushedAt: true,
      isArchived: true,
    },
  });
  const snapshots = new Map(
    existingRepositories.map((repository) => [repository.externalId, repository]),
  );
  const lifecycleEvents = repositories.flatMap((repository) =>
    createRepositoryLifecycleEvents(repository, snapshots.get(repository.externalId)),
  );

  const lifecycleResult = await prisma.$transaction(async (transaction) => {
    await Promise.all(
      repositories.map((repository) =>
        transaction.gitHubRepository.upsert({
          where: { externalId: repository.externalId },
          update: toGitHubRepositoryPersistenceData(repository),
          create: toGitHubRepositoryPersistenceData(repository),
        }),
      ),
    );

    return persistEngineeringEvents(transaction, lifecycleEvents);
  });

  const existingCommitSourceIds = await getGitHubCommitSourceIds();
  const commitRepositories = repositories.filter((repository) => {
    const snapshot = snapshots.get(repository.externalId);
    return (
      !snapshot ||
      !areDatesEqual(snapshot.pushedAt, repository.pushedAt) ||
      !hasCommitEventForRepository(existingCommitSourceIds, repository.externalId)
    );
  });

  let commitsFetched = 0;
  let commitCreated = 0;
  let commitSkipped = 0;
  for (const repository of commitRepositories) {
    const commits = await getCommitsOrEmpty(repository);
    commitsFetched += commits.length;
    const result = await persistEngineeringEvents(
      prisma,
      commits.map((commit) => createCommitEvent(repository, commit)),
    );
    commitCreated += result.created;
    commitSkipped += result.skipped;
  }

  const repositoriesCreated = repositories.filter(
    ({ externalId }) => !snapshots.has(externalId),
  ).length;
  const summary = {
    repositoriesFetched: repositories.length,
    repositoriesCreated,
    repositoriesUpdated: repositories.length - repositoriesCreated,
    commitsFetched,
    eventsCreated: lifecycleResult.created + commitCreated,
    eventsSkipped: lifecycleResult.skipped + commitSkipped,
  };
  console.info("GitHub engineering-event sync completed", summary);
  return summary;
}

function createRepositoryLifecycleEvents(
  repository: GitHubRepository,
  previous: RepositorySnapshot | undefined,
): NewEngineeringEvent[] {
  const metadata = createRepositoryMetadata(repository);

  if (!previous) {
    return [
      {
        type: "repository_created",
        sourceId: `repository:${repository.externalId}:created`,
        title: `Repository created: ${repository.fullName}`,
        description: repository.description ?? `GitHub repository ${repository.fullName} was created.`,
        metadata,
        occurredAt: repository.createdAt,
      },
    ];
  }

  if (!previous.isArchived && repository.isArchived) {
    return [
      {
        type: "repository_archived",
        sourceId: `repository:${repository.externalId}:archived:${repository.updatedAt.toISOString()}`,
        title: `Repository archived: ${repository.fullName}`,
        description: repository.description ?? `GitHub repository ${repository.fullName} was archived.`,
        metadata,
        occurredAt: repository.updatedAt,
      },
    ];
  }

  if (repository.updatedAt > previous.githubUpdatedAt) {
    return [
      {
        type: "repository_updated",
        sourceId: `repository:${repository.externalId}:updated:${repository.updatedAt.toISOString()}`,
        title: `Repository updated: ${repository.fullName}`,
        description: repository.description ?? `GitHub repository ${repository.fullName} was updated.`,
        metadata,
        occurredAt: repository.updatedAt,
      },
    ];
  }

  return [];
}

function createCommitEvent(repository: GitHubRepository, commit: GitHubCommit): NewEngineeringEvent {
  const firstLine = commit.message.split("\n", 1)[0]?.trim() || "GitHub commit";
  return {
    type: "commit",
    sourceId: createCommitSourceId(repository.externalId, commit.sha),
    title: `Commit in ${repository.fullName}: ${firstLine}`,
    description: commit.message,
    metadata: {
      repository: repository.fullName,
      repositoryId: repository.externalId,
      commitSha: commit.sha,
      commitUrl: commit.url,
      authorLogin: commit.authorLogin,
      authorName: commit.authorName,
    },
    occurredAt: commit.committedAt,
  };
}

function createRepositoryMetadata(repository: GitHubRepository) {
  return {
    repository: repository.fullName,
    repositoryId: repository.externalId,
    repositoryUrl: repository.url,
    archived: repository.isArchived,
    pushedAt: repository.pushedAt?.toISOString() ?? null,
  };
}

async function persistEngineeringEvents(
  client: Pick<typeof prisma, "engineeringEvent">,
  events: NewEngineeringEvent[],
): Promise<{ created: number; skipped: number }> {
  if (events.length === 0) {
    return { created: 0, skipped: 0 };
  }

  const result = await client.engineeringEvent.createMany({
    data: events.map((event) => ({ ...event, source: EVENT_SOURCE })),
    skipDuplicates: true,
  });
  return { created: result.count, skipped: events.length - result.count };
}

async function getGitHubCommitSourceIds(): Promise<Set<string>> {
  const events = await prisma.engineeringEvent.findMany({
    where: { source: EVENT_SOURCE, type: "commit" },
    select: { sourceId: true },
  });
  return new Set(events.flatMap(({ sourceId }) => (sourceId ? [sourceId] : [])));
}

function hasCommitEventForRepository(sourceIds: Set<string>, repositoryId: string): boolean {
  const prefix = `repository:${repositoryId}:commit:`;
  return [...sourceIds].some((sourceId) => sourceId.startsWith(prefix));
}

async function getCommitsOrEmpty(repository: GitHubRepository): Promise<GitHubCommit[]> {
  try {
    return await getRecentPublicGitHubCommits(repository.fullName, COMMIT_PAGES_PER_REPOSITORY);
  } catch (error: unknown) {
    if (error instanceof GitHubClientError && error.code === "GITHUB_REPOSITORY_EMPTY") {
      return [];
    }
    throw error;
  }
}

function createCommitSourceId(repositoryId: string, sha: string): string {
  return `repository:${repositoryId}:commit:${sha}`;
}

function areDatesEqual(left: Date | null, right: Date | null): boolean {
  return left?.getTime() === right?.getTime();
}
