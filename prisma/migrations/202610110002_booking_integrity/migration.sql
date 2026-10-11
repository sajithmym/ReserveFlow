-- Prisma cannot represent exclusion constraints; apply migrations, never db push.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Resource" ADD CONSTRAINT "resource_positive_capacity"
  CHECK ("capacity" IS NULL OR "capacity" > 0);

ALTER TABLE "Reservation" ADD CONSTRAINT "reservation_valid_range"
  CHECK ("startAt" < "endAt");

ALTER TABLE "Reservation" ADD CONSTRAINT "reservation_no_overlap_confirmed"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("status" = 'CONFIRMED');
