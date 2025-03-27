import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Transaction, MainCategory, SubCategory } from '@/types/transaction';
import { saveTransactions } from '@/utils/db';

export async function POST(request: Request) {
  try {
    // Extract transactions array from request body
    const body = await request.json();
    const transactions: Transaction[] = Array.isArray(body) ? body : body.transactions || [];
    
    if (!transactions.length) {
      return NextResponse.json(
        { error: 'No valid transactions found in request' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${transactions.length} transactions`);
    
    // Add additional validation and error handling
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    try {
      // Use the improved saveTransactions function that checks for duplicates
      const savedTransactions = await saveTransactions(transactions);
      processedCount = savedTransactions.length;
      
      // Get the last updated date
      const lastUpdated = await prisma.transaction.findFirst({
        orderBy: {
          updatedAt: 'desc'
        },
        select: {
          updatedAt: true
        }
      });
      
      // Get all transactions for the response
      const allTransactions = await prisma.transaction.findMany({
        orderBy: {
          date: 'desc'
        }
      });

      console.log(`Successfully saved ${processedCount} out of ${transactions.length} transactions`);
      
      return NextResponse.json({
        transactions: allTransactions,
        lastUpdated: lastUpdated?.updatedAt || null,
        newTransactionsCount: savedTransactions.length,
        totalTransactionsCount: allTransactions.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (saveError: any) {
      // Handle specific save errors
      console.error(`Error during transaction save operation: ${saveError.message}`);
      
      if (saveError.message && saveError.message.includes('Invalid date')) {
        return NextResponse.json(
          { 
            error: 'Date validation error',
            message: saveError.message,
            hint: 'Check date formats in your CSV. Dates must be in a recognized format.'
          },
          { status: 400 }
        );
      }
      
      throw saveError; // re-throw for the outer catch block
    }
  } catch (error: any) {
    console.error('Error saving transactions:', error);
    
    // Provide a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to save transactions',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Get the last updated date
    const lastUpdated = await prisma.transaction.findFirst({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      }
    });

    // Get transactions for the specified period if dates are provided
    let transactions = [];
    if (start && end) {
      transactions = await prisma.transaction.findMany({
        where: {
          date: {
            gte: new Date(start),
            lte: new Date(end)
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
    } else {
      // If no dates provided, get all transactions
      transactions = await prisma.transaction.findMany({
        orderBy: {
          date: 'desc'
        }
      });
    }

    return NextResponse.json({
      transactions,
      lastUpdated: lastUpdated?.updatedAt || null
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { transactionId, mainCategory, subCategory } = await request.json();
    
    console.log(`Updating transaction ${transactionId} to category: ${mainCategory} -> ${subCategory}`);

    try {
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { 
          mainCategory: mainCategory as MainCategory,
          subCategory: subCategory as SubCategory
        },
      });
      
      console.log(`Transaction updated successfully to: ${updatedTransaction.mainCategory} -> ${updatedTransaction.subCategory}`);

      // Update pattern usage count
      try {
        const pattern = await prisma.categoryPattern.findFirst({
          where: {
            pattern: { contains: updatedTransaction.description.toLowerCase() },
            mainCategory: mainCategory as MainCategory,
            subCategory: subCategory as SubCategory
          },
        });

        if (pattern) {
          await prisma.categoryPattern.update({
            where: { id: pattern.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      } catch (patternError) {
        console.error('Error updating pattern usage count:', patternError);
        // Continue even if pattern update fails
      }

      return NextResponse.json(updatedTransaction);
    } catch (updateError: any) {
      console.error('Prisma error updating transaction:', updateError);
      return NextResponse.json(
        { error: `Failed to update transaction: ${updateError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in PUT handler:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}