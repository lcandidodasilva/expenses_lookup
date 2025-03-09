# Personal Finance Tracker

A Next.js application for analyzing and categorizing bank transactions from CSV files. This application helps you organize your finances by providing visual insights into your spending patterns and transaction history.

## Features

- CSV file upload with drag-and-drop support
- Automatic transaction categorization
- Financial summary with income, expenses, and balance
- Visual representation of expenses by category
- Detailed transaction list with sorting and filtering
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd house_keeping
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## CSV File Format

The application expects CSV files with the following columns:
- `date`: Transaction date (YYYY-MM-DD format)
- `description`: Transaction description
- `amount`: Transaction amount (positive for credits, negative for debits)

Example:
```csv
date,description,amount
2024-03-15,Salary Deposit,5000.00
2024-03-16,Grocery Store,-150.25
2024-03-17,Netflix Subscription,-15.99
```

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Chart.js
- Papa Parse (CSV parsing)
- Date-fns
- Heroicons

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
