import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { DEFAULT_CATEGORIES } from '@/types/transaction';

// Initialize default category patterns
const DEFAULT_PATTERNS = {
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

export async function PUT() {
  try {
    // Initialize category patterns
    for (const [category, patterns] of Object.entries(DEFAULT_PATTERNS)) {
      for (const pattern of patterns) {
        await prisma.categoryPattern.upsert({
          where: { pattern },
          update: {},
          create: {
            pattern,
            category: category as any, // Using 'any' here because TypeScript doesn't recognize the string literal type
            confidence: 1.0,
            usageCount: 0
          }
        });
      }
    }

    return NextResponse.json({ message: 'Categories initialized successfully' });
  } catch (error) {
    console.error('Error initializing categories:', error);
    return NextResponse.json(
      { error: 'Failed to initialize categories' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const patterns = await prisma.categoryPattern.findMany({
      orderBy: { usageCount: 'desc' }
    });
    return NextResponse.json(patterns);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 