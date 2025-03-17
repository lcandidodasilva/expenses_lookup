export type TransactionType = 'credit' | 'debit';

export type MainCategory = 
  | 'Housing'
  | 'Transportation'
  | 'FoodAndGroceries'
  | 'PersonalCareAndHealth'
  | 'KidsAndFamily'
  | 'EntertainmentAndLeisure'
  | 'Shopping'
  | 'Education'
  | 'FinancialExpenses'
  | 'Income'
  | 'GiftsAndDonations'
  | 'Travel'
  | 'Miscellaneous';

export const MAIN_CATEGORIES: MainCategory[] = [
  'Housing',
  'Transportation',
  'FoodAndGroceries',
  'PersonalCareAndHealth',
  'KidsAndFamily',
  'EntertainmentAndLeisure',
  'Shopping',
  'Education',
  'FinancialExpenses',
  'Income',
  'GiftsAndDonations',
  'Travel',
  'Miscellaneous'
];

export type SubCategory = 
  // Housing
  | 'Mortgage'
  | 'Rent'
  | 'Utilities'
  | 'HomeInsurance'
  | 'PropertyTaxes'
  | 'HomeMaintenanceAndRepairs'
  // Transportation
  | 'PublicTransportation'
  | 'Fuel'
  | 'CarInsurance'
  | 'CarMaintenanceAndRepairs'
  | 'Parking'
  | 'RoadTax'
  | 'Tolls'
  | 'RideSharingServices'
  | 'OVChipkaartRecharges'
  // Food & Groceries
  | 'Groceries'
  | 'RestaurantsAndDiningOut'
  | 'TakeawayDelivery'
  | 'CoffeeSnacks'
  // Personal Care & Health
  | 'HealthInsurance'
  | 'PharmacyMedications'
  | 'GymAndFitness'
  | 'PersonalCareProducts'
  | 'DoctorSpecialistVisits'
  // Kids & Family
  | 'Childcare'
  | 'KidsActivitiesAndEntertainment'
  // Entertainment & Leisure
  | 'MoviesCinema'
  | 'EventsConcertsAttractions'
  | 'HobbiesAndRecreation'
  | 'LotteryGambling'
  // Shopping
  | 'Clothing'
  | 'ElectronicsAndAppliances'
  | 'HomeGoodsAndFurniture'
  | 'BooksAndStationery'
  // Education
  | 'TuitionSchoolFees'
  | 'BooksAndSupplies'
  | 'LanguageClasses'
  // Financial Expenses
  | 'BankFees'
  | 'CreditCardPayments'
  | 'LoanPayments'
  | 'TransferFees'
  // Income
  | 'Salary'
  | 'OtherIncome'
  | 'Compensation'
  // Gifts & Donations
  | 'Gifts'
  | 'CharitableDonations'
  // Travel
  | 'Accommodation'
  | 'Activities'
  | 'Food'
  | 'Transportation'
  // Miscellaneous
  | 'Other';

// Map main categories to their subcategories
export const CATEGORY_MAPPING: Record<MainCategory, SubCategory[]> = {
  'Housing': ['Mortgage', 'Rent', 'Utilities', 'HomeInsurance', 'PropertyTaxes', 'HomeMaintenanceAndRepairs'],
  'Transportation': ['PublicTransportation', 'Fuel', 'CarInsurance', 'CarMaintenanceAndRepairs', 'Parking', 'RoadTax', 'Tolls', 'RideSharingServices', 'OVChipkaartRecharges'],
  'FoodAndGroceries': ['Groceries', 'RestaurantsAndDiningOut', 'TakeawayDelivery', 'CoffeeSnacks'],
  'PersonalCareAndHealth': ['HealthInsurance', 'PharmacyMedications', 'GymAndFitness', 'PersonalCareProducts', 'DoctorSpecialistVisits'],
  'KidsAndFamily': ['Childcare', 'KidsActivitiesAndEntertainment'],
  'EntertainmentAndLeisure': ['MoviesCinema', 'EventsConcertsAttractions', 'HobbiesAndRecreation', 'LotteryGambling'],
  'Shopping': ['Clothing', 'ElectronicsAndAppliances', 'HomeGoodsAndFurniture', 'BooksAndStationery'],
  'Education': ['TuitionSchoolFees', 'BooksAndSupplies', 'LanguageClasses'],
  'FinancialExpenses': ['BankFees', 'CreditCardPayments', 'LoanPayments', 'TransferFees'],
  'Income': ['Salary', 'OtherIncome', 'Compensation'],
  'GiftsAndDonations': ['Gifts', 'CharitableDonations'],
  'Travel': ['Accommodation', 'Activities', 'Food', 'Transportation'],
  'Miscellaneous': ['Other']
};

// Define colors for main categories
export const CATEGORY_COLORS: Record<MainCategory, string> = {
  'Housing': '#2196F3',     // Blue
  'Transportation': '#FF9800', // Orange
  'FoodAndGroceries': '#8BC34A', // Light Green
  'PersonalCareAndHealth': '#F44336',  // Red
  'KidsAndFamily': '#E91E63',   // Pink
  'EntertainmentAndLeisure': '#FF5722', // Deep Orange
  'Shopping': '#795548',    // Brown
  'Education': '#009688',   // Teal
  'FinancialExpenses': '#9C27B0',     // Purple
  'Income': '#4CAF50',      // Green
  'GiftsAndDonations': '#CDDC39',    // Lime
  'Travel': '#3F51B5', // Indigo
  'Miscellaneous': '#9E9E9E'        // Grey
};

// For backward compatibility
export type CategoryName = MainCategory;
export const DEFAULT_CATEGORIES = MAIN_CATEGORIES;

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  mainCategory: string;
  subCategory: string;
  account: string;
  counterparty: string | null;
  notes: string | null;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryTotals: Record<MainCategory, number>;
} 