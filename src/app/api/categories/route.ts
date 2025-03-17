import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { DEFAULT_CATEGORIES, MainCategory as AppMainCategory, SubCategory as AppSubCategory } from '@/types/transaction';
import { MainCategory, SubCategory } from '@prisma/client';

// Initialize default category patterns
const DEFAULT_PATTERNS: Record<string, string[]> = {
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

// Map old categories to new mainCategory and subCategory
const CATEGORY_MAPPING: Record<string, { mainCategory: AppMainCategory, subCategory: AppSubCategory }> = {
  Housing: { mainCategory: 'Housing', subCategory: 'Rent' },
  Transportation: { mainCategory: 'Transportation', subCategory: 'Public Transportation' },
  Savings: { mainCategory: 'Financial Expenses', subCategory: 'Other' },
  Utilities: { mainCategory: 'Housing', subCategory: 'Utilities' },
  Insurance: { mainCategory: 'Personal Care & Health', subCategory: 'Health Insurance' },
  Healthcare: { mainCategory: 'Personal Care & Health', subCategory: 'Doctor/Specialist Visits' },
  Entertainment: { mainCategory: 'Entertainment & Leisure', subCategory: 'Hobbies & Recreation' },
  Shopping: { mainCategory: 'Shopping', subCategory: 'Home Goods & Furniture' },
  Income: { mainCategory: 'Income', subCategory: 'Salary' },
  Supermarket: { mainCategory: 'Food & Groceries', subCategory: 'Groceries' },
  Delivery: { mainCategory: 'Food & Groceries', subCategory: 'Takeaway/Delivery' }
};

// Helper function to convert app category names to database enum values
function convertToDatabaseCategories(mainCategory: AppMainCategory, subCategory: AppSubCategory): { mainCategory: MainCategory, subCategory: SubCategory } {
  // Convert main category (replace spaces and special characters)
  let dbMainCategoryStr = mainCategory.replace(/\s+&\s+/g, 'And').replace(/\s+/g, '');
  
  // Convert subcategory (replace spaces and special characters)
  let dbSubCategoryStr = subCategory.replace(/\s+&\s+/g, 'And').replace(/\//g, '').replace(/\s+/g, '');
  
  // Cast to enum types
  const dbMainCategory = dbMainCategoryStr as MainCategory;
  const dbSubCategory = dbSubCategoryStr as SubCategory;
  
  return { mainCategory: dbMainCategory, subCategory: dbSubCategory };
}

export async function PUT() {
  try {
    // Initialize category patterns
    for (const [category, patterns] of Object.entries(DEFAULT_PATTERNS)) {
      const { mainCategory, subCategory } = CATEGORY_MAPPING[category] || { 
        mainCategory: 'Miscellaneous' as AppMainCategory, 
        subCategory: 'Other' as AppSubCategory 
      };
      
      // Convert app categories to database enum values
      const { mainCategory: dbMainCategory, subCategory: dbSubCategory } = 
        convertToDatabaseCategories(mainCategory, subCategory);
      
      for (const pattern of patterns) {
        await prisma.categoryPattern.upsert({
          where: { pattern },
          update: {},
          create: {
            pattern,
            mainCategory: dbMainCategory,
            subCategory: dbSubCategory,
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