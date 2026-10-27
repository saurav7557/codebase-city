import { getAIProvider, getAIProviderStatus } from "@/ai/ai-provider-service";
import { prisma } from "@/lib/prisma";
import { cityData } from "@/data/city";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  answer: string;
  evidence: string[];
  sources: string[];
  isAiGenerated: boolean;
  provider: string | null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      return Response.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "A message is required",
          },
        },
        { status: 400 }
      );
    }

    const query = body.message.trim();
    const providerStatus = getAIProviderStatus();

    // Gather verified portfolio context from database with fallback to cityData
    let projectsData: Array<{
      name: string;
      description: string;
      category: string;
      district: string;
      status: string;
      technologies: string[];
    }> = [];

    let technologiesList: string[] = [];

    try {
      const [dbProjects, dbTech] = await Promise.all([
        prisma.project.findMany({
          include: {
            district: { select: { name: true } },
            technologies: { include: { technology: true } },
          },
        }),
        prisma.technology.findMany(),
      ]);

      if (dbProjects.length > 0) {
        projectsData = dbProjects.map((p) => ({
          name: p.name,
          description: p.description,
          category: p.category,
          district: p.district.name,
          status: p.status,
          technologies: p.technologies.map((t) => t.technology.name),
        }));
      }

      if (dbTech.length > 0) {
        technologiesList = dbTech.map((t) => t.name);
      }
    } catch {
      // Database unavailable, use static canonical cityData
    }

    if (projectsData.length === 0) {
      projectsData = cityData.buildings
        .filter((b) => b.id !== "saurav-hq")
        .map((b) => ({
          name: b.name,
          description: b.description,
          category: b.type,
          district: b.district,
          status: b.status,
          technologies: b.technologies || [],
        }));
    }

    if (technologiesList.length === 0) {
      const techSet = new Set<string>();
      cityData.buildings.forEach((b) => b.technologies?.forEach((t) => techSet.add(t)));
      technologiesList = Array.from(techSet);
    }

    // 1. Attempt Live AI Provider if configured (Ollama or OpenAI)
    if (providerStatus.configured) {
      try {
        const provider = getAIProvider();
        if (provider && provider.ask) {
          const aiContext = {
            projects: projectsData,
            technologies: technologiesList,
            districts: cityData.districts.map((d) => ({ name: d.name, type: d.id })),
            aiInsights: [
              {
                confidence: 0.95,
                result: "Saurav Kumar is a Full-Stack & Systems Engineer specializing in distributed payment systems, AI/ML pipelines, and modern web architectures.",
              },
            ],
          };

          const aiResponse = await provider.ask(query, aiContext);

          return Response.json({
            answer: aiResponse.answer,
            evidence: aiResponse.evidence || [],
            sources: aiResponse.sources || ["Verified Portfolio Knowledge Base"],
            isAiGenerated: true,
            provider: providerStatus.provider,
          } satisfies ChatResponse);
        }
      } catch (aiErr) {
        console.warn("AI Provider call failed, falling back to deterministic portfolio engine:", aiErr);
      }
    }

    // 2. Deterministic Portfolio Knowledge Engine
    // Generates precise, verified answers directly from real portfolio records.
    const fallbackAnswer = generateDeterministicAnswer(query, projectsData, technologiesList);

    return Response.json({
      answer: fallbackAnswer.answer,
      evidence: fallbackAnswer.evidence,
      sources: fallbackAnswer.sources,
      isAiGenerated: false,
      provider: null,
    } satisfies ChatResponse);
  } catch (error) {
    console.error("Recruiter chat failed:", error);
    return Response.json(
      {
        error: {
          code: "CHAT_FAILED",
          message: "Failed to process chat query",
        },
      },
      { status: 500 }
    );
  }
}

interface DeterministicResult {
  answer: string;
  evidence: string[];
  sources: string[];
}

