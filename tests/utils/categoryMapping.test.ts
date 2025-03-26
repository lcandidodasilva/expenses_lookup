import { CATEGORY_MAPPING } from '@/utils/categoryMapping';
import { $Enums } from '@prisma/client';

describe('categoryMapping', () => {
  it('should have all main categories defined in the schema', () => {
    // Get all the main categories from the MainCategory enum in Prisma
    const mainCategoryEnumValues = Object.values($Enums.MainCategory);
    
    // Get all the keys from the CATEGORY_MAPPING
    const mappingKeys = Object.keys(CATEGORY_MAPPING);
    
    // Check that all enum values are represented in the mapping
    mainCategoryEnumValues.forEach(category => {
      expect(mappingKeys).toContain(category);
    });
    
    // Check that there are no extra keys in the mapping that aren't in the enum
    mappingKeys.forEach(key => {
      expect(mainCategoryEnumValues).toContain(key);
    });
  });
  
  it('should have valid subcategories for each main category', () => {
    // Get all the subcategory values from the SubCategory enum in Prisma
    const subCategoryEnumValues = Object.values($Enums.SubCategory);
    
    // Check that each subcategory in the mapping is a valid enum value
    Object.entries(CATEGORY_MAPPING).forEach(([mainCategory, subCategories]) => {
      expect(Array.isArray(subCategories)).toBe(true);
      
      subCategories.forEach(subCategory => {
        expect(subCategoryEnumValues).toContain(subCategory);
      });
    });
  });
  
  it('should have appropriate subcategories for each main category', () => {
    // Test a few specific cases to ensure mapping makes sense
    
    // Housing should contain Rent, Mortgage, etc.
    expect(CATEGORY_MAPPING.Housing).toContain('Rent');
    expect(CATEGORY_MAPPING.Housing).toContain('Mortgage');
    
    // Transportation should contain Fuel, Car Maintenance, etc.
    expect(CATEGORY_MAPPING.Transportation).toContain('Fuel');
    expect(CATEGORY_MAPPING.Transportation).toContain('CarMaintenanceAndRepairs');
    
    // FoodAndGroceries should contain Groceries, RestaurantsAndDiningOut, etc.
    expect(CATEGORY_MAPPING.FoodAndGroceries).toContain('Groceries');
    expect(CATEGORY_MAPPING.FoodAndGroceries).toContain('RestaurantsAndDiningOut');
    
    // Income should contain Salary, etc.
    expect(CATEGORY_MAPPING.Income).toContain('Salary');
  });
  
  it('should not have overlapping subcategories between main categories', () => {
    // Create a map to track which main categories each subcategory belongs to
    const subCategoryToMainCategories: Record<string, string[]> = {};
    
    Object.entries(CATEGORY_MAPPING).forEach(([mainCategory, subCategories]) => {
      subCategories.forEach(subCategory => {
        if (!subCategoryToMainCategories[subCategory]) {
          subCategoryToMainCategories[subCategory] = [];
        }
        subCategoryToMainCategories[subCategory].push(mainCategory);
      });
    });
    
    // Check that each subcategory only belongs to one main category
    // Note: This might need to be adjusted if your business logic allows subcategories to appear in multiple main categories
    Object.entries(subCategoryToMainCategories).forEach(([subCategory, mainCategories]) => {
      expect(mainCategories.length).toBe(1);
    });
  });
}); 