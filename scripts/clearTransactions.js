// Script to clear all transactions and category patterns from the database
const { PrismaClient } = require('@prisma/client');

async function clearDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    console.log('Clearing transactions and category patterns...');
    
    // Delete all transactions
    const transactionResult = await prisma.transaction.deleteMany({});
    console.log(`Successfully deleted ${transactionResult.count} transactions.`);
    
    // Delete all category patterns (optional, comment out if you want to keep learned patterns)
    const patternResult = await prisma.categoryPattern.deleteMany({});
    console.log(`Successfully deleted ${patternResult.count} category patterns.`);
    
    console.log('Database cleaned successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase()
  .then(() => {
    console.log('Operation completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 