import { PrismaClient, $Enums } from '@prisma/client';
import { Transaction, MainCategory, SubCategory, MAIN_CATEGORIES, CATEGORY_MAPPING } from '../types/transaction';

const prisma = new PrismaClient();

interface PatternType {
  pattern: string;
  mainCategory: MainCategory;
  subCategory: SubCategory;
}

// Map from display format to database format
const DISPLAY_TO_DB_CATEGORY: Record<string, MainCategory> = {
  'Food & Groceries': 'FoodAndGroceries',
  'Personal Care & Health': 'PersonalCareAndHealth',
  'Kids & Family': 'KidsAndFamily',
  'Entertainment & Leisure': 'EntertainmentAndLeisure',
  'Financial Expenses': 'FinancialExpenses',
  'Gifts & Donations': 'GiftsAndDonations',
  // Add direct mappings for categories that don't need conversion
  'Housing': 'Housing',
  'Transportation': 'Transportation',
  'Shopping': 'Shopping',
  'Education': 'Education',
  'Income': 'Income',
  'Travel': 'Travel',
  'Miscellaneous': 'Miscellaneous'
};

// Map from database format to display format
const DB_TO_DISPLAY_CATEGORY: Record<MainCategory, string> = {
  'FoodAndGroceries': 'Food & Groceries',
  'PersonalCareAndHealth': 'Personal Care & Health',
  'KidsAndFamily': 'Kids & Family',
  'EntertainmentAndLeisure': 'Entertainment & Leisure',
  'FinancialExpenses': 'Financial Expenses',
  'GiftsAndDonations': 'Gifts & Donations',
  // Add direct mappings for categories that don't need conversion
  'Housing': 'Housing',
  'Transportation': 'Transportation',
  'Shopping': 'Shopping',
  'Education': 'Education',
  'Income': 'Income',
  'Travel': 'Travel',
  'Miscellaneous': 'Miscellaneous'
};

