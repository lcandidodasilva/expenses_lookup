import { CategoryName } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '@/types/transaction';
import prisma from '@/lib/db';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
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

// Function to call GPT API with retry logic
async function callGptApi(description: string, patternExamples: string): Promise<CategoryName | null> {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: `You are a Dutch financial transaction categorizer. Categorize the transaction into exactly one of these categories: ${DEFAULT_CATEGORIES.join(', ')}. 
            
            Here are detailed descriptions of each category:
            - Income: Salary, wages, freelance payments, deposits, refunds
            - Housing: Rent, mortgage, housing association fees (VVE)
            - Transportation: Public transport (NS, OV-chipkaart, GVB), fuel (Shell, BP), car maintenance, parking
            - Savings: Transfers to savings accounts, investments
            - Utilities: Phone bills (Vodafone, KPN), internet, electricity, water, gas
            - Insurance: Health insurance, home insurance, car insurance
            - Healthcare: Doctor visits, pharmacy, hospital, dental care
            - Entertainment: Streaming services (Netflix, Spotify), cinema, concerts, subscriptions
            - Shopping: Online shopping (bol.com, Amazon), clothing, electronics
            - Delivery: Food delivery services (Thuisbezorgd, Deliveroo, Uber Eats)
            - Supermarket: Grocery stores (Albert Heijn, Jumbo, Lidl)
            - Restaurants: Dining out, cafes, bars, fast food
            - HouseImprovements: Furniture, home decor, DIY stores (IKEA, Praxis, Gamma)
            - Education: Schools, universities, courses, language lessons, training, workshops
            - Other: Anything that doesn't fit the above categories
            
            ${patternExamples}
            
            Respond with ONLY the category name, nothing else.`
          }, {
            role: 'user',
            content: description
          }],
          temperature: 0.3,
          max_tokens: 10,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid GPT response format');
      }
      
      const categoryText = data.choices[0].message.content.trim();
      
      // Validate that the category is one of the allowed values
      if (!DEFAULT_CATEGORIES.includes(categoryText as any)) {
        console.warn(`Invalid category from GPT: ${categoryText}. Using fallback.`);
        return null;
      }
      
      return categoryText as CategoryName;
    } catch (error) {
      console.warn(`GPT API call failed (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error);
      retries++;
      
      if (retries > MAX_RETRIES) {
        console.error('All GPT API retries failed');
        return null;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return null;
}

export async function categorizeThroughGPT(description: string): Promise<CategoryName> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found. Using fallback categorization.');
    return fallbackCategorization(description);
  }

  try {
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

    // Call GPT API with retry logic
    const category = await callGptApi(description, patternExamples);
    
    // If GPT categorization failed, use fallback
    if (!category) {
      return fallbackCategorization(description);
    }
    
    return category;
  } catch (error) {
    console.error('Error getting category from GPT:', error);
    return fallbackCategorization(description);
  }
}

function fallbackCategorization(description: string): CategoryName {
  const lowerDesc = description.toLowerCase();
  
  // Check for specific known merchants first
  if (lowerDesc.includes('dp') || lowerDesc.includes('dominos') || lowerDesc.includes('domino\'s')) {
    return 'Delivery' as CategoryName;
  }
  
  if (lowerDesc.includes('rai') && (lowerDesc.includes('parking') || lowerDesc.includes('parkeren'))) {
    return 'Transportation' as CategoryName;
  }
  
  if (lowerDesc.includes('mark de jong') || lowerDesc.includes('aulas de holandes')) {
    return 'Education' as CategoryName;
  }
  
  // Define patterns for each category
  const patterns: Record<string, string[]> = {
    Housing: ['rent', 'mortgage', 'housing', 'huur', 'hypotheek', 'vve'],
    Transportation: ['ns.nl', 'ov-chipkaart', 'ovpay', 'gvb', 'ret', 'htm', 'connexxion', 'arriva', 'uber', 'bolt.eu', 'shell', 'bp', 'esso', 'parking', 'parkeren', 'q-park', 'p+r'],
    Savings: ['spaarrekening', 'savings', 'oranje spaarrekening'],
    Utilities: ['vodafone', 'kpn', 't-mobile', 'tele2', 'ziggo', 'eneco', 'vattenfall', 'essent', 'greenchoice', 'water', 'gas'],
    Insurance: ['insurance', 'verzekering', 'aegon', 'nationale nederlanden', 'centraal beheer'],
    Healthcare: ['doctor', 'hospital', 'pharmacy', 'medical', 'apotheek', 'huisarts', 'tandarts', 'fysio', 'ziekenhuis'],
    Entertainment: ['netflix', 'spotify', 'disney+', 'videoland', 'prime video', 'hbo', 'pathe', 'kinepolis', 'vue', 'bioscoop', 'cinema', 'theater', 'concert'],
    Shopping: ['bol.com', 'coolblue', 'mediamarkt', 'amazon', 'zalando', 'h&m', 'zara', 'uniqlo', 'primark', 'hema', 'bijenkorf'],
    Income: ['salary', 'payroll', 'deposit', 'salaris', 'loon', 'ebay marketplaces', 'connexie'],
    Supermarket: ['albert heijn', 'jumbo', 'lidl', 'aldi', 'plus', 'dirk', 'ah to go', 'ah bezorgservice', 'dekamarkt'],
    Delivery: ['thuisbezorgd', 'deliveroo', 'uber eats', 'dominos', 'new york pizza', 'takeaway', 'pizza', 'bezorg'],
    Restaurants: ['restaurant', 'dining', 'cafe', 'bar', 'eetcafe', 'iens', 'dinner', 'lunch', 'bistro', 'brasserie', 'mcdonalds', 'burger king', 'kfc'],
    HouseImprovements: ['ikea', 'praxis', 'gamma', 'action', 'karwei', 'hornbach', 'home depot', 'furniture', 'lamp', 'decoration', 'home improvement'],
    Education: ['school', 'university', 'college', 'course', 'training', 'workshop', 'aulas', 'les', 'cursus', 'holandes', 'dutch', 'language', 'taalcursus', 'education']
  };

  // Check each pattern
  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    if (categoryPatterns.some(pattern => lowerDesc.includes(pattern.toLowerCase()))) {
      return category as CategoryName;
    }
  }

  return 'Other' as CategoryName;
} 