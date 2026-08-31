-- Persist validated, auditable AI interpretations without granting AI a direct
-- relation to manually curated portfolio or city entities.
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIAnalysis_sourceType_sourceId_fingerprint_provider_model_key"
ON "AIAnalysis"("sourceType", "sourceId", "fingerprint", "provider", "model");

CREATE INDEX "AIAnalysis_sourceType_sourceId_idx"
ON "AIAnalysis"("sourceType", "sourceId");

CREATE INDEX "AIAnalysis_confidence_idx"
ON "AIAnalysis"("confidence");
