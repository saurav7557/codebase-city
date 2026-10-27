import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface JourneyPhase {
  id: string;
  title: string;
  period: string;
  description: string;
  projects: string[];
  technologies: string[];
  status: "completed" | "current" | "future";
}

const BASELINE_PHASES: JourneyPhase[] = [
  {
    id: "foundation",
    title: "Foundation",
    period: "2022",
    description:
      "Core computer science fundamentals, data structures, algorithms, and web development basics.",
    projects: ["Foundational Projects"],
    technologies: ["JavaScript", "HTML/CSS", "Python", "Data Structures"],
    status: "completed",
  },
  {
    id: "web3-foundations",
    title: "Web3 Foundations",
    period: "2024",
    description:
      "Explored decentralized networks, smart contracts, and cryptographic verification through hands-on development.",
    projects: ["Decentralized Identity Verification"],
    technologies: ["Solidity", "Ethereum", "Web3.js", "Cryptography"],
    status: "completed",
  },
  {
    id: "blockchain-platform",
    title: "Decentralized Systems",
    period: "2024",
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

export async function GET(): Promise<Response> {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { date: "asc" },
    });

    if (achievements.length > 0) {
      const dynamicPhases: JourneyPhase[] = achievements.map((ach) => ({
        id: ach.id,
        title: ach.title,
        period: new Date(ach.date).getFullYear().toString(),
        description: ach.description,
        projects: [ach.title],
        technologies: [ach.category],
        status: "completed",
      }));

      return Response.json({ phases: dynamicPhases });
    }

    // When no Achievement records are in the database, return baseline phases
    return Response.json({ phases: BASELINE_PHASES });
  } catch (error) {
    console.error("Failed to fetch journey data:", error);
    return Response.json({ phases: BASELINE_PHASES });
  }
}
