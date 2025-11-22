-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "LayawayStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('SALES', 'EXPENSES', 'INVENTORY', 'CUSTOMERS', 'JOURNAL_ENTRIES');

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "period" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "locationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "alertAt" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendor" TEXT,
    "frequency" "RecurringFrequency" NOT NULL,
    "dayOfMonth" INTEGER,
    "dayOfWeek" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGenerated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layaways" (
    "id" TEXT NOT NULL,
    "layawayNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "LayawayStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "layaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layaway_items" (
    "id" TEXT NOT NULL,
    "layawayId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layaway_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layaway_payments" (
    "id" TEXT NOT NULL,
    "layawayId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layaway_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_exports" (
    "id" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "format" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "fileUrl" TEXT,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budgets_category_idx" ON "budgets"("category");

-- CreateIndex
CREATE INDEX "budgets_locationId_idx" ON "budgets"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_category_period_startDate_locationId_key" ON "budgets"("category", "period", "startDate", "locationId");

-- CreateIndex
CREATE INDEX "recurring_expenses_nextDueDate_idx" ON "recurring_expenses"("nextDueDate");

-- CreateIndex
CREATE INDEX "recurring_expenses_category_idx" ON "recurring_expenses"("category");

-- CreateIndex
CREATE INDEX "recurring_expenses_locationId_idx" ON "recurring_expenses"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "layaways_layawayNumber_key" ON "layaways"("layawayNumber");

-- CreateIndex
CREATE INDEX "layaways_customerId_idx" ON "layaways"("customerId");

-- CreateIndex
CREATE INDEX "layaways_userId_idx" ON "layaways"("userId");

-- CreateIndex
CREATE INDEX "layaways_status_idx" ON "layaways"("status");

-- CreateIndex
CREATE INDEX "layaway_items_layawayId_idx" ON "layaway_items"("layawayId");

-- CreateIndex
CREATE INDEX "layaway_payments_layawayId_idx" ON "layaway_payments"("layawayId");

-- CreateIndex
CREATE INDEX "accounting_exports_type_idx" ON "accounting_exports"("type");

-- CreateIndex
CREATE INDEX "accounting_exports_createdAt_idx" ON "accounting_exports"("createdAt");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaways" ADD CONSTRAINT "layaways_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaways" ADD CONSTRAINT "layaways_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaways" ADD CONSTRAINT "layaways_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaway_items" ADD CONSTRAINT "layaway_items_layawayId_fkey" FOREIGN KEY ("layawayId") REFERENCES "layaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaway_items" ADD CONSTRAINT "layaway_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "layaway_payments" ADD CONSTRAINT "layaway_payments_layawayId_fkey" FOREIGN KEY ("layawayId") REFERENCES "layaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;
