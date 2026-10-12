CREATE TABLE "RateLimit" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rate_limit_positive_count" CHECK ("count" > 0)
);
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
CREATE INDEX "RateLimit_lastRequest_idx" ON "RateLimit"("lastRequest");
