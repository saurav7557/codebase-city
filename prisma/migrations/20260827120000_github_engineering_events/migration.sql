-- Make the normalized GitHub event identity database-enforced. Existing events
-- are preserved; sourceId is populated for every Phase 4B event.
CREATE UNIQUE INDEX "EngineeringEvent_source_sourceId_type_key"
ON "EngineeringEvent"("source", "sourceId", "type");
