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
  const defaultPatterns = {
    Housing: ['rent', 'mortgage', 'housing', 'huur', 'hypotheek', 'vve'],
    Transportation: ['ns.nl', 'ov-chipkaart', 'ovpay', 'gvb', 'ret', 'htm', 'connexxion', 'arriva', 'uber', 'bolt.eu', 'shell', 'bp', 'esso'],
    Savings: ['spaarrekening', 'savings', 'oranje spaarrekening'],
    Utilities: ['vodafone', 'kpn', 't-mobile', 'tele2', 'ziggo', 'eneco', 'vattenfall', 'essent', 'greenchoice', 'water', 'gas'],
    Insurance: ['insurance', 'verzekering', 'aegon', 'nationale nederlanden', 'centraal beheer'],
    Healthcare: ['doctor', 'hospital', 'pharmacy', 'medical', 'apotheek', 'huisarts', 'tandarts', 'fysio', 'ziekenhuis'],
    Entertainment: ['netflix', 'spotify', 'disney+', 'videoland', 'prime video', 'hbo', 'pathe', 'kinepolis', 'vue', 'bioscoop', 'cinema', 'theater', 'concert'],
    Shopping: ['bol.com', 'coolblue', 'mediamarkt', 'amazon', 'zalando', 'h&m', 'zara', 'uniqlo', 'primark', 'action', 'hema', 'bijenkorf', 'ikea'],
    Income: ['salary', 'payroll', 'deposit', 'salaris', 'loon', 'ebay marketplaces', 'connexie'],
    Supermarket: ['albert heijn', 'jumbo', 'lidl', 'aldi', 'plus', 'dirk', 'ah to go', 'ah bezorgservice'],
    Delivery: ['thuisbezorgd', 'deliveroo', 'uber eats', 'dominos', 'new york pizza', 'takeaway']
  };

  for (const [category, patterns] of Object.entries(defaultPatterns)) {
    for (const pattern of patterns) {
      await prisma.categoryPattern.upsert({
        where: { pattern },
        update: {},
        create: {
          pattern,
          category: category as any,
          confidence: 1.0,
          usageCount: 0
        }
      });
    }
  }
}

export async function saveTransactions(transactions: AppTransaction[]) {
  return Promise.all(
    transactions.map(t => 
      prisma.transaction.create({
        data: {
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          account: t.account,
          counterparty: t.counterparty || null,
          notes: t.notes || null,
        }
      })
    )
  );
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryName: string
) {
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { category: categoryName as any }
  });
}

export async function getTransactionsByPeriod(start: Date | string, end: Date | string) {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  return prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
}

export async function getCategories() {
  return prisma.categoryPattern.findMany({
    orderBy: { usageCount: 'desc' }
  });
}

export async function addPattern(categoryName: string, pattern: string) {
  return prisma.categoryPattern.create({
    data: {
      pattern,
      category: categoryName as any,
      confidence: 1.0,
      usageCount: 0
    }
  });
}

export default prisma;