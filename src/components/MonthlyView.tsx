import React, { useState, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { flushSync } from "react-dom";
import { ExpenseCard, type Transaction } from "./ExpenseCard";
import { GlassCard } from "./ui/GlassCard";
import { FilterModal } from "./FilterModal";

interface MonthlyViewProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction, target?: HTMLElement) => void;
  onDelete: (id: string) => void;
  editingTransactionId?: string | null;
  isModalOpen?: boolean;
  defaultCurrency: string;
  convertToDefault: (amount: number, from: string) => number;
  injectedSelectedDate: Date | null;
  setInjectedSelectedDate: (date: Date | null) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  transactions,
  onEdit,
  onDelete,
  editingTransactionId,
  isModalOpen,
  defaultCurrency,
  convertToDefault,
  injectedSelectedDate,
  setInjectedSelectedDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "month">("day");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterMinAmount, setFilterMinAmount] = useState<number | null>(null);
  const [filterMaxAmount, setFilterMaxAmount] = useState<number | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Detect mobile Chrome synchronously — useMemo is correct on first render,
  // avoiding the useEffect delay that could cause glitchy View Transitions
  const isMobileChrome = useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isChrome =
      /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
    return isAndroid && isChrome;
  }, []);


  // We can just set viewMode directly when they click a specific day.
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
    setInjectedSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
    setInjectedSelectedDate(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setInjectedSelectedDate(today);
  };

  const closeFilterModal = () => {
    const targetId = "filter-button-monthly";

    if (!document.startViewTransition || isMobileChrome) {
      setIsFilterModalOpen(false);
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsFilterModalOpen(false);
      });
      // Modal is now unmounted — assign name to the filter button so
      // the browser uses it as the "new" snapshot endpoint.
      const target = document.getElementById(targetId);
      if (target) target.style.viewTransitionName = "modal-morph";
    });

    transition.finished.finally(() => {
      const t = document.getElementById(targetId);
      if (t) t.style.viewTransitionName = "";
    });
  };

  const monthYearStr = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // transactions mapped by YYYY-MM-DD
  const txByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      // Filter by Type
      if (filterType !== "all" && tx.type !== filterType) return;
      // Filter by Category
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(tx.category)
      )
        return;

      // Filter by Amount
      const convertedAmount = convertToDefault(tx.amount, tx.currency);
      if (filterMinAmount !== null && convertedAmount < filterMinAmount) return;
      if (filterMaxAmount !== null && convertedAmount > filterMaxAmount) return;

      // Filter by Date Range
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (tx.date < start) return;

        // Default to Today if no end date
        const endDateObj = filterEndDate ? new Date(filterEndDate) : new Date();
        endDateObj.setHours(23, 59, 59, 999);
        if (tx.date > endDateObj) return;
      } else if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (tx.date > end) return;
      }

      const d = tx.date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return map;
  }, [
    transactions,
    selectedCategories,
    filterType,
    filterMinAmount,
    filterMaxAmount,
    convertToDefault,
  ]);

  // days to render
  const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => (
    <div key={`blank-${i}`} className="p-2" />
  ));

  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const dayNum = i + 1;
    const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const hasTx = txByDate[dateKey] && txByDate[dateKey].length > 0;

    // Check if selected
    const isSelected =
      injectedSelectedDate?.getDate() === dayNum &&
      injectedSelectedDate?.getMonth() === currentMonth.getMonth() &&
      injectedSelectedDate?.getFullYear() === currentMonth.getFullYear();

    return (
      <button
        key={dayNum}
        onClick={() => {
          setInjectedSelectedDate(
            new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              dayNum,
            ),
          );
          setViewMode("day");
        }}
        className={`relative p-3 rounded-full flex flex-col items-center justify-center transition-all ${
          isSelected
            ? "bg-teal-500 text-slate-900 font-bold shadow-[0_0_15px_rgba(20,184,166,0.5)]"
            : "hover:bg-white/10 text-slate-300 font-medium"
        }`}
      >
        {dayNum}
        {hasTx && (
          <span
            className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
              isSelected ? "bg-slate-900" : "bg-teal-400"
            }`}
          />
        )}
      </button>
    );
  });

  const selectedDateKey = injectedSelectedDate
    ? `${injectedSelectedDate.getFullYear()}-${String(injectedSelectedDate.getMonth() + 1).padStart(2, "0")}-${String(injectedSelectedDate.getDate()).padStart(2, "0")}`
    : null;
  const selectedTxs = selectedDateKey ? txByDate[selectedDateKey] || [] : [];

  // Determine if the filter extends beyond the current calendar month
  const isCrossMonthRange = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return false;

    const currentYear = currentMonth.getFullYear();
    const currentMonthIdx = currentMonth.getMonth();

    if (filterStartDate) {
      const start = new Date(filterStartDate);
      if (
        start.getMonth() !== currentMonthIdx ||
        start.getFullYear() !== currentYear
      )
        return true;

      // Check if Today is in a different month if no end date
      if (!filterEndDate) {
        const today = new Date();
        if (
          today.getMonth() !== currentMonthIdx ||
          today.getFullYear() !== currentYear
        )
          return true;
      }
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      if (
        end.getMonth() !== currentMonthIdx ||
        end.getFullYear() !== currentYear
      )
        return true;
    }
    return false;
  }, [filterStartDate, filterEndDate, currentMonth]);

  // Grouped month transactions
  const monthTxs = useMemo(() => {
    return transactions
      .filter((tx) => {
        const convertedAmount = convertToDefault(tx.amount, tx.currency);

        const inCurrentMonth =
          tx.date.getMonth() === currentMonth.getMonth() &&
          tx.date.getFullYear() === currentMonth.getFullYear();

        // If a cross-month range is active, we ignore the current calendar month constraint
        const dateMatch = isCrossMonthRange ? true : inCurrentMonth;

        return (
          dateMatch &&
          (filterType === "all" || tx.type === filterType) &&
          (selectedCategories.length === 0 ||
            selectedCategories.includes(tx.category)) &&
          (filterMinAmount === null || convertedAmount >= filterMinAmount) &&
          (filterMaxAmount === null || convertedAmount <= filterMaxAmount) &&
          (!filterStartDate || tx.date >= new Date(filterStartDate)) &&
          (!filterStartDate ||
            tx.date <=
              (filterEndDate ? new Date(filterEndDate) : new Date())) &&
          (!filterEndDate || filterStartDate || tx.date <= new Date(filterEndDate))
        );
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [
    transactions,
    currentMonth,
    selectedCategories,
    filterType,
    filterMinAmount,
    filterMaxAmount,
    filterStartDate,
    filterEndDate,
    convertToDefault,
    isCrossMonthRange,
  ]);

  const groupedMonthTxs = useMemo(() => {
    return monthTxs.reduce(
      (acc, tx) => {
        const dateStr = tx.date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(tx);
        return acc;
      },
      {} as Record<string, typeof transactions>,
    );
  }, [monthTxs]);

  const monthViewLabel = isCrossMonthRange ? "Filtered Results" : "Full Month";

  return (
    <div className="space-y-6 pb-20 overflow-x-hidden animate-in fade-in zoom-in-95 duration-300">
      <GlassCard className="max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col gap-4 mb-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 order-2 sm:order-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide capitalize sm:hidden">
                {monthYearStr}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 order-1 sm:order-2">
              <h2 className="text-xl font-bold text-white tracking-wide capitalize hidden sm:block">
                {monthYearStr}
              </h2>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
                title="Go to Today"
              >
                Go to Today
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2 relative z-10">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div
              key={d}
              className="text-xs font-bold text-slate-500 uppercase tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 relative z-10">
          {blanks}
          {days}
        </div>
      </GlassCard>

      {/* ── Category Filter ── */}
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
          {(filterType !== "all" ||
            selectedCategories.length > 0 ||
            filterMinAmount !== null ||
            filterMaxAmount !== null ||
            filterStartDate !== "" ||
            filterEndDate !== "") && (
            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                Active:
              </span>
              <div
                className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 px-4 pr-12"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent 0px, black 32px, black calc(100% - 40px), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0px, black 32px, black calc(100% - 40px), transparent 100%)",
                }}
              >
                {filterType !== "all" && (
                  <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    {filterType}
                  </span>
                )}
                {(filterMinAmount !== null || filterMaxAmount !== null) && (
                  <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    {filterMinAmount !== null
                      ? `${defaultCurrency}${filterMinAmount}`
                      : "Any"}{" "}
                    -{" "}
                    {filterMaxAmount !== null
                      ? `${defaultCurrency}${filterMaxAmount}`
                      : "Any"}
                  </span>
                )}
                {(filterStartDate || filterEndDate) && (
                  <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    {filterStartDate
                      ? new Date(filterStartDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Start"}{" "}
                    -{" "}
                    {filterEndDate
                      ? new Date(filterEndDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : filterStartDate
                        ? "Today"
                        : "End"}
                  </span>
                )}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          id="filter-button-monthly"
          onClick={() => {
            const target = document.getElementById("filter-button-monthly");
            if (target && !isMobileChrome) {
              target.style.viewTransitionName = "modal-morph";
            }

            if (!document.startViewTransition || isMobileChrome) {
              if (target) target.style.viewTransitionName = "";
              setIsFilterModalOpen(true);
              return;
            }

            document.startViewTransition(() => {
              if (target) target.style.viewTransitionName = "";
              flushSync(() => {
                setIsFilterModalOpen(true);
              });
            });
          }}
          className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-300 hover:text-white transition-all shadow-lg active:scale-95 shrink-0 ${
            isFilterModalOpen
              ? "opacity-0 pointer-events-none scale-75"
              : "opacity-100 pointer-events-auto scale-100"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-wider">
            Filter
          </span>
        </button>
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={closeFilterModal}
        transactions={transactions}
        currentType={filterType}
        currentCategories={selectedCategories}
        currentMinAmount={filterMinAmount}
        currentMaxAmount={filterMaxAmount}
        currentStartDate={filterStartDate}
        currentEndDate={filterEndDate}
        onApply={({
          type,
          categories,
          minAmount,
          maxAmount,
          startDate,
          endDate,
        }) => {
          setFilterType(type);
          setSelectedCategories(categories);
          setFilterMinAmount(minAmount);
          setFilterMaxAmount(maxAmount);
          setFilterStartDate(startDate);
          setFilterEndDate(endDate);
        }}
        convertToDefault={convertToDefault}
        currencySymbol={defaultCurrency}
      />

      {/* ── View Toggle ── */}
      <div className="max-w-md mx-auto flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm relative mb-4">
        <button
          onClick={() => {
            setViewMode("day");
            if (!injectedSelectedDate) setInjectedSelectedDate(new Date());
          }}
          className={`relative flex-1 py-1.5 sm:py-2 text-sm font-medium rounded-full z-10 transition-colors ${
            viewMode === "day"
              ? "text-teal-300"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {viewMode === "day" && (
            <motion.div
              layoutId="monthly-view-mode"
              className="absolute inset-0 bg-teal-500/20 border border-teal-500/30 rounded-full z-[-1]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          Specific Day
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`relative flex-1 py-1.5 sm:py-2 text-sm font-medium rounded-full z-10 transition-colors ${
            viewMode === "month"
              ? "text-teal-300"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {viewMode === "month" && (
            <motion.div
              layoutId="monthly-view-mode"
              className="absolute inset-0 bg-teal-500/20 border border-teal-500/30 rounded-full z-[-1]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {monthViewLabel}
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {viewMode === "day" && injectedSelectedDate && (
          <motion.div
            key="day-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight capitalize">
                {injectedSelectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            {selectedTxs.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-white/5 border-dashed">
                <p className="text-slate-400">No transactions on this day.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedTxs.map((tx) => (
                  <ExpenseCard
                    key={tx.id}
                    transaction={tx}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isEditing={editingTransactionId === tx.id && isModalOpen}
                    defaultCurrency={defaultCurrency}
                    convertToDefault={convertToDefault}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {viewMode === "month" && (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-xl font-bold text-white tracking-tight capitalize">
                {currentMonth.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-teal-500/30 to-transparent" />
            </div>

            {monthTxs.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-white/5 border-dashed">
                <p className="text-slate-400">No transactions this month.</p>
              </div>
            ) : (
              Object.entries(groupedMonthTxs).map(([dateStr, txs]) => (
                <div key={dateStr} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h4 className="text-sm font-bold text-slate-300 tracking-wider uppercase">
                      {dateStr}
                    </h4>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  <div className="space-y-4">
                    {txs.map((tx) => (
                      <ExpenseCard
                        key={tx.id}
                        transaction={tx}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isEditing={
                          editingTransactionId === tx.id && isModalOpen
                        }
                        defaultCurrency={defaultCurrency}
                        convertToDefault={convertToDefault}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
