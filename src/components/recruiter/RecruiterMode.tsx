"use client";

import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// RecruiterMode — Portfolio AI Assistant & Recruiter Command Center
//
// Designed to match the architectural technology campus aesthetic:
// - Candidate profile header with live status, resume download, and GitHub link
// - Interactive AI chat assistant with prompt chips and verified portfolio facts
// - Tabs for Chat, Profile, Skills, and Projects
// - Detailed portfolio intelligence metrics, achievements, recent GitHub activity,
//   and categorized skill matrices
// - Telemetry Quick Insights and Top Technologies badges
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
    category?: string;
    district?: string;
  }>;
  technologies: string[];
  githubActivity: {
    repositories: number;
    commits: number;
    recentActivity?: Array<{
      month: string;
      count: number;
    }>;
    languages: string[];
  };
  portfolioIntelligence?: {
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
  achievements?: Array<{
    title: string;
    date: string;
    category: string;
  }>;
  openSource: boolean;
  aiBackendExperience: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: string[];
  sources?: string[];
  isAiGenerated?: boolean;
  provider?: string | null;
  timestamp: string;
}

interface RecruiterModeProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Tell me about Saurav.",
  "What are his key projects?",
  "What technologies does he use?",
  "What is MeshPay?",
  "What are his recent achievements?",
  "Why should we consider him for an SDE role?",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "Hi! I'm Codebase City Assistant. Ask me anything about Saurav's experience, projects, skills, or background.",
    timestamp: "NOW",
    isAiGenerated: false,
  },
];