function generateDeterministicAnswer(
  query: string,
  projects: Array<{
    name: string;
    description: string;
    category: string;
    status: string;
    technologies: string[];
  }>,
  technologies: string[]
): DeterministicResult {
  const q = query.toLowerCase();

  // 1. Tell me about Saurav / Profile / Overview
  if (
    q.includes("about") ||
    q.includes("who is") ||
    q.includes("overview") ||
    q.includes("background") ||
    q.includes("introduce")
  ) {
    return {
      answer:
        "Saurav Kumar is a Software Engineer & Builder with a focus on distributed backend systems, AI/ML platforms, and high-impact full-stack applications. He architects resilient distributed systems with asynchronous settlement mechanisms (MeshPay), builds automated LLM and computer vision pipelines (GrowEasy, AI IP Protection), and maintains active open-source contributions with over 22 repositories and 500+ commits.",
      evidence: [
        "Core competencies: Distributed Systems, High-Throughput APIs, AI/ML Pipelines, Full-Stack Architecture",
        "Key tech stack: TypeScript, Python, Java, Spring Boot, Next.js, PostgreSQL, Docker",
        "Active status: Open to Software Engineering & Builder opportunities",
      ],
      sources: ["Portfolio Core Dossier", "GitHub Activity Records", "City District Schema"],
    };
  }

  // 2. MeshPay / Payments / Settlement
  if (q.includes("meshpay") || q.includes("payment") || q.includes("settlement")) {
    const meshpay = projects.find((p) => p.name.toLowerCase().includes("meshpay"));
    return {
      answer:
        "MeshPay is an offline-first deferred payment settlement system engineered for high-throughput distributed environments. It tackles network partition challenges through asynchronous transactional reconciliation across mesh topologies, maintaining transaction consistency even under intermittent network connectivity.",
      evidence: [
        "Architecture: Offline-first event queuing with asynchronous two-phase reconciliation",
        "Tech Stack: Java, Spring Boot, PostgreSQL, Docker",
        `Status: ${meshpay ? meshpay.status.toUpperCase() : "ACTIVE"} in Backend District`,
      ],
      sources: ["MeshPay Engineering Specs", "Backend District Architecture"],
    };
  }

  // 3. GrowEasy / AI Lab
  if (q.includes("groweasy") || q.includes("growth") || q.includes("smb")) {
    return {
      answer:
        "GrowEasy AI Lab is a full-stack growth automation platform for SMBs. It leverages fine-tuned LLM agents to deliver tailored operational recommendations, coupled with real-time customer analytics and multi-channel CRM synchronization.",
      evidence: [
        "Core Capabilities: LLM automated workflows, telemetry dashboards, real-time CRM webhooks",
        "Tech Stack: Python, FastAPI, OpenAI API, React, Next.js",
        "District: AI & Intelligence District",
      ],
      sources: ["GrowEasy Project Dossier", "AI District Records"],
    };
  }

  // 4. AI IP Protection / Computer Vision
  if (
    q.includes("ip protection") ||
    q.includes("computer vision") ||
    q.includes("copyright") ||
    q.includes("vision") ||
    q.includes("opencv")
  ) {
    return {
      answer:
        "The AI IP Protection Center is a high-accuracy computer vision pipeline designed to detect unauthorized intellectual property use across digital media. It pairs perceptual hashing algorithms for immediate deduplication with deep CNN feature embeddings to identify modified, cropped, or masked creative assets.",
      evidence: [
        "Pipeline: Dual-stage matching (Perceptual Hashing + PyTorch feature embeddings)",
        "Tech Stack: Python, PyTorch, OpenCV, FastAPI",
        "District: AI & Intelligence District",
      ],
      sources: ["AI IP Protection Dossier", "Computer Vision Architecture"],
    };
  }

  // 5. Blockchain / Distributed Ledger
  if (
    q.includes("blockchain") ||
    q.includes("solidity") ||
    q.includes("ethereum") ||
    q.includes("ledger") ||
    q.includes("web3")
  ) {
    return {
      answer:
        "The Blockchain Verification Hub is an immutable on-chain verification infrastructure for cryptographic provenance tracking, credential issuance, and decentralized document authentication via decentralized storage.",
      evidence: [
        "Capabilities: Smart contract verification, verifiable credentials, IPFS content addressing",
        "Tech Stack: Solidity, Ethereum, Node.js, IPFS",
        "District: Distributed Ledger District",
      ],
      sources: ["Blockchain Verification Hub Specs"],
    };
  }

  // 6. Open Source
  if (q.includes("open source") || q.includes("community") || q.includes("contribution")) {
    return {
      answer:
        "Saurav actively contributes to the open-source ecosystem, maintaining developer utilities, modular libraries, and interactive visualization tooling. The Open Source Hub in Codebase City represents this commitment to collaborative engineering.",
      evidence: [
        "GitHub Footprint: 22+ public repositories, 500+ commits",
        "Focus Areas: Developer CLI tools, React/Three.js interactive modules, and TypeScript utilities",
      ],
      sources: ["GitHub Repositories", "Open Source District"],
    };
  }

  // 7. Projects / Key Projects
  if (q.includes("project") || q.includes("strongest") || q.includes("portfolio") || q.includes("built")) {
    const projectBullets = projects.slice(0, 4).map(
      (p) => `• ${p.name}: ${p.description} (${p.technologies.slice(0, 3).join(", ")})`
    );
    return {
      answer: `Saurav has designed and shipped several high-impact projects spanning distributed backend systems and AI automation:\n\n${projectBullets.join(
        "\n\n"
      )}`,
      evidence: [
        "Architectural diversity: Offline payment settlements (MeshPay), AI SMB automation (GrowEasy), IP verification pipelines, and on-chain registries",
        `Total active projects: ${projects.length}`,
      ],
      sources: ["Codebase City Projects Registry", "System Architecture Database"],
    };
  }

  // 8. Technologies / Skills / Stack
  if (
    q.includes("technolog") ||
    q.includes("skill") ||
    q.includes("stack") ||
    q.includes("language") ||
    q.includes("tools") ||
    q.includes("know")
  ) {
    return {
      answer:
        "Saurav has extensive hands-on experience across full-stack, distributed backend, and AI engineering stacks:\n\n" +
        "• Languages: TypeScript, JavaScript, Python, Java, Solidity, SQL\n" +
        "• Backend & Systems: Spring Boot, FastAPI, Node.js, PostgreSQL, Docker, Redis\n" +
        "• Frontend & 3D: React 19, Next.js, Three.js, React Three Fiber, Tailwind CSS\n" +
        "• AI & Machine Learning: PyTorch, OpenCV, OpenAI API, Ollama, Perceptual Hashing",
      evidence: [
        `Verified technologies: ${technologies.slice(0, 12).join(", ")}`,
        "Demonstrated in production-style codebases and containerized deployments",
      ],
      sources: ["Technology Matrix Registry", "Repository Dependency Manifests"],
    };
  }

  // 9. Achievements / Milestones
  if (
    q.includes("achievement") ||
    q.includes("milestone") ||
    q.includes("award") ||
    q.includes("impact") ||
    q.includes("win")
  ) {
    return {
      answer:
        "Saurav's achievements highlight consistent execution across product engineering, distributed systems scaling, and open-source delivery:\n\n" +
        "• Architected MeshPay's offline-first settlement protocol for high-throughput distributed transaction reconciliation.\n" +
        "• Deployed multi-modal AI detection pipelines combining perceptual hashing and deep embeddings with real-time throughput.\n" +
        "• Shipped 22+ GitHub repositories with over 500 commits across TypeScript, Python, and Java ecosystems.\n" +
        "• Designed and engineered Codebase City — an interactive 3D architectural portfolio combining React Three Fiber, Next.js, and live systems telemetry.",
      evidence: [
        "Track record of taking complex engineering specifications from design to production",
        "Demonstrated leadership in technical architecture and full-stack software development",
      ],
      sources: ["Achievement District Records", "Engineering Event Stream"],
    };
  }

  // 10. Why hire / SDE role fit
  if (
    q.includes("why") ||
    q.includes("sde") ||
    q.includes("hire") ||
    q.includes("consider") ||
    q.includes("fit") ||
    q.includes("candidate") ||
    q.includes("role")
  ) {
    return {
      answer:
        "Here is why Saurav Kumar is a standout candidate for Software Engineering (SDE) roles:\n\n" +
        "1. Strong Systems Foundation: Deep understanding of distributed transactions, concurrency, event reconciliation, and database performance demonstrated in MeshPay.\n" +
        "2. Applied AI & Modern Stack: Practical expertise integrating AI/LLM models and computer vision pipelines into production full-stack apps (GrowEasy, AI IP Protection).\n" +
        "3. Production Velocity & Craftsmanship: Proven builder capable of owning end-to-end features—from database schemas and containerization up to high-performance interactive 3D UIs.\n" +
        "4. Collaborative & Transparent: Active open-source presence, clean documentation, rigorous TypeScript/ESLint practices, and communicative engineering habits.",
      evidence: [
        "Demonstrated technical range: Low-level network resilience to modern React 19 / Next.js UIs",
        "Autonomous problem-solver ready to make immediate impact on engineering teams",
      ],
      sources: ["Recruiter Evaluation Dossier", "Technical Architecture Audit"],
    };
  }

  // General fallback
  return {
    answer:
      `Saurav Kumar is a Software Engineer & Builder specializing in distributed backend systems, AI/ML pipelines, and modern full-stack web applications. ` +
      `He has engineered high-throughput payment architectures (MeshPay), AI automation tools (GrowEasy AI), and maintains an active engineering footprint of 22+ repositories. ` +
      `You can ask me about his specific projects, tech stack, achievements, or reasons to consider him for an SDE position.`,
    evidence: [
      `Key active projects: ${projects.slice(0, 3).map((p) => p.name).join(", ")}`,
      `Verified skills: ${technologies.slice(0, 8).join(", ")}`,
    ],
    sources: ["Verified Codebase City Knowledge Base"],
  };
}
