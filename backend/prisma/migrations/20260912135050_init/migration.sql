-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Detection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "from" TEXT,
    "subject" TEXT,
    "service" TEXT,
    "price" REAL,
    "currency" TEXT,
    "cycle" TEXT,
    "trialEndsAt" DATETIME,
    "confidence" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Detection_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Detection_emailId_key" ON "Detection"("emailId");
