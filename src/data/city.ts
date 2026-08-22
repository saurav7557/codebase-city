// ─────────────────────────────────────────────────────────────────────────────
// Codebase City — Seed Data
//
// This file is the ONLY place where project-specific content lives.
// The 3D renderer is entirely data-driven — it reads from this file and
// renders accordingly. In Phase 2+, this data will be fetched from:
//   - PostgreSQL (project records)
//   - GitHub API (activity, repos)
//   - AI classifier (building type, placement)
// ─────────────────────────────────────────────────────────────────────────────

import type { CityData } from "@/types/city";

export const cityData: CityData = {
  districts: [
    {
      id: "core",
      name: "Core District",
      color: "#6366f1",
      center: [0, 0],
      radius: 5,
    },
    {
      id: "backend",
      name: "Backend District",
      color: "#0ea5e9",
      center: [-9, -6],
      radius: 4.5,
    },
    {
      id: "ai",
      name: "AI District",
      color: "#8b5cf6",
      center: [9, -6],
      radius: 5,
    },
    {
      id: "blockchain",
      name: "Blockchain District",
      color: "#f59e0b",
      center: [-9, 6],
      radius: 4,
    },
    {
      id: "open-source",
      name: "Open Source District",
      color: "#10b981",
      center: [9, 6],
      radius: 4,
    },
    {
      id: "achievements",
      name: "Achievement District",
      color: "#f43f5e",
      center: [0, -10],
      radius: 3.5,
    },
  ],

  buildings: [
    // ── Core District ─────────────────────────────────────────────────────────
    {
      id: "saurav-hq",
      name: "Saurav HQ",
      type: "profile",
      district: "core",
      description:
        "The nerve center of Codebase City. Home base for a full-stack engineer with a focus on distributed systems, AI, and high-impact products.",
      status: "active",
      position: [0, 0, 0],
      height: 3.5,
      color: "#6366f1",
      accentColor: "#a5b4fc",
      technologies: ["TypeScript", "React", "Next.js", "Three.js"],
    },

    // ── Backend District ──────────────────────────────────────────────────────
    {
      id: "meshpay-tower",
      name: "MeshPay Tower",
      type: "backend",
      district: "backend",
      description:
        "Offline-first, deferred payment settlement system built for high-throughput distributed environments. Handles async reconciliation across mesh networks.",
      status: "active",
      position: [-9, 0, -6],
      height: 2.8,
      color: "#0ea5e9",
      accentColor: "#7dd3fc",
      technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    },

    // ── AI District ───────────────────────────────────────────────────────────
    {
      id: "groweasy-ai-lab",
      name: "GrowEasy AI Lab",
      type: "ai",
      district: "ai",
      description:
        "Full-stack AI platform for SMB growth automation. Combines LLM-powered recommendations with real-time analytics and CRM integrations.",
      status: "active",
      position: [9, 0, -6],
      height: 3.0,
      color: "#8b5cf6",
      accentColor: "#c4b5fd",
      technologies: ["Python", "FastAPI", "OpenAI", "React"],
    },
    {
      id: "ai-ip-protection",
      name: "AI IP Protection Center",
      type: "ai",
      district: "ai",
      description:
        "Computer vision pipeline for detecting unauthorized use of intellectual property across digital media. Combines perceptual hashing with deep feature matching.",
      status: "active",
      position: [11, 0, -4],
      height: 2.2,
      color: "#7c3aed",
      accentColor: "#ddd6fe",
      technologies: ["Python", "PyTorch", "OpenCV", "FastAPI"],
    },

    // ── Blockchain District ───────────────────────────────────────────────────
    {
      id: "blockchain-verification-hub",
      name: "Blockchain Verification Hub",
      type: "blockchain",
      district: "blockchain",
      description:
        "Immutable on-chain verification infrastructure for provenance tracking, credential issuance, and trustless document authentication.",
      status: "active",
      position: [-9, 0, 6],
      height: 2.5,
      color: "#f59e0b",
      accentColor: "#fde68a",
      technologies: ["Solidity", "Ethereum", "Node.js", "IPFS"],
    },

    // ── Open Source District ──────────────────────────────────────────────────
    {
      id: "open-source-hub",
      name: "Open Source Hub",
      type: "open-source",
      district: "open-source",
      description:
        "A growing collection of open-source contributions, tooling, and libraries. Currently under active construction — watch this space.",
      status: "building",
      position: [9, 0, 6],
      height: 1.5,
      color: "#10b981",
      accentColor: "#6ee7b7",
      technologies: ["TypeScript", "Open Source"],
    },

    // ── Achievement District ──────────────────────────────────────────────────
    {
      id: "achievement-center",
      name: "Achievement Center",
      type: "achievement",
      district: "achievements",
      description:
        "A monument to milestones: shipped products, engineering wins, technical leadership moments, and lessons learned at scale.",
      status: "active",
      position: [0, 0, -10],
      height: 2.0,
      color: "#f43f5e",
      accentColor: "#fda4af",
      technologies: ["Leadership", "Product", "Engineering"],
    },
  ],
};
