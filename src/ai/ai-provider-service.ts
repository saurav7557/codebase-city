import "server-only";

import { OpenAIProvider } from "./openai-provider";
import type { AIProvider, AIProviderStatus } from "./ai-types";

export class AIProviderConfigurationError extends Error {
  constructor() {
    super("No AI provider is configured.");
    this.name = "AIProviderConfigurationError";
  }
}

export function getAIProviderStatus(): AIProviderStatus {
  const providerName = process.env.AI_PROVIDER?.trim().toLocaleLowerCase();
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const openAISelected = providerName === "openai" || (!providerName && hasOpenAIKey);

  if (openAISelected && hasOpenAIKey) {
    return { configured: true, provider: "openai", model: process.env.OPENAI_MODEL || "gpt-4.1-mini" };
  }
  return { configured: false, provider: null, model: null };
}

export function getAIProvider(): AIProvider {
  const status = getAIProviderStatus();
  if (!status.configured || status.provider !== "openai") {
    throw new AIProviderConfigurationError();
  }
  return new OpenAIProvider(process.env.OPENAI_API_KEY!, status.model!);
}
