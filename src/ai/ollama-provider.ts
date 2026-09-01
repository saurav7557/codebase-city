import "server-only";

import type {
  AIAnalysisContext,
  AIAskContext,
  AIAskResult,
  AIProvider,
  AIProviderResult,
} from "./ai-types";

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434";

const REQUEST_TIMEOUT_MS = 45_000;

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  readonly model: string;

  constructor(
    model = process.env.OLLAMA_MODEL || "llama3.2:3b",
  ) {
    this.model = model;
  }

  async analyzeRepository(
    context: AIAnalysisContext,
  ): Promise<AIProviderResult> {
    throw new Error(
      "Ollama repository analysis is not implemented yet.",
    );
  }

  async ask(
    question: string,
    context: AIAskContext,
  ): Promise<AIAskResult> {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: {
            type: "object",
            properties: {
              answer: {
                type: "string",
              },
              evidence: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              confidence: {
                type: "number",
              },
              sources: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: [
              "answer",
              "evidence",
              "confidence",
              "sources",
            ],
          },
          messages: [
            {
              role: "system",
              content:
                           "You are City AI, a helpful assistant for an engineering portfolio. " +
                           "Use ONLY the supplied portfolio context. " +
                            "Never invent projects, technologies, dates, evidence, or achievements. " +
                            "If a selected building/project is provided, answer about THAT project first. " +
                            "Prioritize the selected project's name, description, technologies, category, " +
                            "status, and district. " +
                           "For questions like 'what technologies are used here', list technologies " +
                            "from the selected project, NOT technologies from the entire portfolio. " +
                            "Use broader portfolio context only when the question explicitly asks about " +
                            "the portfolio as a whole or when comparison is useful. " +
                            "If the selected project does not contain enough information, clearly say so. " +
                            "Keep answers concise and specific. " +
                            "Confidence should reflect the evidence: 0.9-1.0 for directly supported facts, " +
                            "0.7-0.89 for strongly supported answers, 0.4-0.69 for limited evidence, " +
                            "and below 0.4 when evidence is insufficient. " +
                            "Return valid JSON matching the requested format.",
               
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                ...context,
              }),
            },
          ],
          options: {
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });

      const body = (await response.json()) as {
        message?: {
          content?: string;
        };
        error?: string;
      };

      if (!response.ok) {
        console.error("OLLAMA ASK ERROR", {
          status: response.status,
          statusText: response.statusText,
          body,
        });

        throw new Error(
          `Ollama request failed: ${response.status} ${response.statusText}`,
        );
      }

      const content = body.message?.content;

      if (!content) {
        throw new Error(
          "Ollama returned an empty response.",
        );
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error(
          "Ollama returned invalid JSON.",
        );
      }

      if (!isRecord(parsed)) {
        throw new Error(
          "Ollama returned an invalid response.",
        );
      }

      if (
        typeof parsed.answer !== "string" ||
        !Array.isArray(parsed.evidence) ||
        typeof parsed.confidence !== "number" ||
        !Array.isArray(parsed.sources)
      ) {
        throw new Error(
          "Ollama response does not match the expected format.",
        );
      }

      return {
        answer: parsed.answer,
        evidence: parsed.evidence.filter(
          (item): item is string =>
            typeof item === "string",
        ),
        confidence: Math.max(
          0,
          Math.min(1, parsed.confidence),
        ),
        sources: parsed.sources.filter(
          (item): item is string =>
            typeof item === "string",
        ),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}