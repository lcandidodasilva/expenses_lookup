// Initialize categories in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeCategories() {
  const defaultPatterns = {
    Housing: ['rent', 'mortgage', 'housing', 'huur', 'hypotheek', 'vve'],
    Transportation: ['ns.nl', 'ov-chipkaart', 'ovpay', 'gvb', 'ret', 'htm', 'connexxion', 'arriva', 'uber', 'bolt.eu', 'shell', 'bp', 'esso', 'rai parking', 'rai parkeren', 'q-park', 'p+r'],
    Savings: ['spaarrekening', 'savings', 'oranje spaarrekening'],
    Utilities: ['vodafone', 'kpn', 't-mobile', 'tele2', 'ziggo', 'eneco', 'vattenfall', 'essent', 'greenchoice', 'water', 'gas'],
    Insurance: ['insurance', 'verzekering', 'aegon', 'nationale nederlanden', 'centraal beheer'],
    Healthcare: ['doctor', 'hospital', 'pharmacy', 'medical', 'apotheek', 'huisarts', 'tandarts', 'fysio', 'ziekenhuis'],
    Entertainment: ['netflix', 'spotify', 'disney+', 'videoland', 'prime video', 'hbo', 'pathe', 'kinepolis', 'vue', 'bioscoop', 'cinema', 'theater', 'concert'],
    Shopping: ['bol.com', 'coolblue', 'mediamarkt', 'amazon', 'zalando', 'h&m', 'zara', 'uniqlo', 'primark', 'action', 'hema', 'bijenkorf', 'ikea'],
    Income: ['salary', 'payroll', 'deposit', 'salaris', 'loon', 'ebay marketplaces', 'connexie'],
    Supermarket: ['albert heijn', 'jumbo', 'lidl', 'aldi', 'plus', 'dirk', 'ah to go', 'ah bezorgservice'],
    Delivery: ['thuisbezorgd', 'deliveroo', 'uber eats', 'dominos', 'dp', 'new york pizza', 'takeaway'],
    Restaurants: ['restaurant', 'dining', 'cafe', 'bar', 'eetcafe', 'iens', 'dinner', 'lunch', 'bistro', 'brasserie', 'mcdonalds', 'burger king', 'kfc'],
    HouseImprovements: ['ikea', 'praxis', 'gamma', 'action', 'karwei', 'hornbach', 'home depot', 'furniture', 'lamp', 'decoration', 'home improvement'],
    Education: ['school', 'university', 'college', 'course', 'training', 'workshop', 'aulas', 'les', 'cursus', 'mark de jong', 'holandes', 'dutch', 'language', 'taalcursus'],
    Clothes: ['h&m', 'zara', 'uniqlo', 'primark', 'c&a', 'we fashion', 'only', 'vero moda', 'jack & jones', 'nike', 'adidas', 'puma', 'clothing', 'kleding', 'fashion'],
    Pharmacy: ['apotheek', 'pharmacy', 'etos', 'kruidvat', 'da', 'medicine', 'medicijn', 'drug', 'prescription', 'recept'],
    Taxes: ['belastingdienst', 'tax', 'belasting', 'gemeente', 'municipality', 'waterschapsbelasting', 'property tax', 'income tax', 'inkomstenbelasting', 'omzetbelasting', 'btw', 'vat'],
    Other: []
  };

  console.log('Starting category initialization...');
  
  for (const [category, patterns] of Object.entries(defaultPatterns)) {
    console.log(`Processing category: ${category} with ${patterns.length} patterns`);
    
    for (const pattern of patterns) {
      try {
        await prisma.categoryPattern.upsert({
          where: { pattern },
          update: {},
          create: {
            pattern,
            category: category,
            confidence: 1.0,
            usageCount: 0
          }
        });
        console.log(`  - Added/updated pattern: ${pattern}`);
      } catch (error) {
        console.error(`  - Error with pattern "${pattern}":`, error);
      }
    }
  }
  
  console.log('Category initialization completed');
}

// Run the initialization
initializeCategories()
  .then(() => {
    console.log('Categories initialized successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error initializing categories:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 