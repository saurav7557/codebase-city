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

export type AIAskContext = {
  projects: Array<{
    name: string;
    description: string;
    category: string;
    district: string;
    technologies: string[];
    status: string;
  }>;
  technologies: string[];
  districts: Array<{ name: string; type: string }>;
  aiInsights: Array<{
    confidence: number;
    result: unknown;
  }>;
};

export type AIAskResult = {
  answer: string;
  evidence: string[];
  confidence: number;
  sources: string[];
};

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  analyzeRepository(context: AIAnalysisContext): Promise<AIProviderResult>;
  ask?(question: string, context: AIAskContext): Promise<AIAskResult>;
}

export type AIProviderStatus = {
  configured: boolean;
  provider: string | null;
  model: string | null;
};
