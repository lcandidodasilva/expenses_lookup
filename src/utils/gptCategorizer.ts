import { CategoryName } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '@/types/transaction';
import prisma from '@/lib/db';

// Change from OpenAI to Gemini API key
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
      const category = pattern.category;
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
async function callGeminiApi(description: string, patternExamples: string): Promise<CategoryName | null> {
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
                  text: `You are a Dutch financial transaction categorizer. Categorize the transaction into exactly one of these categories: ${DEFAULT_CATEGORIES.join(', ')}. 
                  
                  Here are detailed descriptions of each category:
                  - Income: Salary, wages, freelance payments, deposits, refunds
                  - Housing: Rent, mortgage, housing association fees (VVE)
                  - Transportation: Public transport (NS, OV-chipkaart, GVB), fuel (Shell, BP), car maintenance, parking
                  - Savings: Transfers to savings accounts, investments
                  - Utilities: Phone bills (Vodafone, KPN), internet, electricity, water, gas
                  - Insurance: Health insurance, home insurance, car insurance
                  - Healthcare: Doctor visits, hospital, dental care, physiotherapy
                  - Entertainment: Streaming services (Netflix, Spotify), cinema, concerts, subscriptions
                  - Shopping: Online shopping (bol.com, Amazon), electronics, general retail
                  - Delivery: Food delivery services (Thuisbezorgd, Deliveroo, Uber Eats)
                  - Supermarket: Grocery stores (Albert Heijn, Jumbo, Lidl)
                  - Restaurants: Dining out, cafes, bars, fast food
                  - HouseImprovements: Furniture, home decor, DIY stores (IKEA, Praxis, Gamma)
                  - Education: Schools, universities, courses, language lessons, training, workshops
                  - Clothes: Clothing stores, fashion retailers (H&M, Zara, Primark), shoes, accessories
                  - Pharmacy: Drugstores, pharmacies (Etos, Kruidvat), medicine, prescriptions
                  - Taxes: Tax payments, government fees, municipality charges, VAT, income tax
                  - Other: Anything that doesn't fit the above categories
                  
                  ${patternExamples}
                  
                  Transaction description: "${description}"
                  
                  Respond with ONLY the category name, nothing else.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 10,
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
      
      // Validate that the category is one of the allowed values
      if (!DEFAULT_CATEGORIES.includes(categoryText as any)) {
        console.warn(`Invalid category from Gemini: ${categoryText}. Using fallback.`);
        return null;
      }
      
      return categoryText as CategoryName;
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

export async function categorizeWithGemini(description: string): Promise<CategoryName> {
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
    const category = await callGeminiApi(description, patternExamples);
    
    // If Gemini categorization failed, use fallback
    if (!category) {
      console.log(`Gemini categorization failed for "${description}", using fallback`);
      return fallbackCategorization(description);
    }
    
    console.log(`Gemini categorized "${description}" as: ${category}`);
    return category;
  } catch (error) {
    console.error('Error getting category from Gemini:', error);
    return fallbackCategorization(description);
  }
}

function fallbackCategorization(description: string): CategoryName {
  const lowerDesc = description.toLowerCase();
  console.log(`Using fallback categorization for: "${description}"`);
  
  // Check for specific known merchants first
  if (lowerDesc.includes('dp') || lowerDesc.includes('dominos') || lowerDesc.includes('domino\'s')) {
    console.log(`Matched "Delivery" pattern for: "${description}"`);
    return 'Delivery' as CategoryName;
  }
  
  if (lowerDesc.includes('rai') && (lowerDesc.includes('parking') || lowerDesc.includes('parkeren'))) {
    console.log(`Matched "Transportation" pattern for: "${description}"`);
    return 'Transportation' as CategoryName;
  }
  
  if (lowerDesc.includes('mark de jong') || lowerDesc.includes('aulas de holandes')) {
    console.log(`Matched "Education" pattern for: "${description}"`);
    return 'Education' as CategoryName;
  }
  
  if (lowerDesc.includes('apotheek') || lowerDesc.includes('etos') || lowerDesc.includes('kruidvat')) {
    console.log(`Matched "Pharmacy" pattern for: "${description}"`);
    return 'Pharmacy' as CategoryName;
  }
  
  if (lowerDesc.includes('h&m') || lowerDesc.includes('zara') || lowerDesc.includes('primark') || lowerDesc.includes('c&a')) {
    console.log(`Matched "Clothes" pattern for: "${description}"`);
    return 'Clothes' as CategoryName;
  }
  
  if (lowerDesc.includes('belastingdienst') || lowerDesc.includes('tax') || lowerDesc.includes('belasting') || lowerDesc.includes('gemeente')) {
    console.log(`Matched "Taxes" pattern for: "${description}"`);
    return 'Taxes' as CategoryName;
  }
  
  // Define patterns for each category
  const patterns: Record<string, string[]> = {
    Housing: ['rent', 'mortgage', 'housing', 'huur', 'hypotheek', 'vve'],
    Transportation: ['ns.nl', 'ov-chipkaart', 'ovpay', 'gvb', 'ret', 'htm', 'connexxion', 'arriva', 'uber', 'bolt.eu', 'shell', 'bp', 'esso', 'parking', 'parkeren', 'q-park', 'p+r'],
    Savings: ['spaarrekening', 'savings', 'oranje spaarrekening'],
    Utilities: ['vodafone', 'kpn', 't-mobile', 'tele2', 'ziggo', 'eneco', 'vattenfall', 'essent', 'greenchoice', 'water', 'gas'],
    Insurance: ['insurance', 'verzekering', 'aegon', 'nationale nederlanden', 'centraal beheer'],
    Healthcare: ['doctor', 'hospital', 'medical', 'huisarts', 'tandarts', 'fysio', 'ziekenhuis'],
    Entertainment: ['netflix', 'spotify', 'disney+', 'videoland', 'prime video', 'hbo', 'pathe', 'kinepolis', 'vue', 'bioscoop', 'cinema', 'theater', 'concert'],
    Shopping: ['bol.com', 'coolblue', 'mediamarkt', 'amazon', 'bijenkorf'],
    Income: ['salary', 'payroll', 'deposit', 'salaris', 'loon', 'ebay marketplaces', 'connexie'],
    Supermarket: ['albert heijn', 'jumbo', 'lidl', 'aldi', 'plus', 'dirk', 'ah to go', 'ah bezorgservice', 'dekamarkt'],
    Delivery: ['thuisbezorgd', 'deliveroo', 'uber eats', 'dominos', 'new york pizza', 'takeaway', 'pizza', 'bezorg'],
    Restaurants: ['restaurant', 'dining', 'cafe', 'bar', 'eetcafe', 'iens', 'dinner', 'lunch', 'bistro', 'brasserie', 'mcdonalds', 'burger king', 'kfc'],
    HouseImprovements: ['ikea', 'praxis', 'gamma', 'action', 'karwei', 'hornbach', 'home depot', 'furniture', 'lamp', 'decoration', 'home improvement'],
    Education: ['school', 'university', 'college', 'course', 'training', 'workshop', 'aulas', 'les', 'cursus', 'holandes', 'dutch', 'language', 'taalcursus', 'education'],
    Clothes: ['h&m', 'zara', 'uniqlo', 'primark', 'c&a', 'we fashion', 'only', 'vero moda', 'jack & jones', 'nike', 'adidas', 'puma', 'clothing', 'kleding', 'fashion'],
    Pharmacy: ['apotheek', 'pharmacy', 'etos', 'kruidvat', 'da', 'medicine', 'medicijn', 'drug', 'prescription', 'recept'],
    Taxes: ['belastingdienst', 'tax', 'belasting', 'gemeente', 'municipality', 'waterschapsbelasting', 'property tax', 'income tax', 'inkomstenbelasting', 'omzetbelasting', 'btw', 'vat']
  };

  // Check each pattern
  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    if (categoryPatterns.some(pattern => lowerDesc.includes(pattern.toLowerCase()))) {
      console.log(`Matched "${category}" pattern for: "${description}"`);
      return category as CategoryName;
    }
  }

  console.log(`No pattern matched for: "${description}", categorizing as "Other"`);
  return 'Other' as CategoryName;
} 