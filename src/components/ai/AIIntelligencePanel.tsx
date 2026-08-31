"use client";

import { useEffect, useState } from "react";
import { SystemButton } from "@/components/ui/SystemButton";

// ─────────────────────────────────────────────────────────────────────────────
// AIIntelligencePanel — Right-side panel for AI / City Intelligence
//
// Shows portfolio analysis metrics and AI observations from the backend.
// Connects to existing AI API routes for status and analysis.
// ─────────────────────────────────────────────────────────────────────────────

interface PortfolioMetrics {
  projects: number;
  repositories: number;
  technologies: number;
  districts: number;
  engineeringEvents: number;
  aiAnalyses: number;
}

interface AIAnalysis {
  id: string;
  sourceType: string;
  sourceId: string;
  provider: string;
  model: string;
  confidence: number;
  result: unknown;
  evidence: unknown;
  generatedAt: string;
}

type AnalysisStatus = "ready" | "analyzing" | "complete" | "unavailable" | "error";

interface AIProviderStatus {
  configured: boolean;
  provider?: string;
  model?: string;
}

interface AIIntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAskAI?: () => void;
}

export function AIIntelligencePanel({ isOpen, onClose, onOpenAskAI }: AIIntelligencePanelProps) {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("ready");
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetchMetrics();
    fetchAnalyses();
    fetchProviderStatus();
  }, [isOpen]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/city");
      if (!response.ok) throw new Error("Failed to fetch metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
      setError("Failed to load portfolio metrics");
    }
  };

  const fetchAnalyses = async () => {
    try {
      const response = await fetch("/api/ai/analyses");
      if (!response.ok) {
        if (response.status === 404) {
          setAnalyses([]);
          return;
        }
        throw new Error("Failed to fetch analyses");
      }
      const data = await response.json();
      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error("Failed to fetch analyses:", err);
      setAnalyses([]);
    }
  };

  const fetchProviderStatus = async () => {
    try {
      const response = await fetch("/api/ai/status");
      if (!response.ok) throw new Error("Failed to fetch provider status");
      const data = await response.json();
      setProviderStatus(data);
      setAnalysisStatus(data.configured ? "ready" : "unavailable");
    } catch (err) {
      console.error("Failed to fetch provider status:", err);
      setAnalysisStatus("error");
    }
  };

  const handleRunAnalysis = async () => {
    if (!providerStatus?.configured) {
      setError("AI provider is not configured");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus("analyzing");
    setError(null);

    try {
      // Trigger analysis for all repositories
      const reposResponse = await fetch("/api/github/repositories");
      if (!reposResponse.ok) throw new Error("Failed to fetch repositories");
      const reposData = await reposResponse.json();

      if (reposData.repositories && reposData.repositories.length > 0) {
        const repo = reposData.repositories[0];
        const analyzeResponse = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repositoryId: repo.externalId }),
        });

        if (!analyzeResponse.ok) {
          const errorData = await analyzeResponse.json();
          throw new Error(errorData.error?.message || "Analysis failed");
        }

        setAnalysisStatus("complete");
        await fetchAnalyses();
      } else {
        setError("No repositories available for analysis");
        setAnalysisStatus("unavailable");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setAnalysisStatus("error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/10 sm:hidden panel-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="panel-enter fixed inset-y-0 right-0 z-40 w-full sm:w-[380px] bg-[var(--surface)] border-l border-[var(--border)] shadow-[var(--shadow-log)]"
        role="dialog"
        aria-labelledby="ai-panel-title"
      >
        {/* Top accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase mb-1">
              06 AI
            </p>
            <h2
              id="ai-panel-title"
              className="text-sm font-bold tracking-[0.22em] text-[var(--foreground)] uppercase"
            >
              AI / CITY INTELLIGENCE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close AI panel"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Portfolio Analysis Section */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
              PORTFOLIO ANALYSIS
            </p>

            {metrics ? (
              <div className="grid grid-cols-2 gap-3">
                <MetricItem label="PROJECTS" value={metrics.projects} />
                <MetricItem label="REPOSITORIES" value={metrics.repositories} />
                <MetricItem label="TECHNOLOGIES" value={metrics.technologies} />
                <MetricItem label="DISTRICTS" value={metrics.districts} />
                <MetricItem label="EVENTS" value={metrics.engineeringEvents} />
                <MetricItem label="AI ANALYSES" value={metrics.aiAnalyses} />
              </div>
            ) : (
              <p className="font-mono text-[10px] text-[var(--border-strong)]">--</p>
            )}
          </div>

          {/* Engineering Profile Section */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
              ENGINEERING PROFILE
            </p>
            <p className="font-mono text-[10px] text-[var(--foreground-muted)] leading-relaxed">
              Data-driven portfolio intelligence powered by AI analysis of GitHub
              repositories and engineering activity.
            </p>
          </div>

          {/* AI Observations Section */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
              AI OBSERVATIONS
            </p>

            {analyses.length > 0 ? (
              <div className="space-y-3">
                {analyses.slice(0, 3).map((analysis) => (
                  <div
                    key={analysis.id}
                    className="border border-[var(--border)] bg-[var(--surface-muted)] p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-mono text-[9px] tracking-[0.12em] text-[var(--foreground)] uppercase">
                        {analysis.sourceType}
                      </p>
                      <p className="font-mono text-[9px] text-[var(--foreground-muted)]">
                        {Math.round(analysis.confidence * 100)}%
                      </p>
                    </div>
                    <p className="font-mono text-[8px] text-[var(--foreground-muted)]">
                      {analysis.provider} · {analysis.model}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[10px] text-[var(--border-strong)]">
                -- No analyses available
              </p>
            )}
          </div>

          {/* Analysis Status & Control */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase">
                ANALYSIS STATUS
              </p>
              <StatusBadge status={analysisStatus} />
            </div>

            {error && (
              <p className="font-mono text-[9px] text-[var(--status-building)] mb-3">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <SystemButton
                variant="primary"
                className="w-full"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || analysisStatus === "unavailable"}
                aria-label="Run AI analysis"
              >
                {isAnalyzing ? "ANALYZING..." : "RUN ANALYSIS"}
              </SystemButton>
              {onOpenAskAI && (
                <SystemButton
                  className="w-full"
                  onClick={onOpenAskAI}
                  aria-label="Ask the City AI a question"
                >
                  ASK THE CITY
                </SystemButton>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

interface MetricItemProps {
  label: string;
  value: number;
}

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-2">
      <p className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase mb-1">
        {label}
      </p>
      <p className="font-mono text-[14px] font-semibold text-[var(--foreground)] tabular-nums">
        {value}
      </p>
    </div>
  );
}

interface StatusBadgeProps {
  status: AnalysisStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<AnalysisStatus, string> = {
    ready: "text-[var(--status-active)]",
    analyzing: "text-[var(--status-building)]",
    complete: "text-[var(--status-active)]",
    unavailable: "text-[var(--status-planned)]",
    error: "text-[var(--status-building)]",
  };

  return (
    <span className={`font-mono text-[9px] tracking-[0.14em] uppercase font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
}
