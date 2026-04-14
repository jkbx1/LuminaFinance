/**
 * Get the saved custom icon for a category from localStorage.
 */
export const getSavedCategoryIcon = (category: string): string | null => {
  try {
    const saved = localStorage.getItem("lumina_category_icons");
    if (saved) {
      const map = JSON.parse(saved);
      return map[category.toLowerCase()] || null;
    }
  } catch (e) {
    console.error("Error reading category icons from localStorage", e);
  }
  return null;
};

/**
 * Save a custom icon for a category to localStorage.
 */
export const saveCategoryIcon = (category: string, iconName: string): void => {
  try {
    const saved = localStorage.getItem("lumina_category_icons");
    const map = saved ? JSON.parse(saved) : {};
    map[category.toLowerCase()] = iconName;
    localStorage.setItem("lumina_category_icons", JSON.stringify(map));
  } catch (e) {
    console.error("Error saving category icon to localStorage", e);
  }
};
