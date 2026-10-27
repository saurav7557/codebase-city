"use client";

import { useEffect, useRef, useState } from "react";
import { cityData } from "@/data/city";
import type { CityBuilding } from "@/types/city";

// ─────────────────────────────────────────────────────────────────────────────
// SystemsMode — Architectural Systems Experience (03 SYSTEMS)
//
// Presents real engineering systems, topology, technologies, and relationships
// to projects and 3D city districts. Clearly separates genuine data from
// explanatory architectural specifications.
// ─────────────────────────────────────────────────────────────────────────────

interface SystemDefinition {
  id: string;
  code: string;
  name: string;
  domain: string;
  districtId: string;
  districtName: string;
  districtColor: string;
  center: [number, number];
  radius: number;
  status: "active" | "building" | "planned";
  technologies: string[];
  connectedBuildings: {
    id: string;
    name: string;
    type: string;
    status: string;
    height: number;
    position: [number, number, number];
    technologies: string[];
  }[];
  architectureSummary: string;
  runtimeInvariants: string[];
  dataFlow: {
    inbound: string;
    processing: string;
    storage: string;
  };
}

const SYSTEMS_DATA: SystemDefinition[] = [
  {
    id: "core",
    code: "SYS-01",
    name: "CORE ENGINE & 3D RUNTIME",
    domain: "WebGL Visualization & Client State",
    districtId: "core",
    districtName: "Core District",
    districtColor: "#6366f1",
    center: [0, 0],
    radius: 5.0,
    status: "active",
    technologies: ["TypeScript", "React 19", "Next.js 16", "Three.js", "React Three Fiber"],
    connectedBuildings: cityData.buildings
      .filter((b) => b.district === "core")
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        status: b.status,
        height: b.height,
        position: b.position,
        technologies: b.technologies ?? [],
      })),
    architectureSummary:
      "Primary execution runtime orchestrating client-side reactive state, procedural Three.js extrusion geometry, camera positioning matrices, and technical HUD overlay panels.",
    runtimeInvariants: [
      "Deterministic 3D canvas mount with Suspense fallback",
      "Zero state mutation of canonical scene coordinates",
      "Bidirectional selection sync between 2D panels and 3D scene",
    ],
    dataFlow: {
      inbound: "User interaction & route events",
      processing: "React Three Fiber scene graph updates",
      storage: "Browser memory / React reactive state",
    },
  },
  {
    id: "backend",
    code: "SYS-02",
    name: "DISTRIBUTED PAYMENT & SETTLEMENT",
    domain: "High-Throughput Distributed Systems",
    districtId: "backend",
    districtName: "Backend District",
    districtColor: "#0ea5e9",
    center: [-9, -6],
    radius: 4.5,
    status: "active",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker", "REST API"],
    connectedBuildings: cityData.buildings
      .filter((b) => b.district === "backend")
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        status: b.status,
        height: b.height,
        position: b.position,
        technologies: b.technologies ?? [],
      })),
    architectureSummary:
      "Offline-first, deferred settlement transaction pipeline engineered for resilient peer-to-peer mesh networks. Guarantees eventual reconciliation across disconnected nodes.",
    runtimeInvariants: [
      "Idempotent payment event ingestion",
      "Cryptographic reconciliation ledger",
      "Zero-loss deferred offline queue",
    ],
    dataFlow: {
      inbound: "Mesh network transaction payloads",
      processing: "Spring Boot asynchronous reconciliation engine",
      storage: "ACID PostgreSQL relational persistence",
    },
  },
  {
    id: "ai",
    code: "SYS-03",
    name: "INTELLIGENCE & COMPUTER VISION",
    domain: "Machine Learning & Perceptual Hashing",
    districtId: "ai",
    districtName: "AI District",
    districtColor: "#8b5cf6",
    center: [9, -6],
    radius: 5.0,
    status: "active",
    technologies: ["Python", "FastAPI", "PyTorch", "OpenCV", "OpenAI API"],
    connectedBuildings: cityData.buildings
      .filter((b) => b.district === "ai")
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        status: b.status,
        height: b.height,
        position: b.position,
        technologies: b.technologies ?? [],
      })),
    architectureSummary:
      "Dual-purpose AI pipeline combining LLM context augmentation for business automation with computer vision perceptual hashing for automated copyright and IP detection.",
    runtimeInvariants: [
      "Strict schema validation on LLM inference results",
      "Cosine similarity thresholds for visual asset matching",
      "Graceful fallback on provider rate-limits or timeouts",
    ],
    dataFlow: {
      inbound: "Digital image streams & natural language queries",
      processing: "PyTorch feature extractor & FastAPI microservice",
      storage: "Vector embeddings & JSON analysis audit records",
    },
  },
  {
    id: "blockchain",
    code: "SYS-04",
    name: "TRUSTLESS VERIFICATION & LEDGER",
    domain: "Cryptographic Provenance & On-Chain State",
    districtId: "blockchain",
    districtName: "Blockchain District",
    districtColor: "#f59e0b",
    center: [-9, 6],
    radius: 4.0,
    status: "active",
    technologies: ["Solidity", "Ethereum", "Node.js", "IPFS", "Ethers.js"],
    connectedBuildings: cityData.buildings
      .filter((b) => b.district === "blockchain")
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        status: b.status,
        height: b.height,
        position: b.position,
        technologies: b.technologies ?? [],
      })),
    architectureSummary:
      "Immutable verification infrastructure coupling Ethereum smart contracts with decentralized IPFS content storage for tamper-proof credentials and provenance tracking.",
    runtimeInvariants: [
      "Deterministic cryptographic hash verification",
      "Immutable on-chain event emissions",
      "Content-addressed interplanetary storage",
    ],
    dataFlow: {
      inbound: "Credential claims & asset hashes",
      processing: "Solidity smart contract EVM execution",
      storage: "Ethereum ledger state + IPFS decentralized network",
    },
  },
  {
    id: "open-source",
    code: "SYS-05",
    name: "OPEN SOURCE TOOLING ECOSYSTEM",
    domain: "Developer Toolchains & Community Artifacts",
    districtId: "open-source",
    districtName: "Open Source District",
    districtColor: "#10b981",
    center: [9, 6],
    radius: 4.0,
    status: "building",
    technologies: ["TypeScript", "Node.js", "Git", "GitHub Actions"],
    connectedBuildings: cityData.buildings
      .filter((b) => b.district === "open-source")
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        status: b.status,
        height: b.height,
        position: b.position,
        technologies: b.technologies ?? [],
      })),
    architectureSummary:
      "Collection of reusable developer packages, algorithmic utilities, and CI/CD automation modules published for community adoption and collaborative development.",
    runtimeInvariants: [
      "Strict semver compliance on public releases",
      "Continuous automated type & lint validations",
      "Open MIT-licensed distribution",
    ],
    dataFlow: {
      inbound: "GitHub pull requests & issue reports",
      processing: "Automated linting & build workflows",
      storage: "Public GitHub repositories & NPM registries",
    },
  },
  {
    id: "achievements",
    code: "SYS-06",
    name: "OPERATIONAL MILESTONES & DELIVERY",
    domain: "Production Deployments & Leadership",
    districtId: "achievements",
    districtName: "Achievement District",
    districtColor: "#f43f5e",
    center: [0, -10],
    radius: 3.5,
    status: "active",
    technologies: ["Architecture", "Production Scaling", "Reliability", "Leadership"],
    connectedBuildings: cityData.buildings
      .filter((b) => b.district === "achievements")
      .map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        status: b.status,
        height: b.height,
        position: b.position,
        technologies: b.technologies ?? [],
      })),
    architectureSummary:
      "Registry of scalable system deployments, technical milestones, production incidents resolved, and high-impact software engineering deliveries.",
    runtimeInvariants: [
      "High availability zero-downtime releases",
      "Measurable scalability and throughput metrics",
      "Auditable engineering retrospectives",
    ],
    dataFlow: {
      inbound: "Production deployment events & system milestones",
      processing: "Post-release audit & observability metrics",
      storage: "Portfolio record & engineering ledger",
    },
  },
];

