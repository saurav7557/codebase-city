"use client";

import { useEffect, useState } from "react";
import { SystemButton } from "@/components/ui/SystemButton";

// ─────────────────────────────────────────────────────────────────────────────
// EngineeringJourney — Timeline of engineering growth
//
// Represents career progression as city construction phases.
// Uses actual project and achievement data where available.
// ─────────────────────────────────────────────────────────────────────────────

interface JourneyPhase {
  id: string;
  title: string;
  period: string;
  description: string;
  projects: string[];
  technologies: string[];
  status: "completed" | "current" | "future";
}

interface EngineeringJourneyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EngineeringJourney({ isOpen, onClose }: EngineeringJourneyProps) {
  const [phases, setPhases] = useState<JourneyPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchJourneyData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/journey");
        if (response.ok) {
          const data = await response.json();
          setPhases(data.phases || []);
        } else {
          // Use fallback data if API not available
          setPhases(getFallbackPhases());
        }
      } catch (err) {
        console.error("Failed to fetch journey data:", err);
        setPhases(getFallbackPhases());
      } finally {
        setLoading(false);
      }
    }

    fetchJourneyData();
  }, [isOpen]);

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
        className="panel-enter fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:left-4 sm:top-4 sm:bottom-4 sm:w-[500px] max-h-[90vh] sm:max-h-none bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-panel)] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="journey-title"
      >
        {/* Top accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 shrink-0">
          <div>
            <p className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase mb-1">
              05 JOURNEY
            </p>
            <h2
              id="journey-title"
              className="text-sm font-bold tracking-[0.22em] text-[var(--foreground)] uppercase"
            >
              ENGINEERING JOURNEY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close engineering journey"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="text-center py-8">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
                Loading journey...
              </p>
            </div>
          )}

          {error && (
            <p className="font-mono text-[10px] text-[var(--status-building)] mb-4">
              {error}
            </p>
          )}

          {!loading && phases.length > 0 && (
            <div className="space-y-6">
              {/* Timeline visualization */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border)]" aria-hidden="true" />

                {phases.map((phase, index) => (
                  <div key={phase.id} className="relative pl-10 pb-8 last:pb-0">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-[11px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                        phase.status === "current"
                          ? "bg-[var(--status-active)] border-[var(--status-active)]"
                          : phase.status === "completed"
                          ? "bg-[var(--surface)] border-[var(--border-strong)]"
                          : "bg-[var(--surface)] border-[var(--border-subtle)]"
                      }`}
                      aria-hidden="true"
                    />

                    {/* Phase content */}
                    <div
                      className={`border p-4 ${
                        phase.status === "current"
                          ? "border-[var(--status-active)] bg-[var(--surface-muted)]"
                          : "border-[var(--border)] bg-[var(--surface)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-mono text-[11px] font-bold tracking-[0.14em] text-[var(--foreground)] uppercase">
                            {phase.title}
                          </h3>
                          <p className="font-mono text-[9px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                            {phase.period}
                          </p>
                        </div>
                        {phase.status === "current" && (
                          <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--status-active)] uppercase font-semibold shrink-0">
                            CURRENT
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] leading-relaxed text-[var(--foreground-muted)] mb-3">
                        {phase.description}
                      </p>

                      {phase.projects.length > 0 && (
                        <div className="mb-3">
                          <p className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase mb-1">
                            Projects
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {phase.projects.map((project) => (
                              <span
                                key={project}
                                className="inline-block border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[8px] tracking-[0.06em] text-[var(--foreground)] uppercase"
                              >
                                {project}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase.technologies.length > 0 && (
                        <div>
                          <p className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase mb-1">
                            Technologies
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {phase.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="inline-block border border-[var(--border-subtle)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[8px] tracking-[0.06em] text-[var(--foreground-muted)] uppercase"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="rule-thin" />

              {/* Summary */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  JOURNEY SUMMARY
                </p>
                <p className="text-[10px] leading-relaxed text-[var(--foreground-muted)]">
                  The engineering journey represents growth through key phases, from foundational
                  skills to specialized domains. Each phase builds upon previous experience, with
                  projects and technologies reflecting the evolution of expertise.
                </p>
              </div>

              <hr className="rule-thin" />

              {/* Actions */}
              <div>
                <SystemButton
                  className="w-full"
                  onClick={onClose}
                  aria-label="Return to city view"
                >
                  BACK TO CITY
                </SystemButton>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function getFallbackPhases(): JourneyPhase[] {
  return [
    {
      id: "foundation",
      title: "Foundation",
      period: "2022",
      description:
        "Started the engineering journey through a B.Tech in Information Technology, building strong foundations in programming, data structures, databases, and software engineering.",
      projects: ["B.Tech in Information Technology"],
      technologies: [
        "Java",
        "C",
        "Python",
        "SQL",
        "DSA",
        "OOP",
        "DBMS",
      ],
      status: "completed",
    },
    {
      id: "ai-ip-protection",
      title: "AI & Intelligent Systems",
      period: "February 2025",
      description:
        "Built an AI-based intellectual property protection system for detecting unauthorized use of video content and supporting automated copyright workflows.",
      projects: ["AI-Based Intellectual Property Protection System"],
      technologies: [
        "React",
        "Node.js",
        "Express.js",
        "OpenCV",
        "YOLOv5",
        "YouTube Data API",
      ],
      status: "completed",
    },
    {
      id: "blockchain",
      title: "Blockchain Systems",
      period: "April 2025",
      description:
        "Built a blockchain certificate platform combining a web application, smart contracts, decentralized storage, and on-chain verification.",
      projects: ["Blockchain Certificate Generation & Validation Platform"],
      technologies: [
        "React",
        "Node.js",
        "Solidity",
        "IPFS",
        "Hardhat",
        "Ethereum Sepolia",
      ],
      status: "completed",
    },
    {
      id: "gdg",
      title: "Engineering Recognition",
      period: "2025",
      description:
        "Reached the Top 105 global finalists in the GDG Solution Challenge, competing among more than 64,000 participants.",
      projects: ["GDG Solution Challenge 2025"],
      technologies: ["Google Technologies", "Full-Stack Development"],
      status: "completed",
    },
    {
      id: "meshpay",
      title: "Distributed Systems",
      period: "June 2026",
      description:
        "Built MeshPay, an offline payment settlement network focused on secure peer-to-peer payment propagation, cryptography, idempotency, and distributed routing.",
      projects: ["MeshPay — Offline Payment Settlement Network"],
      technologies: [
        "Java",
        "Spring Boot",
        "PostgreSQL",
        "Docker",
        "JPA",
        "REST APIs",
        "Cryptography",
      ],
      status: "completed",
    },
    {
      id: "open-source",
      title: "Open Source",
      period: "July 2026",
      description:
        "Started contributing to open-source software through GitHub issues, pull requests, documentation improvements, and code contributions.",
      projects: ["Open Source Contributions"],
      technologies: ["Git", "GitHub", "Pull Requests", "Code Review"],
      status: "completed",
    },
    {
      id: "codevita",
      title: "Competitive Engineering",
      period: "2026",
      description:
        "Achieved a global rank of 15,145 in TCS CodeVita Season 13, placing in the top 10% among 146,922 participants.",
      projects: ["TCS CodeVita Season 13"],
      technologies: ["Problem Solving", "Algorithms", "Data Structures"],
      status: "current",
    },
  ];
}