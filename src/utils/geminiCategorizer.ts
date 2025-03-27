import { MainCategory, SubCategory, MAIN_CATEGORIES, CATEGORY_MAPPING } from '@/types/transaction';
import prisma from '@/lib/db';
import { $Enums } from '@prisma/client';

// Gemini API key
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 5000;

// Simple in-memory cache to avoid repeated API calls for similar descriptions
const categoryCache: Record<string, { mainCategory: MainCategory, subCategory: SubCategory }> = {};

// Function to get category patterns from the database
async function getCategoryPatterns() {
  try {
    const patterns = await prisma.categoryPattern.findMany({
      orderBy: { usageCount: 'desc' }
    });
    
    // Group patterns by category
    const patternsByCategory: Record<string, string[]> = {};
    
    patterns.forEach(pattern => {
      // Format it as "MainCategory -> SubCategory" for the prompt
      const mainCategory = pattern.mainCategory;
      const subCategory = pattern.subCategory;
      
      // Convert from database format to display format
      const formattedMainCategory = mainCategory.replace(/([A-Z])/g, ' $1').trim().replace(/And/g, '&');
      const formattedSubCategory = subCategory.replace(/([A-Z])/g, ' $1').trim().replace(/And/g, '&');
      
      const category = `${formattedMainCategory} -> ${formattedSubCategory}`;
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
async function callGeminiApi(
  description: string, 
  transactionType: 'credit' | 'debit',
  patternExamples: string
): Promise<{ mainCategory: MainCategory, subCategory: SubCategory } | null> {
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
IMPORTANT: This is a ${transactionType.toUpperCase()} transaction (${transactionType === 'credit' ? 'money coming in' : 'money going out'}).
If a direct category is not found, use the "Miscellaneous" category.
Provide the result as a single string with the format: "Category -> Subcategory"

Here are the possible categories and subcategories:

Housing: (ONLY for DEBIT transactions)
    - Mortgage
    - Rent
    - Utilities (Gas, Electricity, Water, Heating)
    - Home Insurance
    - Property Taxes
    - Home Maintenance & Repairs

Transportation: (ONLY for DEBIT transactions)
    - Public Transportation
    - Fuel
    - Car Insurance
    - Car Maintenance & Repairs
    - Parking
    - Road Tax
    - Tolls
    - Ride-Sharing Services
    - OV-chipkaart recharges

Food & Groceries: (ONLY for DEBIT transactions)
    - Groceries
    - Restaurants & Dining Out
    - Takeaway/Delivery
    - Coffee/Snacks

Personal Care & Health: (ONLY for DEBIT transactions)
    - Health Insurance
    - Pharmacy/Medications
    - Gym & Fitness
    - Personal Care Products
    - Doctor/Specialist Visits

Kids & Family: (ONLY for DEBIT transactions)
    - Childcare
    - Kids Activities & Entertainment

Entertainment & Leisure: (ONLY for DEBIT transactions)
    - Movies/Cinema
    - Events/Concerts/Attractions
    - Hobbies & Recreation
    - Lottery/Gambling

Shopping: (ONLY for DEBIT transactions)
    - Clothing
    - Electronics & Appliances
    - Home Goods & Furniture
    - Books & Stationery

Education: (ONLY for DEBIT transactions)
    - Tuition/School Fees
    - Books & Supplies
    - Language Classes

Financial Expenses: (ONLY for DEBIT transactions)
    - Bank Fees
    - Credit Card Payments
    - Loan Payments
    - Transfer Fees

Income: (ONLY for CREDIT transactions)
    - Salary
    - Other Income
    - Compensation

Gifts & Donations: (Depends on transaction type)
    - Gifts (DEBIT if sending, CREDIT if receiving)
    - Charitable Donations (ONLY for DEBIT transactions)

Travel: (ONLY for DEBIT transactions)
    - Accommodation
    - Activities
    - Food
    - Transportation

Miscellaneous:
    - Other

${patternExamples}

Transaction Description: "${description}"
Transaction Type: ${transactionType.toUpperCase()} (${transactionType === 'credit' ? 'money coming in' : 'money going out'})

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
      
      let [mainCategoryText, subCategoryText] = parts;
      
      // Normalize category names to match our enum format
      // Convert display format to database format
      mainCategoryText = mainCategoryText.replace(/\s*&\s*/g, 'And').replace(/\s+/g, '');
      subCategoryText = subCategoryText.replace(/\s*&\s*/g, 'And').replace(/\/|\s+/g, '');
      
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

export async function categorizeWithGemini(
  description: string,
  transactionType: 'credit' | 'debit' = 'debit'
): Promise<{ mainCategory: MainCategory, subCategory: SubCategory }> {
  // Generate a cache key based on description and transaction type
  const cacheKey = `${description.toLowerCase()}_${transactionType}`;
  
  // Check cache first
  if (categoryCache[cacheKey]) {
    return categoryCache[cacheKey];
  }
  
  // If no Gemini API key, use fallback categorization
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found. Using fallback categorization.');
    const result = fallbackCategorization(description, transactionType);
    categoryCache[cacheKey] = result; // Cache the result
    return result;
  }

  try {
    console.log(`Categorizing transaction: "${description}" (${transactionType})`);
    
    // First try with our enhanced local categorization
    const localCategorization = tryLocalCategorization(description, transactionType);
    if (localCategorization) {
      console.log(`Local categorization succeeded for "${description}": ${localCategorization.mainCategory} -> ${localCategorization.subCategory}`);
      categoryCache[cacheKey] = localCategorization; // Cache the result
      return localCategorization;
    }
    
    // If local categorization fails, then try with Gemini
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
    const categories = await callGeminiApi(description, transactionType, patternExamples);
    
    // If Gemini categorization failed, use fallback
    if (!categories) {
      console.log(`Gemini categorization failed for "${description}", using fallback`);
      const fallbackResult = fallbackCategorization(description, transactionType);
      categoryCache[cacheKey] = fallbackResult; // Cache the result
      return fallbackResult;
    }
    
    console.log(`Gemini categorized "${description}" as: ${categories.mainCategory} -> ${categories.subCategory}`);
    categoryCache[cacheKey] = categories; // Cache the result
    return categories;
  } catch (error) {
    console.error('Error getting category from Gemini:', error);
    const fallbackResult = fallbackCategorization(description, transactionType);
    categoryCache[cacheKey] = fallbackResult; // Cache the result
    return fallbackResult;
  }
}

// Try to categorize using local pattern matching first before using Gemini
function tryLocalCategorization(
  description: string, 
  transactionType: 'credit' | 'debit'
): { mainCategory: MainCategory, subCategory: SubCategory } | null {
  const lowerDesc = description.toLowerCase();
  
  // For CREDIT transactions, always check for income patterns first
  if (transactionType === 'credit') {
    // Income - Salary
    if (lowerDesc.includes('salary') || lowerDesc.includes('payroll') || 
        lowerDesc.includes('salaris') || lowerDesc.includes('loon') || 
        lowerDesc.includes('wages') || lowerDesc.includes('bonus') ||
        lowerDesc.includes('payout') || lowerDesc.includes('abn amro') ||
        lowerDesc.includes('payment from') || 
        lowerDesc.includes('ing bank') || lowerDesc.includes('deposit')) {
      return { mainCategory: 'Income', subCategory: 'Salary' };
    }
    
    // Income - Other Income
    if (lowerDesc.includes('interest') || lowerDesc.includes('dividend') || 
        lowerDesc.includes('investment') || lowerDesc.includes('earnings') ||
        lowerDesc.includes('rente') || lowerDesc.includes('spaarrekening')) {
      return { mainCategory: 'Income', subCategory: 'OtherIncome' };
    }
    
    // Income - Compensation
    if (lowerDesc.includes('refund') || lowerDesc.includes('rebate') || 
        lowerDesc.includes('compensation') || lowerDesc.includes('cashback') ||
        lowerDesc.includes('teruggave') || lowerDesc.includes('terugbetaling') ||
        lowerDesc.includes('return') || lowerDesc.includes('correction')) {
      return { mainCategory: 'Income', subCategory: 'Compensation' };
    }
    
    // Default for unknown credit transactions
    return { mainCategory: 'Income', subCategory: 'OtherIncome' };
  }
  
  // For DEBIT transactions, match against the patterns

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
    return { mainCategory: 'Housing', subCategory: 'HomeInsurance' };
  }
  if (lowerDesc.includes('gemeente') && (lowerDesc.includes('aanslag') || lowerDesc.includes('tax'))) {
    return { mainCategory: 'Housing', subCategory: 'PropertyTaxes' };
  }
  if (lowerDesc.includes('vve') || lowerDesc.includes('home maintenance') || lowerDesc.includes('repair')) {
    return { mainCategory: 'Housing', subCategory: 'HomeMaintenanceAndRepairs' };
  }
  
  // Transportation
  if (lowerDesc.includes('ns.nl') || lowerDesc.includes('ov-chipkaart') || lowerDesc.includes('ovpay') || 
      lowerDesc.includes('gvb') || lowerDesc.includes('ret') || lowerDesc.includes('htm') || 
      lowerDesc.includes('connexxion') || lowerDesc.includes('arriva')) {
    return { mainCategory: 'Transportation', subCategory: 'PublicTransportation' };
  }
  if (lowerDesc.includes('shell') || lowerDesc.includes('bp') || lowerDesc.includes('esso') || 
      lowerDesc.includes('fuel') || lowerDesc.includes('tango') || lowerDesc.includes('tinq') ||
      lowerDesc.includes('texaco') || lowerDesc.includes('gas station')) {
    return { mainCategory: 'Transportation', subCategory: 'Fuel' };
  }
  if (lowerDesc.includes('car insurance') || lowerDesc.includes('autoverzekering')) {
    return { mainCategory: 'Transportation', subCategory: 'CarInsurance' };
  }
  if (lowerDesc.includes('car maintenance') || lowerDesc.includes('car repair') || lowerDesc.includes('garage')) {
    return { mainCategory: 'Transportation', subCategory: 'CarMaintenanceAndRepairs' };
  }
  if (lowerDesc.includes('parking') || lowerDesc.includes('parkeren') || lowerDesc.includes('q-park') || lowerDesc.includes('p+r')) {
    return { mainCategory: 'Transportation', subCategory: 'Parking' };
  }
  if (lowerDesc.includes('wegenbelasting') || lowerDesc.includes('road tax')) {
    return { mainCategory: 'Transportation', subCategory: 'RoadTax' };
  }
  if (lowerDesc.includes('toll') || lowerDesc.includes('tol')) {
    return { mainCategory: 'Transportation', subCategory: 'Tolls' };
  }
  if (lowerDesc.includes('uber') || lowerDesc.includes('bolt.eu')) {
    return { mainCategory: 'Transportation', subCategory: 'RideSharingServices' };
  }
  if (lowerDesc.includes('ov-chipkaart') && lowerDesc.includes('recharge')) {
    return { mainCategory: 'Transportation', subCategory: 'OVChipkaartRecharges' };
  }
  
  // Food & Groceries
  if (lowerDesc.includes('albert heijn') || lowerDesc.includes('jumbo') || lowerDesc.includes('lidl') || 
      lowerDesc.includes('aldi') || lowerDesc.includes('plus') || lowerDesc.includes('dirk') || 
      lowerDesc.includes('ah to go') || lowerDesc.includes('ah bezorgservice') || lowerDesc.includes('dekamarkt')) {
    return { mainCategory: 'FoodAndGroceries', subCategory: 'Groceries' };
  }
  if (lowerDesc.includes('restaurant') || lowerDesc.includes('dining') || lowerDesc.includes('cafe') || 
      lowerDesc.includes('bar') || lowerDesc.includes('eetcafe') || lowerDesc.includes('iens') || 
      lowerDesc.includes('dinner') || lowerDesc.includes('lunch') || lowerDesc.includes('bistro') || 
      lowerDesc.includes('brasserie') || lowerDesc.includes('mcdonalds') || lowerDesc.includes('burger king') || 
      lowerDesc.includes('kfc')) {
    return { mainCategory: 'FoodAndGroceries', subCategory: 'RestaurantsAndDiningOut' };
  }
  if (lowerDesc.includes('thuisbezorgd') || lowerDesc.includes('deliveroo') || lowerDesc.includes('uber eats') || 
      lowerDesc.includes('dominos') || lowerDesc.includes('new york pizza') || lowerDesc.includes('takeaway') || 
      lowerDesc.includes('pizza') || lowerDesc.includes('bezorg')) {
    return { mainCategory: 'FoodAndGroceries', subCategory: 'TakeawayDelivery' };
  }
  if (lowerDesc.includes('coffee') || lowerDesc.includes('koffie') || lowerDesc.includes('snack')) {
    return { mainCategory: 'FoodAndGroceries', subCategory: 'CoffeeSnacks' };
  }
  
  // Personal Care & Health
  if (lowerDesc.includes('zilveren kruis') || lowerDesc.includes('health insurance') || lowerDesc.includes('zorgverzekering')) {
    return { mainCategory: 'PersonalCareAndHealth', subCategory: 'HealthInsurance' };
  }
  if (lowerDesc.includes('apotheek') || lowerDesc.includes('pharmacy') || lowerDesc.includes('etos') || 
      lowerDesc.includes('kruidvat') || lowerDesc.includes('da') || lowerDesc.includes('medicine') || 
      lowerDesc.includes('medicijn') || lowerDesc.includes('drug') || lowerDesc.includes('prescription') || 
      lowerDesc.includes('recept')) {
    return { mainCategory: 'PersonalCareAndHealth', subCategory: 'PharmacyMedications' };
  }
  if (lowerDesc.includes('gym') || lowerDesc.includes('fitness') || lowerDesc.includes('sport')) {
    return { mainCategory: 'PersonalCareAndHealth', subCategory: 'GymAndFitness' };
  }
  if (lowerDesc.includes('personal care') || lowerDesc.includes('toiletries') || lowerDesc.includes('cosmetics')) {
    return { mainCategory: 'PersonalCareAndHealth', subCategory: 'PersonalCareProducts' };
  }
  if (lowerDesc.includes('doctor') || lowerDesc.includes('hospital') || lowerDesc.includes('medical') || 
      lowerDesc.includes('huisarts') || lowerDesc.includes('tandarts') || lowerDesc.includes('fysio') || 
      lowerDesc.includes('ziekenhuis')) {
    return { mainCategory: 'PersonalCareAndHealth', subCategory: 'DoctorSpecialistVisits' };
  }
  
  // Kids & Family
  if (lowerDesc.includes('childcare') || lowerDesc.includes('kinderopvang')) {
    return { mainCategory: 'KidsAndFamily', subCategory: 'Childcare' };
  }
  if (lowerDesc.includes('kids') || lowerDesc.includes('children') || lowerDesc.includes('toys') || 
      lowerDesc.includes('intertoys') || lowerDesc.includes('funky jungle')) {
    return { mainCategory: 'KidsAndFamily', subCategory: 'KidsActivitiesAndEntertainment' };
  }
  
  // Entertainment & Leisure
  if (lowerDesc.includes('cinema') || lowerDesc.includes('movie') || lowerDesc.includes('vue') || 
      lowerDesc.includes('pathe') || lowerDesc.includes('kinepolis') || lowerDesc.includes('bioscoop')) {
    return { mainCategory: 'EntertainmentAndLeisure', subCategory: 'MoviesCinema' };
  }
  if (lowerDesc.includes('event') || lowerDesc.includes('concert') || lowerDesc.includes('attraction') || 
      lowerDesc.includes('theater') || lowerDesc.includes('theatre')) {
    return { mainCategory: 'EntertainmentAndLeisure', subCategory: 'EventsConcertsAttractions' };
  }
  if (lowerDesc.includes('hobby') || lowerDesc.includes('recreation') || lowerDesc.includes('netflix') || 
      lowerDesc.includes('spotify') || lowerDesc.includes('disney+') || lowerDesc.includes('videoland') || 
      lowerDesc.includes('prime video') || lowerDesc.includes('hbo')) {
    return { mainCategory: 'EntertainmentAndLeisure', subCategory: 'HobbiesAndRecreation' };
  }
  if (lowerDesc.includes('lottery') || lowerDesc.includes('gambling') || lowerDesc.includes('loterij')) {
    return { mainCategory: 'EntertainmentAndLeisure', subCategory: 'LotteryGambling' };
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
    return { mainCategory: 'Shopping', subCategory: 'ElectronicsAndAppliances' };
  }
  if (lowerDesc.includes('ikea') || lowerDesc.includes('furniture') || lowerDesc.includes('home goods') || 
      lowerDesc.includes('praxis') || lowerDesc.includes('gamma') || lowerDesc.includes('karwei') || 
      lowerDesc.includes('hornbach') || lowerDesc.includes('home depot') || lowerDesc.includes('lamp') || 
      lowerDesc.includes('decoration') || lowerDesc.includes('home improvement')) {
    return { mainCategory: 'Shopping', subCategory: 'HomeGoodsAndFurniture' };
  }
  if (lowerDesc.includes('books') || lowerDesc.includes('stationery')) {
    return { mainCategory: 'Shopping', subCategory: 'BooksAndStationery' };
  }
  
  // Education
  if (lowerDesc.includes('tuition') || lowerDesc.includes('school fees')) {
    return { mainCategory: 'Education', subCategory: 'TuitionSchoolFees' };
  }
  if (lowerDesc.includes('books') && lowerDesc.includes('school')) {
    return { mainCategory: 'Education', subCategory: 'BooksAndSupplies' };
  }
  if (lowerDesc.includes('mark de jong') || lowerDesc.includes('aulas de holandes') || 
      lowerDesc.includes('language') || lowerDesc.includes('dutch') || lowerDesc.includes('holandes') || 
      lowerDesc.includes('taalcursus')) {
    return { mainCategory: 'Education', subCategory: 'LanguageClasses' };
  }
  
  // Financial Expenses
  if (lowerDesc.includes('bank fees') || lowerDesc.includes('kosten oranjepakket') || 
      lowerDesc.includes('kosten tweede rekeninghouder')) {
    return { mainCategory: 'FinancialExpenses', subCategory: 'BankFees' };
  }
  if (lowerDesc.includes('credit card') || lowerDesc.includes('creditcard')) {
    return { mainCategory: 'FinancialExpenses', subCategory: 'CreditCardPayments' };
  }
  if (lowerDesc.includes('loan') || lowerDesc.includes('lening')) {
    return { mainCategory: 'FinancialExpenses', subCategory: 'LoanPayments' };
  }
  if (lowerDesc.includes('transfer fee') || lowerDesc.includes('transfer provisie')) {
    return { mainCategory: 'FinancialExpenses', subCategory: 'TransferFees' };
  }
  
  // Gifts & Donations
  if (lowerDesc.includes('gift')) {
    return { mainCategory: 'GiftsAndDonations', subCategory: 'Gifts' };
  }
  if (lowerDesc.includes('donation') || lowerDesc.includes('stg care nederland') || lowerDesc.includes('charity')) {
    return { mainCategory: 'GiftsAndDonations', subCategory: 'CharitableDonations' };
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

  // If no local match is found, return null to try Gemini or fallback
  return null;
}

// Fallback categorization when Gemini API fails
function fallbackCategorization(
  description: string, 
  transactionType: 'credit' | 'debit'
): { mainCategory: MainCategory, subCategory: SubCategory } {
  // Try local categorization first
  const localResult = tryLocalCategorization(description, transactionType);
  if (localResult) {
    return localResult;
  }
  
  console.log(`No pattern matched for: "${description}", categorizing as ${transactionType === 'credit' ? '"Income -> Other Income"' : '"Miscellaneous -> Other"'}`);
  
  // Default categories based on transaction type
  if (transactionType === 'credit') {
    return { mainCategory: 'Income', subCategory: 'OtherIncome' };
  } else {
    return { mainCategory: 'Miscellaneous', subCategory: 'Other' };
  }
}