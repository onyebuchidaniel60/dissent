ALTER TABLE "bounty_allocations" ADD COLUMN "settlement_id" text;
UPDATE "bounty_allocations" SET "settlement_id" = "id"::text WHERE "settlement_id" IS NULL;
ALTER TABLE "bounty_allocations" ALTER COLUMN "settlement_id" SET NOT NULL;