interface SystemsModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding?: (building: CityBuilding) => void;
}

export function SystemsMode({
  isOpen,
  onClose,
  onSelectBuilding,
}: SystemsModeProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<string>("core");
  const systems = SYSTEMS_DATA;

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeSystem =
    systems.find((s) => s.id === selectedSystemId) ?? systems[0];

  const handleLocateBuilding = (buildingId: string) => {
    if (!onSelectBuilding) return;
    const building = cityData.buildings.find((b) => b.id === buildingId);
    if (building) {
      onSelectBuilding(building);
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 sm:hidden panel-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={containerRef}
        className="panel-enter fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:left-[216px] sm:top-4 sm:bottom-4 sm:w-[560px] max-h-[90vh] sm:max-h-none bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-panel)] overflow-hidden flex flex-col select-none"
        role="dialog"
        aria-labelledby="systems-panel-title"
      >
        {/* Top accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 shrink-0 bg-[var(--surface)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase">
                03 SYSTEMS
              </span>
              <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--border-strong)]">
                ·
              </span>
              <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
                ENGINEERING TOPOLOGY
              </span>
            </div>
            <h2
              id="systems-panel-title"
              className="text-sm font-bold tracking-[0.22em] text-[var(--foreground)] uppercase"
            >
              DISTRIBUTED ARCHITECTURE
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            aria-label="Close systems panel"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* ── Systems Navigation Tabs ──────────────────────────────── */}
        <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Select system architecture">
            {systems.map((sys) => {
              const isSelected = selectedSystemId === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => setSelectedSystemId(sys.id)}
                  role="tab"
                  aria-selected={isSelected}
                  className={[
                    "shrink-0 font-mono text-[8px] tracking-[0.14em] uppercase px-2.5 py-1.5 border transition-colors flex items-center gap-1.5",
                    isSelected
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-semibold"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
                  ].join(" ")}
                >
                  <span
                    className="w-1.5 h-1.5 shrink-0"
                    style={{ backgroundColor: sys.districtColor }}
                    aria-hidden="true"
                  />
                  <span>{sys.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main System Dossier ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeSystem ? (
            <div className="flex flex-col gap-5">
              {/* System Header Card */}
              <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[var(--foreground)] uppercase">
                      {activeSystem.code}
                    </span>
                    <span className="font-mono text-[9px] text-[var(--border-strong)]">
                      ·
                    </span>
                    <span className="font-mono text-[8px] tracking-[0.18em] text-[var(--foreground-muted)] uppercase">
                      {activeSystem.domain}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={[
                        "status-dot",
                        activeSystem.status === "active"
                          ? "status-dot--active"
                          : "status-dot--building",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground)] uppercase font-medium">
                      {activeSystem.status === "active" ? "OPERATIONAL" : "BUILDING"}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold tracking-[0.14em] text-[var(--foreground)] uppercase mb-2">
                  {activeSystem.name}
                </h3>

                <p className="text-[11px] leading-relaxed text-[var(--foreground-muted)]">
                  {activeSystem.architectureSummary}
                </p>
              </div>

              {/* Genuine City & District Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase">
                    GENUINE TOPOLOGY PARAMETERS
                  </h4>
                  <span className="font-mono text-[7px] tracking-[0.1em] text-[var(--border-strong)] uppercase border border-[var(--border-subtle)] px-1 py-0.5">
                    VERIFIED SCHEMA
                  </span>
                </div>

                <div className="border border-[var(--border)] divide-y divide-[var(--border)] font-mono text-[9px]">
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      ASSOCIATED DISTRICT
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 inline-block"
                        style={{ backgroundColor: activeSystem.districtColor }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-[var(--foreground)] uppercase tracking-[0.1em]">
                        {activeSystem.districtName} ({activeSystem.districtId})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-muted)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      WORLD CENTER [X, Z]
                    </span>
                    <span className="text-[var(--foreground)] tabular-nums">
                      [{activeSystem.center[0]}, {activeSystem.center[1]}]
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      DISTRICT RADIUS
                    </span>
                    <span className="text-[var(--foreground)] tabular-nums">
                      {activeSystem.radius} UNITS
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-muted)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      CONNECTED CITY STRUCTURES
                    </span>
                    <span className="text-[var(--foreground)] tabular-nums">
                      {activeSystem.connectedBuildings.length} BUILDING UNITS
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected Structures in this System */}
              <div>
                <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2">
                  SUBSYSTEM IMPLEMENTATIONS
                </h4>

                <div className="flex flex-col gap-2">
                  {activeSystem.connectedBuildings.map((building) => (
                    <div
                      key={building.id}
                      className="border border-[var(--border)] bg-[var(--surface)] p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-mono text-[10px] font-bold tracking-[0.1em] text-[var(--foreground)] uppercase">
                            {building.name}
                          </h5>
                          <span className="font-mono text-[8px] text-[var(--border-strong)] uppercase">
                            [{building.position.join(", ")}]
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {building.technologies.map((t) => (
                            <span
                              key={t}
                              className="font-mono text-[8px] tracking-[0.06em] text-[var(--foreground-muted)] bg-[var(--surface-muted)] px-1.5 py-0.5 border border-[var(--border-subtle)] uppercase"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {onSelectBuilding && (
                        <button
                          onClick={() => handleLocateBuilding(building.id)}
                          className="shrink-0 font-mono text-[8px] tracking-[0.14em] uppercase text-[var(--foreground)] hover:underline border border-[var(--border)] px-2 py-1 bg-[var(--surface-muted)]"
                          aria-label={`Locate ${building.name} in 3D City`}
                        >
                          LOCATE 3D →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Flow & Runtime Architecture */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase">
                    DATA FLOW PIPELINE
                  </h4>
                  <span className="font-mono text-[7px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                    ARCHITECTURE SPEC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-mono text-[8px]">
                  <div className="border border-[var(--border)] bg-[var(--surface)] p-2.5">
                    <span className="block tracking-[0.18em] text-[var(--foreground-muted)] uppercase mb-1">
                      01 · INBOUND
                    </span>
                    <span className="text-[var(--foreground)] font-medium uppercase tracking-[0.08em]">
                      {activeSystem.dataFlow.inbound}
                    </span>
                  </div>
                  <div className="border border-[var(--border)] bg-[var(--surface)] p-2.5">
                    <span className="block tracking-[0.18em] text-[var(--foreground-muted)] uppercase mb-1">
                      02 · PROCESS
                    </span>
                    <span className="text-[var(--foreground)] font-medium uppercase tracking-[0.08em]">
                      {activeSystem.dataFlow.processing}
                    </span>
                  </div>
                  <div className="border border-[var(--border)] bg-[var(--surface)] p-2.5">
                    <span className="block tracking-[0.18em] text-[var(--foreground-muted)] uppercase mb-1">
                      03 · PERSISTENCE
                    </span>
                    <span className="text-[var(--foreground)] font-medium uppercase tracking-[0.08em]">
                      {activeSystem.dataFlow.storage}
                    </span>
                  </div>
                </div>
              </div>

              {/* Runtime Invariants */}
              <div>
                <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2">
                  RUNTIME INVARIANTS & INTEGRITY RULES
                </h4>
                <ul className="border border-[var(--border)] bg-[var(--surface-muted)] p-3 space-y-1.5 font-mono text-[9px] text-[var(--foreground-muted)]">
                  {activeSystem.runtimeInvariants.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--foreground)] font-bold">✓</span>
                      <span className="tracking-[0.06em] uppercase">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2">
                  SYSTEM CORE TECHNOLOGIES
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeSystem.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[9px] tracking-[0.1em] text-[var(--foreground)] uppercase"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 bg-[var(--surface-muted)] flex items-center justify-between font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
          <span>ACTIVE SYSTEMS: {systems.length}</span>
          <span>CITY ARCHITECTURAL TOPOLOGY</span>
        </div>
      </aside>
    </>
  );
}
