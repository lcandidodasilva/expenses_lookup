import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { categorizeWithGemini } from '@/utils/geminiCategorizer';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { MainCategory, SubCategory } from '@/types/transaction';

// Process transactions in batches to avoid overwhelming the API
const BATCH_SIZE = 5;

// Helper function to process transactions in batches
async function processBatch(transactions: any[], startIdx: number, batchSize: number) {
  const endIdx = Math.min(startIdx + batchSize, transactions.length);
  const batch = transactions.slice(startIdx, endIdx);
  
  const results = await Promise.all(
    batch.map(async (transaction) => {
      try {
        console.log(`Processing transaction: ${transaction.id} - ${transaction.description}`);
        
        // Determine the transaction type
        const type = transaction.amount >= 0 ? 'credit' : 'debit';
        
        // Use Gemini to categorize the transaction
        const newCategory = await categorizeWithGemini(transaction.description, type);
        
        console.log(`Categorized "${transaction.description}" as: ${newCategory.mainCategory} -> ${newCategory.subCategory}`);
        
        // Only update if the category is not Miscellaneous/Other
        if (newCategory.mainCategory !== 'Miscellaneous' || newCategory.subCategory !== 'Other') {
          try {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: { 
                mainCategory: newCategory.mainCategory as MainCategory,
                subCategory: newCategory.subCategory as SubCategory
              }
            });
            
            console.log(`Updated transaction ${transaction.id} to category: ${newCategory.mainCategory} -> ${newCategory.subCategory}`);
            
            return {
              id: transaction.id,
              oldMainCategory: transaction.mainCategory || 'Miscellaneous',
              oldSubCategory: transaction.subCategory || 'Other',
              newMainCategory: newCategory.mainCategory,
              newSubCategory: newCategory.subCategory
            };
          } catch (updateError: any) {
            console.error(`Error updating transaction ${transaction.id}:`, updateError);
            console.error(`Failed to update to category: ${newCategory.mainCategory} -> ${newCategory.subCategory}, error: ${updateError.message || 'Unknown error'}`);
            return null;
          }
        } else {
          console.log(`Keeping transaction ${transaction.id} as '${transaction.mainCategory || 'Miscellaneous'} -> ${transaction.subCategory || 'Other'}'`);
        }
        
        return null;
      } catch (error: any) {
        console.error(`Error processing transaction ${transaction.id}:`, error);
        return null;
      }
    })
  );
  
  return results.filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM
    
    let whereClause: any = { 
      mainCategory: 'Miscellaneous',
      subCategory: 'Other'
    };
    let monthLabel = 'all time';
    
    // If month is specified, filter transactions for that month
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(startDate);
      
      whereClause = {
        ...whereClause,
        date: {
          gte: startDate,
          lte: endDate
        }
      };
      
      monthLabel = format(startDate, 'MMMM yyyy');
    }
    
    // Find transactions with category 'Miscellaneous/Other' for the specified month (or all time)
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        message: `No transactions found to recategorize for ${monthLabel}`,
        recategorizedCount: 0
      });
    }

    // Process transactions in batches
    const successfulRecategorizations = [];
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batchResults = await processBatch(transactions, i, BATCH_SIZE);
      successfulRecategorizations.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: `Successfully recategorized ${successfulRecategorizations.length} out of ${transactions.length} transactions for ${monthLabel}`,
      recategorizedCount: successfulRecategorizations.length,
      totalCount: transactions.length,
      recategorized: successfulRecategorizations,
      month: monthParam || 'all'
    });
  } catch (error) {
    console.error('Error recategorizing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to recategorize transactions' },
      { status: 500 }
    );
  }
} 