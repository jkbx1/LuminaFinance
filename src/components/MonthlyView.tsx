import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExpenseCard, type Transaction } from "./ExpenseCard";
import { GlassCard } from "./ui/GlassCard";

interface MonthlyViewProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
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

  const monthYearStr = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // transactions mapped by YYYY-MM-DD
  const txByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      const d = tx.date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return map;
  }, [transactions]);

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

  // Grouped month transactions
  const monthTxs = useMemo(() => {
    return transactions
      .filter(
        (tx) =>
          tx.date.getMonth() === currentMonth.getMonth() &&
          tx.date.getFullYear() === currentMonth.getFullYear(),
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, currentMonth]);

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

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
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
          Full Month
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
