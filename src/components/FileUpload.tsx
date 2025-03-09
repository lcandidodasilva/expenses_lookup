'use client';

import { ChangeEvent, DragEvent, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
      onFileUpload(files[0]);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type === 'text/csv') {
      onFileUpload(files[0]);
    } else {
      alert('Please upload a CSV file');
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="mb-2 text-lg">Drag and drop your CSV file here</p>
      <p className="text-sm text-gray-500 mb-4">or</p>
      <label className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
        Browse Files
        <input
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleFileInput}
        />
      </label>
    </div>
  );
} 