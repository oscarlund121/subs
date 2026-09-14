/*
  Warnings:

  - You are about to drop the column `body` on the `Detection` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Detection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "from" TEXT,
    "subject" TEXT,
    "snippet" TEXT,
    "service" TEXT,
    "category" TEXT,
    "price" REAL,
    "currency" TEXT,
    "cycle" TEXT,
    "renewalAt" DATETIME,
    "trialEndsAt" DATETIME,
    "confidence" REAL,
    "parseReasons" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Detection_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Detection" ("confidence", "createdAt", "currency", "cycle", "emailId", "from", "id", "price", "service", "snippet", "status", "subject", "subscriptionId", "trialEndsAt", "updatedAt") SELECT "confidence", "createdAt", "currency", "cycle", "emailId", "from", "id", "price", "service", "snippet", "status", "subject", "subscriptionId", "trialEndsAt", "updatedAt" FROM "Detection";
DROP TABLE "Detection";
ALTER TABLE "new_Detection" RENAME TO "Detection";
CREATE UNIQUE INDEX "Detection_emailId_key" ON "Detection"("emailId");
CREATE INDEX "Detection_status_createdAt_idx" ON "Detection"("status", "createdAt");
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DKK',
    "cycle" TEXT NOT NULL DEFAULT 'monthly',
    "nextRenewal" DATETIME NOT NULL,
    "trialEndsAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'Website',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Subscription" ("category", "createdAt", "currency", "cycle", "id", "name", "nextRenewal", "notes", "price", "source", "status", "trialEndsAt", "updatedAt") SELECT "category", "createdAt", "currency", "cycle", "id", "name", "nextRenewal", "notes", "price", "source", "status", "trialEndsAt", "updatedAt" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE INDEX "Subscription_nameKey_idx" ON "Subscription"("nameKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