// Map from display format to database format for subcategories
const DISPLAY_TO_DB_SUBCATEGORY: Record<string, SubCategory> = {
  // Housing
  'Mortgage': 'Mortgage',
  'Rent': 'Rent',
  'Utilities': 'Utilities',
  'Home Insurance': 'HomeInsurance',
  'Home-Insurance': 'HomeInsurance',
  'Home/Insurance': 'HomeInsurance',
  'Property Taxes': 'PropertyTaxes',
  'Property-Taxes': 'PropertyTaxes',
  'Property/Taxes': 'PropertyTaxes',
  'Home Maintenance & Repairs': 'HomeMaintenanceAndRepairs',
  'Home Maintenance and Repairs': 'HomeMaintenanceAndRepairs',
  'Home Maintenance/Repairs': 'HomeMaintenanceAndRepairs',
  'Home-Maintenance-Repairs': 'HomeMaintenanceAndRepairs',
  // Transportation
  'Public Transportation': 'PublicTransportation',
  'Public-Transportation': 'PublicTransportation',
  'Public/Transportation': 'PublicTransportation',
  'Fuel': 'Fuel',
  'Car Insurance': 'CarInsurance',
  'Car-Insurance': 'CarInsurance',
  'Car/Insurance': 'CarInsurance',
  'Car Maintenance & Repairs': 'CarMaintenanceAndRepairs',
  'Car Maintenance and Repairs': 'CarMaintenanceAndRepairs',
  'Car Maintenance/Repairs': 'CarMaintenanceAndRepairs',
  'Car-Maintenance-Repairs': 'CarMaintenanceAndRepairs',
  'Parking': 'Parking',
  'Road Tax': 'RoadTax',
  'Road-Tax': 'RoadTax',
  'Road/Tax': 'RoadTax',
  'Tolls': 'Tolls',
  'Ride Sharing Services': 'RideSharingServices',
  'Ride-Sharing Services': 'RideSharingServices',
  'Ride Sharing': 'RideSharingServices',
  'Ride-Sharing': 'RideSharingServices',
  'Ride/Sharing': 'RideSharingServices',
  'Ride/Sharing/Services': 'RideSharingServices',
  'OV-Chipkaart Recharges': 'OVChipkaartRecharges',
  'OV Chipkaart Recharges': 'OVChipkaartRecharges',
  'OV/Chipkaart/Recharges': 'OVChipkaartRecharges',
  // Food & Groceries
  'Groceries': 'Groceries',
  'Restaurants & Dining Out': 'RestaurantsAndDiningOut',
  'Restaurants and Dining Out': 'RestaurantsAndDiningOut',
  'Restaurants/Dining Out': 'RestaurantsAndDiningOut',
  'Restaurants/Dining/Out': 'RestaurantsAndDiningOut',
  'Takeaway & Delivery': 'TakeawayDelivery',
  'Takeaway and Delivery': 'TakeawayDelivery',
  'Takeaway/Delivery': 'TakeawayDelivery',
  'Coffee & Snacks': 'CoffeeSnacks',
  'Coffee and Snacks': 'CoffeeSnacks',
  'Coffee/Snacks': 'CoffeeSnacks',
  // Personal Care & Health
  'Health Insurance': 'HealthInsurance',
  'Health-Insurance': 'HealthInsurance',
  'Health/Insurance': 'HealthInsurance',
  'Pharmacy & Medications': 'PharmacyMedications',
  'Pharmacy and Medications': 'PharmacyMedications',
  'Pharmacy/Medications': 'PharmacyMedications',
  'Gym & Fitness': 'GymAndFitness',
  'Gym and Fitness': 'GymAndFitness',
  'Gym/Fitness': 'GymAndFitness',
  'Personal Care Products': 'PersonalCareProducts',
  'Personal-Care-Products': 'PersonalCareProducts',
  'Personal/Care/Products': 'PersonalCareProducts',
  'Doctor & Specialist Visits': 'DoctorSpecialistVisits',
  'Doctor and Specialist Visits': 'DoctorSpecialistVisits',
  'Doctor/Specialist Visits': 'DoctorSpecialistVisits',
  'Doctor/Specialist/Visits': 'DoctorSpecialistVisits',
  // Kids & Family
  'Childcare': 'Childcare',
  'Kids Activities & Entertainment': 'KidsActivitiesAndEntertainment',
  'Kids Activities and Entertainment': 'KidsActivitiesAndEntertainment',
  'Kids Activities/Entertainment': 'KidsActivitiesAndEntertainment',
  'Kids/Activities/Entertainment': 'KidsActivitiesAndEntertainment',
  // Entertainment & Leisure
  'Movies & Cinema': 'MoviesCinema',
  'Movies and Cinema': 'MoviesCinema',
  'Movies/Cinema': 'MoviesCinema',
  'Events, Concerts & Attractions': 'EventsConcertsAttractions',
  'Events, Concerts and Attractions': 'EventsConcertsAttractions',
  'Events, Concerts/Attractions': 'EventsConcertsAttractions',
  'Events/Concerts/Attractions': 'EventsConcertsAttractions',
  'Hobbies & Recreation': 'HobbiesAndRecreation',
  'Hobbies and Recreation': 'HobbiesAndRecreation',
  'Hobbies/Recreation': 'HobbiesAndRecreation',
  'Lottery & Gambling': 'LotteryGambling',
  'Lottery and Gambling': 'LotteryGambling',
  'Lottery/Gambling': 'LotteryGambling',
  // Shopping
  'Clothing': 'Clothing',
  'Electronics & Appliances': 'ElectronicsAndAppliances',
  'Electronics and Appliances': 'ElectronicsAndAppliances',
  'Electronics/Appliances': 'ElectronicsAndAppliances',
  'Home Goods & Furniture': 'HomeGoodsAndFurniture',
  'Home Goods and Furniture': 'HomeGoodsAndFurniture',
  'Home Goods/Furniture': 'HomeGoodsAndFurniture',
  'Home/Goods/Furniture': 'HomeGoodsAndFurniture',
  'Books & Stationery': 'BooksAndStationery',
  'Books and Stationery': 'BooksAndStationery',
  'Books/Stationery': 'BooksAndStationery',
  // Education
  'Tuition & School Fees': 'TuitionSchoolFees',
  'Tuition and School Fees': 'TuitionSchoolFees',
  'Tuition/School Fees': 'TuitionSchoolFees',
  'Tuition/School/Fees': 'TuitionSchoolFees',
  'Books & Supplies': 'BooksAndSupplies',
  'Books and Supplies': 'BooksAndSupplies',
  'Books/Supplies': 'BooksAndSupplies',
  'Language Classes': 'LanguageClasses',
  'Language-Classes': 'LanguageClasses',
  // Financial Expenses
  'Bank Fees': 'BankFees',
  'Bank-Fees': 'BankFees',
  'Bank/Fees': 'BankFees',
  'Credit Card Payments': 'CreditCardPayments',
  'Credit-Card-Payments': 'CreditCardPayments',
  'Credit/Card/Payments': 'CreditCardPayments',
  'Loan Payments': 'LoanPayments',
  'Loan-Payments': 'LoanPayments',
  'Loan/Payments': 'LoanPayments',
  'Transfer Fees': 'TransferFees',
  'Transfer-Fees': 'TransferFees',
  'Transfer/Fees': 'TransferFees',
  // Income
  'Salary': 'Salary',
  'Other Income': 'OtherIncome',
  'Other-Income': 'OtherIncome',
  'Other/Income': 'OtherIncome',
  'Compensation': 'Compensation',
  // Gifts & Donations
  'Gifts': 'Gifts',
  'Charitable Donations': 'CharitableDonations',
  'Charitable-Donations': 'CharitableDonations',
  'Charitable/Donations': 'CharitableDonations',
  // Travel
  'Accommodation': 'Accommodation',
  'Activities': 'Activities',
  'Food': 'Food',
  'Transportation': 'Transportation',
  // Miscellaneous
  'Other': 'Other',
  // Direct mappings for database format
  ...Object.values(MAIN_CATEGORIES).reduce((acc, category) => ({
    ...acc,
    ...CATEGORY_MAPPING[category].reduce((subAcc, subCategory) => ({
      ...subAcc,
      [subCategory]: subCategory
    }), {})
  }), {})
};

