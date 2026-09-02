"use client";

import { useEffect, useState } from "react";
import { SystemButton } from "@/components/ui/SystemButton";

// ─────────────────────────────────────────────────────────────────────────────
// RecruiterMode — Focused experience for hiring teams
//
// Shows role fit, project highlights, technologies, and contact actions.
// Maintains the Codebase City architectural aesthetic with information density.
// ─────────────────────────────────────────────────────────────────────────────

interface RecruiterData {
  name: string;
  role: string;
  domains: string[];
  strongProjects: Array<{
    name: string;
    description: string;
    technologies: string[];
    status: string;
    category: string;
    district: string;
  }>;
  technologies: string[];
  githubActivity: {
    repositories: number;
    commits: number;
    recentActivity: Array<{
      month: string;
      count: number;
    }>;
    languages: string[];
  };
  portfolioIntelligence: {
    projectCount: number;
    technologyCount: number;
    districtCount: number;
    engineeringEventCount: number;
    repositoryCount: number;
    achievementCount: number;
    aiAnalysisCount: number;
    highConfidenceAnalysisCount: number;
    featuredProjectCount: number;
    projectCategoryCount: number;
    majorDomains: string[];
  };
  achievements: Array<{
    title: string;
    date: string;
    category: string;
  }>;
  openSource: boolean;
  aiBackendExperience: boolean;
}

