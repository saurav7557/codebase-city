export type AIAnalysisResult = {
  projectName: string | null;
  districtType: string | null;
  technologyNames: string[];
  buildingType: string | null;
  importance: number;
  confidence: number;
  summary: string;
  evidence: string[];
};

export type AIAnalysisContext = {
  repository: {
    externalId: string;
    fullName: string;
    description: string | null;
    url: string;
    primaryLanguage: string | null;
    topics: string[];
    isArchived: boolean;
  };
  recentEvents: Array<{
    type: string;
    title: string;
    description: string;
    occurredAt: string;
  }>;
  evidenceFacts: string[];
  knownTechnologies: string[];
};

export type AIProviderResult = {
  model: string;
  analysis: AIAnalysisResult;
};

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  analyzeRepository(context: AIAnalysisContext): Promise<AIProviderResult>;
}

export type AIProviderStatus = {
  configured: boolean;
  provider: string | null;
  model: string | null;
};
