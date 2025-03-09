import { Transaction } from '@/types/transaction';
import { startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth, addMonths, format, getDate } from 'date-fns';

export interface MonthlyPeriod {
  start: Date;
  end: Date;
  label: string;
}

export function findSalaryDates(transactions: Transaction[]): Date[] {
  return transactions
    .filter(t => {
      const date = new Date(t.date);
      const dayOfMonth = getDate(date);
      return t.type === 'credit' && 
        (t.description.includes('EBAY MARKETPLACES GMBH') ||
        t.description.includes('CONNEXIE')) &&
        dayOfMonth >= 20 && dayOfMonth <= 23;
    })
    .map(t => new Date(t.date))
    .sort((a, b) => a.getTime() - b.getTime());
}

export function generateMonthlyPeriods(transactions: Transaction[]): MonthlyPeriod[] {
  if (transactions.length === 0) return [];

  // Find the earliest and latest transaction dates
  const allDates = transactions.map(t => new Date(t.date));
  const earliest = new Date(Math.min(...allDates.map(d => d.getTime())));
  const latest = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Start from the first day of the month of the earliest transaction
  let currentDate = startOfMonth(earliest);
  const periods: MonthlyPeriod[] = [];

  while (currentDate <= latest) {
    const periodStart = currentDate;
    const periodEnd = endOfMonth(currentDate);
    
    periods.push({
      start: startOfDay(periodStart),
      end: endOfDay(periodEnd),
      label: formatMonthYear(periodStart)
    });

    // Move to the next month
    currentDate = addMonths(currentDate, 1);
  }

  return periods;
}

function formatMonthYear(date: Date): string {
  return format(date, 'MMM yyyy');
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: MonthlyPeriod
): Transaction[] {
  return transactions.filter(transaction =>
    isWithinInterval(new Date(transaction.date), { 
      start: period.start, 
      end: period.end 
    })
  );
} 