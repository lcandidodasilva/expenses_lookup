import { TransactionCategory } from '@/types/transaction';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Define common patterns for each category
const PATTERNS = {
  SUPERMARKET: [
    'albert heijn',
    'ah to go',
    'ah bezorgservice',
    'jumbo',
    'lidl',
    'aldi',
    'plus',
    'dirk',
    'spar',
    'hoogvliet',
    'ekoplaza',
    'marqt',
    'deka',
    'vomar',
  ],
  DELIVERY: [
    'thuisbezorgd',
    'deliveroo',
    'uber eats',
    'just eat',
    'takeaway',
    'dominos',
    'new york pizza',
    'bezorg',
    'delivery',
  ],
  TRANSPORTATION: [
    'ns.nl',
    'ns-',
    'ov-chipkaart',
    'ovpay.nl',
    'gvb',
    'ret',
    'htm',
    'connexxion',
    'arriva',
    'uber',
    'bolt.eu',
    'shell',
    'bp',
    'esso',
    'total',
    'q8',
    'tango',
    'tinq',
  ],
  UTILITIES: [
    'vodafone',
    'kpn',
    't-mobile',
    'tele2',
    'ziggo',
    'eneco',
    'vattenfall',
    'essent',
    'greenchoice',
    'dunea',
    'vitens',
    'pwn',
    'waternet',
  ],
  ENTERTAINMENT: [
    'netflix',
    'spotify',
    'disney+',
    'videoland',
    'prime video',
    'hbo',
    'pathe',
    'kinepolis',
    'vue',
    'bioscoop',
    'cinema',
    'theater',
    'concert',
    'spotify',
    'steam',
    'playstation',
    'xbox',
    'nintendo',
  ],
  SHOPPING: [
    'bol.com',
    'coolblue',
    'mediamarkt',
    'amazon',
    'zalando',
    'h&m',
    'zara',
    'uniqlo',
    'primark',
    'action',
    'hema',
    'bijenkorf',
    'ikea',
    'wehkamp',
    'decathlon',
  ],
  HEALTHCARE: [
    'apotheek',
    'huisarts',
    'tandarts',
    'fysio',
    'ziekenhuis',
    'hospital',
    'pharmacy',
    'medical',
    'zorg',
    'cz',
    'vgz',
    'menzis',
    'achmea',
  ],
};

export async function categorizeThroughGPT(description: string): Promise<TransactionCategory> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found. Using fallback categorization.');
    return fallbackCategorization(description);
  }

  try {
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
          content: `You are a Dutch financial transaction categorizer. Categorize the transaction into exactly one of these categories: Housing, Transportation, Savings, Utilities, Insurance, Healthcare, Entertainment, Shopping, Income, Supermarket, Delivery, Other. 
          
          Common patterns:
          - Supermarkets: Albert Heijn, Jumbo, Lidl, Plus, Dirk, Aldi
          - Delivery: Thuisbezorgd, Deliveroo, Uber Eats, Dominos, New York Pizza
          - Transportation: NS, OV-chipkaart, GVB, RET, HTM, Shell, BP
          - Utilities: Vodafone, KPN, T-Mobile, Ziggo, Eneco, Vattenfall
          - Entertainment: Netflix, Spotify, Pathe, Kinepolis, Steam
          - Shopping: bol.com, Coolblue, MediaMarkt, Action, HEMA
          - Healthcare: Apotheek, Huisarts, Tandarts, Ziekenhuis
          - Savings: Spaarrekening, savings transfers
          - Income: EBay, Connexie, Salary, freelance payments
          
          Respond with just the category name, nothing else.`
        }, {
          role: 'user',
          content: description
        }],
        temperature: 0.3,
        max_tokens: 20
      })
    });

    const data = await response.json();
    const category = data.choices[0].message.content.trim() as TransactionCategory;
    
    // Validate that the returned category is valid
    if (isValidCategory(category)) {
      return category;
    }
    return fallbackCategorization(description);
  } catch (error) {
    console.error('Error categorizing with GPT:', error);
    return fallbackCategorization(description);
  }
}

function isValidCategory(category: string): category is TransactionCategory {
  const validCategories: TransactionCategory[] = [
    'Housing', 'Transportation', 'Savings', 'Utilities', 'Insurance',
    'Healthcare', 'Entertainment', 'Shopping', 'Income', 'Supermarket',
    'Delivery', 'Other'
  ];
  return validCategories.includes(category as TransactionCategory);
}

function fallbackCategorization(description: string): TransactionCategory {
  description = description.toLowerCase();
  
  // Check for exact matches first
  if (description.includes('spaarrekening') || description.includes('savings')) {
    return 'Savings';
  }

  // Check for income
  if (description.includes('ebay marketplaces') || 
      description.includes('connexie') ||
      description.includes('salary') ||
      description.includes('salaris') ||
      description.includes('loon')) {
    return 'Income';
  }

  // Check for housing related
  if (description.includes('huur') || 
      description.includes('rent') ||
      description.includes('hypotheek') ||
      description.includes('mortgage') ||
      description.includes('vve') ||
      description.includes('woningborg')) {
    return 'Housing';
  }

  // Check patterns for each category
  for (const [category, patterns] of Object.entries(PATTERNS)) {
    if (patterns.some(pattern => description.includes(pattern))) {
      return category as TransactionCategory;
    }
  }

  // Check for insurance
  if (description.includes('verzekering') || 
      description.includes('insurance') ||
      description.includes('aegon') ||
      description.includes('nationale nederlanden') ||
      description.includes('centraal beheer')) {
    return 'Insurance';
  }

  return 'Other';
} 