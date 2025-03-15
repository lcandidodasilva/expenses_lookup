// Script to clear all transactions from the database
const { PrismaClient } = require('@prisma/client');

async function clearTransactions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Delete all transactions
    const result = await prisma.transaction.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} transactions.`);
  } catch (error) {
    console.error('Error clearing transactions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearTransactions()
  .then(() => {
    console.log('Operation completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 