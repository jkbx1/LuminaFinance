import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, LogOut } from "lucide-react";
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
import { GlassButton } from "./ui/GlassButton";
import { MonthlyView } from "./MonthlyView";

export const Dashboard: React.FC = () => {
  const { user, logout, isGuest, signInWithGoogle, clearGuest } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [view, setView] = useState<"overview" | "monthly">("overview");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    new Date(),
  );

  const [chartTimeframe, setChartTimeframe] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "all"
  >("all");

  const [balanceTimeframe, setBalanceTimeframe] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "all"
  >("all");

  // Detect mobile Chrome to avoid heavy View Transitions there
  const [isMobileChrome, setIsMobileChrome] = useState(false);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent || "";
      const isAndroid = /Android/i.test(ua);
      const isChrome =
        /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
      setIsMobileChrome(isAndroid && isChrome);
    }
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
    async (id: string) => {
      if (user) {
        try {
          await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
        } catch (error) {
          console.error(
            "Error deleting transaction: Failed to delete from database.",
          );
        }
      } else if (isGuest) {
        setTransactions((prev) => {
          const updated = prev.filter((tx) => tx.id !== id);
          saveGuestData(updated);
          return updated;
        });
      }
    },
    [user, isGuest],
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
    const isMobile = window.innerWidth < 640;
    const targetId = isMobile ? "fab-add-button-mobile" : "fab-add-button";
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
    const isMobile = window.innerWidth < 640;
    const defaultTargetId = isMobile
      ? "fab-add-button-mobile"
      : "fab-add-button";
    const targetId = editingTransaction
      ? `expense-card-${editingTransaction.id}`
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
      // After flushSync, the new DOM layout is applied
      const target = document.getElementById(targetId);
      if (target) target.style.viewTransitionName = "modal-morph";
    });

    transition.finished.finally(() => {
      const target = document.getElementById(targetId);
      if (target) target.style.viewTransitionName = "";
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
    food: "#fb923c", // orange-400
    shopping: "#c084fc", // purple-400
    housing: "#60a5fa", // blue-400
    utilities: "#facc15", // yellow-400
    other: "#94a3b8", // slate-400
  };

  const chartData = Object.entries(chartDataMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: colorMap[name] || colorMap["other"],
  }));

  // Fallback empty chart data
  const isEmptyChart = chartData.length === 0;
  if (isEmptyChart) {
    chartData.push({ name: "No Expenses", value: 0.1, color: "#334155" });
  }

  return (
    <LayoutGroup>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen pt-8 pb-20 px-4 md:px-8 relative z-0 selection:bg-teal-500/30"
      >
        <Background3D />

        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
            {/* Top Row on Mobile: Logo and Logout */}
            <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
              <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)] shrink-0 overflow-hidden p-1.5">
                  <img
                    src="/icon.svg"
                    alt="Lumina Icon"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-white tracking-tight truncate">
                    Lumina Finance
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400 font-medium truncate">
                    Welcome back, {user?.displayName?.split(" ")[0] || "User"}
                  </p>
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center gap-2 md:hidden shrink-0">
                {isGuest && (
                  <GlassButton
                    variant="primary"
                    onClick={handleLoginAndSync}
                    disabled={isSyncing}
                    className="p-2.5 rounded-full flex shrink-0"
                    aria-label="Login & Sync"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-xs font-semibold px-2">Sync</span>
                    )}
                  </GlassButton>
                )}
                <GlassButton
                  variant="secondary"
                  onClick={logout}
                  className="p-2.5 rounded-full flex shrink-0"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </GlassButton>
              </div>
            </div>

            {/* Controls Row: Toggles and Desktop Logout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full md:w-auto gap-4 mt-4 md:mt-0">
              <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-3 w-full md:w-auto">
                {/* View Toggle */}
                <div className="hidden sm:flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm shrink-0 w-full lg:w-auto justify-center">
                  <button
                    onClick={() => setView("overview")}
                    className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full z-10 transition-colors ${
                      view === "overview"
                        ? "text-teal-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {view === "overview" && (
                      <motion.div
                        layoutId="view-highlight"
                        className="absolute inset-0 bg-teal-400 rounded-full z-[-1]"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    Overview
                  </button>
                  <button
                    onClick={() => setView("monthly")}
                    className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full z-10 transition-colors ${
                      view === "monthly"
                        ? "text-teal-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {view === "monthly" && (
                      <motion.div
                        layoutId="view-highlight"
                        className="absolute inset-0 bg-teal-400 rounded-full z-[-1]"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    Monthly
                  </button>
                </div>

                {/* Default display currency selector */}
                <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 glass-panel p-1.5 sm:p-2 rounded-2xl w-full lg:w-auto">
                  {Object.keys(CURRENCY_SYMBOL).map((code) => (
                    <button
                      key={code}
                      onClick={() => handleDefaultCurrencyChange(code)}
                      className={`relative px-2 sm:px-3 py-1.5 flex-1 text-center rounded-full text-[10px] sm:text-xs font-semibold transition-colors z-10 ${
                        defaultCurrency === code
                          ? "text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {defaultCurrency === code && (
                        <motion.div
                          layoutId="default-currency-pill"
                          className="absolute inset-0 bg-teal-500/30 border border-teal-400/40 rounded-full z-[-1]"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      {currencySymbol(code)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Auth Controls */}
              <div className="hidden md:flex items-center gap-3 shrink-0">
                {isGuest && (
                  <GlassButton
                    variant="primary"
                    onClick={handleLoginAndSync}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-full flex shrink-0 transition-all font-semibold"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <span className="mr-0">Login & Sync</span>
                    )}
                  </GlassButton>
                )}
                <GlassButton
                  variant="secondary"
                  onClick={logout}
                  className="px-4 py-2 rounded-full flex shrink-0"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </GlassButton>
              </div>
            </div>
          </header>

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
                  <GlassCard className="relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/20 blur-[50px] rounded-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-1 relative z-10">
                      <h2 className="text-slate-400 text-sm font-medium tracking-wide uppercase">
                        Total Balance
                      </h2>
                      <select
                        value={balanceTimeframe}
                        onChange={(e) =>
                          setBalanceTimeframe(e.target.value as any)
                        }
                        className="bg-white/5 border border-white/10 text-slate-300 font-medium text-xs rounded-full px-3 py-1 outline-none focus:ring-1 focus:ring-teal-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <option
                          value="daily"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Daily
                        </option>
                        <option
                          value="weekly"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Weekly
                        </option>
                        <option
                          value="monthly"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Monthly
                        </option>
                        <option
                          value="yearly"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Yearly
                        </option>
                        <option
                          value="all"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          All Time
                        </option>
                      </select>
                    </div>
                    <div className="text-4xl font-bold text-white mb-6 tracking-tight overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`balance-all`}
                          layout={false}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="block"
                        >
                          {currencySymbol(defaultCurrency)}{" "}
                          {balance < 0 ? "-" : ""}
                          {Math.abs(balance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </motion.span>
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 overflow-hidden">
                        <div className="text-emerald-400 text-xs font-semibold mb-1 tracking-wider uppercase flex items-center gap-1">
                          Income
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`income-all-${defaultCurrency}`}
                            layout={false}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="text-lg font-bold text-slate-200"
                          >
                            {currencySymbol(defaultCurrency)}{" "}
                            {income.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 overflow-hidden">
                        <div className="text-rose-400 text-xs font-semibold mb-1 tracking-wider uppercase flex items-center gap-1">
                          Expense
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`expense-all-${defaultCurrency}`}
                            layout={false}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="text-lg font-bold text-slate-200"
                          >
                            {currencySymbol(defaultCurrency)}{" "}
                            {Math.abs(expense).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white">
                        Spending Overview
                      </h3>
                      <select
                        value={chartTimeframe}
                        onChange={(e) =>
                          setChartTimeframe(e.target.value as any)
                        }
                        className="bg-white/5 border border-white/10 text-slate-300 font-medium text-xs rounded-full px-3 py-1 outline-none focus:ring-1 focus:ring-teal-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <option
                          value="daily"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Daily
                        </option>
                        <option
                          value="weekly"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Weekly
                        </option>
                        <option
                          value="monthly"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Monthly
                        </option>
                        <option
                          value="yearly"
                          className="bg-[#0f172a] text-slate-300"
                        >
                          Yearly
                        </option>
                        <option
                          value="all"
                          className="bg-[#0f172a] text-slate-300"
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
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      Recent Transactions{" "}
                      <span className="text-sm font-normal text-slate-400 ml-2">
                        (Last 3 days)
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-6 relative z-0">
                    {transactions.length === 0 ? (
                      <div className="glass-panel p-10 text-center rounded-2xl border border-white/10 border-dashed">
                        <p className="text-slate-400 mb-4">
                          No transactions yet.
                        </p>
                        <button
                          onClick={openAddModal}
                          className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
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
                            <div className="glass-panel p-10 text-center rounded-2xl border border-white/10 border-dashed">
                              <p className="text-slate-400">
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
            ) : (
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
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile View Navigation (Bottom Bar) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden pb-safe">
          <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-3 px-4 relative w-full h-[76px] flex items-center justify-between gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            <div className="flex gap-1 flex-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setView("overview")}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors relative z-10 ${
                  view === "overview"
                    ? "text-teal-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {view === "overview" && (
                  <motion.div
                    layoutId="view-highlight-mobile"
                    className="absolute inset-0 bg-teal-400 rounded-full z-[-1]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                Overview
              </button>
              <button
                onClick={() => setView("monthly")}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors relative z-10 ${
                  view === "monthly"
                    ? "text-teal-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {view === "monthly" && (
                  <motion.div
                    layoutId="view-highlight-mobile"
                    className="absolute inset-0 bg-teal-400 rounded-full z-[-1]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                Monthly
              </button>
            </div>

            {/* Add Button incorporated into Navbar */}
            <div className="relative shrink-0 flex items-center justify-center">
              <button
                id="fab-add-button-mobile"
                onClick={openAddModal}
                className={`flex items-center justify-center gap-1.5 bg-teal-500 rounded-full h-11 px-5 text-slate-900 shadow-[0_0_20px_rgba(20,184,166,0.5)] transition-all active:scale-95 ${
                  isModalOpen || editingTransaction
                    ? "opacity-0 pointer-events-none scale-75"
                    : "opacity-100 pointer-events-auto scale-100"
                }`}
              >
                <Plus className="w-5 h-5 pointer-events-none" />
                <span className="font-bold tracking-wide">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Action Button (Desktop Only) */}
        {!isModalOpen && !editingTransaction && (
          <button
            id="fab-add-button"
            onClick={openAddModal}
            className="hidden sm:flex fixed bottom-8 right-8 w-16 h-16 bg-teal-500 rounded-full items-center justify-center text-slate-900 shadow-[0_0_30px_rgba(20,184,166,0.5)] z-50 transition-all hover:shadow-[0_0_40px_rgba(20,184,166,0.8)] hover:scale-105 active:scale-95 hover:rotate-90 animate-in fade-in zoom-in-50 duration-300"
          >
            <Plus className="w-8 h-8 pointer-events-none transition-transform" />
          </button>
        )}

        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onAdd={handleAddTransaction}
          editingTransaction={editingTransaction}
          onEdit={handleEditTransaction}
          defaultDate={selectedCalendarDate || new Date()}
        />
      </motion.div>
    </LayoutGroup>
  );
};
