'use client';

import { useState } from 'react';
import { MainCategory, SubCategory } from '@/types/transaction';
import { CATEGORY_MAPPING } from '@/utils/categoryMapping';

export default function CategoriesPage() {
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);

  const handleMainCategoryClick = (category: MainCategory) => {
    setSelectedMainCategory(category);
    setSelectedSubCategory(null); // Reset sub-category selection
  };

  const handleSubCategoryClick = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>

      {!selectedMainCategory && (
        <div className="flex flex-wrap gap-4">
          {Object.keys(CATEGORY_MAPPING).map((mainCategory) => (
            <button
              key={mainCategory}
              onClick={() => handleMainCategoryClick(mainCategory as MainCategory)}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
            >
              {mainCategory.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      )}

      {selectedMainCategory && !selectedSubCategory && (
        <div className="flex flex-wrap gap-4">
          {CATEGORY_MAPPING[selectedMainCategory].map((subCategory) => (
            <button
              key={subCategory}
              onClick={() => handleSubCategoryClick(subCategory)}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-full hover:bg-green-200"
            >
              {subCategory.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      )}

      {selectedSubCategory && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{selectedSubCategory.replace(/([A-Z])/g, ' $1').trim()}</h2>
          <p className="text-gray-600">Description and rules for {selectedSubCategory}.</p>
          {/* Add more detailed information about the sub-category here */}
        </div>
      )}
    </div>
  );
} 