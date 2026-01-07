-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('RECEIVED', 'DELIVERED', 'SIGNATURE', 'OTHER');

-- CreateTable
CREATE TABLE "ShipmentPhoto" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShipmentPhoto_shipmentId_idx" ON "ShipmentPhoto"("shipmentId");

-- AddForeignKey
ALTER TABLE "ShipmentPhoto" ADD CONSTRAINT "ShipmentPhoto_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
