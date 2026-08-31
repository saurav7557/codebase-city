import type { AIAnalysisResult } from "./ai-types";

const ANALYSIS_KEYS = new Set([
  "projectName",
  "districtType",
  "technologyNames",
  "buildingType",
  "importance",
  "confidence",
  "summary",
  "evidence",
]);

export class AIValidationError extends Error {
  constructor(message = "AI returned an invalid analysis.") {
    super(message);
    this.name = "AIValidationError";
  }
}

/**
 * Runtime validation is deliberately independent of an AI provider. It rejects
 * malformed structures, invented technologies, and evidence not supplied in the
 * bounded source context.
 */
export function validateAIAnalysisResult(
  value: unknown,
  evidenceFacts: string[],
  knownTechnologies: string[],
): AIAnalysisResult {
  if (!isRecord(value) || Object.keys(value).length !== ANALYSIS_KEYS.size) {
    throw new AIValidationError();
  }

  for (const key of Object.keys(value)) {
    if (!ANALYSIS_KEYS.has(key)) {
      throw new AIValidationError();
    }
  }

  if (
    !isNullableShortString(value.projectName) ||
    !isNullableShortString(value.districtType) ||
    !isStringArray(value.technologyNames) ||
    !isNullableShortString(value.buildingType) ||
    !isUnitInterval(value.importance) ||
    !isUnitInterval(value.confidence) ||
    !isBoundedString(value.summary, 1, 1_000) ||
    !isStringArray(value.evidence)
  ) {
    throw new AIValidationError();
  }

  const allowedTechnologyByLowercase = new Map(
    knownTechnologies.map((technology) => [technology.toLocaleLowerCase(), technology]),
  );
  const technologyNames = value.technologyNames.map((technology) => {
    const knownTechnology = allowedTechnologyByLowercase.get(technology.toLocaleLowerCase());
    if (!knownTechnology) {
      throw new AIValidationError("AI analysis included a technology not present in the source data.");
    }
    return knownTechnology;
  });

  const allowedEvidence = new Set(evidenceFacts);
  if (value.evidence.some((evidence) => !allowedEvidence.has(evidence))) {
    throw new AIValidationError("AI analysis included evidence not present in the source data.");
  }

  return {
    projectName: value.projectName,
    districtType: value.districtType,
    technologyNames: [...new Set(technologyNames)],
    buildingType: value.buildingType,
    importance: value.importance,
    confidence: value.confidence,
    summary: value.summary.trim(),
    evidence: [...new Set(value.evidence)],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableShortString(value: unknown): value is string | null {
  return value === null || isBoundedString(value, 1, 200);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => isBoundedString(item, 1, 300));
}

function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value.trim().length >= minimum && value.length <= maximum;
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}
