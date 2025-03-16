/*
  Warnings:

  - You are about to drop the column `category` on the `CategoryPattern` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `mainCategory` to the `CategoryPattern` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subCategory` to the `CategoryPattern` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MainCategory" AS ENUM ('Housing', 'Transportation', 'FoodAndGroceries', 'PersonalCareAndHealth', 'KidsAndFamily', 'EntertainmentAndLeisure', 'Shopping', 'Education', 'FinancialExpenses', 'Income', 'GiftsAndDonations', 'Travel', 'Miscellaneous');

-- CreateEnum
CREATE TYPE "SubCategory" AS ENUM ('Mortgage', 'Rent', 'Utilities', 'HomeInsurance', 'PropertyTaxes', 'HomeMaintenanceAndRepairs', 'PublicTransportation', 'Fuel', 'CarInsurance', 'CarMaintenanceAndRepairs', 'Parking', 'RoadTax', 'Tolls', 'RideSharingServices', 'OVChipkaartRecharges', 'Groceries', 'RestaurantsAndDiningOut', 'TakeawayDelivery', 'CoffeeSnacks', 'HealthInsurance', 'PharmacyMedications', 'GymAndFitness', 'PersonalCareProducts', 'DoctorSpecialistVisits', 'Childcare', 'KidsActivitiesAndEntertainment', 'MoviesCinema', 'EventsConcertsAttractions', 'HobbiesAndRecreation', 'LotteryGambling', 'Clothing', 'ElectronicsAndAppliances', 'HomeGoodsAndFurniture', 'BooksAndStationery', 'TuitionSchoolFees', 'BooksAndSupplies', 'LanguageClasses', 'BankFees', 'CreditCardPayments', 'LoanPayments', 'TransferFees', 'Salary', 'OtherIncome', 'Compensation', 'Gifts', 'CharitableDonations', 'Accommodation', 'Activities', 'Food', 'Transportation', 'Other');

-- AlterTable
ALTER TABLE "CategoryPattern" DROP COLUMN "category",
ADD COLUMN     "mainCategory" "MainCategory" NOT NULL,
ADD COLUMN     "subCategory" "SubCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "category",
ADD COLUMN     "mainCategory" "MainCategory" NOT NULL DEFAULT 'Miscellaneous',
ADD COLUMN     "subCategory" "SubCategory" NOT NULL DEFAULT 'Other';

-- DropEnum
DROP TYPE "CategoryName";
