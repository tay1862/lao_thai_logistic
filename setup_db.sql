-- Create Enums
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('STAFF', 'MANAGER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ShipmentDirection" AS ENUM ('TH_TO_LA', 'LA_TO_TH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'RECEIVED_AT_ORIGIN', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'DELIVERED', 'FAILED', 'RETURNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ParcelType" AS ENUM ('DOCUMENT', 'PACKAGE', 'FRAGILE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CodStatus" AS ENUM ('NONE', 'PENDING', 'COLLECTED', 'TRANSFERRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LastMileMethod" AS ENUM ('PICKUP', 'DELIVERY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Branch" AS ENUM ('THAI', 'LAOS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PhotoType" AS ENUM ('RECEIVED', 'DELIVERED', 'SIGNATURE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Tables
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "branch" "Branch" NOT NULL DEFAULT 'LAOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lineId" TEXT,
    "defaultAddress" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_code_key" ON "Customer"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_phone_key" ON "Customer"("phone");

CREATE TABLE IF NOT EXISTS "Shipment" (
    "id" TEXT NOT NULL,
    "companyTracking" TEXT NOT NULL,
    "thaiTracking" TEXT,
    "direction" "ShipmentDirection" NOT NULL,
    "currentStatus" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "parcelType" "ParcelType" NOT NULL,
    "weight" DOUBLE PRECISION,
    "note" TEXT,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "receiverAddress" TEXT,
    "senderName" TEXT,
    "senderPhone" TEXT,
    "senderAddress" TEXT,
    "crossBorderFee" INTEGER NOT NULL,
    "domesticFee" INTEGER,
    "codAmount" INTEGER,
    "codStatus" "CodStatus" NOT NULL DEFAULT 'NONE',
    "lastMileMethod" "LastMileMethod",
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_companyTracking_key" ON "Shipment"("companyTracking");

CREATE TABLE IF NOT EXISTS "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");

CREATE TABLE IF NOT EXISTS "ShipmentPhoto" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShipmentPhoto_shipmentId_idx" ON "ShipmentPhoto"("shipmentId");

CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultCrossBorderFee" INTEGER NOT NULL DEFAULT 50000,
    "defaultDomesticFee" INTEGER NOT NULL DEFAULT 20000,
    "trackingPrefixTH" TEXT NOT NULL DEFAULT 'TH',
    "trackingPrefixLA" TEXT NOT NULL DEFAULT 'LA',
    "companyName" TEXT NOT NULL DEFAULT 'Thai-Lao Logistics',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Keys
DO $$ BEGIN
    ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ShipmentPhoto" ADD CONSTRAINT "ShipmentPhoto_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Seed Admin (Insert only if not exists)
INSERT INTO "User" ("id", "username", "password", "fullName", "role", "branch", "createdAt", "updatedAt")
VALUES ('admin-manual-01', 'admin', '$2b$10$YDWkL287.gGJ9pe8UVTdTOD4am4mgsM7mEoWEohCaWQsvCKHD5DcG', 'System Admin', 'ADMIN', 'LAOS', NOW(), NOW())
ON CONFLICT ("username") DO NOTHING;
