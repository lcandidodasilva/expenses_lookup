import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Transaction } from '@/types/transaction';
import { saveTransactions } from '@/utils/db';
import { CategoryName } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const transactions: Transaction[] = await request.json();
    
    // Use the improved saveTransactions function that checks for duplicates
    const savedTransactions = await saveTransactions(transactions);
    
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

    return NextResponse.json({
      transactions: allTransactions,
      lastUpdated: lastUpdated?.updatedAt || null,
      newTransactionsCount: savedTransactions.length,
      totalTransactionsCount: allTransactions.length
    });
  } catch (error) {
    console.error('Error saving transactions:', error);
    return NextResponse.json(
      { error: 'Failed to save transactions' },
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
    const { transactionId, categoryName } = await request.json();
    
    console.log(`Updating transaction ${transactionId} to category: ${categoryName}`);
    
    // Ensure the category name is properly formatted
    // This helps debug issues with case sensitivity
    if (categoryName === 'Education') {
      console.log('Education category detected, ensuring proper case');
    }

    try {
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { category: categoryName as unknown as CategoryName },
      });
      
      console.log(`Transaction updated successfully to: ${updatedTransaction.category}`);

      // Update pattern usage count
      try {
        const pattern = await prisma.categoryPattern.findFirst({
          where: {
            pattern: { contains: updatedTransaction.description.toLowerCase() },
            category: categoryName as unknown as CategoryName,
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