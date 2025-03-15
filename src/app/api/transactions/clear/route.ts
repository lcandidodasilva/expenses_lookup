import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    // Delete all transactions from the database
    const deletedCount = await prisma.transaction.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount.count} transactions`,
      deletedCount: deletedCount.count
    });
  } catch (error) {
    console.error('Error clearing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to clear transactions', success: false },
      { status: 500 }
    );
  }
} 