/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `originalCategory` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pattern` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "CategoryName" AS ENUM ('Housing', 'Transportation', 'Savings', 'Utilities', 'Insurance', 'Healthcare', 'Entertainment', 'Shopping', 'Income', 'Supermarket', 'Delivery', 'Other');

-- DropForeignKey
ALTER TABLE "Pattern" DROP CONSTRAINT "Pattern_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "categoryId",
DROP COLUMN "originalCategory",
ADD COLUMN     "category" "CategoryName" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Pattern";

-- CreateTable
CREATE TABLE "CategoryPattern" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" "CategoryName" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryPattern_pattern_key" ON "CategoryPattern"("pattern");