interface RecruiterModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecruiterMode({ isOpen, onClose }: RecruiterModeProps) {
  const [data, setData] = useState<RecruiterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchRecruiterData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/recruiter");
        if (response.ok) {
          const recruiterData = await response.json();
          setData(recruiterData);
        } else {
          setError("Failed to load recruiter profile");
        }
      } catch (err) {
        console.error("Failed to fetch recruiter data:", err);
        setError("Failed to load recruiter profile");
      } finally {
        setLoading(false);
      }
    }

    fetchRecruiterData();
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
        className="panel-enter fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:left-4 sm:top-4 sm:bottom-4 sm:w-[480px] max-h-[90vh] sm:max-h-none bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-panel)] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="recruiter-title"
      >
        {/* Top accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 shrink-0">
          <div>
            <p className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase mb-1">
              07 RECRUITER
            </p>
            <h2
              id="recruiter-title"
              className="text-sm font-bold tracking-[0.22em] text-[var(--foreground)] uppercase"
            >
              RECRUITER MODE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close recruiter mode"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="text-center py-8">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
                Loading profile...
              </p>
            </div>
          )}

          {error && (
            <p className="font-mono text-[10px] text-[var(--status-building)] mb-4">
              {error}
            </p>
          )}

          {data && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  PROFILE
                </p>
                <h3 className="text-xl font-bold tracking-[0.08em] text-[var(--foreground)] uppercase mb-1">
                  {data.name}
                </h3>
                <p className="font-mono text-[11px] tracking-[0.12em] text-[var(--foreground-muted)] uppercase mb-3">
                  {data.role}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.domains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-block border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[9px] font-medium tracking-[0.08em] text-[var(--foreground)] uppercase"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="rule-thin" />

              {/* Strong Projects */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  STRONG PROJECTS
                </p>
                <div className="space-y-3">
                  {data.strongProjects.map((project, index) => (
                    <div
                      key={index}
                      className="border border-[var(--border)] bg-[var(--surface-muted)] p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-mono text-[10px] font-semibold tracking-[0.1em] text-[var(--foreground)] uppercase">
                          {project.name}
                        </h4>
                        <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase shrink-0">
                          {project.status}
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[var(--foreground-muted)] mb-2">
                        {project.description}
                      </p>
                      <p className="font-mono text-[8px] tracking-[0.08em] text-[var(--foreground-muted)] uppercase mb-2">
                        {project.category} · {project.district}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="inline-block border border-[var(--border-subtle)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[8px] tracking-[0.06em] text-[var(--foreground-muted)] uppercase"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="rule-thin" />

              {/* Technologies */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  TECHNOLOGIES
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-block border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[9px] tracking-[0.08em] text-[var(--foreground)] uppercase"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="rule-thin" />

              {/* GitHub Activity */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  GITHUB ACTIVITY
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-center">
                    <p className="font-mono text-[14px] font-bold text-[var(--foreground)] tabular-nums">
                      {data.githubActivity.repositories}
                    </p>
                    <p className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                      Repos
                    </p>
                  </div>
                  <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-center">
                    <p className="font-mono text-[14px] font-bold text-[var(--foreground)] tabular-nums">
                      {data.githubActivity.commits}
                    </p>
                    <p className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                      Events
                    </p>
                  </div>
                  <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-center">
                    <p className="font-mono text-[14px] font-bold text-[var(--foreground)] tabular-nums">
                      {data.githubActivity.languages.length}
                    </p>
                    <p className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                      Languages
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {data.githubActivity.languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-block font-mono text-[8px] tracking-[0.06em] text-[var(--foreground-muted)] uppercase"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-1">
                  {data.githubActivity.recentActivity.map((activity) => (
                    <p
                      key={activity.month}
                      className="font-mono text-[8px] tracking-[0.08em] text-[var(--foreground-muted)] uppercase"
                    >
                      {activity.month}: {activity.count} events
                    </p>
                  ))}
                </div>
              </div>

              <hr className="rule-thin" />

              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  PORTFOLIO INTELLIGENCE
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Projects" value={data.portfolioIntelligence.projectCount} />
                  <Metric label="Tech Stack" value={data.portfolioIntelligence.technologyCount} />
                  <Metric label="Districts" value={data.portfolioIntelligence.districtCount} />
                  <Metric label="Categories" value={data.portfolioIntelligence.projectCategoryCount} />
                  <Metric label="Repositories" value={data.portfolioIntelligence.repositoryCount} />
                  <Metric label="Events" value={data.portfolioIntelligence.engineeringEventCount} />
                  <Metric label="Achievements" value={data.portfolioIntelligence.achievementCount} />
                  <Metric label="AI Analyses" value={data.portfolioIntelligence.aiAnalysisCount} />
                </div>
                {data.portfolioIntelligence.majorDomains.length > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-[8px] tracking-[0.12em] text-[var(--foreground-muted)] uppercase mb-1">
                      Major Domains
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {data.portfolioIntelligence.majorDomains.map((domain) => (
                        <span
                          key={domain}
                          className="inline-block border border-[var(--border-subtle)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[8px] tracking-[0.06em] text-[var(--foreground-muted)] uppercase"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <hr className="rule-thin" />

              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  ACHIEVEMENTS
                </p>
                <div className="space-y-2">
                  {data.achievements.length > 0 ? (
                    data.achievements.slice(0, 4).map((achievement) => (
                      <div
                        key={`${achievement.title}-${achievement.date}`}
                        className="border border-[var(--border)] bg-[var(--surface-muted)] p-2"
                      >
                        <p className="font-mono text-[9px] tracking-[0.08em] text-[var(--foreground)] uppercase">
                          {achievement.title}
                        </p>
                        <p className="font-mono text-[8px] tracking-[0.08em] text-[var(--foreground-muted)] uppercase">
                          {new Date(achievement.date).toLocaleDateString("en-GB")} · {achievement.category}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="font-mono text-[9px] text-[var(--foreground-muted)] uppercase">
                      No achievements available
                    </p>
                  )}
                </div>
              </div>

              {/* Specializations */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase mb-3">
                  SPECIALIZATIONS
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`status-dot ${data.openSource ? 'bg-[var(--status-active)]' : 'bg-[var(--status-planned)]'}`}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] tracking-[0.08em] text-[var(--foreground)] uppercase">
                      Open Source Contributions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`status-dot ${data.aiBackendExperience ? 'bg-[var(--status-active)]' : 'bg-[var(--status-planned)]'}`}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[10px] tracking-[0.08em] text-[var(--foreground)] uppercase">
                      AI / Backend Systems
                    </span>
                  </div>
                </div>
              </div>

              <hr className="rule-thin" />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <SystemButton
                  variant="primary"
                  className="w-full"
                  onClick={() => window.open("mailto:sauravkumar7557.dev@gmail.com", "_blank")}
                  aria-label="Contact candidate"
                >
                  CONTACT
                </SystemButton>
                <SystemButton
                  className="w-full"
                  onClick={() => window.open('/resume.pdf', '_blank')}
                  aria-label="View resume"
                >
                  RESUME
                </SystemButton>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-2">
      <p className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">{label}</p>
      <p className="font-mono text-[12px] font-semibold text-[var(--foreground)] tabular-nums">{value}</p>
    </div>
  );
}
