import { CategoryName, DEFAULT_CATEGORIES } from '@/types/transaction';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

export async function categorizeThroughGPT(description: string): Promise<CategoryName> {
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
          content: `You are a Dutch financial transaction categorizer. Categorize the transaction into exactly one of these categories: ${DEFAULT_CATEGORIES.join(', ')}. 
          
          Common patterns:
          - "Oranje Spaarrekening" and savings transfers are for Savings
          - Albert Heijn, Jumbo, Lidl, Plus, Dirk, Aldi are Supermarket
          - Thuisbezorgd, Deliveroo, Uber Eats, Dominos, New York Pizza are Delivery
          - NS, OV-chipkaart, GVB, RET, HTM, Shell, BP are Transportation
          - Vodafone, KPN, T-Mobile, Ziggo, Eneco, Vattenfall are Utilities
          - Netflix, Spotify, Pathe, Kinepolis, Steam are Entertainment
          - bol.com, Coolblue, MediaMarkt, Action, HEMA are Shopping
          - Apotheek, Huisarts, Tandarts, Ziekenhuis are Healthcare
          - Salary, wages, freelance payments are Income
          
          Respond with ONLY the category name, nothing else.`
        }, {
          role: 'user',
          content: description
        }],
        temperature: 0.3,
        max_tokens: 10,
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Failed to parse GPT response:', error);
      return fallbackCategorization(description);
    }

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      console.warn('Invalid GPT response:', data);
      return fallbackCategorization(description);
    }

    const category = data.choices[0].message.content.trim() as CategoryName;

    // Validate that the category is one of the allowed values
    if (!DEFAULT_CATEGORIES.includes(category)) {
      console.warn(`Invalid category from GPT: ${category}. Using fallback.`);
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
  
  // Define patterns for each category
  const patterns = {
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

  // Check each pattern
  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    if (categoryPatterns.some(pattern => lowerDesc.includes(pattern.toLowerCase()))) {
      return category as CategoryName;
    }
  }

  return 'Other';
} 