import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

import { Plus } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { flushSync } from "react-dom";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Background3D } from "./ui/Background3D";
import { GlassCard } from "./ui/GlassCard";
import {
  ExpenseCard,
  type Transaction,
  currencySymbol,
  CURRENCY_SYMBOL,
} from "./ExpenseCard";
import { GlassyDonutChart } from "./GlassyDonutChart";
import { AddExpenseModal } from "./AddExpenseModal";
import { MonthlyView } from "./MonthlyView";
import { FloatingNavbar } from "./ui/FloatingNavbar";
import { ExchangeRatesPanel } from "./ExchangeRatesPanel";

export const Dashboard: React.FC = () => {
  const { user, logout, isGuest, signInWithGoogle, clearGuest } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [view, setView] = useState<"overview" | "monthly" | "rates">("overview");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    new Date(),
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [chartTimeframe, setChartTimeframe] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "all"
  >("all");

  const [balanceTimeframe, setBalanceTimeframe] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "all"
  >("all");

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


  // ── Default display currency & live exchange rates ──────────────────────
  const [defaultCurrency, setDefaultCurrency] = useState<string>(
    () => localStorage.getItem("lumina_default_currency") ?? "USD",
  );
  // rates["EUR"] = 0.92 means 1 USD = 0.92 EUR (base = USD)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 1,
  });
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?base=USD")
      .then((r) => r.json())
      .then((data) => {
        setExchangeRates({ USD: 1, ...data.rates });
        setRatesLoading(false);
      })
      .catch(() => setRatesLoading(false));
  }, []);


  /** Convert an amount from `from` currency into `defaultCurrency`. */
  const convertToDefault = React.useCallback(
    (amount: number, from: string): number => {
      if (from === defaultCurrency || ratesLoading) return amount;
      const fromRate = exchangeRates[from] ?? 1;
      const toRate = exchangeRates[defaultCurrency] ?? 1;
      return (amount / fromRate) * toRate;
    },
    [defaultCurrency, ratesLoading, exchangeRates],
  );

  const handleDefaultCurrencyChange = (code: string) => {
    setDefaultCurrency(code);
    localStorage.setItem("lumina_default_currency", code);
  };

  // Data loader
  useEffect(() => {
    if (user) {
      try {
        const q = query(
          collection(db, `users/${user.uid}/transactions`),
          orderBy("date", "desc"),
        );

        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const txs: Transaction[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              txs.push({
                id: doc.id,
                title: data.title,
                amount: data.amount,
                type: data.type,
                category: data.category,
                customIcon: data.customIcon,
                currency: data.currency ?? "USD",
                date: data.date?.toDate() || new Date(),
                batchId: data.batchId,
                batchName: data.batchName,
                isBatchHeader: data.isBatchHeader
              });
            });
            setTransactions(txs);
          },
          (_error) => {
            console.error("Firestore error: Failed to fetch transactions.");
          },
        );

        return () => unsubscribe();
      } catch (err) {
        console.warn("Firebase not fully configured. Using empty state.");
      }
    } else if (isGuest) {
      try {
        const localData = localStorage.getItem("lumina_local_data");
        if (localData) {
          const parsed = JSON.parse(localData) as any[];
          const txs: Transaction[] = parsed.map((item) => ({
            ...item,
            date: new Date(item.date),
          }));
          txs.sort((a, b) => b.date.getTime() - a.date.getTime());
          setTransactions(txs);
        }
      } catch (_err) {
        console.error("Error parsing local data: Data formatting issue.");
      }
    }
  }, [user, isGuest]);

  const saveGuestData = (newData: Transaction[]) => {
    localStorage.setItem("lumina_local_data", JSON.stringify(newData));
  };

  const handleAddTransaction = async (txData: Omit<Transaction, "id">) => {
    if (user) {
      try {
        await addDoc(collection(db, `users/${user.uid}/transactions`), {
          ...txData,
          date: txData.date, // user-picked Date object — Firestore converts it
        });
      } catch (_error) {
        console.error("Error adding transaction: Failed to save to database.");
      }
    } else if (isGuest) {
      const newTx: Transaction = {
        ...txData,
        id: crypto.randomUUID(),
      };
      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        updated.sort((a, b) => b.date.getTime() - a.date.getTime());
        saveGuestData(updated);
        return updated;
      });
    }
  };

  const handleBatchAddTransactions = async (txsData: Omit<Transaction, "id">[]) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        txsData.forEach((txData) => {
          const newDocRef = doc(collection(db, `users/${user.uid}/transactions`));
          batch.set(newDocRef, {
            ...txData,
            date: txData.date,
            batchId: txData.batchId,
            batchName: txData.batchName,
            isBatchHeader: txData.isBatchHeader
          });
        });
        await batch.commit();
      } catch (_error) {
        console.error("Error batch adding transactions: Failed to save to database.");
      }
    } else if (isGuest) {
      const newTxs: Transaction[] = txsData.map((txData) => ({
        ...txData,
        id: crypto.randomUUID(),
      }));
      setTransactions((prev) => {
        const updated = [...newTxs, ...prev];
        updated.sort((a, b) => b.date.getTime() - a.date.getTime());
        saveGuestData(updated);
        return updated;
      });
    }
  };

  const handleEditTransaction = async (
    id: string,
    txData: Omit<Transaction, "id">,
  ) => {
    if (user) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/transactions`, id), {
          ...txData,
        });
      } catch (error) {
        console.error(
          "Error updating transaction: Failed to update in database.",
        );
      }
    } else if (isGuest) {
      setTransactions((prev) => {
        const updated = prev.map((tx) =>
          tx.id === id ? { ...tx, ...txData } : tx,
        );
        updated.sort((a, b) => b.date.getTime() - a.date.getTime());
        saveGuestData(updated);
        return updated;
      });
    }
  };

  const handleDeleteTransaction = React.useCallback(
    async (id: string, batchId?: string) => {
      if (user) {
        try {
          if (batchId) {
            // Delete all with this batchId
            const batch = writeBatch(db);
            const batchTxs = transactions.filter(tx => tx.batchId === batchId);
            batchTxs.forEach(tx => {
              batch.delete(doc(db, `users/${user.uid}/transactions`, tx.id));
            });
            await batch.commit();
          } else {
            await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
          }
        } catch (error) {
          console.error(
            "Error deleting transaction: Failed to delete from database.",
          );
        }
      } else if (isGuest) {
        setTransactions((prev) => {
          const updated = batchId 
            ? prev.filter((tx) => tx.batchId !== batchId)
            : prev.filter((tx) => tx.id !== id);
          saveGuestData(updated);
          return updated;
        });
      }
    },
    [user, isGuest, transactions],
  );

  const handleLoginAndSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const userCredential = await signInWithGoogle();
      if (!userCredential?.user) {
        // User cancelled login popup
        setIsSyncing(false);
        return;
      }

      // If user successfully authenticated, sync their local data immediately
      const currentUid = userCredential.user.uid;
      const localData = localStorage.getItem("lumina_local_data");

      if (localData) {
        const parsedTxs = JSON.parse(localData) as any[];

        // Batch write to Firestore for optimal performance
        const batch = writeBatch(db);

        for (const item of parsedTxs) {
          // You must generate fresh DocumentReferences using the new UID namespace
          const newDocRef = doc(
            collection(db, `users/${currentUid}/transactions`),
          );
          batch.set(newDocRef, {
            title: item.title,
            amount: item.amount,
            type: item.type,
            category: item.category,
            ...(item.customIcon ? { customIcon: item.customIcon } : {}),
            currency: item.currency ?? "USD",
            date: new Date(item.date),
          });
        }

        await batch.commit();
      }

      // Erase Guest Cache LocalStorage footprint
      clearGuest();
    } catch (_err) {
      console.error("Error during sync: Failed to synchronize data.");
      setIsSyncing(false);
    }
  };

  const openAddModal = () => {
    const targetId = "fab-add-button";
    const target = document.getElementById(targetId);
    if (target && !isMobileChrome)
      target.style.viewTransitionName = "modal-morph";

    if (!document.startViewTransition || isMobileChrome) {
      if (target) target.style.viewTransitionName = "";
      setEditingTransaction(null);
      if (view === "overview") setSelectedCalendarDate(new Date());
      setIsModalOpen(true);
      return;
    }

    document.startViewTransition(() => {
      if (target) target.style.viewTransitionName = "";
      flushSync(() => {
        setEditingTransaction(null);
        if (view === "overview") setSelectedCalendarDate(new Date());
        setIsModalOpen(true);
      });
    });
  };

  const openEditModal = React.useCallback(
    (transaction: Transaction, passedTarget?: HTMLElement) => {
      const targetId = `expense-card-${transaction.id}`;
      const target = passedTarget || document.getElementById(targetId);
      if (target && !isMobileChrome) {
        target.style.viewTransitionName = "modal-morph";
      }

      if (!document.startViewTransition || isMobileChrome) {
        if (target) target.style.viewTransitionName = "";
        setEditingTransaction(transaction);
        setIsModalOpen(true);
        return;
      }

      document.startViewTransition(() => {
        if (target) target.style.viewTransitionName = "";
        flushSync(() => {
          setEditingTransaction(transaction);
          setIsModalOpen(true);
        });
      });
    },
    [isMobileChrome],
  );

  const closeModal = () => {
    const defaultTargetId = "fab-add-button";
    const targetId = editingTransaction
      ? `edit-btn-${editingTransaction.id}`
      : defaultTargetId;

    if (!document.startViewTransition || isMobileChrome) {
      setIsModalOpen(false);
      setTimeout(() => {
        setEditingTransaction(null);
      }, 300);
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsModalOpen(false);
        setEditingTransaction(null);
      });
      // Modal is now unmounted — assign name to the target button so
      // the browser uses it as the "new" snapshot endpoint.
      const target = document.getElementById(targetId);
      if (target) target.style.viewTransitionName = "modal-morph";
    });

    transition.finished.finally(() => {
      const t = document.getElementById(targetId);
      if (t) t.style.viewTransitionName = "";
    });
  };

  const filteredBalanceTransactions = transactions.filter((tx) => {
    if (balanceTimeframe === "all") return true;

    const txDate = tx.date;
    const nowLocal = new Date();
    const startOfTodayLocal = new Date(
      nowLocal.getFullYear(),
      nowLocal.getMonth(),
      nowLocal.getDate(),
    );

    if (balanceTimeframe === "daily") {
      return txDate >= startOfTodayLocal;
    }

    if (balanceTimeframe === "weekly") {
      const sevenDaysAgo = new Date(startOfTodayLocal);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return txDate >= sevenDaysAgo;
    }

    if (balanceTimeframe === "monthly") {
      return (
        txDate.getMonth() === nowLocal.getMonth() &&
        txDate.getFullYear() === nowLocal.getFullYear()
      );
    }

    if (balanceTimeframe === "yearly") {
      return txDate.getFullYear() === nowLocal.getFullYear();
    }

    return true;
  });

  // Calculations (converted to defaultCurrency)
  const balance = filteredBalanceTransactions.reduce(
    (acc, tx) => acc + convertToDefault(tx.amount, tx.currency),
    0,
  );
  const income = filteredBalanceTransactions
    .filter((tx) => tx.type === "income")
    .reduce((acc, tx) => acc + convertToDefault(tx.amount, tx.currency), 0);
  const expense = filteredBalanceTransactions
    .filter((tx) => tx.type === "expense")
    .reduce(
      (acc, tx) => acc + Math.abs(convertToDefault(tx.amount, tx.currency)),
      0,
    );

  // Chart Data format
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const filteredChartTransactions = transactions.filter((tx) => {
    if (tx.type !== "expense") return false;
    if (chartTimeframe === "all") return true;

    const txDate = tx.date;

    if (chartTimeframe === "daily") {
      return txDate >= startOfToday;
    }

    if (chartTimeframe === "weekly") {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return txDate >= sevenDaysAgo;
    }

    if (chartTimeframe === "monthly") {
      return (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      );
    }

    if (chartTimeframe === "yearly") {
      return txDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

  const chartDataMap = filteredChartTransactions.reduce(
    (acc, tx) => {
      acc[tx.category] =
        (acc[tx.category] || 0) +
        convertToDefault(Math.abs(tx.amount), tx.currency);
      return acc;
    },
    {} as Record<string, number>,
  );

  const colorMap: Record<string, string> = {
    food: "#FF0037", // Red (Accent)
    shopping: "#6366F1", // Indigo
    housing: "#F59E0B", // Amber
    utilities: "#10B981", // Emerald
    other: "#94A3B8", // Slate
  };

  const chartData = Object.entries(chartDataMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: colorMap[name] || colorMap["other"],
  }));

  // Fallback empty chart data
  const isEmptyChart = chartData.length === 0;
  if (isEmptyChart) {
    chartData.push({ name: "No Expenses", value: 0.1, color: "#1A1A1A" });
  }

  return (
    <LayoutGroup>
      <main
        className="min-h-screen pt-32 pb-32 px-4 md:px-8 relative z-0 selection:bg-accent/30"
      >
        <Background3D />
        
        <FloatingNavbar 
          isGuest={isGuest}
          isSyncing={isSyncing}
          onLogout={logout}
          onSync={handleLoginAndSync}
          welcomeName={user?.displayName?.split(" ")[0] || "User"}
          isBlurred={isModalOpen || !!editingTransaction || isFilterModalOpen}
        />

        <div className="max-w-7xl mx-auto">

          <AnimatePresence mode="wait">
            {view === "overview" ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8"
              >
                {/* Left Column: Summary & Chart */}
                <div className="lg:col-span-1 xl:col-span-1 space-y-6 relative z-20">
                  {/* Currency Selector above Balance */}
                  <div className="flex gap-1 glass-panel p-1 rounded-full mb-2" role="group" aria-label="Currency selection">
                    {Object.keys(CURRENCY_SYMBOL).map((code) => (
                      <button
                        key={code}
                        onClick={() => handleDefaultCurrencyChange(code)}
                        aria-label={`Switch to ${code}`}
                        aria-pressed={defaultCurrency === code}
                        className={`relative flex-1 px-2 py-1.5 text-[10px] font-bold rounded-full transition-colors z-10 ${
                          defaultCurrency === code
                            ? "text-bright"
                            : "text-muted hover:text-bright"
                        }`}
                      >
                        {defaultCurrency === code && (
                          <motion.div
                            layoutId="currency-selector-pill"
                            className="absolute inset-0 bg-accent/20 border border-accent/20 rounded-full z-[-1]"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        {currencySymbol(code)}
                      </button>
                    ))}
                  </div>
                  <GlassCard className="relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 blur-[50px] rounded-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-1 relative z-10">
                      <h2 className="text-muted text-sm font-medium tracking-wide uppercase">
                        Total Balance
                      </h2>
                      <select
                        value={balanceTimeframe}
                        onChange={(e) =>
                          setBalanceTimeframe(e.target.value as any)
                        }
                        aria-label="Filter balance timeframe"
                        className="bg-bg-card border border-bg-border text-bright font-medium text-xs rounded-full px-3 py-1 outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer hover:bg-bg-card/80 transition-colors"
                      >
                        <option
                          value="daily"
                          className="bg-bg-card text-bright"
                        >
                          Daily
                        </option>
                        <option
                          value="weekly"
                          className="bg-bg-card text-bright"
                        >
                          Weekly
                        </option>
                        <option
                          value="monthly"
                          className="bg-bg-card text-bright"
                        >
                          Monthly
                        </option>
                        <option
                          value="yearly"
                          className="bg-bg-card text-bright"
                        >
                          Yearly
                        </option>
                        <option
                          value="all"
                          className="bg-bg-card text-bright"
                        >
                          All Time
                        </option>
                      </select>
                    </div>
                          {(() => {
                            const formatted = `${currencySymbol(defaultCurrency)} ${balance < 0 ? "-" : ""}${Math.abs(balance).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`;
                            const len = formatted.length;
                            const fontSize = len > 14 ? "text-2xl" : len > 11 ? "text-3xl" : "text-4xl";
                            return (
                              <span className={`${fontSize} font-bold text-bright tracking-tight block whitespace-nowrap transition-all duration-300`}>
                                {formatted}
                              </span>
                            );
                          })()}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-bg-card/50 p-3 rounded-xl border border-bg-border overflow-hidden">
                        <div className="text-emerald-400 text-xs font-semibold mb-1 tracking-wider uppercase flex items-center gap-1">
                          Income
                        </div>
                        <AnimatePresence mode="wait">
                            {(() => {
                              const formatted = `${currencySymbol(defaultCurrency)} ${income.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`;
                              const len = formatted.length;
                              const fontSize = len > 12 ? "text-[11px]" : len > 10 ? "text-xs" : len > 8 ? "text-sm" : "text-base";
                              return (
                                <div className={`${fontSize} font-bold text-bright whitespace-nowrap transition-all duration-300`}>
                                  {formatted}
                                </div>
                              );
                            })()}
                        </AnimatePresence>
                      </div>
                      <div className="bg-bg-card/50 p-3 rounded-xl border border-bg-border overflow-hidden">
                        <div className="text-rose-400 text-xs font-semibold mb-1 tracking-wider uppercase flex items-center gap-1">
                          Expense
                        </div>
                        <AnimatePresence mode="wait">
                            {(() => {
                              const formatted = `${currencySymbol(defaultCurrency)} ${Math.abs(expense).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`;
                              const len = formatted.length;
                              const fontSize = len > 12 ? "text-[11px]" : len > 10 ? "text-xs" : len > 8 ? "text-sm" : "text-base";
                              return (
                                <div className={`${fontSize} font-bold text-bright whitespace-nowrap transition-all duration-300`}>
                                  {formatted}
                                </div>
                              );
                            })()}
                        </AnimatePresence>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-bright">
                        Spending Overview
                      </h3>
                      <select
                        value={chartTimeframe}
                        onChange={(e) =>
                          setChartTimeframe(e.target.value as any)
                        }
                        className="bg-bg-card border border-bg-border text-bright font-medium text-xs rounded-full px-3 py-1 outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer hover:bg-bg-card/80 transition-colors"
                      >
                        <option
                          value="daily"
                          className="bg-bg-card text-bright"
                        >
                          Daily
                        </option>
                        <option
                          value="weekly"
                          className="bg-bg-card text-bright"
                        >
                          Weekly
                        </option>
                        <option
                          value="monthly"
                          className="bg-bg-card text-bright"
                        >
                          Monthly
                        </option>
                        <option
                          value="yearly"
                          className="bg-bg-card text-bright"
                        >
                          Yearly
                        </option>
                        <option
                          value="all"
                          className="bg-bg-card text-bright"
                        >
                          All Time
                        </option>
                      </select>
                    </div>
                    <GlassyDonutChart
                      data={chartData}
                      totalText="Expenses"
                      currencySymbol={currencySymbol(defaultCurrency)}
                      forceZeroTotal={isEmptyChart}
                    />
                  </GlassCard>
                </div>

                {/* Right Column: Transactions List */}
                <div className="lg:col-span-2 xl:col-span-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-2xl font-bold text-bright tracking-tight">
                      Recent Transactions{" "}
                      <span className="text-sm font-normal text-muted ml-2">
                        (Last 3 days)
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-6 relative z-0">
                    {transactions.length === 0 ? (
                      <div className="glass-panel p-10 text-center rounded-2xl border border-bg-border border-dashed">
                        <p className="text-muted mb-4">
                          No transactions yet.
                        </p>
                        <button
                          onClick={openAddModal}
                          className="text-accent hover:text-accent-hover font-medium transition-colors"
                        >
                          Add your first expense
                        </button>
                      </div>
                    ) : (
                      (() => {
                        // 1. Filter to last 3 days
                        const threeDaysAgo = new Date();
                        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                        threeDaysAgo.setHours(0, 0, 0, 0);

                        const recentTxs = transactions.filter(
                          (tx) => tx.date.getTime() >= threeDaysAgo.getTime(),
                        );

                        if (recentTxs.length === 0) {
                          return (
                            <div className="glass-panel p-10 text-center rounded-2xl border border-bg-border border-dashed">
                              <p className="text-muted">
                                No transactions in the last 3 days.
                              </p>
                            </div>
                          );
                        }

                        // 2. Group by date string
                        const grouped = recentTxs.reduce(
                          (acc, tx) => {
                            const dateStr = tx.date.toLocaleDateString(
                              undefined,
                              {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              },
                            );
                            if (!acc[dateStr]) acc[dateStr] = [];
                            acc[dateStr].push(tx);
                            return acc;
                          },
                          {} as Record<string, typeof transactions>,
                        );

                        // 3. Render groups
                        return Object.entries(grouped).map(([dateStr, txs]) => (
                          <div key={dateStr} className="space-y-4">
                            <div className="flex items-center gap-4">
                              <h4 className="text-sm font-bold text-muted tracking-wider uppercase">
                                {dateStr}
                              </h4>
                              <div className="h-px flex-1 bg-gradient-to-r from-bg-border to-transparent" />
                            </div>
                            <div className="space-y-4">
                              {txs.map((tx) => (
                                <ExpenseCard
                                  key={tx.id}
                                  transaction={tx}
                                  onEdit={openEditModal}
                                  onDelete={handleDeleteTransaction}
                                  isEditing={
                                    editingTransaction?.id === tx.id &&
                                    isModalOpen
                                  }
                                  defaultCurrency={defaultCurrency}
                                  convertToDefault={convertToDefault}
                                />
                              ))}
                            </div>
                          </div>
                        ));
                      })()
                    )}
                  </div>
                </div>
              </motion.div>
            ) : view === "monthly" ? (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <MonthlyView
                  transactions={transactions}
                  onEdit={openEditModal}
                  onDelete={handleDeleteTransaction}
                  editingTransactionId={editingTransaction?.id}
                  isModalOpen={isModalOpen}
                  defaultCurrency={defaultCurrency}
                  convertToDefault={convertToDefault}
                  injectedSelectedDate={selectedCalendarDate}
                  setInjectedSelectedDate={setSelectedCalendarDate}
                  isFilterModalOpen={isFilterModalOpen}
                  setIsFilterModalOpen={setIsFilterModalOpen}
                />
              </motion.div>
            ) : (
              <ExchangeRatesPanel
                latestRates={exchangeRates}
                ratesLoading={ratesLoading}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation (Toggle & Add Button) */}
        <motion.nav
          initial={false}
          animate={{
            y: isModalOpen || !!editingTransaction || isFilterModalOpen ? 120 : 0,
            visibility: isModalOpen || !!editingTransaction || isFilterModalOpen ? "hidden" : "visible"
          } as any}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-3 w-full max-w-sm px-6"
        >
          <div className="glass-panel p-1.5 rounded-full flex flex-1 pointer-events-auto border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <button
              onClick={() => setView("overview")}
              className={`relative flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-full z-10 transition-all duration-300 ${
                view === "overview"
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              aria-label="Show overview"
            >
              {view === "overview" && (
                <motion.div
                  layoutId="view-toggle-pill"
                  className="absolute inset-0 bg-accent rounded-full z-[-1] shadow-[0_0_20px_rgba(255,0,55,0.4)]"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
              Overview
            </button>
            <button
              onClick={() => setView("monthly")}
              className={`relative flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-full z-10 transition-all duration-300 ${
                view === "monthly"
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {view === "monthly" && (
                <motion.div
                  layoutId="view-toggle-pill"
                  className="absolute inset-0 bg-accent rounded-full z-[-1] shadow-[0_0_20px_rgba(255,0,55,0.4)]"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
              Monthly
            </button>
            <button
              onClick={() => setView("rates")}
              className={`relative flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-full z-10 transition-all duration-300 ${
                view === "rates"
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              aria-label="Show exchange rates"
            >
              {view === "rates" && (
                <motion.div
                  layoutId="view-toggle-pill"
                  className="absolute inset-0 bg-accent rounded-full z-[-1] shadow-[0_0_20px_rgba(255,0,55,0.4)]"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              )}
              Rates
            </button>
          </div>

          <button
            id="fab-add-button"
            onClick={openAddModal}
            className="w-14 h-14 bg-accent rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,0,55,0.4)] pointer-events-auto transition-all hover:scale-110 active:scale-95 hover:rotate-90 shrink-0"
          >
            <Plus className="w-7 h-7 pointer-events-none" />
          </button>
        </motion.nav>

        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onAdd={handleAddTransaction}
          onBatchAdd={handleBatchAddTransactions}
          editingTransaction={editingTransaction}
          onEdit={handleEditTransaction}
          defaultDate={selectedCalendarDate || new Date()}
        />
      </main>
    </LayoutGroup>
  );
};
