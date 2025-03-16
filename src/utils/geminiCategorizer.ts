import { MainCategory, SubCategory, MAIN_CATEGORIES, CATEGORY_MAPPING } from '@/types/transaction';
import prisma from '@/lib/db';
import { CategoryName } from '@prisma/client';

// Gemini API key
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 5000;

// Function to get category patterns from the database
async function getCategoryPatterns() {
  try {
    const patterns = await prisma.categoryPattern.findMany({
      orderBy: { usageCount: 'desc' }
    });
    
    // Group patterns by category
    const patternsByCategory: Record<string, string[]> = {};
    
    patterns.forEach(pattern => {
      // Use the category field from the database schema
      // We'll format it as "MainCategory -> SubCategory" for the prompt
      const categoryParts = pattern.category.split('_');
      let mainCategory = '';
      let subCategory = '';
      
      if (categoryParts.length >= 2) {
        // Convert from database format (e.g., "FOOD_GROCERIES") to display format
        mainCategory = categoryParts[0];
        
        // Join remaining parts with spaces
        subCategory = categoryParts.slice(1).join(' ');
      } else {
        // Fallback if category format is unexpected
        mainCategory = 'Miscellaneous';
        subCategory = 'Other';
      }
      
      const category = `${mainCategory} -> ${subCategory}`;
      if (!patternsByCategory[category]) {
        patternsByCategory[category] = [];
      }
      patternsByCategory[category].push(pattern.pattern);
    });
    
    return patternsByCategory;
  } catch (error) {
    console.error('Error fetching category patterns:', error);
    return null;
  }
}