export function RecruiterMode({ isOpen, onClose }: RecruiterModeProps) {
  const [data, setData] = useState<RecruiterData | null>(null);
  const [hasResumePdf, setHasResumePdf] = useState(false);
  const [resumeTooltip, setResumeTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "profile" | "skills" | "projects">("chat");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCounterRef = useRef<number>(10);

  // Check if real resume PDF exists in public directory
  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    fetch("/resume.pdf", { method: "HEAD" })
      .then((res) => {
        if (isSubscribed && res.ok) {
          setHasResumePdf(true);
        }
      })
      .catch(() => {
        if (isSubscribed) setHasResumePdf(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  // Fetch verified recruiter metrics from API
  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    async function fetchRecruiterData() {
      try {
        const response = await fetch("/api/recruiter");
        if (!isSubscribed) return;

        if (response.ok) {
          const recruiterData = await response.json();
          if (isSubscribed) {
            setData(recruiterData);
          }
        } else {
          if (isSubscribed) {
            setData(getFallbackData());
          }
        }
      } catch (err) {
        if (isSubscribed) {
          console.error("Failed to fetch recruiter data:", err);
          setData(getFallbackData());
        }
      }
    }

    fetchRecruiterData();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAsking, activeTab]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText ?? inputQuery).trim();
    if (!textToSend || isAsking) return;

    msgCounterRef.current += 1;
    const currentCount = msgCounterRef.current;
    const userMsgId = `user-${currentCount}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp: "NOW",
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!queryText) setInputQuery("");
    setChatError(null);
    setIsAsking(true);

    try {
      const res = await fetch("/api/recruiter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${currentCount}`,
        role: "assistant",
        content: result.answer,
        evidence: result.evidence,
        sources: result.sources,
        isAiGenerated: result.isAiGenerated,
        provider: result.provider,
        timestamp: "NOW",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Recruiter chat error:", err);
      setChatError("Unable to reach assistant. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  const recruiter = data || getFallbackData();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 sm:hidden panel-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="panel-enter fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[460px] md:w-[490px] max-h-[92vh] sm:max-h-none bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-panel)] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="recruiter-title"
      >
        {/* Top architectural accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* ── 01. Header Bar ────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2
              id="recruiter-title"
              className="text-xs font-bold tracking-[0.24em] text-[var(--foreground)] uppercase"
            >
              RECRUITER MODE
            </h2>
            <span className="font-mono text-[9px] tracking-[0.18em] text-[var(--foreground-muted)] uppercase border-l border-[var(--border)] pl-2.5">
              AI ASSISTANT
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            aria-label="Close recruiter assistant"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* ── 02. Candidate Profile Header Card ──────────────────────── */}
        <div className="border-b border-[var(--border)] px-5 py-4 bg-[var(--surface-muted)]/40 shrink-0">
          <div className="flex items-start gap-4">
            {/* Avatar with fallback */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full border border-[var(--border-strong)] overflow-hidden bg-[var(--surface)] flex items-center justify-center shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/saurav.jpg"
                  alt="Saurav Kumar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallbackEl = document.getElementById("avatar-fallback");
                    if (fallbackEl) fallbackEl.style.display = "flex";
                  }}
                />
                <div
                  id="avatar-fallback"
                  className="hidden w-full h-full bg-[#18202a] text-[#f8fafc] font-mono font-bold text-base items-center justify-center tracking-wider"
                >
                  SK
                </div>
              </div>
              <span
                className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[var(--surface)]"
                title="Available for opportunities"
              />
            </div>

            {/* Candidate Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base tracking-[0.14em] text-[var(--foreground)] uppercase truncate">
                {recruiter.name}
              </h3>
              <p className="font-mono text-xs text-[var(--foreground-muted)] tracking-wide mt-0.5">
                {recruiter.role} &amp; Builder
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] tracking-wider text-emerald-700 uppercase font-medium">
                  Open to Opportunities
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Resume & GitHub */}
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div className="relative">
              {hasResumePdf ? (
                <a
                  href="/resume.pdf"
                  download="Saurav_Kumar_Resume.pdf"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--surface)] transition-all font-mono text-[11px] tracking-wider font-semibold uppercase"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  DOWNLOAD RESUME
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setResumeTooltip(!resumeTooltip)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all font-mono text-[11px] tracking-wider uppercase"
                >
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  RESUME PENDING
                </button>
              )}
              {resumeTooltip && !hasResumePdf && (
                <div className="absolute left-0 bottom-full mb-1 z-50 p-2 bg-[var(--foreground)] text-[var(--surface)] font-mono text-[10px] leading-tight shadow-md border border-[var(--border-strong)] w-56">
                  Add <code className="text-amber-300">public/resume.pdf</code> to enable one-click PDF download.
                </div>
              )}
            </div>

            <a
              href="https://github.com/Sauravkumar911"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] transition-all font-mono text-[11px] tracking-wider uppercase font-medium"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GITHUB
            </a>
          </div>
        </div>

        {/* ── 03. Mode Navigation Tabs ──────────────────────────────── */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-muted)]/20 px-5 pt-2.5 shrink-0 gap-1.5 overflow-x-auto">
          {[
            { id: "chat", label: "CHAT" },
            { id: "profile", label: "PROFILE" },
            { id: "skills", label: "SKILLS" },
            { id: "projects", label: "PROJECTS" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`font-mono text-[10px] tracking-[0.2em] uppercase px-3.5 py-1.5 border transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--foreground)] text-[var(--surface)] border-[var(--foreground)] font-bold shadow-xs"
                  : "bg-transparent text-[var(--foreground-muted)] border-transparent hover:text-[var(--foreground)] hover:border-[var(--border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 04. Tab Body Content ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* ── TAB: CHAT ────────────────────────────────────────── */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col p-4 space-y-4">
              {/* Message thread */}
              <div className="space-y-3 flex-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-3.5 text-xs font-sans leading-relaxed border ${
                        msg.role === "user"
                          ? "bg-[var(--foreground)] text-[var(--surface)] border-[var(--foreground)] rounded-tl-sm rounded-tr-none rounded-br-sm rounded-bl-sm"
                          : "bg-[var(--surface-muted)] text-[var(--foreground)] border-[var(--border)] rounded-tr-sm rounded-tl-none rounded-br-sm rounded-bl-sm shadow-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Evidence / Source tags */}
                      {msg.evidence && msg.evidence.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[var(--border)]/40 space-y-1">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--foreground-muted)] font-semibold">
                            Verified Context:
                          </p>
                          {msg.evidence.map((ev, i) => (
                            <p key={i} className="font-mono text-[10px] text-[var(--foreground-muted)] leading-tight">
                              • {ev}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Provider pill indicator */}
                      {msg.role === "assistant" && (
                        <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-[var(--foreground-muted)] pt-1">
                          <span>
                            {msg.isAiGenerated
                              ? `● LIVE AI (${msg.provider || "OLLAMA"})`
                              : "● VERIFIED PORTFOLIO ENGINE"}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isAsking && (
                  <div className="flex items-start">
                    <div className="p-3 bg-[var(--surface-muted)] border border-[var(--border)] text-xs font-mono text-[var(--foreground-muted)] flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Analyzing portfolio context...
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {chatError && (
                  <div className="p-2.5 border border-red-300 bg-red-50 text-red-800 font-mono text-[11px]">
                    {chatError}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions (Chips) */}
              <div className="space-y-1.5 pt-1">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--foreground-muted)]">
                  Quick Inquiries:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(question)}
                      disabled={isAsking}
                      className="text-left font-mono text-[10px] py-1 px-2.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] transition-all rounded-xs disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAsking}
                    placeholder="Ask anything about Saurav..."
                    className="flex-1 bg-[var(--surface)] border border-[var(--border-strong)] px-3 py-2 text-xs text-[var(--foreground)] font-mono placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputQuery.trim() || isAsking}
                    className="shrink-0 px-3.5 py-2 bg-[var(--foreground)] text-[var(--surface)] font-mono text-xs font-bold uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: PROFILE ──────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1">
                  CORE SUMMARY
                </h4>
                <p className="text-xs text-[var(--foreground)] leading-relaxed">
                  Full-stack software engineer specializing in resilient distributed systems, high-throughput payment reconciliation (MeshPay), and automated AI/ML pipelines (GrowEasy, AI IP Protection). Experienced in building scalable production architectures from database schema design through interactive real-time interfaces.
                </p>
              </div>

              <div>
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1.5">
                  ENGINEERING DOMAINS
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {recruiter.domains.map((dom, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 font-mono text-[10px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] font-medium"
                    >
                      {dom}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1.5">
                  GITHUB FOOTPRINT
                </h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-3 border border-[var(--border)] bg-[var(--surface-muted)]">
                    <p className="text-[10px] text-[var(--foreground-muted)] uppercase">REPOSITORIES</p>
                    <p className="text-base font-bold text-[var(--foreground)] mt-0.5">
                      {recruiter.githubActivity.repositories || 22}+
                    </p>
                  </div>
                  <div className="p-3 border border-[var(--border)] bg-[var(--surface-muted)]">
                    <p className="text-[10px] text-[var(--foreground-muted)] uppercase">COMMITS</p>
                    <p className="text-base font-bold text-[var(--foreground)] mt-0.5">
                      {recruiter.githubActivity.commits || 500}+
                    </p>
                  </div>
                </div>

                {/* Recent GitHub Activity breakdown */}
                {recruiter.githubActivity.recentActivity && recruiter.githubActivity.recentActivity.length > 0 && (
                  <div className="mt-2.5 p-2.5 border border-[var(--border)] bg-[var(--surface-muted)] space-y-1">
                    <p className="font-mono text-[9px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase font-semibold">
                      Recent Activity
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                      {recruiter.githubActivity.recentActivity.map((act) => (
                        <div key={act.month} className="flex justify-between text-[var(--foreground-muted)]">
                          <span>{act.month}:</span>
                          <span className="font-semibold text-[var(--foreground)]">{act.count} events</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Portfolio Intelligence Metrics */}
              {recruiter.portfolioIntelligence && (
                <div>
                  <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2">
                    PORTFOLIO INTELLIGENCE
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Metric label="Projects" value={recruiter.portfolioIntelligence.projectCount} />
                    <Metric label="Tech Stack" value={recruiter.portfolioIntelligence.technologyCount} />
                    <Metric label="Districts" value={recruiter.portfolioIntelligence.districtCount} />
                    <Metric label="Categories" value={recruiter.portfolioIntelligence.projectCategoryCount} />
                    <Metric label="Repositories" value={recruiter.portfolioIntelligence.repositoryCount} />
                    <Metric label="Events" value={recruiter.portfolioIntelligence.engineeringEventCount} />
                    <Metric label="Achievements" value={recruiter.portfolioIntelligence.achievementCount} />
                    <Metric label="AI Analyses" value={recruiter.portfolioIntelligence.aiAnalysisCount} />
                  </div>
                  {recruiter.portfolioIntelligence.majorDomains && recruiter.portfolioIntelligence.majorDomains.length > 0 && (
                    <div className="mt-2.5">
                      <p className="font-mono text-[9px] tracking-[0.12em] text-[var(--foreground-muted)] uppercase mb-1">
                        Major Domains
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recruiter.portfolioIntelligence.majorDomains.map((domain) => (
                          <span
                            key={domain}
                            className="inline-block border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--foreground)] uppercase"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Achievements */}
              {recruiter.achievements && recruiter.achievements.length > 0 && (
                <div>
                  <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2">
                    VERIFIED ACHIEVEMENTS
                  </h4>
                  <div className="space-y-2">
                    {recruiter.achievements.slice(0, 4).map((achievement, idx) => (
                      <div
                        key={`${achievement.title}-${idx}`}
                        className="border border-[var(--border)] bg-[var(--surface-muted)] p-2.5"
                      >
                        <p className="font-mono text-[10px] font-semibold tracking-wide text-[var(--foreground)] uppercase">
                          {achievement.title}
                        </p>
                        <p className="font-mono text-[9px] text-[var(--foreground-muted)] uppercase mt-0.5">
                          {new Date(achievement.date).toLocaleDateString("en-GB")} · {achievement.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: SKILLS ────────────────────────────────────────── */}
          {activeTab === "skills" && (
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1.5">
                  CORE LANGUAGES
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {recruiter.githubActivity.languages.length > 0
                    ? recruiter.githubActivity.languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2.5 py-1 font-mono text-[10px] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] font-semibold"
                        >
                          {lang}
                        </span>
                      ))
                    : ["TypeScript", "JavaScript", "Python", "Java", "Solidity", "SQL"].map((lang) => (
                        <span
                          key={lang}
                          className="px-2.5 py-1 font-mono text-[10px] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] font-semibold"
                        >
                          {lang}
                        </span>
                      ))}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1.5">
                  FRAMEWORKS &amp; RUNTIMES
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["React 19", "Next.js 16", "Spring Boot", "FastAPI", "Node.js", "Three.js", "Tailwind CSS"].map((fw) => (
                    <span
                      key={fw}
                      className="px-2.5 py-1 font-mono text-[10px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1.5">
                  BACKEND &amp; DISTRIBUTED
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["PostgreSQL", "Docker", "Prisma ORM", "Redis", "Distributed Mesh", "IPFS", "Event Queues"].map((be) => (
                    <span
                      key={be}
                      className="px-2.5 py-1 font-mono text-[10px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                    >
                      {be}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1.5">
                  AI &amp; VISION
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["PyTorch", "OpenCV", "OpenAI API", "Ollama LLMs", "Perceptual Hashing", "CNN Embeddings"].map((ai) => (
                    <span
                      key={ai}
                      className="px-2.5 py-1 font-mono text-[10px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                    >
                      {ai}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic technologies list from API */}
              {recruiter.technologies && recruiter.technologies.length > 0 && (
                <div>
                  <h4 className="font-mono text-[10px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-1.5">
                    ALL VERIFIED TECHNOLOGIES
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {recruiter.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="font-mono text-[9px] px-2 py-0.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: PROJECTS ──────────────────────────────────────── */}
          {activeTab === "projects" && (
            <div className="p-4 space-y-3">
              {recruiter.strongProjects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-3.5 border border-[var(--border)] bg-[var(--surface-muted)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs tracking-wide text-[var(--foreground)] uppercase">
                      {proj.name}
                    </h5>
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 border border-emerald-600/40 text-emerald-800 bg-emerald-50">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--foreground)] leading-relaxed">
                    {proj.description}
                  </p>
                  {(proj.category || proj.district) && (
                    <p className="font-mono text-[9px] text-[var(--foreground-muted)] uppercase">
                      {proj.category} {proj.district ? `· ${proj.district}` : ""}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="font-mono text-[9px] px-1.5 py-0.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 05. Telemetry Quick Insights & Top Tech ───────────────── */}
        <div className="border-t border-[var(--border)] p-4 bg-[var(--surface-muted)]/50 shrink-0 space-y-3">
          <div>
            <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-[var(--foreground-muted)] font-semibold mb-2">
              QUICK INSIGHTS
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-2 border border-[var(--border)] bg-[var(--surface)] flex items-baseline justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  {recruiter.portfolioIntelligence?.projectCount || 6}
                </span>
                <span className="text-[10px] text-[var(--foreground-muted)] uppercase">Projects</span>
              </div>
              <div className="p-2 border border-[var(--border)] bg-[var(--surface)] flex items-baseline justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  {recruiter.portfolioIntelligence?.technologyCount || 21}
                </span>
                <span className="text-[10px] text-[var(--foreground-muted)] uppercase">Technologies</span>
              </div>
              <div className="p-2 border border-[var(--border)] bg-[var(--surface)] flex items-baseline justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  {recruiter.portfolioIntelligence?.districtCount || 6}
                </span>
                <span className="text-[10px] text-[var(--foreground-muted)] uppercase">Districts</span>
              </div>
              <div className="p-2 border border-[var(--border)] bg-[var(--surface)] flex items-baseline justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">
                  {recruiter.portfolioIntelligence?.repositoryCount || 22}
                </span>
                <span className="text-[10px] text-[var(--foreground-muted)] uppercase">GitHub Repos</span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-[var(--foreground-muted)] font-semibold mb-1.5">
              TOP TECHNOLOGIES
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "TypeScript",
                "Python",
                "Java",
                "Next.js",
                "React",
                "PostgreSQL",
                "Docker",
                "Solidity",
                "OpenCV",
              ].map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-[9px] px-2 py-0.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
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

function getFallbackData(): RecruiterData {
  return {
    name: "Saurav Kumar",
    role: "Full-Stack Engineer",
    domains: ["Backend Systems", "AI & Machine Learning", "Distributed Ledger", "Open Source"],
    strongProjects: [
      {
        name: "MeshPay Tower",
        description: "Offline-first deferred payment settlement system for distributed environments.",
        technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
        status: "Active",
        category: "backend",
        district: "Backend District",
      },
      {
        name: "GrowEasy AI Lab",
        description: "Full-stack AI platform for SMB growth automation with LLM recommendations.",
        technologies: ["Python", "FastAPI", "OpenAI", "React"],
        status: "Active",
        category: "ai",
        district: "AI District",
      },
      {
        name: "AI IP Protection Center",
        description: "Computer vision pipeline detecting unauthorized IP across digital media.",
        technologies: ["Python", "PyTorch", "OpenCV", "FastAPI"],
        status: "Active",
        category: "ai",
        district: "AI District",
      },
      {
        name: "Blockchain Verification Hub",
        description: "Immutable on-chain verification infrastructure for cryptographic provenance.",
        technologies: ["Solidity", "Ethereum", "Node.js", "IPFS"],
        status: "Active",
        category: "blockchain",
        district: "Blockchain District",
      },
    ],
    technologies: [
      "TypeScript",
      "React",
      "Next.js",
      "Python",
      "Java",
      "Spring Boot",
      "PostgreSQL",
      "Docker",
      "Solidity",
      "OpenCV",
    ],
    githubActivity: {
      repositories: 22,
      commits: 500,
      recentActivity: [
        { month: "2026-08", count: 42 },
        { month: "2026-07", count: 38 },
        { month: "2026-06", count: 55 },
        { month: "2026-05", count: 61 },
      ],
      languages: ["TypeScript", "Python", "Java", "Solidity"],
    },
    portfolioIntelligence: {
      projectCount: 6,
      technologyCount: 21,
      districtCount: 6,
      engineeringEventCount: 500,
      repositoryCount: 22,
      achievementCount: 5,
      aiAnalysisCount: 12,
      highConfidenceAnalysisCount: 8,
      featuredProjectCount: 4,
      projectCategoryCount: 4,
      majorDomains: ["Backend Systems", "AI & Machine Learning", "Distributed Ledger", "Open Source"],
    },
    achievements: [
      {
        title: "Architected MeshPay Offline Settlement",
        date: "2026-07-15T00:00:00.000Z",
        category: "Engineering",
      },
      {
        title: "Deployed Dual-Stage CV Pipeline for IP Protection",
        date: "2026-06-20T00:00:00.000Z",
        category: "AI / Vision",
      },
      {
        title: "Shipped 22+ Open Source Repositories",
        date: "2026-05-10T00:00:00.000Z",
        category: "Open Source",
      },
    ],
    openSource: true,
    aiBackendExperience: true,
  };
}
