import "server-only";

import { OllamaProvider } from "./ollama-provider";
import { OpenAIProvider } from "./openai-provider";
import type {
  AIProvider,
  AIProviderStatus,
} from "./ai-types";

export class AIProviderConfigurationError extends Error {
  constructor() {
    super("No AI provider is configured.");
    this.name = "AIProviderConfigurationError";
  }
}

export function getAIProviderStatus(): AIProviderStatus {
  const providerName =
    process.env.AI_PROVIDER?.trim().toLowerCase();

  const hasOpenAIKey =
    Boolean(process.env.OPENAI_API_KEY?.trim());

  const ollamaSelected =
    providerName === "ollama";

  const openAISelected =
    providerName === "openai" ||
    (!providerName && hasOpenAIKey);

  if (ollamaSelected) {
    return {
      configured: true,
      provider: "ollama",
      model:
        process.env.OLLAMA_MODEL ||
        "llama3.2:3b",
    };
  }

  if (openAISelected && hasOpenAIKey) {
    return {
      configured: true,
      provider: "openai",
      model:
        process.env.OPENAI_MODEL ||
        "gpt-4.1-mini",
    };
  }

  return {
    configured: false,
    provider: null,
    model: null,
  };
}

export function getAIProvider(): AIProvider {
  const status = getAIProviderStatus();

  if (!status.configured) {
    throw new AIProviderConfigurationError();
  }

  if (status.provider === "ollama") {
    return new OllamaProvider(
      status.model || "llama3.2:3b",
    );
  }

  if (status.provider === "openai") {
    return new OpenAIProvider(
      process.env.OPENAI_API_KEY!,
      status.model || "gpt-4.1-mini",
    );
  }

  throw new AIProviderConfigurationError();
}