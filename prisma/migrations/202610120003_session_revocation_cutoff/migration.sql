-- A login that began before a credential/access change cannot mint a usable
-- session after the transaction deleted the previous sessions.
ALTER TABLE "User" ADD COLUMN "sessionsInvalidBefore" TIMESTAMPTZ(3);
