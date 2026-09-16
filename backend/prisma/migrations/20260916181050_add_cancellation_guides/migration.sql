-- CreateTable
CREATE TABLE "CancellationGuide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKey" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "cancelUrl" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CancellationGuide_nameKey_key" ON "CancellationGuide"("nameKey");