// Map from database format to display format for subcategories
const DB_TO_DISPLAY_SUBCATEGORY: Record<SubCategory, string> = {
  // Housing
  'Mortgage': 'Mortgage',
  'Rent': 'Rent',
  'Utilities': 'Utilities',
  'HomeInsurance': 'Home Insurance',
  'PropertyTaxes': 'Property Taxes',
  'HomeMaintenanceAndRepairs': 'Home Maintenance & Repairs',
  // Transportation
  'PublicTransportation': 'Public Transportation',
  'Fuel': 'Fuel',
  'CarInsurance': 'Car Insurance',
  'CarMaintenanceAndRepairs': 'Car Maintenance & Repairs',
  'Parking': 'Parking',
  'RoadTax': 'Road Tax',
  'Tolls': 'Tolls',
  'RideSharingServices': 'Ride Sharing Services',
  'OVChipkaartRecharges': 'OV-Chipkaart Recharges',
  // Food & Groceries
  'Groceries': 'Groceries',
  'RestaurantsAndDiningOut': 'Restaurants & Dining Out',
  'TakeawayDelivery': 'Takeaway & Delivery',
  'CoffeeSnacks': 'Coffee & Snacks',
  // Personal Care & Health
  'HealthInsurance': 'Health Insurance',
  'PharmacyMedications': 'Pharmacy & Medications',
  'GymAndFitness': 'Gym & Fitness',
  'PersonalCareProducts': 'Personal Care Products',
  'DoctorSpecialistVisits': 'Doctor & Specialist Visits',
  // Kids & Family
  'Childcare': 'Childcare',
  'KidsActivitiesAndEntertainment': 'Kids Activities & Entertainment',
  // Entertainment & Leisure
  'MoviesCinema': 'Movies & Cinema',
  'EventsConcertsAttractions': 'Events, Concerts & Attractions',
  'HobbiesAndRecreation': 'Hobbies & Recreation',
  'LotteryGambling': 'Lottery & Gambling',
  // Shopping
  'Clothing': 'Clothing',
  'ElectronicsAndAppliances': 'Electronics & Appliances',
  'HomeGoodsAndFurniture': 'Home Goods & Furniture',
  'BooksAndStationery': 'Books & Stationery',
  // Education
  'TuitionSchoolFees': 'Tuition & School Fees',
  'BooksAndSupplies': 'Books & Supplies',
  'LanguageClasses': 'Language Classes',
  // Financial Expenses
  'BankFees': 'Bank Fees',
  'CreditCardPayments': 'Credit Card Payments',
  'LoanPayments': 'Loan Payments',
  'TransferFees': 'Transfer Fees',
  // Income
  'Salary': 'Salary',
  'OtherIncome': 'Other Income',
  'Compensation': 'Compensation',
  // Gifts & Donations
  'Gifts': 'Gifts',
  'CharitableDonations': 'Charitable Donations',
  // Travel
  'Accommodation': 'Accommodation',
  'Activities': 'Activities',
  'Food': 'Food',
  'Transportation': 'Transportation',
  // Miscellaneous
  'Other': 'Other'
};

