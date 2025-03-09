import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Transaction } from '@/types/transaction';

export async function POST(request: Request) {
  try {
    const transactions: Transaction[] = await request.json();
    
    // Save all transactions
    const savedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        return prisma.transaction.create({
          data: {
            ...transaction,
            date: new Date(transaction.date), // Ensure date is properly converted
          },
        });
      })
    );

    return NextResponse.json(savedTransactions);
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

    let whereClause = {};
    if (start && end) {
      whereClause = {
        date: {
          gte: new Date(start),
          lte: new Date(end),
        },
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
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

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { category: categoryName },
    });

    // Update pattern usage count
    const pattern = await prisma.categoryPattern.findFirst({
      where: {
        pattern: { contains: updatedTransaction.description.toLowerCase() },
        category: categoryName,
      },
    });

    if (pattern) {
      await prisma.categoryPattern.update({
        where: { id: pattern.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
} 