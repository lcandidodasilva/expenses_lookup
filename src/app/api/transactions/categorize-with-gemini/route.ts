import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { categorizeWithGemini } from '@/utils/geminiCategorizer';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { transactionId, description } = body;

    if (!transactionId || !description) {
      return NextResponse.json(
        { error: 'Transaction ID and description are required' },
        { status: 400 }
      );
    }

    // Get the transaction from the database
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Categorize the transaction using Gemini
    const { mainCategory, subCategory } = await categorizeWithGemini(description);
    
    // Convert to database enum values
    const dbMainCategory = mainCategory.replace(/\s+&\s+/g, 'And').replace(/\s+/g, '');
    const dbSubCategory = subCategory.replace(/\s+&\s+/g, 'And').replace(/\//g, '').replace(/\s+/g, '');

    // Update the transaction in the database
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        mainCategory: dbMainCategory,
        subCategory: dbSubCategory,
      },
    });

    // Update or create a category pattern
    await prisma.categoryPattern.upsert({
      where: {
        pattern: description.toLowerCase(),
      },
      update: {
        mainCategory: dbMainCategory,
        subCategory: dbSubCategory,
        usageCount: { increment: 1 },
      },
      create: {
        pattern: description.toLowerCase(),
        mainCategory: dbMainCategory,
        subCategory: dbSubCategory,
        confidence: 0.9, // High confidence since it's from Gemini
        usageCount: 1,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      categorization: { mainCategory, subCategory },
    });
  } catch (error) {
    console.error('Error categorizing transaction with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to categorize transaction' },
      { status: 500 }
    );
  }
}

// Also allow recategorizing multiple transactions in batch
export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { transactionIds } = body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'Transaction IDs array is required' },
        { status: 400 }
      );
    }

    // Process in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    const results = [];
    let successCount = 0;

    // Process transactions in batches
    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
      const batch = transactionIds.slice(i, i + BATCH_SIZE);
      
      // Get transactions from the database
      const transactions = await prisma.transaction.findMany({
        where: { id: { in: batch } },
      });

      // Process each transaction in the batch
      const batchPromises = transactions.map(async (transaction) => {
        try {
          // Categorize the transaction using Gemini
          const { mainCategory, subCategory } = await categorizeWithGemini(transaction.description);
          
          // Convert to database enum values
          const dbMainCategory = mainCategory.replace(/\s+&\s+/g, 'And').replace(/\s+/g, '');
          const dbSubCategory = subCategory.replace(/\s+&\s+/g, 'And').replace(/\//g, '').replace(/\s+/g, '');

          // Update the transaction in the database
          const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              mainCategory: dbMainCategory,
              subCategory: dbSubCategory,
            },
          });

          // Update or create a category pattern
          await prisma.categoryPattern.upsert({
            where: {
              pattern: transaction.description.toLowerCase(),
            },
            update: {
              mainCategory: dbMainCategory,
              subCategory: dbSubCategory,
              usageCount: { increment: 1 },
            },
            create: {
              pattern: transaction.description.toLowerCase(),
              mainCategory: dbMainCategory,
              subCategory: dbSubCategory,
              confidence: 0.9, // High confidence since it's from Gemini
              usageCount: 1,
            },
          });

          successCount++;
          return {
            id: transaction.id,
            success: true,
            categorization: { mainCategory, subCategory },
          };
        } catch (error) {
          console.error(`Error categorizing transaction ${transaction.id}:`, error);
          return {
            id: transaction.id,
            success: false,
            error: 'Failed to categorize transaction',
          };
        }
      });

      // Wait for all transactions in the batch to be processed
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < transactionIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: transactionIds.length,
      successfullyRecategorized: successCount,
      results,
    });
  } catch (error) {
    console.error('Error batch categorizing transactions with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to batch categorize transactions' },
      { status: 500 }
    );
  }
} 