export type TransactionType = 'credit' | 'debit';

export type MainCategory = 
  | 'Housing'
  | 'Transportation'
  | 'Food & Groceries'
  | 'Personal Care & Health'
  | 'Kids & Family'
  | 'Entertainment & Leisure'
  | 'Shopping'
  | 'Education'
  | 'Financial Expenses'
  | 'Income'
  | 'Gifts & Donations'
  | 'Travel'
  | 'Miscellaneous';

export const MAIN_CATEGORIES: MainCategory[] = [
  'Housing',
  'Transportation',
  'Food & Groceries',
  'Personal Care & Health',
  'Kids & Family',
  'Entertainment & Leisure',
  'Shopping',
  'Education',
  'Financial Expenses',
  'Income',
  'Gifts & Donations',
  'Travel',
  'Miscellaneous'
];

export type SubCategory = 
  // Housing
  | 'Mortgage'
  | 'Rent'
  | 'Utilities'
  | 'Home Insurance'
  | 'Property Taxes'
  | 'Home Maintenance & Repairs'
  // Transportation
  | 'Public Transportation'
  | 'Fuel'
  | 'Car Insurance'
  | 'Car Maintenance & Repairs'
  | 'Parking'
  | 'Road Tax'
  | 'Tolls'
  | 'Ride-Sharing Services'
  | 'OV-chipkaart recharges'
  // Food & Groceries
  | 'Groceries'
  | 'Restaurants & Dining Out'
  | 'Takeaway/Delivery'
  | 'Coffee/Snacks'
  // Personal Care & Health
  | 'Health Insurance'
  | 'Pharmacy/Medications'
  | 'Gym & Fitness'
  | 'Personal Care Products'
  | 'Doctor/Specialist Visits'
  // Kids & Family
  | 'Childcare'
  | 'Kids Activities & Entertainment'
  // Entertainment & Leisure
  | 'Movies/Cinema'
  | 'Events/Concerts/Attractions'
  | 'Hobbies & Recreation'
  | 'Lottery/Gambling'
  // Shopping
  | 'Clothing'
  | 'Electronics & Appliances'
  | 'Home Goods & Furniture'
  | 'Books & Stationery'
  // Education
  | 'Tuition/School Fees'
  | 'Books & Supplies'
  | 'Language Classes'
  // Financial Expenses
  | 'Bank Fees'
  | 'Credit Card Payments'
  | 'Loan Payments'
  | 'Transfer Fees'
  // Income
  | 'Salary'
  | 'Other Income'
  | 'Compensation'
  // Gifts & Donations
  | 'Gifts'
  | 'Charitable Donations'
  // Travel
  | 'Accommodation'
  | 'Activities'
  | 'Food'
  | 'Transportation'
  // Miscellaneous
  | 'Other';

// Map main categories to their subcategories
export const CATEGORY_MAPPING: Record<MainCategory, SubCategory[]> = {
  'Housing': ['Mortgage', 'Rent', 'Utilities', 'Home Insurance', 'Property Taxes', 'Home Maintenance & Repairs'],
  'Transportation': ['Public Transportation', 'Fuel', 'Car Insurance', 'Car Maintenance & Repairs', 'Parking', 'Road Tax', 'Tolls', 'Ride-Sharing Services', 'OV-chipkaart recharges'],
  'Food & Groceries': ['Groceries', 'Restaurants & Dining Out', 'Takeaway/Delivery', 'Coffee/Snacks'],
  'Personal Care & Health': ['Health Insurance', 'Pharmacy/Medications', 'Gym & Fitness', 'Personal Care Products', 'Doctor/Specialist Visits'],
  'Kids & Family': ['Childcare', 'Kids Activities & Entertainment'],
  'Entertainment & Leisure': ['Movies/Cinema', 'Events/Concerts/Attractions', 'Hobbies & Recreation', 'Lottery/Gambling'],
  'Shopping': ['Clothing', 'Electronics & Appliances', 'Home Goods & Furniture', 'Books & Stationery'],
  'Education': ['Tuition/School Fees', 'Books & Supplies', 'Language Classes'],
  'Financial Expenses': ['Bank Fees', 'Credit Card Payments', 'Loan Payments', 'Transfer Fees'],
  'Income': ['Salary', 'Other Income', 'Compensation'],
  'Gifts & Donations': ['Gifts', 'Charitable Donations'],
  'Travel': ['Accommodation', 'Activities', 'Food', 'Transportation'],
  'Miscellaneous': ['Other']
};

// Define colors for main categories
export const CATEGORY_COLORS: Record<MainCategory, string> = {
  'Housing': '#2196F3',     // Blue
  'Transportation': '#FF9800', // Orange
  'Food & Groceries': '#8BC34A', // Light Green
  'Personal Care & Health': '#F44336',  // Red
  'Kids & Family': '#E91E63',   // Pink
  'Entertainment & Leisure': '#FF5722', // Deep Orange
  'Shopping': '#795548',    // Brown
  'Education': '#009688',   // Teal
  'Financial Expenses': '#9C27B0',     // Purple
  'Income': '#4CAF50',      // Green
  'Gifts & Donations': '#CDDC39',    // Lime
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
  mainCategory: MainCategory;
  subCategory: SubCategory;
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