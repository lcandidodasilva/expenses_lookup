import { MainCategory, SubCategory } from '@/types/transaction';

export const CATEGORY_MAPPING: Record<MainCategory, SubCategory[]> = {
  Housing: ['Mortgage', 'Rent', 'Utilities', 'HomeInsurance', 'PropertyTaxes', 'HomeMaintenanceAndRepairs'],
  Transportation: ['PublicTransportation', 'Fuel', 'CarInsurance', 'CarMaintenanceAndRepairs', 'Parking', 'RoadTax', 'Tolls', 'RideSharingServices', 'OVChipkaartRecharges'],
  FoodAndGroceries: ['Groceries', 'RestaurantsAndDiningOut', 'TakeawayDelivery', 'CoffeeSnacks'],
  PersonalCareAndHealth: ['HealthInsurance', 'PharmacyMedications', 'GymAndFitness', 'PersonalCareProducts', 'DoctorSpecialistVisits'],
  KidsAndFamily: ['Childcare', 'KidsActivitiesAndEntertainment'],
  EntertainmentAndLeisure: ['MoviesCinema', 'EventsConcertsAttractions', 'HobbiesAndRecreation', 'LotteryGambling'],
  Shopping: ['Clothing', 'ElectronicsAndAppliances', 'HomeGoodsAndFurniture', 'BooksAndStationery'],
  Education: ['TuitionSchoolFees', 'BooksAndSupplies', 'LanguageClasses'],
  FinancialExpenses: ['BankFees', 'CreditCardPayments', 'LoanPayments', 'TransferFees'],
  Income: ['Salary', 'OtherIncome', 'Compensation'],
  GiftsAndDonations: ['Gifts', 'CharitableDonations'],
  Travel: ['Accommodation', 'Activities', 'Food', 'Transportation'],
  Miscellaneous: ['Other'],
}; 