// Helper functions to check if a category is valid
function isValidMainCategory(category: string): boolean {
  return !!DISPLAY_TO_DB_CATEGORY[category];
}

function isValidSubCategory(category: string): boolean {
  return !!DISPLAY_TO_DB_SUBCATEGORY[category];
}

// Helper function to validate transaction data before saving
function validateTransaction(transaction: any): void {
  // Validate required fields
  if (!transaction) {
    throw new Error('Transaction object is required');
  }
  
  // If this is a partial transaction update, skip validation of missing fields
  if (transaction.date !== undefined) {
    // Only check if date is a valid Date object, don't reject future dates
    if (!(transaction.date instanceof Date)) {
      // Try to convert it to a Date if it's not already
      try {
        transaction.date = new Date(transaction.date);
      } catch (e) {
        throw new Error(`Could not convert to valid date: ${transaction.date}`);
      }
    }
    
    // Check if the resulting date is valid
    if (isNaN(transaction.date.getTime())) {
      throw new Error(`Invalid date format: ${transaction.date}`);
    }
    
    // Log future dates for information only
    const now = new Date();
    if (transaction.date > now) {
      console.log(`Future date detected: ${transaction.date.toISOString()} for transaction: ${transaction.description || 'Unknown'}`);
    }
  }
  
  // Validate category fields if they exist on the transaction
  if (transaction.mainCategory !== undefined && !isValidMainCategory(transaction.mainCategory)) {
    throw new Error(`Invalid main category: ${transaction.mainCategory}`);
  }
  
  if (transaction.subCategory !== undefined && !isValidSubCategory(transaction.subCategory)) {
    throw new Error(`Invalid sub category: ${transaction.subCategory}`);
  }
}

// Convert display names to database enum values
function convertToDatabaseCategories(mainCategory: string, subCategory: string): {
  mainCategory: MainCategory;
  subCategory: SubCategory;
} {
  // Default to "Other" category if invalid categories are provided
  const dbMainCategory = DISPLAY_TO_DB_CATEGORY[mainCategory] || 'Other';
  const dbSubCategory = DISPLAY_TO_DB_SUBCATEGORY[subCategory] || 'Other';
  
  // This ensures the database doesn't get invalid category combinations
  // If the subcategory doesn't belong to the main category, default to "Other"
  if (!CATEGORY_MAPPING[dbMainCategory as MainCategory]?.includes(dbSubCategory as SubCategory)) {
    return {
      mainCategory: dbMainCategory as MainCategory,
      subCategory: 'Other' as SubCategory
    };
  }
  
  return {
    mainCategory: dbMainCategory as MainCategory,
    subCategory: dbSubCategory as SubCategory
  };
}

