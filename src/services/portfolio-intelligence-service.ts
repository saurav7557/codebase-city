import "server-only";

import { createHash } from "node:crypto";

import { getAIProvider } from "@/ai/ai-provider-service";
import { validateAIAnalysisResult } from "@/ai/ai-validation";
import type { AIAnalysisContext, AIAnalysisResult } from "@/ai/ai-types";
import { prisma } from "@/lib/prisma";

const ANALYSIS_SOURCE_TYPE = "github_repository";
const MAX_CONTEXT_EVENTS = 20;

export class PortfolioIntelligenceNotFoundError extends Error {
  constructor() {
    super("GitHub repository was not found.");
    this.name = "PortfolioIntelligenceNotFoundError";
  }
}

export type RepositoryAnalysisResult = {
  created: boolean;
  analysis: AIAnalysisResult;
  provider: string;
  model: string;
  generatedAt: Date;
};

/**
 * Produces and audits AI interpretations of a persisted GitHub repository. This
 * service never writes Project, Technology, District, or CityBuilding records.
 */
export async function analyzeGitHubRepository(
  repositoryExternalId: string,
): Promise<RepositoryAnalysisResult> {
  const context = await createRepositoryAnalysisContext(repositoryExternalId);
  const provider = getAIProvider();
  const fingerprint = createContextFingerprint(context);
  const existing = await prisma.aiAnalysis.findFirst({
    where: {
      sourceType: ANALYSIS_SOURCE_TYPE,
      sourceId: repositoryExternalId,
      fingerprint,
      provider: provider.name,
      model: provider.model,
    },
    select: { result: true, generatedAt: true, provider: true, model: true },
  });

  if (existing) {
    return {
      created: false,
      analysis: validateAIAnalysisResult(
        existing.result,
        context.evidenceFacts,
        context.knownTechnologies,
      ),
      provider: existing.provider,
      model: existing.model,
      generatedAt: existing.generatedAt,
    };
  }

  console.info("AI analysis started", {
    sourceType: ANALYSIS_SOURCE_TYPE,
    sourceId: repositoryExternalId,
    provider: provider.name,
  });
  const providerResult = await provider.analyzeRepository(context);
  const record = await prisma.aiAnalysis.create({
    data: {
      sourceType: ANALYSIS_SOURCE_TYPE,
      sourceId: repositoryExternalId,
      fingerprint,
      provider: provider.name,
      model: providerResult.model,
      result: providerResult.analysis,
      confidence: providerResult.analysis.confidence,
      evidence: providerResult.analysis.evidence,
    },
    select: { generatedAt: true },
  });
  console.info("AI analysis completed", {
    sourceType: ANALYSIS_SOURCE_TYPE,
    sourceId: repositoryExternalId,
    provider: provider.name,
  });

  return {
    created: true,
    analysis: providerResult.analysis,
    provider: provider.name,
    model: providerResult.model,
    generatedAt: record.generatedAt,
  };
}

/**
 * Finds the manually curated project that already declares the GitHub URL.
 * Consumers may use the mapping for review, but no manual project data is changed.
 */
export async function getExistingProjectForGitHubRepository(repositoryUrl: string) {
  return prisma.project.findFirst({
    where: { githubUrl: repositoryUrl },
    select: { id: true, name: true, slug: true, districtId: true },
  });
}

async function createRepositoryAnalysisContext(
  repositoryExternalId: string,
): Promise<AIAnalysisContext> {
  const [repository, technologies] = await prisma.$transaction([
    prisma.gitHubRepository.findUnique({
      where: { externalId: repositoryExternalId },
      select: {
        externalId: true,
        fullName: true,
        description: true,
        url: true,
        primaryLanguage: true,
        topics: true,
        isArchived: true,
      },
    }),
    prisma.technology.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!repository) {
    throw new PortfolioIntelligenceNotFoundError();
  }

  const events = await prisma.engineeringEvent.findMany({
    where: {
      source: "github",
      sourceId: { startsWith: `repository:${repository.externalId}:` },
    },
    select: { type: true, title: true, description: true, occurredAt: true },
    orderBy: { occurredAt: "desc" },
    take: MAX_CONTEXT_EVENTS,
  });
  const evidenceFacts = uniqueStrings([
    `repository:${repository.fullName}`,
    `url:${repository.url}`,
    ...(repository.description ? [`description:${repository.description}`] : []),
    ...(repository.primaryLanguage ? [`language:${repository.primaryLanguage}`] : []),
    ...repository.topics.map((topic) => `topic:${topic}`),
    ...(repository.isArchived ? ["archived:true"] : []),
    ...events.flatMap((event) => [
      `event:${event.type}`,
      `event-title:${event.title}`,
      `event-description:${truncateEvidence(event.description)}`,
    ]),
  ]);
  const knownTechnologies = uniqueStrings([
    ...technologies.map(({ name }) => name),
    ...(repository.primaryLanguage ? [repository.primaryLanguage] : []),
    ...repository.topics,
  ]);

  return {
    repository,
    recentEvents: events.map((event) => ({
      type: event.type,
      title: event.title,
      description: truncateEvidence(event.description),
      occurredAt: event.occurredAt.toISOString(),
    })),
    evidenceFacts,
    knownTechnologies,
  };
}

function createContextFingerprint(context: AIAnalysisContext): string {
  return createHash("sha256").update(JSON.stringify(context)).digest("hex");
}

function truncateEvidence(value: string): string {
  return value.length <= 260 ? value : `${value.slice(0, 257)}...`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
