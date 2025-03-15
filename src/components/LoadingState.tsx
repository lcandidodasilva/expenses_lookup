'use client';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading transactions...' }: LoadingStateProps) {
  return (
    <div className="text-center text-gray-500 my-8">
      <p className="text-xl">{message}</p>
    </div>
  );
} 