/**
 * Shared category definitions used by AddExpenseModal, FilterModal, and
 * any other component that needs to enumerate transaction categories.
 *
 * Single source of truth — add new categories here and every consumer
 * updates automatically.
 */

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food & Drink" },
  { id: "shopping", label: "Shopping" },
  { id: "housing", label: "Housing" },
  { id: "transport", label: "Transportation" },
  { id: "utilities", label: "Utilities" },
  { id: "other", label: "Other" },
] as const;

export const INCOME_CATEGORIES = [
  { id: "salary", label: "Salary" },
  { id: "freelance", label: "Freelance" },
  { id: "investment", label: "Investment" },
  { id: "gift", label: "Gift" },
  { id: "family", label: "Family" },
  { id: "other", label: "Other" },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]["id"];
export type IncomeCategoryId = (typeof INCOME_CATEGORIES)[number]["id"];
