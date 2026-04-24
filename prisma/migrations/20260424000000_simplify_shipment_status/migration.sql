-- Migration: Simplify ShipmentStatus enum
-- Removes: arrived_hub, out_for_delivery, return_in_transit
-- Adds: arrived (covers arrived_hub + out_for_delivery stages)
-- returned absorbs: return_in_transit

-- Step 1: Add the new 'arrived' value to the existing enum
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'arrived';

-- Step 2: Migrate existing data BEFORE dropping old values
-- arrived_hub and out_for_delivery both map to the new 'arrived'
UPDATE "Shipment" SET "status" = 'arrived'   WHERE "status" IN ('arrived_hub', 'out_for_delivery');
UPDATE "Shipment" SET "status" = 'returned'  WHERE "status" = 'return_in_transit';

UPDATE "ShipmentEvent" SET "status" = 'arrived'  WHERE "status" IN ('arrived_hub', 'out_for_delivery');
UPDATE "ShipmentEvent" SET "status" = 'returned' WHERE "status" = 'return_in_transit';

-- Step 3: Recreate enum with only the 7 supported values
--         PostgreSQL requires creating a new type, swapping columns, then dropping the old type.

CREATE TYPE "ShipmentStatus_v2" AS ENUM (
  'received',
  'in_transit',
  'arrived',
  'delivered',
  'failed_delivery',
  'returned',
  'cancelled'
);

ALTER TABLE "Shipment"
  ALTER COLUMN "status" TYPE "ShipmentStatus_v2"
  USING "status"::text::"ShipmentStatus_v2";

ALTER TABLE "ShipmentEvent"
  ALTER COLUMN "status" TYPE "ShipmentStatus_v2"
  USING "status"::text::"ShipmentStatus_v2";

DROP TYPE "ShipmentStatus";
ALTER TYPE "ShipmentStatus_v2" RENAME TO "ShipmentStatus";
