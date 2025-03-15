'use client';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'Upload a CSV file to get started',
  description = 'Your file should contain columns for date, description, and amount'
}: EmptyStateProps) {
  return (
    <div className="text-center text-gray-500 mt-16">
      <p className="text-xl">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
} 