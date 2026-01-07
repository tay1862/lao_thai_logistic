-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultCrossBorderFee" INTEGER NOT NULL DEFAULT 50000,
    "defaultDomesticFee" INTEGER NOT NULL DEFAULT 20000,
    "trackingPrefixTH" TEXT NOT NULL DEFAULT 'TH',
    "trackingPrefixLA" TEXT NOT NULL DEFAULT 'LA',
    "companyName" TEXT NOT NULL DEFAULT 'Thai-Lao Logistics',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