// Function to call Gemini API with retry logic
async function callGeminiApi(description: string, patternExamples: string): Promise<{ mainCategory: MainCategory, subCategory: SubCategory } | null> {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      // Gemini API endpoint
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY as string,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert financial advisor helping a family categorize their bank transactions.
You will receive a transaction description and your task is to classify it into one of the following categories.
If a direct category is not found use the "Miscellaneous" category.
Provide the result as a single string with the format: "Category -> Subcategory"

Here are the possible categories and subcategories:

Housing:
    - Mortgage
    - Rent
    - Utilities (Gas, Electricity, Water, Heating)
    - Home Insurance
    - Property Taxes
    - Home Maintenance & Repairs

Transportation:
    - Public Transportation
    - Fuel
    - Car Insurance
    - Car Maintenance & Repairs
    - Parking
    - Road Tax
    - Tolls
    - Ride-Sharing Services
    - OV-chipkaart recharges

Food & Groceries:
    - Groceries
    - Restaurants & Dining Out
    - Takeaway/Delivery
    - Coffee/Snacks

Personal Care & Health:
    - Health Insurance
    - Pharmacy/Medications
    - Gym & Fitness
    - Personal Care Products
    - Doctor/Specialist Visits

Kids & Family:
    - Childcare
    - Kids Activities & Entertainment

Entertainment & Leisure:
    - Movies/Cinema
    - Events/Concerts/Attractions
    - Hobbies & Recreation
    - Lottery/Gambling

Shopping:
    - Clothing
    - Electronics & Appliances
    - Home Goods & Furniture
    - Books & Stationery

Education:
    - Tuition/School Fees
    - Books & Supplies
    - Language Classes

Financial Expenses:
    - Bank Fees
    - Credit Card Payments
    - Loan Payments
    - Transfer Fees

Income:
    - Salary
    - Other Income
    - Compensation

Gifts & Donations:
    - Gifts
    - Charitable Donations

Travel:
    - Accommodation
    - Activities
    - Food
    - Transportation

Miscellaneous:
    - Other

${patternExamples}

Transaction Description: "${description}"

Respond with ONLY the category and subcategory in the format "Category -> Subcategory", nothing else.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 20,
          },
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the response text from Gemini API response
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid Gemini response format');
      }
      
      const categoryText = data.candidates[0].content.parts[0].text.trim();
      
      // Parse the response in format "MainCategory -> SubCategory"
      const parts = categoryText.split('->').map((part: string) => part.trim());
      
      if (parts.length !== 2) {
        console.warn(`Invalid category format from Gemini: ${categoryText}. Expected "MainCategory -> SubCategory". Using fallback.`);
        return null;
      }
      
      const [mainCategoryText, subCategoryText] = parts;
      
      // Normalize category names to match our enum format
      const mainCategory = mainCategoryText as MainCategory;
      const subCategory = subCategoryText as SubCategory;
      
      // Validate that the categories are valid
      if (!MAIN_CATEGORIES.includes(mainCategory)) {
        console.warn(`Invalid main category from Gemini: ${mainCategoryText}. Using fallback.`);
        return null;
      }
      
      // Validate that the subcategory belongs to the main category
      if (!CATEGORY_MAPPING[mainCategory].includes(subCategory)) {
        console.warn(`Subcategory ${subCategory} does not belong to main category ${mainCategory}. Using fallback.`);
        return null;
      }
      
      return { mainCategory, subCategory };
    } catch (error) {
      console.warn(`Gemini API call failed (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error);
      retries++;
      
      if (retries > MAX_RETRIES) {
        console.error('All Gemini API retries failed');
        return null;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return null;
}

export async function categorizeWithGemini(description: string): Promise<{ mainCategory: MainCategory, subCategory: SubCategory }> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found. Using fallback categorization.');
    return fallbackCategorization(description);
  }

  try {
    console.log(`Categorizing transaction: "${description}"`);
    
    // Get patterns from database to enhance the prompt
    const patternsByCategory = await getCategoryPatterns();
    
    // Build a more detailed prompt with examples from the database
    let patternExamples = '';
    if (patternsByCategory) {
      patternExamples = 'Common patterns for each category:\n';
      Object.entries(patternsByCategory).forEach(([category, patterns]) => {
        if (patterns.length > 0) {
          // Take up to 5 patterns per category to keep the prompt manageable
          patternExamples += `- ${category}: ${patterns.slice(0, 5).join(', ')}\n`;
        }
      });
    }

    // Call Gemini API with retry logic
    const categories = await callGeminiApi(description, patternExamples);
    
    // If Gemini categorization failed, use fallback
    if (!categories) {
      console.log(`Gemini categorization failed for "${description}", using fallback`);
      return fallbackCategorization(description);
    }
    
    console.log(`Gemini categorized "${description}" as: ${categories.mainCategory} -> ${categories.subCategory}`);
    return categories;
  } catch (error) {
    console.error('Error getting category from Gemini:', error);
    return fallbackCategorization(description);
  }
}

function fallbackCategorization(description: string): { mainCategory: MainCategory, subCategory: SubCategory } {
  const lowerDesc = description.toLowerCase();
  console.log(`Using fallback categorization for: "${description}"`);
  
  // Housing
  if (lowerDesc.includes('hypotheek') || lowerDesc.includes('mortgage')) {
    return { mainCategory: 'Housing', subCategory: 'Mortgage' };
  }
  if (lowerDesc.includes('huur') || lowerDesc.includes('rent')) {
    return { mainCategory: 'Housing', subCategory: 'Rent' };
  }
  if (lowerDesc.includes('vitens') || lowerDesc.includes('oxxio') || lowerDesc.includes('eneco') || 
      lowerDesc.includes('vattenfall') || lowerDesc.includes('essent') || lowerDesc.includes('greenchoice') || 
      lowerDesc.includes('water') || lowerDesc.includes('gas') || lowerDesc.includes('electricity')) {
    return { mainCategory: 'Housing', subCategory: 'Utilities' };
  }
  if (lowerDesc.includes('woonverzekering') || lowerDesc.includes('home insurance')) {
    return { mainCategory: 'Housing', subCategory: 'Home Insurance' };
  }
  if (lowerDesc.includes('gemeente') && (lowerDesc.includes('aanslag') || lowerDesc.includes('tax'))) {
    return { mainCategory: 'Housing', subCategory: 'Property Taxes' };
  }
  if (lowerDesc.includes('vve') || lowerDesc.includes('home maintenance') || lowerDesc.includes('repair')) {
    return { mainCategory: 'Housing', subCategory: 'Home Maintenance & Repairs' };
  }
  
  // Transportation
  if (lowerDesc.includes('ns.nl') || lowerDesc.includes('ov-chipkaart') || lowerDesc.includes('ovpay') || 
      lowerDesc.includes('gvb') || lowerDesc.includes('ret') || lowerDesc.includes('htm') || 
      lowerDesc.includes('connexxion') || lowerDesc.includes('arriva')) {
    return { mainCategory: 'Transportation', subCategory: 'Public Transportation' };
  }
  if (lowerDesc.includes('shell') || lowerDesc.includes('bp') || lowerDesc.includes('esso') || lowerDesc.includes('fuel')) {
    return { mainCategory: 'Transportation', subCategory: 'Fuel' };
  }
  if (lowerDesc.includes('car insurance') || lowerDesc.includes('autoverzekering')) {
    return { mainCategory: 'Transportation', subCategory: 'Car Insurance' };
  }
  if (lowerDesc.includes('car maintenance') || lowerDesc.includes('car repair') || lowerDesc.includes('garage')) {
    return { mainCategory: 'Transportation', subCategory: 'Car Maintenance & Repairs' };
  }
  if (lowerDesc.includes('parking') || lowerDesc.includes('parkeren') || lowerDesc.includes('q-park') || lowerDesc.includes('p+r')) {
    return { mainCategory: 'Transportation', subCategory: 'Parking' };
  }
  if (lowerDesc.includes('wegenbelasting') || lowerDesc.includes('road tax')) {
    return { mainCategory: 'Transportation', subCategory: 'Road Tax' };
  }
  if (lowerDesc.includes('toll') || lowerDesc.includes('tol')) {
    return { mainCategory: 'Transportation', subCategory: 'Tolls' };
  }
  if (lowerDesc.includes('uber') || lowerDesc.includes('bolt.eu')) {
    return { mainCategory: 'Transportation', subCategory: 'Ride-Sharing Services' };
  }
  if (lowerDesc.includes('ov-chipkaart') && lowerDesc.includes('recharge')) {
    return { mainCategory: 'Transportation', subCategory: 'OV-chipkaart recharges' };
  }
  
  // Food & Groceries
  if (lowerDesc.includes('albert heijn') || lowerDesc.includes('jumbo') || lowerDesc.includes('lidl') || 
      lowerDesc.includes('aldi') || lowerDesc.includes('plus') || lowerDesc.includes('dirk') || 
      lowerDesc.includes('ah to go') || lowerDesc.includes('ah bezorgservice') || lowerDesc.includes('dekamarkt')) {
    return { mainCategory: 'Food & Groceries', subCategory: 'Groceries' };
  }
  if (lowerDesc.includes('restaurant') || lowerDesc.includes('dining') || lowerDesc.includes('cafe') || 
      lowerDesc.includes('bar') || lowerDesc.includes('eetcafe') || lowerDesc.includes('iens') || 
      lowerDesc.includes('dinner') || lowerDesc.includes('lunch') || lowerDesc.includes('bistro') || 
      lowerDesc.includes('brasserie') || lowerDesc.includes('mcdonalds') || lowerDesc.includes('burger king') || 
      lowerDesc.includes('kfc')) {
    return { mainCategory: 'Food & Groceries', subCategory: 'Restaurants & Dining Out' };
  }
  if (lowerDesc.includes('thuisbezorgd') || lowerDesc.includes('deliveroo') || lowerDesc.includes('uber eats') || 
      lowerDesc.includes('dominos') || lowerDesc.includes('new york pizza') || lowerDesc.includes('takeaway') || 
      lowerDesc.includes('pizza') || lowerDesc.includes('bezorg')) {
    return { mainCategory: 'Food & Groceries', subCategory: 'Takeaway/Delivery' };
  }
  if (lowerDesc.includes('coffee') || lowerDesc.includes('koffie') || lowerDesc.includes('snack')) {
    return { mainCategory: 'Food & Groceries', subCategory: 'Coffee/Snacks' };
  }
  
  // Personal Care & Health
  if (lowerDesc.includes('zilveren kruis') || lowerDesc.includes('health insurance') || lowerDesc.includes('zorgverzekering')) {
    return { mainCategory: 'Personal Care & Health', subCategory: 'Health Insurance' };
  }
  if (lowerDesc.includes('apotheek') || lowerDesc.includes('pharmacy') || lowerDesc.includes('etos') || 
      lowerDesc.includes('kruidvat') || lowerDesc.includes('da') || lowerDesc.includes('medicine') || 
      lowerDesc.includes('medicijn') || lowerDesc.includes('drug') || lowerDesc.includes('prescription') || 
      lowerDesc.includes('recept')) {
    return { mainCategory: 'Personal Care & Health', subCategory: 'Pharmacy/Medications' };
  }
  if (lowerDesc.includes('gym') || lowerDesc.includes('fitness') || lowerDesc.includes('sport')) {
    return { mainCategory: 'Personal Care & Health', subCategory: 'Gym & Fitness' };
  }
  if (lowerDesc.includes('personal care') || lowerDesc.includes('toiletries') || lowerDesc.includes('cosmetics')) {
    return { mainCategory: 'Personal Care & Health', subCategory: 'Personal Care Products' };
  }
  if (lowerDesc.includes('doctor') || lowerDesc.includes('hospital') || lowerDesc.includes('medical') || 
      lowerDesc.includes('huisarts') || lowerDesc.includes('tandarts') || lowerDesc.includes('fysio') || 
      lowerDesc.includes('ziekenhuis')) {
    return { mainCategory: 'Personal Care & Health', subCategory: 'Doctor/Specialist Visits' };
  }
  
  // Kids & Family
  if (lowerDesc.includes('childcare') || lowerDesc.includes('kinderopvang')) {
    return { mainCategory: 'Kids & Family', subCategory: 'Childcare' };
  }
  if (lowerDesc.includes('kids') || lowerDesc.includes('children') || lowerDesc.includes('toys') || 
      lowerDesc.includes('intertoys') || lowerDesc.includes('funky jungle')) {
    return { mainCategory: 'Kids & Family', subCategory: 'Kids Activities & Entertainment' };
  }
  
  // Entertainment & Leisure
  if (lowerDesc.includes('cinema') || lowerDesc.includes('movie') || lowerDesc.includes('vue') || 
      lowerDesc.includes('pathe') || lowerDesc.includes('kinepolis') || lowerDesc.includes('bioscoop')) {
    return { mainCategory: 'Entertainment & Leisure', subCategory: 'Movies/Cinema' };
  }
  if (lowerDesc.includes('event') || lowerDesc.includes('concert') || lowerDesc.includes('attraction') || 
      lowerDesc.includes('theater') || lowerDesc.includes('theatre')) {
    return { mainCategory: 'Entertainment & Leisure', subCategory: 'Events/Concerts/Attractions' };
  }
  if (lowerDesc.includes('hobby') || lowerDesc.includes('recreation') || lowerDesc.includes('netflix') || 
      lowerDesc.includes('spotify') || lowerDesc.includes('disney+') || lowerDesc.includes('videoland') || 
      lowerDesc.includes('prime video') || lowerDesc.includes('hbo')) {
    return { mainCategory: 'Entertainment & Leisure', subCategory: 'Hobbies & Recreation' };
  }
  if (lowerDesc.includes('lottery') || lowerDesc.includes('gambling') || lowerDesc.includes('loterij')) {
    return { mainCategory: 'Entertainment & Leisure', subCategory: 'Lottery/Gambling' };
  }
  
  // Shopping
  if (lowerDesc.includes('h&m') || lowerDesc.includes('zara') || lowerDesc.includes('uniqlo') || 
      lowerDesc.includes('primark') || lowerDesc.includes('c&a') || lowerDesc.includes('we fashion') || 
      lowerDesc.includes('only') || lowerDesc.includes('vero moda') || lowerDesc.includes('jack & jones') || 
      lowerDesc.includes('nike') || lowerDesc.includes('adidas') || lowerDesc.includes('puma') || 
      lowerDesc.includes('clothing') || lowerDesc.includes('kleding') || lowerDesc.includes('fashion')) {
    return { mainCategory: 'Shopping', subCategory: 'Clothing' };
  }
  if (lowerDesc.includes('electronics') || lowerDesc.includes('appliances') || lowerDesc.includes('mediamarkt') || 
      lowerDesc.includes('coolblue')) {
    return { mainCategory: 'Shopping', subCategory: 'Electronics & Appliances' };
  }
  if (lowerDesc.includes('ikea') || lowerDesc.includes('furniture') || lowerDesc.includes('home goods') || 
      lowerDesc.includes('praxis') || lowerDesc.includes('gamma') || lowerDesc.includes('karwei') || 
      lowerDesc.includes('hornbach') || lowerDesc.includes('home depot') || lowerDesc.includes('lamp') || 
      lowerDesc.includes('decoration') || lowerDesc.includes('home improvement')) {
    return { mainCategory: 'Shopping', subCategory: 'Home Goods & Furniture' };
  }
  if (lowerDesc.includes('books') || lowerDesc.includes('stationery')) {
    return { mainCategory: 'Shopping', subCategory: 'Books & Stationery' };
  }
  
  // Education
  if (lowerDesc.includes('tuition') || lowerDesc.includes('school fees')) {
    return { mainCategory: 'Education', subCategory: 'Tuition/School Fees' };
  }
  if (lowerDesc.includes('books') || lowerDesc.includes('supplies') && lowerDesc.includes('school')) {
    return { mainCategory: 'Education', subCategory: 'Books & Supplies' };
  }
  if (lowerDesc.includes('mark de jong') || lowerDesc.includes('aulas de holandes') || 
      lowerDesc.includes('language') || lowerDesc.includes('dutch') || lowerDesc.includes('holandes') || 
      lowerDesc.includes('taalcursus')) {
    return { mainCategory: 'Education', subCategory: 'Language Classes' };
  }
  
  // Financial Expenses
  if (lowerDesc.includes('bank fees') || lowerDesc.includes('kosten oranjepakket') || 
      lowerDesc.includes('kosten tweede rekeninghouder')) {
    return { mainCategory: 'Financial Expenses', subCategory: 'Bank Fees' };
  }
  if (lowerDesc.includes('credit card') || lowerDesc.includes('creditcard')) {
    return { mainCategory: 'Financial Expenses', subCategory: 'Credit Card Payments' };
  }
  if (lowerDesc.includes('loan') || lowerDesc.includes('lening')) {
    return { mainCategory: 'Financial Expenses', subCategory: 'Loan Payments' };
  }
  if (lowerDesc.includes('transfer fee') || lowerDesc.includes('transfer provisie')) {
    return { mainCategory: 'Financial Expenses', subCategory: 'Transfer Fees' };
  }
  
  // Income
  if (lowerDesc.includes('salary') || lowerDesc.includes('payroll') || lowerDesc.includes('deposit') || 
      lowerDesc.includes('salaris') || lowerDesc.includes('loon') || lowerDesc.includes('connexie') || 
      lowerDesc.includes('ebay marketplaces')) {
    return { mainCategory: 'Income', subCategory: 'Salary' };
  }
  if (lowerDesc.includes('wise') || lowerDesc.includes('zalando payments') || 
      lowerDesc.includes('oranje spaarrekening') || lowerDesc.includes('interest')) {
    return { mainCategory: 'Income', subCategory: 'Other Income' };
  }
  if (lowerDesc.includes('compensation') || lowerDesc.includes('refund')) {
    return { mainCategory: 'Income', subCategory: 'Compensation' };
  }
  
  // Gifts & Donations
  if (lowerDesc.includes('gift')) {
    return { mainCategory: 'Gifts & Donations', subCategory: 'Gifts' };
  }
  if (lowerDesc.includes('donation') || lowerDesc.includes('stg care nederland') || lowerDesc.includes('charity')) {
    return { mainCategory: 'Gifts & Donations', subCategory: 'Charitable Donations' };
  }
  
  // Travel
  if (lowerDesc.includes('hotel') || lowerDesc.includes('airbnb') || lowerDesc.includes('accommodation')) {
    return { mainCategory: 'Travel', subCategory: 'Accommodation' };
  }
  if (lowerDesc.includes('activities') && lowerDesc.includes('vacation')) {
    return { mainCategory: 'Travel', subCategory: 'Activities' };
  }
  if (lowerDesc.includes('food') && lowerDesc.includes('vacation')) {
    return { mainCategory: 'Travel', subCategory: 'Food' };
  }
  if (lowerDesc.includes('transportation') && lowerDesc.includes('vacation')) {
    return { mainCategory: 'Travel', subCategory: 'Transportation' };
  }
  
  // If no specific category is found, return Miscellaneous -> Other
  console.log(`No pattern matched for: "${description}", categorizing as "Miscellaneous -> Other"`);
  return { mainCategory: 'Miscellaneous', subCategory: 'Other' };
} 