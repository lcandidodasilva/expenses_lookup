import prisma from './db';
import type { CategoryName } from '@prisma/client';
import { Prisma } from '@prisma/client';

const DEFAULT_PATTERNS = {
  Housing: [
    'rent', 'mortgage', 'housing', 'huur', 'hypotheek', 'vve'
  ],
  Transportation: [
    'ns.nl', 'ov-chipkaart', 'ovpay', 'gvb', 'ret', 'htm', 'connexxion', 'arriva', 'uber', 'bolt.eu', 'shell', 'bp', 'esso'
  ],
  Savings: [
    'spaarrekening', 'savings', 'oranje spaarrekening'
  ],
  Utilities: [
    'vodafone', 'kpn', 't-mobile', 'tele2', 'ziggo', 'eneco', 'vattenfall', 'essent', 'greenchoice', 'water', 'gas'
  ],
  Insurance: [
    'insurance', 'verzekering', 'aegon', 'nationale nederlanden', 'centraal beheer'
  ],
  Healthcare: [
    'doctor', 'hospital', 'pharmacy', 'medical', 'apotheek', 'huisarts', 'tandarts', 'fysio', 'ziekenhuis'
  ],
  Entertainment: [
    'netflix', 'spotify', 'disney+', 'videoland', 'prime video', 'hbo', 'pathe', 'kinepolis', 'vue', 'bioscoop', 'cinema', 'theater', 'concert'
  ],
  Shopping: [
    'bol.com', 'coolblue', 'mediamarkt', 'amazon', 'zalando', 'h&m', 'zara', 'uniqlo', 'primark', 'action', 'hema', 'bijenkorf', 'ikea'
  ],
  Income: [
    'salary', 'payroll', 'deposit', 'salaris', 'loon', 'ebay marketplaces', 'connexie'
  ],
  Supermarket: [
    'albert heijn', 'jumbo', 'lidl', 'aldi', 'plus', 'dirk', 'ah to go', 'ah bezorgservice'
  ],
  Delivery: [
    'thuisbezorgd', 'deliveroo', 'uber eats', 'dominos', 'new york pizza', 'takeaway'
  ]
};

export async function initializeDatabase() {
  try {
    // Initialize category patterns
    for (const [category, patterns] of Object.entries(DEFAULT_PATTERNS)) {
      for (const pattern of patterns) {
        await prisma.categoryPattern.upsert({
          where: { pattern },
          update: {},
          create: {
            pattern,
            category: category as CategoryName,
            confidence: 1.0,
            usageCount: 0
          }
        });
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 