import { initializeDatabase } from '../src/lib/initDb';

async function main() {
  try {
    await initializeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main(); 