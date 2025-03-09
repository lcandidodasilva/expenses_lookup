import { NextResponse } from 'next/server';
import { saveTransactions, updateTransactionCategory, getTransactionsByPeriod } from '@/utils/db';
import { Transaction } from '@/types/transaction';

export async function POST(request: Request) {
  try {
    const transactions: Transaction[] = await request.json();
    const savedTransactions = await saveTransactions(transactions);
    return NextResponse.json(savedTransactions);
  } catch (error) {
    console.error('Error saving transactions:', error);
    return NextResponse.json({ error: 'Failed to save transactions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { transactionId, categoryName } = await request.json();
    const updatedTransaction = await updateTransactionCategory(transactionId, categoryName);
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = new Date(searchParams.get('start') || '');
    const end = new Date(searchParams.get('end') || '');

    const transactions = await getTransactionsByPeriod(start, end);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
} 