import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Check } from "lucide-react";
import { type Transaction } from "./ExpenseCard";

// Matches AddExpenseModal categories
const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food & Drink" },
  { id: "shopping", label: "Shopping" },
  { id: "housing", label: "Housing" },
  { id: "utilities", label: "Utilities" },
  { id: "other", label: "Other" },
];

const INCOME_CATEGORIES = [
  { id: "salary", label: "Salary" },
  { id: "freelance", label: "Freelance" },
  { id: "investment", label: "Investment" },
  { id: "gift", label: "Gift" },
  { id: "other", label: "Other" },
];

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentType: "all" | "income" | "expense";
  currentCategories: string[];
  currentMinAmount: number | null;
  currentMaxAmount: number | null;
  currentStartDate: string;
  currentEndDate: string;
  onApply: (filters: {
    type: "all" | "expense" | "income";
    categories: string[];
    minAmount: number | null;
    maxAmount: number | null;
    startDate: string;
    endDate: string;
  }) => void;
  convertToDefault: (amount: number, from: string) => number;
  currencySymbol: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currentType,
  currentCategories,
  currentMinAmount,
  currentMaxAmount,
  currentStartDate,
  currentEndDate,
  onApply,
  convertToDefault,
  currencySymbol,
}) => {
  const [type, setType] = useState<"all" | "expense" | "income">(currentType);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(currentCategories);
  const [minAmount, setMinAmount] = useState<string>(
    currentMinAmount?.toString() || "",
  );
  const [maxAmount, setMaxAmount] = useState<string>(
    currentMaxAmount?.toString() || "",
  );
  const [startDate, setStartDate] = useState<string>(currentStartDate);
  const [endDate, setEndDate] = useState<string>(currentEndDate);

  // Detect mobile Chrome synchronously — useMemo is correct on first render,
  // avoiding the useEffect delay that caused glitchy animations on mobile Chrome
  const isMobileChrome = useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isChrome =
      /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
    return isAndroid && isChrome;
  }, []);



  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setType(currentType);
      setSelectedCategories(currentCategories);
      setMinAmount(currentMinAmount?.toString() || "");
      setMaxAmount(currentMaxAmount?.toString() || "");
      setStartDate(currentStartDate);
      setEndDate(currentEndDate);
    }
  }, [isOpen, currentType, currentCategories, currentMinAmount, currentMaxAmount, currentStartDate, currentEndDate]);

  // Detect custom categories used in transactions
  const customCategories = useMemo(() => {
    const expenseCats = new Set<string>();
    const incomeCats = new Set<string>();

    transactions.forEach((tx) => {
      const isBuiltIn =
        tx.type === "expense"
          ? EXPENSE_CATEGORIES.some((c) => c.id === tx.category)
          : INCOME_CATEGORIES.some((c) => c.id === tx.category);

      if (!isBuiltIn) {
        if (tx.type === "expense") expenseCats.add(tx.category);
        else incomeCats.add(tx.category);
      }
    });

    return {
      expense: Array.from(expenseCats).sort(),
      income: Array.from(incomeCats).sort(),
    };
  }, [transactions]);

  // Calculate boundaries based on selected type
  const { absMin, absMax } = useMemo(() => {
    if (transactions.length === 0) return { absMin: -1000, absMax: 1000 };

    const convertedValues = transactions.map((t) =>
      convertToDefault(t.amount, t.currency),
    );

    const expenseValues = convertedValues.filter((v) => v < 0);
    const incomeValues = convertedValues.filter((v) => v > 0);

    const minExpense =
      expenseValues.length > 0 ? Math.floor(Math.min(...expenseValues)) : -1000;
    const maxIncome =
      incomeValues.length > 0 ? Math.ceil(Math.max(...incomeValues)) : 1000;

    if (type === "expense") return { absMin: minExpense, absMax: 0 };
    if (type === "income") return { absMin: 0, absMax: maxIncome };
    return { absMin: minExpense, absMax: maxIncome };
  }, [transactions, convertToDefault, type]);

  // Handle type switching: clear or clamp range if invalid for new type
  useEffect(() => {
    const minVal = parseFloat(minAmount);
    const maxVal = parseFloat(maxAmount);

    let needsReset = false;

    if (!isNaN(minVal)) {
      if (minVal < absMin || minVal > absMax) needsReset = true;
    }
    if (!isNaN(maxVal)) {
      if (maxVal < absMin || maxVal > absMax) needsReset = true;
    }

    if (needsReset) {
      setMinAmount("");
      setMaxAmount("");
    }
  }, [type, absMin, absMax]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId],
    );
  };

  const handleApply = () => {
    onApply({
      type,
      categories: selectedCategories,
      minAmount: minAmount === "" ? null : parseFloat(minAmount),
      maxAmount: maxAmount === "" ? null : parseFloat(maxAmount),
      startDate,
      endDate,
    });
    onClose();
  };

  const handleReset = () => {
    setType("all");
    setSelectedCategories([]);
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    onApply({
      type: "all",
      categories: [],
      minAmount: null,
      maxAmount: null,
      startDate: "",
      endDate: "",
    });
    onClose();
  };

  const modalTransition = { duration: 0.22, ease: "easeOut" as const };

  return (
    <>
      {/* Backdrop in its own AnimatePresence — fades independently */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={modalTransition}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel rendered directly (no AnimatePresence) — unmounts immediately
          when isOpen is false, so the view transition close can snapshot the button cleanly */}
      {isOpen && (
        <motion.div
          key="filter-modal-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={modalTransition}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none pb-safe"
        >
              <div
                className="relative w-full max-w-md flex flex-col pointer-events-auto glass-panel shadow-2xl border border-glass-border rounded-3xl"
                style={{
                  maxHeight: "95dvh",
                  overflow: "hidden",
                  viewTransitionName: !isMobileChrome ? "modal-morph" : undefined,
                }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-2 shrink-0 relative z-10">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-bold text-bright">Filter</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full hover:bg-bg-card/50 text-muted hover:text-bright transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content with Fade Mask */}
              <div
                className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-4 space-y-6 scrollbar-thin scrollbar-thumb-bg-border scrollbar-track-transparent"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
                }}
              >
                {/* Type Toggle */}
                <div className="space-y-3">
                  <label className="text-xs text-muted font-bold uppercase tracking-widest ml-1 opacity-60">
                    Transaction Type
                  </label>
                  <div className="flex bg-bg-card/30 p-1 rounded-full border border-bg-border backdrop-blur-sm">
                    {(["all", "expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setType(t);
                          setSelectedCategories([]);
                        }}
                        className={`relative flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full z-10 transition-colors ${
                          type === t
                            ? "text-accent"
                            : "text-muted hover:text-bright"
                        }`}
                      >
                        {type === t && (
                          <motion.div
                            layoutId="filter-type-highlight"
                            className="absolute inset-0 bg-accent/20 border border-accent/20 rounded-full z-[-1]"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted font-bold uppercase tracking-widest ml-1 opacity-60">
                      Amount Range ({currencySymbol})
                    </label>
                    {(minAmount !== "" || maxAmount !== "") && (
                      <button
                        onClick={() => {
                          setMinAmount("");
                          setMaxAmount("");
                        }}
                        className="text-[10px] text-accent/60 hover:text-accent font-bold uppercase tracking-wider transition-colors"
                      >
                        Clear Range
                      </button>
                    )}
                  </div>

                  {/* Amount Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[9px] font-bold uppercase tracking-widest pointer-events-none opacity-60">
                        MIN
                      </div>
                      <input
                        type="number"
                        placeholder={absMin.toString()}
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="w-full bg-bg-card/50 border border-bg-border rounded-2xl py-3 pl-14 pr-4 text-xs font-bold text-bright placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[9px] font-bold uppercase tracking-widest pointer-events-none opacity-60">
                        MAX
                      </div>
                      <input
                        type="number"
                        placeholder={absMax.toString()}
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="w-full bg-bg-card/50 border border-bg-border rounded-2xl py-3 pl-14 pr-4 text-xs font-bold text-bright placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Dual-Range Slider */}
                  <div className="px-2 pt-2 pb-4">
                    <div className="relative h-2 bg-bg-card/50 rounded-full border border-bg-border">
                      {/* Active Range Highlight */}
                      <div
                        className="absolute h-full bg-accent/30 rounded-full"
                        style={{
                          left: `${Math.max(0, Math.min(100, ((parseFloat(minAmount) || absMin) - absMin) / (absMax - absMin || 1) * 100))}%`,
                          right: `${100 - Math.max(0, Math.min(100, ((parseFloat(maxAmount) || absMax) - absMin) / (absMax - absMin || 1) * 100))}%`,
                        }}
                      />
                      {/* Range Inputs */}
                      <input
                        type="range"
                        min={absMin}
                        max={absMax}
                        value={minAmount || absMin}
                        onChange={(e) => {
                          const val = Math.min(
                            parseFloat(e.target.value),
                            parseFloat(maxAmount) || absMax,
                          );
                          setMinAmount(val.toString());
                        }}
                        className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-auto cursor-pointer z-20 range-thumb-accent"
                      />
                      <input
                        type="range"
                        min={absMin}
                        max={absMax}
                        value={maxAmount || absMax}
                        onChange={(e) => {
                          const val = Math.max(
                            parseFloat(e.target.value),
                            parseFloat(minAmount) || absMin,
                          );
                          setMaxAmount(val.toString());
                        }}
                        className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-auto cursor-pointer z-20 range-thumb-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 mx-2 my-2" />

                {/* Date Range */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted font-bold uppercase tracking-widest ml-1 opacity-60">
                      Date Range
                    </label>
                    {(startDate !== "" || endDate !== "") && (
                      <button
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="text-[10px] text-accent/60 hover:text-accent font-bold uppercase tracking-wider transition-colors"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[9px] font-bold uppercase tracking-widest pointer-events-none group-focus-within:text-accent/70 transition-colors opacity-60">
                        FROM
                      </div>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-bg-card/50 border border-bg-border rounded-2xl py-3 pl-14 pr-4 text-xs font-bold text-bright transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-[9px] font-bold uppercase tracking-widest pointer-events-none group-focus-within:text-accent/70 transition-colors opacity-60">
                        TO
                      </div>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-bg-card/50 border border-bg-border rounded-2xl py-3 pl-14 pr-4 text-xs font-bold text-bright transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 mx-2 my-2" />

                {/* Categories */}
                {type !== "all" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Built-in Section */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] ml-1 opacity-60">
                        Preset Categories
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategories([])}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                            selectedCategories.length === 0
                              ? "bg-accent/20 text-accent border-accent/40 shadow-[0_0_15px_rgba(255,0,55,0.2)]"
                              : "bg-bg-card/30 text-muted border-bg-border hover:bg-bg-card/50 hover:text-bright"
                          }`}
                        >
                          All {type}s
                        </button>
                        {(type === "expense"
                          ? EXPENSE_CATEGORIES
                          : INCOME_CATEGORIES
                        ).map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                              selectedCategories.includes(cat.id)
                                ? "bg-accent/20 text-accent border-accent/40 shadow-[0_0_15px_rgba(255,0,55,0.2)]"
                                : "bg-bg-card/30 text-muted border-bg-border hover:bg-bg-card/50 hover:text-bright"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Section */}
                    {customCategories[type].length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] ml-1 opacity-60">
                          Your Custom Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {customCategories[type].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => toggleCategory(cat)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                                selectedCategories.includes(cat)
                                  ? "bg-accent/20 text-accent border-accent/40 shadow-[0_0_15px_rgba(255,0,55,0.2)]"
                                  : "bg-bg-card/30 text-muted border-bg-border hover:bg-bg-card/50 hover:text-bright"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {type === "all" && (
                  <div className="p-8 text-center glass-panel rounded-2xl border border-bg-border border-dashed">
                    <p className="text-muted text-sm">
                      Showing all transaction types and categories.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 pt-2 shrink-0 border-t border-bg-border bg-bg-card/20 flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-full text-xs font-bold uppercase tracking-widest text-muted hover:text-bright hover:bg-bg-card/30 transition-all"
                >
                  Reset All
                </button>
                <button
                  onClick={handleApply}
                  className="flex-[2] bg-accent hover:bg-accent-hover text-white font-bold py-3 px-6 rounded-full shadow-[0_0_20px_rgba(255,0,55,0.3)] transition-all transform hover:-translate-y-0.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Filters
                </button>
              </div>
              </div>
        </motion.div>
      )}
    </>
  );
};
