import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Calendar, Plus, Check, Edit2 } from "lucide-react";
import { type Transaction, CUSTOM_ICONS_MAP } from "./ExpenseCard";

// ─── Currency Options ────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "PLN", symbol: "zł" },
  { code: "JPY", symbol: "¥" },
  { code: "CAD", symbol: "CA$" },
];

// ─── Category Sets ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStoredCurrency = () =>
  localStorage.getItem("lumina_currency") ?? "USD";

const toDatetimeLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, "id">) => void;
  editingTransaction?: Transaction | null;
  onEdit?: (id: string, transaction: Omit<Transaction, "id">) => void;
  defaultDate?: Date;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  editingTransaction,
  onEdit,
  defaultDate,
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("food");
  const [customIcon, setCustomIcon] = useState("Monitor");
  const [currency, setCurrency] = useState(getStoredCurrency);
  const [dateStr, setDateStr] = useState(
    toDatetimeLocal(defaultDate || new Date()),
  );

  // Custom category
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryDraft, setCustomCategoryDraft] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile Chrome to simplify heavy modal animations there
  const [isMobileChrome, setIsMobileChrome] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent || "";
      const isAndroid = /Android/i.test(ua);
      const isChrome =
        /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
      setIsMobileChrome(isAndroid && isChrome);
    }
  }, []);

  // Populate form when opening
  React.useEffect(() => {
    if (isOpen && editingTransaction) {
      setTitle(editingTransaction.title);
      setAmount(Math.abs(editingTransaction.amount).toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setCustomIcon(editingTransaction.customIcon || "Monitor");
      setCurrency(editingTransaction.currency ?? getStoredCurrency());
      setDateStr(toDatetimeLocal(editingTransaction.date));
    } else if (isOpen && !editingTransaction) {
      setTitle("");
      setAmount("");
      setType("expense");
      setCategory("food");
      setCustomIcon("Monitor");
      setCurrency(getStoredCurrency());
      setDateStr(toDatetimeLocal(defaultDate || new Date()));
    }
    setShowCustomInput(false);
    setCustomCategoryDraft("");
  }, [isOpen, editingTransaction, defaultDate]);

  // Ensure category resets to a valid default when switching type
  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);
    setCategory(newType === "expense" ? "food" : "salary");
    setShowCustomInput(false);
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    localStorage.setItem("lumina_currency", code);
  };

  const handleCustomCategory = () => {
    const val = customCategoryDraft.trim();
    if (!val) return;
    setCategory(val.toLowerCase());
    setShowCustomInput(false);
    setCustomCategoryDraft("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    let finalCategory = category;
    if (showCustomInput && customCategoryDraft.trim()) {
      finalCategory = customCategoryDraft.trim().toLowerCase();
    }

    const isCustom =
      !EXPENSE_CATEGORIES.find((c) => c.id === finalCategory) &&
      !INCOME_CATEGORIES.find((c) => c.id === finalCategory);

    const txData: Omit<Transaction, "id"> = {
      title,
      amount:
        type === "expense"
          ? -Math.abs(Number(amount))
          : Math.abs(Number(amount)),
      type,
      category: finalCategory,
      currency,
      date: new Date(dateStr),
    };

    if (isCustom) {
      txData.customIcon = customIcon;
    } else {
      // Explicitly clear any lingering custom icon if the user switched back to a preset category
      txData.customIcon = "";
    }

    if (editingTransaction && onEdit) {
      onEdit(editingTransaction.id, txData);
    } else {
      onAdd(txData);
    }

    setTitle("");
    setAmount("");
    onClose();
  };

  const categories =
    type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const isCustomActive =
    showCustomInput ||
    (!EXPENSE_CATEGORIES.find((c) => c.id === category) &&
      !INCOME_CATEGORIES.find((c) => c.id === category));

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Standard CSS View Transition Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none pb-safe">
          <div
            className={`relative w-full max-w-md flex flex-col pointer-events-auto glass-panel shadow-2xl border border-white/20 rounded-3xl ${
              isMobileChrome
                ? "animate-in fade-in duration-200"
                : "animate-in fade-in zoom-in-95 duration-300"
            }`}
            style={{
              maxHeight: "95dvh",
              overflow: "hidden",
              viewTransitionName: isMobileChrome ? undefined : "modal-morph",
            }}
          >
            <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col items-stretch h-full max-h-[95dvh]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

              {/* Header (Fixed) */}
              <div className="flex items-center justify-between p-5 sm:p-8 pb-1 sm:pb-2 shrink-0 relative z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {editingTransaction ? "Edit Transaction" : "Add Transaction"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body and Footer Form Wrapper */}
              <form
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 min-h-0 relative z-10 w-full"
              >
                {/* Scrollable Form Fields with Fade Mask */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 sm:px-8 py-6 space-y-3 sm:space-y-5 w-full max-w-[320px] mx-auto sm:max-w-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                  style={{
                    maskImage:
                      "linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
                  }}
                >
                  {/* ── Currency selector ── */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium ml-1 tracking-wider uppercase">
                      Currency
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCurrencyChange(c.code)}
                          className={`relative py-2 rounded-full text-xs sm:text-sm font-medium transition-colors z-10 ${
                            currency === c.code
                              ? "text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {currency === c.code && (
                            <motion.div
                              layoutId="currency-highlight"
                              className="absolute inset-0 bg-teal-500/30 border border-teal-400/50 rounded-full z-[-1]"
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}
                          {c.symbol} {c.code}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Expense / Income toggle ── */}
                  <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm w-full relative">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("expense")}
                      className={`relative flex-1 py-2 text-sm font-medium rounded-full z-10 transition-colors ${
                        type === "expense"
                          ? "text-rose-300"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {type === "expense" && (
                        <motion.div
                          layoutId="type-pill-highlight"
                          className="absolute inset-0 bg-rose-500/20 border border-rose-500/30 rounded-full z-[-1]"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("income")}
                      className={`relative flex-1 py-2 text-sm font-medium rounded-full z-10 transition-colors ${
                        type === "income"
                          ? "text-emerald-300"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {type === "income" && (
                        <motion.div
                          layoutId="type-pill-highlight"
                          className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-full z-[-1]"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      Income
                    </button>
                  </div>

                  {/* ── Amount ── */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">
                      {CURRENCIES.find((c) => c.code === currency)?.symbol ??
                        currency}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-10 pr-4 sm:py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-xl font-medium"
                      required
                    />
                  </div>

                  {/* ── Description ── */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Tag className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Description (e.g., Groceries)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 sm:py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-medium"
                      required
                    />
                  </div>

                  {/* ── Date & Time picker ── */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <input
                      type="datetime-local"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 sm:py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-medium [color-scheme:dark]"
                      required
                    />
                  </div>

                  {/* ── Category ── */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium ml-1">
                      Category
                    </label>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={type}
                        layout={false}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="grid grid-cols-2 gap-2"
                      >
                        {categories.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => {
                              setCategory(c.id);
                              setShowCustomInput(false);
                            }}
                            className={`relative py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${
                              category === c.id
                                ? "text-teal-300"
                                : "bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/10"
                            }`}
                          >
                            {category === c.id && (
                              <motion.div
                                layoutId="category-highlight"
                                className="absolute inset-0 bg-teal-500/20 border border-teal-500/30 rounded-full z-[-1]"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              />
                            )}
                            {c.label}
                          </button>
                        ))}

                        {/* Custom category pill */}
                        <AnimatePresence mode="wait">
                          {showCustomInput ? (
                            <motion.div
                              key="custom-input"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-full px-2 py-0.5"
                            >
                              <input
                                ref={customInputRef}
                                autoFocus
                                type="text"
                                value={customCategoryDraft}
                                onChange={(e) =>
                                  setCustomCategoryDraft(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCustomCategory();
                                  }
                                  if (e.key === "Escape") {
                                    setShowCustomInput(false);
                                  }
                                }}
                                placeholder="Custom…"
                                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-24"
                              />
                              <button
                                type="button"
                                onClick={handleCustomCategory}
                                className="p-1 rounded-full hover:bg-teal-500/20 text-teal-400 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          ) : isCustomActive ? (
                            <motion.button
                              key="selected-custom-btn"
                              type="button"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                              onClick={() => {
                                setShowCustomInput(true);
                                setCustomCategoryDraft(category);
                                setTimeout(
                                  () => customInputRef.current?.focus(),
                                  50,
                                );
                              }}
                              className="relative py-2.5 flex items-center justify-center gap-1 rounded-full text-sm font-medium z-10 text-teal-300"
                            >
                              <motion.div
                                layoutId="category-highlight"
                                className="absolute inset-0 bg-teal-500/20 border border-teal-500/30 rounded-full z-[-1]"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              />
                              <Edit2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[80px]">
                                {category.charAt(0).toUpperCase() +
                                  category.slice(1)}
                              </span>
                            </motion.button>
                          ) : (
                            <motion.button
                              key="add-custom-btn"
                              type="button"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                              onClick={() => {
                                setShowCustomInput(true);
                                setTimeout(
                                  () => customInputRef.current?.focus(),
                                  50,
                                );
                              }}
                              className="flex items-center justify-center gap-1 py-2.5 rounded-full text-sm font-medium bg-white/5 text-slate-500 hover:text-slate-300 border border-dashed border-white/10 hover:border-white/20 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add custom
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </AnimatePresence>

                    {/* Custom Icon Picker */}
                    <AnimatePresence>
                      {isCustomActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3">
                            <label className="text-xs text-slate-400 font-medium ml-1 mb-2 block tracking-wide uppercase">
                              Custom Icon
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(CUSTOM_ICONS_MAP).map(
                                ([iconName, IconComp]) => (
                                  <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => setCustomIcon(iconName)}
                                    className={`p-2 rounded-xl transition-all ${
                                      customIcon === iconName
                                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                                        : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-200"
                                    }`}
                                  >
                                    <IconComp className="w-5 h-5" />
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Submit (Fixed Footer) ── */}
                <div className="shrink-0 p-5 sm:p-8 pt-2 sm:pt-4 border-t border-white/5 bg-slate-900/10">
                  <button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3.5 px-6 rounded-full shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transform hover:-translate-y-0.5 text-base uppercase tracking-wide"
                  >
                    {editingTransaction ? "Save Changes" : "Save Transaction"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
