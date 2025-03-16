import { PrismaClient, Prisma, MainCategory, SubCategory } from '@prisma/client';
import { Transaction as AppTransaction, MainCategory as AppMainCategory, SubCategory as AppSubCategory } from '@/types/transaction';

interface PatternType {
  id: string;
  pattern: string;
  mainCategory: string;
  subCategory: string;
  createdAt: Date;
  updatedAt: Date;
  confidence: number;
  usageCount: number;
}

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper function to convert app category names to database enum values
function convertToDatabaseCategories(mainCategory: AppMainCategory, subCategory: AppSubCategory): { mainCategory: MainCategory, subCategory: SubCategory } {
  // Convert main category (replace spaces and special characters)
  let dbMainCategory = mainCategory.replace(/\s+&\s+/g, 'And').replace(/\s+/g, '') as MainCategory;
  
  // Convert subcategory (replace spaces and special characters)
  let dbSubCategory = subCategory.replace(/\s+&\s+/g, 'And').replace(/\//g, '').replace(/\s+/g, '') as SubCategory;
  
  return { mainCategory: dbMainCategory, subCategory: dbSubCategory };
}

// Helper function to convert database enum values to app category names
function convertToAppCategories(mainCategory: MainCategory, subCategory: SubCategory): { mainCategory: AppMainCategory, subCategory: AppSubCategory } {
  // Map from database enum to app category names
  const mainCategoryMap: Record<string, AppMainCategory> = {
    'Housing': 'Housing',
    'Transportation': 'Transportation',
    'FoodAndGroceries': 'Food & Groceries',
    'PersonalCareAndHealth': 'Personal Care & Health',
    'KidsAndFamily': 'Kids & Family',
    'EntertainmentAndLeisure': 'Entertainment & Leisure',
    'Shopping': 'Shopping',
    'Education': 'Education',
    'FinancialExpenses': 'Financial Expenses',
    'Income': 'Income',
    'GiftsAndDonations': 'Gifts & Donations',
    'Travel': 'Travel',
    'Miscellaneous': 'Miscellaneous'
  };
  
  // Map from database enum to app subcategory names
  const subCategoryMap: Record<string, AppSubCategory> = {
    'Mortgage': 'Mortgage',
    'Rent': 'Rent',
    'Utilities': 'Utilities',
    'HomeInsurance': 'Home Insurance',
    'PropertyTaxes': 'Property Taxes',
    'HomeMaintenanceAndRepairs': 'Home Maintenance & Repairs',
    'PublicTransportation': 'Public Transportation',
    'Fuel': 'Fuel',
    'CarInsurance': 'Car Insurance',
    'CarMaintenanceAndRepairs': 'Car Maintenance & Repairs',
    'Parking': 'Parking',
    'RoadTax': 'Road Tax',
    'Tolls': 'Tolls',
    'RideSharingServices': 'Ride-Sharing Services',
    'OVChipkaartRecharges': 'OV-chipkaart recharges',
    'Groceries': 'Groceries',
    'RestaurantsAndDiningOut': 'Restaurants & Dining Out',
    'TakeawayDelivery': 'Takeaway/Delivery',
    'CoffeeSnacks': 'Coffee/Snacks',
    'HealthInsurance': 'Health Insurance',
    'PharmacyMedications': 'Pharmacy/Medications',
    'GymAndFitness': 'Gym & Fitness',
    'PersonalCareProducts': 'Personal Care Products',
    'DoctorSpecialistVisits': 'Doctor/Specialist Visits',
    'Childcare': 'Childcare',
    'KidsActivitiesAndEntertainment': 'Kids Activities & Entertainment',
    'MoviesCinema': 'Movies/Cinema',
    'EventsConcertsAttractions': 'Events/Concerts/Attractions',
    'HobbiesAndRecreation': 'Hobbies & Recreation',
    'LotteryGambling': 'Lottery/Gambling',
    'Clothing': 'Clothing',
    'ElectronicsAndAppliances': 'Electronics & Appliances',
    'HomeGoodsAndFurniture': 'Home Goods & Furniture',
    'BooksAndStationery': 'Books & Stationery',
    'TuitionSchoolFees': 'Tuition/School Fees',
    'BooksAndSupplies': 'Books & Supplies',
    'LanguageClasses': 'Language Classes',
    'BankFees': 'Bank Fees',
    'CreditCardPayments': 'Credit Card Payments',
    'LoanPayments': 'Loan Payments',
    'TransferFees': 'Transfer Fees',
    'Salary': 'Salary',
    'OtherIncome': 'Other Income',
    'Compensation': 'Compensation',
    'Gifts': 'Gifts',
    'CharitableDonations': 'Charitable Donations',
    'Accommodation': 'Accommodation',
    'Activities': 'Activities',
    'Food': 'Food',
    'Transportation': 'Transportation',
    'Other': 'Other'
  };
  
  return { 
    mainCategory: mainCategoryMap[mainCategory] || 'Miscellaneous', 
    subCategory: subCategoryMap[subCategory] || 'Other' 
  };
}

export async function initializeCategories() {
  const defaultPatterns = {
    // Housing
    'Housing': {
      'Mortgage': ['mortgage', 'hypotheek', 'ing hypotheken'],
      'Rent': ['rent', 'huur'],
      'Utilities': ['vitens', 'oxxio', 'eneco', 'vattenfall', 'essent', 'greenchoice', 'water', 'gas', 'electricity'],
      'Home Insurance': ['woonverzekering', 'home insurance', 'nn schadeverzekering'],
      'Property Taxes': ['gemeente aanslag', 'property tax', 'waterschapsbelasting'],
      'Home Maintenance & Repairs': ['vve', 'home maintenance', 'repair']
    },
    // Transportation
    'Transportation': {
      'Public Transportation': ['ns.nl', 'ov-chipkaart', 'ovpay', 'gvb', 'ret', 'htm', 'connexxion', 'arriva'],
      'Fuel': ['shell', 'bp', 'esso', 'fuel'],
      'Car Insurance': ['car insurance', 'autoverzekering'],
      'Car Maintenance & Repairs': ['car maintenance', 'car repair', 'garage'],
      'Parking': ['parking', 'parkeren', 'q-park', 'p+r', 'rai parking', 'rai parkeren'],
      'Road Tax': ['wegenbelasting', 'road tax'],
      'Tolls': ['toll', 'tol'],
      'Ride-Sharing Services': ['uber', 'bolt.eu'],
      'OV-chipkaart recharges': ['ov-chipkaart recharge']
    },
    // Food & Groceries
    'Food & Groceries': {
      'Groceries': ['albert heijn', 'jumbo', 'lidl', 'aldi', 'plus', 'dirk', 'ah to go', 'ah bezorgservice', 'dekamarkt'],
      'Restaurants & Dining Out': ['restaurant', 'dining', 'cafe', 'bar', 'eetcafe', 'iens', 'dinner', 'lunch', 'bistro', 'brasserie', 'mcdonalds', 'burger king', 'kfc'],
      'Takeaway/Delivery': ['thuisbezorgd', 'deliveroo', 'uber eats', 'dominos', 'dp', 'new york pizza', 'takeaway', 'pizza', 'bezorg'],
      'Coffee/Snacks': ['coffee', 'koffie', 'snack']
    },
    // Personal Care & Health
    'Personal Care & Health': {
      'Health Insurance': ['zilveren kruis', 'health insurance', 'zorgverzekering'],
      'Pharmacy/Medications': ['apotheek', 'pharmacy', 'etos', 'kruidvat', 'da', 'medicine', 'medicijn', 'drug', 'prescription', 'recept'],
      'Gym & Fitness': ['gym', 'fitness', 'sport', 'gymxl', 'club pellikaan'],
      'Personal Care Products': ['personal care', 'toiletries', 'cosmetics'],
      'Doctor/Specialist Visits': ['doctor', 'hospital', 'medical', 'huisarts', 'tandarts', 'fysio', 'ziekenhuis']
    },
    // Kids & Family
    'Kids & Family': {
      'Childcare': ['childcare', 'kinderopvang', 'stichting kinderopvang'],
      'Kids Activities & Entertainment': ['kids', 'children', 'toys', 'intertoys', 'funky jungle']
    },
    // Entertainment & Leisure
    'Entertainment & Leisure': {
      'Movies/Cinema': ['cinema', 'movie', 'vue', 'pathe', 'kinepolis', 'bioscoop'],
      'Events/Concerts/Attractions': ['event', 'concert', 'attraction', 'theater', 'theatre'],
      'Hobbies & Recreation': ['hobby', 'recreation', 'netflix', 'spotify', 'disney+', 'videoland', 'prime video', 'hbo'],
      'Lottery/Gambling': ['lottery', 'gambling', 'loterij', 'nederlandse loterij']
    },
    // Shopping
    'Shopping': {
      'Clothing': ['h&m', 'zara', 'uniqlo', 'primark', 'c&a', 'we fashion', 'only', 'vero moda', 'jack & jones', 'nike', 'adidas', 'puma', 'clothing', 'kleding', 'fashion', 'zeeman'],
      'Electronics & Appliances': ['electronics', 'appliances', 'mediamarkt', 'coolblue'],
      'Home Goods & Furniture': ['ikea', 'furniture', 'home goods', 'praxis', 'gamma', 'karwei', 'hornbach', 'home depot', 'lamp', 'decoration', 'home improvement'],
      'Books & Stationery': ['books', 'stationery']
    },
    // Education
    'Education': {
      'Tuition/School Fees': ['tuition', 'school fees'],
      'Books & Supplies': ['books', 'supplies', 'school'],
      'Language Classes': ['mark de jong', 'aulas de holandes', 'language', 'dutch', 'holandes', 'taalcursus']
    },
    // Financial Expenses
    'Financial Expenses': {
      'Bank Fees': ['bank fees', 'kosten oranjepakket', 'kosten tweede rekeninghouder'],
      'Credit Card Payments': ['credit card', 'creditcard', 'incasso creditcard'],
      'Loan Payments': ['loan', 'lening'],
      'Transfer Fees': ['transfer fee', 'transfer provisie']
    },
    // Income
    'Income': {
      'Salary': ['salary', 'payroll', 'deposit', 'salaris', 'loon', 'connexie', 'ebay marketplaces'],
      'Other Income': ['wise', 'zalando payments', 'oranje spaarrekening', 'interest'],
      'Compensation': ['compensation', 'refund']
    },
    // Gifts & Donations
    'Gifts & Donations': {
      'Gifts': ['gift'],
      'Charitable Donations': ['donation', 'stg care nederland', 'charity']
    },
    // Travel
    'Travel': {
      'Accommodation': ['hotel', 'airbnb', 'accommodation'],
      'Activities': ['activities vacation'],
      'Food': ['food vacation'],
      'Transportation': ['transportation vacation']
    },
    // Miscellaneous
    'Miscellaneous': {
      'Other': []
    }
  };

  for (const [mainCategory, subcategories] of Object.entries(defaultPatterns)) {
    for (const [subCategory, patterns] of Object.entries(subcategories)) {
      for (const pattern of patterns) {
        const { mainCategory: dbMainCategory, subCategory: dbSubCategory } = 
          convertToDatabaseCategories(mainCategory as AppMainCategory, subCategory as AppSubCategory);
        
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
  }
}

export async function saveTransactions(transactions: AppTransaction[]) {
  const results = [];
  
  for (const t of transactions) {
    // Check if a similar transaction already exists
    // We consider a transaction duplicate if it has the same date, description, amount, and type
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        date: {
          // Match the date ignoring time component
          gte: new Date(new Date(t.date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(t.date).setHours(23, 59, 59, 999)),
        },
        description: t.description,
        amount: t.amount,
        type: t.type,
      },
    });

    if (!existingTransaction) {
      // Convert app categories to database enum values
      const { mainCategory: dbMainCategory, subCategory: dbSubCategory } = 
        convertToDatabaseCategories(t.mainCategory, t.subCategory);
      
      // Only create if no duplicate exists
      const newTransaction = await prisma.transaction.create({
        data: {
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          mainCategory: dbMainCategory,
          subCategory: dbSubCategory,
          account: t.account,
          counterparty: t.counterparty || null,
          notes: t.notes || null,
        }
      });
      results.push(newTransaction);
    } else {
      // Return the existing transaction
      results.push(existingTransaction);
    }
  }
  
  return results;
}

export async function updateTransactionCategory(
  transactionId: string,
  mainCategory: string,
  subCategory: string
) {
  // Convert app categories to database enum values
  const { mainCategory: dbMainCategory, subCategory: dbSubCategory } = 
    convertToDatabaseCategories(mainCategory as AppMainCategory, subCategory as AppSubCategory);
  
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { 
      mainCategory: dbMainCategory,
      subCategory: dbSubCategory
    }
  });
}

export async function getTransactionsByPeriod(start: Date | string, end: Date | string) {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
  
  // Convert database categories to app categories
  return transactions.map(t => {
    const { mainCategory, subCategory } = convertToAppCategories(t.mainCategory, t.subCategory);
    return {
      ...t,
      mainCategory,
      subCategory
    };
  });
}

export async function getCategories() {
  const patterns = await prisma.categoryPattern.findMany({
    orderBy: { usageCount: 'desc' }
  });
  
  // Convert database categories to app categories
  return patterns.map(p => {
    const { mainCategory, subCategory } = convertToAppCategories(p.mainCategory, p.subCategory);
    return {
      ...p,
      mainCategory,
      subCategory
    };
  });
}

export async function addPattern(mainCategory: string, subCategory: string, pattern: string) {
  // Convert app categories to database enum values
  const { mainCategory: dbMainCategory, subCategory: dbSubCategory } = 
    convertToDatabaseCategories(mainCategory as AppMainCategory, subCategory as AppSubCategory);
  
  return prisma.categoryPattern.create({
    data: {
      pattern,
      mainCategory: dbMainCategory,
      subCategory: dbSubCategory,
      confidence: 1.0,
      usageCount: 0
    }
  });
}

export default prisma;