import { PrismaClient } from '@prisma/client';
import { Transaction as AppTransaction } from '@/types/transaction';

interface PatternType {
  id: string;
  pattern: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  confidence: number;
  usageCount: number;
}

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function initializeCategories() {
  const defaultCategories = [
    { name: 'Housing', description: 'Rent, mortgage, and housing-related expenses' },
    { name: 'Transportation', description: 'Public transport, fuel, and vehicle expenses' },
    { name: 'Savings', description: 'Savings and investments' },
    { name: 'Utilities', description: 'Electricity, water, internet, and phone bills' },
    { name: 'Insurance', description: 'Health, home, and other insurance' },
    { name: 'Healthcare', description: 'Medical expenses and healthcare' },
    { name: 'Entertainment', description: 'Movies, games, and leisure activities' },
    { name: 'Shopping', description: 'General shopping and retail' },
    { name: 'Income', description: 'Salary, freelance, and other income' },
    { name: 'Supermarket', description: 'Grocery and supermarket purchases' },
    { name: 'Delivery', description: 'Food delivery and takeaway' },
    { name: 'Other', description: 'Uncategorized transactions' },
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
}

export async function saveTransactions(transactions: AppTransaction[]) {
  const dbTransactions = transactions.map(async (t) => {
    // Find or create category
    const category = await prisma.category.findUnique({
      where: { name: t.category || 'Other' },
    });

    return prisma.transaction.create({
      data: {
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        categoryId: category?.id,
        account: t.account,
        counterparty: t.counterparty || null,
        notes: t.notes || null,
        originalCategory: t.category || 'Other',
      },
    });
  });

  return Promise.all(dbTransactions);
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryName: string
) {
  const category = await prisma.category.findUnique({
    where: { name: categoryName },
  });

  if (!category) {
    throw new Error(`Category ${categoryName} not found`);
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { categoryId: category.id },
    include: { category: true },
  });

  // Update pattern confidence based on user correction
  if (transaction.originalCategory && transaction.originalCategory !== categoryName) {
    // Decrease confidence for the original pattern
    await updatePatternConfidence(transaction.description, transaction.originalCategory, false);
    // Increase confidence for the new pattern
    await updatePatternConfidence(transaction.description, categoryName, true);
  }

  return transaction;
}

async function updatePatternConfidence(
  description: string,
  categoryName: string,
  increase: boolean
) {
  const category = await prisma.category.findUnique({
    where: { name: categoryName },
    include: { patterns: true },
  });

  if (!category) return;

  // Find matching patterns
  const matchingPatterns = category.patterns.filter((p: PatternType) => 
    description.toLowerCase().includes(p.pattern.toLowerCase())
  );

  for (const pattern of matchingPatterns) {
    await prisma.pattern.update({
      where: { id: pattern.id },
      data: {
        confidence: increase ? 
          Math.min(pattern.confidence + 0.1, 1.0) : 
          Math.max(pattern.confidence - 0.1, 0.1),
        usageCount: pattern.usageCount + 1,
      },
    });
  }
}

export async function getTransactionsByPeriod(start: Date | string, end: Date | string) {
  // Ensure dates are Date objects
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  return prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      date: 'desc',
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    include: {
      patterns: true,
    },
  });
}

export async function addPattern(categoryName: string, pattern: string) {
  const category = await prisma.category.findUnique({
    where: { name: categoryName },
  });

  if (!category) {
    throw new Error(`Category ${categoryName} not found`);
  }

  return prisma.pattern.create({
    data: {
      pattern,
      categoryId: category.id,
    },
  });
}

export default prisma;