// Convert database enum values to display names
function convertToAppCategories(dbMainCategory: MainCategory, dbSubCategory: SubCategory): { mainCategory: string, subCategory: string } {
  const mainCategory = DB_TO_DISPLAY_CATEGORY[dbMainCategory];
  const subCategory = DB_TO_DISPLAY_SUBCATEGORY[dbSubCategory];
  
  if (!mainCategory) {
    throw new Error(`Invalid database main category: ${dbMainCategory}`);
  }
  if (!subCategory) {
    throw new Error(`Invalid database subcategory: ${dbSubCategory}`);
  }
  
  return {
    mainCategory,
    subCategory
  };
}

// Initialize categories in the database
export async function initializeCategories(): Promise<void> {
  // No need to initialize categories as they are enums in the database
}

// Save transactions to the database
export async function saveTransactions(transactions: Transaction[]): Promise<Transaction[]> {
  const savedTransactions: Transaction[] = [];
  const errors: string[] = [];
  
  for (const transaction of transactions) {
    try {
      validateTransaction(transaction);
      
      // Check for duplicates based on date, description, amount, and type
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
        }
      });
      
      if (existingTransaction) {
        console.log(`Skipping duplicate transaction: ${transaction.description} on ${transaction.date.toISOString()}`);
        continue; // Skip this transaction and move to the next one
      }
      
      const { mainCategory, subCategory } = convertToDatabaseCategories(transaction.mainCategory, transaction.subCategory);
      const savedTransaction = await prisma.transaction.create({
        data: {
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          mainCategory,
          subCategory,
          account: transaction.account,
          counterparty: transaction.counterparty,
          notes: transaction.notes
        }
      });
      
      // Convert the database categories back to display format for the response
      const { mainCategory: displayMainCategory, subCategory: displaySubCategory } = convertToAppCategories(savedTransaction.mainCategory, savedTransaction.subCategory);
      savedTransactions.push({
        ...savedTransaction,
        mainCategory: displayMainCategory,
        subCategory: displaySubCategory
      });
    } catch (error: any) {
      // Log the error but continue processing other transactions
      const errorMessage = `Error saving transaction ${transaction.description || ''} (${transaction.date?.toISOString() || 'unknown date'}): ${error.message}`;
      console.error(errorMessage);
      errors.push(errorMessage);
      
      // If we've hit too many errors, stop processing
      if (errors.length > 50) {
        console.error(`Stopping after ${errors.length} transaction errors`);
        break;
      }
    }
  }
  
  // If all transactions failed, throw an error
  if (errors.length === transactions.length) {
    throw new Error(`All ${transactions.length} transactions failed to save. First error: ${errors[0]}`);
  }
  
  // Log a summary
  console.log(`Processed ${transactions.length} transactions: ${savedTransactions.length} saved, ${errors.length} errors`);
  
  return savedTransactions;
}

// Update transaction category
export async function updateTransactionCategory(
  transactionId: string,
  mainCategory: string,
  subCategory: string
): Promise<void> {
  validateTransaction({ mainCategory, subCategory });
  const { mainCategory: dbMainCategory, subCategory: dbSubCategory } = convertToDatabaseCategories(mainCategory, subCategory);
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      mainCategory: dbMainCategory,
      subCategory: dbSubCategory
    }
  });
}

// Get transactions by period
export async function getTransactionsByPeriod(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  return transactions.map(transaction => {
    const { mainCategory, subCategory } = convertToAppCategories(transaction.mainCategory, transaction.subCategory);
    return {
      ...transaction,
      mainCategory,
      subCategory
    };
  });
}

// Get all categories
export async function getCategories(): Promise<{ mainCategory: string, subCategory: string }[]> {
  const patterns = await prisma.categoryPattern.findMany();
  return patterns.map(pattern => convertToAppCategories(pattern.mainCategory, pattern.subCategory));
}

// Add a new pattern
export async function addPattern(pattern: string, mainCategory: string, subCategory: string): Promise<void> {
  validateTransaction({ mainCategory, subCategory });
  const { mainCategory: dbMainCategory, subCategory: dbSubCategory } = convertToDatabaseCategories(mainCategory, subCategory);
  await prisma.categoryPattern.create({
    data: {
      pattern,
      mainCategory: dbMainCategory,
      subCategory: dbSubCategory
    }
  });
}

export default prisma;