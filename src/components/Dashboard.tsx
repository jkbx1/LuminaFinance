import React, { useState, useEffect, useMemo } from "react";
import { useIsMobileChrome } from "../hooks/useIsMobileChrome";
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

const VIEW_ORDER = {
  overview: 0,
  monthly: 1,
  rates: 2,
} as const;

type ViewType = keyof typeof VIEW_ORDER;

const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 30 : direction < 0 ? -30 : 0,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 30 : direction > 0 ? -30 : 0,
    opacity: 0,
  }),
};

// ── Module-level constants — zero per-render allocations ──────────────────────

/** Chart category → color mapping (module-level to avoid re-allocation). */
const COLOR_MAP: Record<string, string> = {
  food: "#FF0037",
  shopping: "#6366F1",
  housing: "#F59E0B",
  transport: "#3B82F6",
  utilities: "#10B981",
  salary: "#10B981",
  freelance: "#3B82F6",
  investment: "#8B5CF6",
  gift: "#EC4899",
  family: "#F59E0B",
  other: "#94A3B8",
};

/** Guest transaction sanitizer — validates and normalises raw localStorage data
 *  before it is written into React state or synced to Firestore. */
const VALID_TX_TYPES = new Set(["income", "expense"]);
const VALID_CURRENCIES_SET = new Set(["USD", "EUR", "GBP", "PLN", "JPY", "CAD"]);
const MAX_TITLE_LEN = 200;
const MAX_CATEGORY_LEN = 50;

function sanitizeGuestTransaction(
  item: unknown,
): Omit<Transaction, "id"> | null {
  if (typeof item !== "object" || item === null) return null;
  const i = item as Record<string, unknown>;

  const title =
    typeof i.title === "string" ? i.title.slice(0, MAX_TITLE_LEN).trim() : null;
  const amount =
    typeof i.amount === "number" && isFinite(i.amount) ? i.amount : null;
  const type = VALID_TX_TYPES.has(i.type as string)
    ? (i.type as "income" | "expense")
    : null;

  // All three required fields must be valid — skip the record if not
  if (!title || amount === null || !type) return null;

  const currency =
    typeof i.currency === "string" && VALID_CURRENCIES_SET.has(i.currency)
      ? i.currency
      : "USD";
  const category =
    typeof i.category === "string"
      ? i.category.slice(0, MAX_CATEGORY_LEN).trim().toLowerCase() || "other"
      : "other";
  const rawDate = new Date(i.date as string | number);
  const date = isNaN(rawDate.getTime()) ? new Date() : rawDate;

  const result: Omit<Transaction, "id"> = {
    title, amount, type, currency, category, date,
  };
  if (typeof i.customIcon === "string" && i.customIcon) result.customIcon = i.customIcon;
  if (typeof i.batchId === "string" && i.batchId) result.batchId = i.batchId;
  if (typeof i.batchName === "string" && i.batchName) result.batchName = i.batchName;
  if (i.isBatchHeader === true) result.isBatchHeader = true;
  if (typeof i.counterparty === "string" && i.counterparty)
    result.counterparty = i.counterparty.slice(0, MAX_TITLE_LEN);

  return result;
}

export const Dashboard: React.FC = () => {
  const { user, logout, isGuest, signInWithGoogle, clearGuest } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Keep a ref in sync with the latest transactions array so that
  // handleDeleteTransaction can read it without being a dep of useCallback.
  const transactionsRef = React.useRef<Transaction[]>(transactions);
  transactionsRef.current = transactions;
  const [isSyncing, setIsSyncing] = useState(false);

  // ── Write-error toast ──────────────────────────────────────────────────────
  const [writeError, setWriteError] = useState<string | null>(null);
  const writeErrorTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = React.useCallback((msg: string) => {
    // Cancel any existing timer so the display duration resets on repeated errors
    if (writeErrorTimerRef.current) clearTimeout(writeErrorTimerRef.current);
    setWriteError(msg);
    writeErrorTimerRef.current = setTimeout(() => setWriteError(null), 4000);
  }, []);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (writeErrorTimerRef.current) clearTimeout(writeErrorTimerRef.current);
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [view, setView] = useState<ViewType>("overview");
  const [direction, setDirection] = useState(0);

  const handleSetView = (newView: ViewType) => {
    if (newView === view) return;
    const newIndex = VIEW_ORDER[newView];
    const currentIndex = VIEW_ORDER[view];
    setDirection(newIndex > currentIndex ? 1 : -1);
    setView(newView);
  };

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    new Date(),
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [chartTimeframe, setChartTimeframe] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "all"
  >("monthly");

  const [chartType, setChartType] = useState<"expense" | "income">("expense");

  const [balanceTimeframe, setBalanceTimeframe] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "all"
  >("monthly");

  const isMobileChrome = useIsMobileChrome();


  // ── Default display currency & live exchange rates ──────────────────────
  const [defaultCurrency, setDefaultCurrency] = useState<string>(
    () => localStorage.getItem("lumina_default_currency") ?? "USD",
  );
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    const cached = localStorage.getItem("lumina_exchange_rates_cache");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached rates:", e);
      }
    }
    return { USD: 1 };
  });
  const [ratesLoading, setRatesLoading] = useState(true);
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>(
    () => localStorage.getItem("lumina_last_rates_date") ?? "Live"
  );

  useEffect(() => {
    fetch("https://api.frankfurter.dev/v2/rates?base=USD")
      .then((r) => r.json())
      .then((data: unknown) => {
        const ratesMap: Record<string, number> = { USD: 1 };
        let updateDate = "Live";

        if (Array.isArray(data) && data.length > 0) {
          // Validate the date field before trusting it
          const firstItem = data[0];
          if (
            typeof firstItem === "object" &&
            firstItem !== null &&
            typeof (firstItem as Record<string, unknown>).date === "string"
          ) {
            updateDate = (firstItem as Record<string, unknown>).date as string;
          }

          data.forEach((item: unknown) => {
            // Strict type guards — skip any entry where quote or rate is malformed.
            // A bad rate silently producing NaN would corrupt ALL conversions and
            // the localStorage cache that persists across sessions.
            if (
              typeof item !== "object" || item === null
            ) return;
            const entry = item as Record<string, unknown>;
            if (
              typeof entry.quote !== "string" ||
              typeof entry.rate !== "number" ||
              !isFinite(entry.rate)
            ) return;

            ratesMap[entry.quote] = entry.rate;
          });

          setExchangeRates(ratesMap);
          setLastUpdatedDate(updateDate);
          localStorage.setItem("lumina_exchange_rates_cache", JSON.stringify(ratesMap));
          localStorage.setItem("lumina_last_rates_date", updateDate);
        }
        setRatesLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch rates:", err);
        setRatesLoading(false);
      });
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
          const rawParsed: unknown = JSON.parse(localData);
          if (!Array.isArray(rawParsed)) throw new Error("Guest data is not an array");

          const txs: Transaction[] = rawParsed
            .map((item, idx) => {
              const sanitized = sanitizeGuestTransaction(item);
              if (!sanitized) return null;
              return { ...sanitized, id: String(idx) } as Transaction;
            })
            .filter((tx): tx is Transaction => tx !== null);

          txs.sort((a, b) => b.date.getTime() - a.date.getTime());
          setTransactions(txs);
        }
      } catch (_err) {
        console.error("Error parsing local data: Data formatting issue.");
      }
    }
  }, [user, isGuest]);


  const cleanTransactionForFirestore = (txData: Omit<Transaction, "id">) => {
    const docData: any = {
      title: txData.title,
      amount: txData.amount,
      type: txData.type,
      category: txData.category,
      currency: txData.currency || "USD",
      date: txData.date,
    };

    if (txData.customIcon !== undefined) docData.customIcon = txData.customIcon;
    if (txData.batchId !== undefined) docData.batchId = txData.batchId;
    if (txData.batchName !== undefined) docData.batchName = txData.batchName;
    if (txData.isBatchHeader !== undefined) docData.isBatchHeader = txData.isBatchHeader;
    if (txData.counterparty !== undefined) docData.counterparty = txData.counterparty;

    return docData;
  };

  const saveGuestData = (newData: Transaction[]) => {
    localStorage.setItem("lumina_local_data", JSON.stringify(newData));
  };

  const handleAddTransaction = async (txData: Omit<Transaction, "id">) => {
    if (user) {
      try {
        await addDoc(
          collection(db, `users/${user.uid}/transactions`),
          cleanTransactionForFirestore(txData)
        );
      } catch (error) {
        console.error("Error adding transaction:", error);
        showError("Couldn't save transaction. Check your connection and try again.");
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
        // Firestore batch limit is 500 operations
        const BATCH_LIMIT = 500;
        for (let i = 0; i < txsData.length; i += BATCH_LIMIT) {
          const chunk = txsData.slice(i, i + BATCH_LIMIT);
          const batch = writeBatch(db);
          
          chunk.forEach((txData) => {
            const newDocRef = doc(collection(db, `users/${user.uid}/transactions`));
            batch.set(newDocRef, cleanTransactionForFirestore(txData));
          });
          
          await batch.commit();
        }
      } catch (error) {
        console.error("Error batch adding transactions:", error);
        showError("Couldn't import transactions. Check your connection and try again.");
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
        await updateDoc(
          doc(db, `users/${user.uid}/transactions`, id),
          cleanTransactionForFirestore(txData)
        );
      } catch (error) {
        console.error("Error updating transaction:", error);
        showError("Couldn't update transaction. Check your connection and try again.");
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
            // Use the ref so this callback never goes stale without re-creating
            const batch = writeBatch(db);
            transactionsRef.current
              .filter((tx) => tx.batchId === batchId)
              .forEach((tx) => {
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
          showError("Couldn't delete transaction. Check your connection and try again.");
        }
      } else if (isGuest) {
        // Functional updater avoids needing transactions in deps
        setTransactions((prev) => {
          const updated = batchId
            ? prev.filter((tx) => tx.batchId !== batchId)
            : prev.filter((tx) => tx.id !== id);
          saveGuestData(updated);
          return updated;
        });
      }
    },
    [user, isGuest, showError], // `transactions` intentionally removed — accessed via ref
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
        let parsedTxs: unknown[];
        try {
          const raw: unknown = JSON.parse(localData);
          if (!Array.isArray(raw)) throw new Error("Unexpected format");
          parsedTxs = raw;
        } catch {
          console.error("Sync aborted: guest data could not be parsed.");
          setIsSyncing(false);
          return;
        }

        // Firestore batch limit is 500 operations
        const BATCH_LIMIT = 500;
        for (let i = 0; i < parsedTxs.length; i += BATCH_LIMIT) {
          const chunk = parsedTxs.slice(i, i + BATCH_LIMIT);
          const batch = writeBatch(db);

          for (const item of chunk) {
            const sanitized = sanitizeGuestTransaction(item);
            if (!sanitized) continue; // skip malformed records silently
            const newDocRef = doc(collection(db, `users/${currentUid}/transactions`));
            batch.set(newDocRef, cleanTransactionForFirestore(sanitized));
          }

          await batch.commit();
        }
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

  const filteredBalanceTransactions = useMemo(() => {
    if (balanceTimeframe === "all") return transactions;
    const nowLocal = new Date();
    const startOfTodayLocal = new Date(
      nowLocal.getFullYear(),
      nowLocal.getMonth(),
      nowLocal.getDate(),
    );
    return transactions.filter((tx) => {
      const txDate = tx.date;
      if (balanceTimeframe === "daily") return txDate >= startOfTodayLocal;
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
  }, [transactions, balanceTimeframe]);

  // Calculations (converted to defaultCurrency)
  const { balance, income, expense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredBalanceTransactions) {
      const converted = convertToDefault(tx.amount, tx.currency);
      if (tx.type === "income") income += converted;
      else expense += Math.abs(converted);
    }
    return { balance: income - expense, income, expense };
  }, [filteredBalanceTransactions, convertToDefault]);

  // Chart data — filtered, aggregated, and shaped in one memoized pass
  // (COLOR_MAP is defined at module scope to avoid per-render re-allocation)

  const { chartData, isEmptyChart } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dataMap: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type !== chartType) continue;
      if (chartTimeframe !== "all") {
        const txDate = tx.date;
        if (chartTimeframe === "daily" && txDate < startOfToday) continue;
        if (chartTimeframe === "weekly") {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (txDate < sevenDaysAgo) continue;
        }
        if (
          chartTimeframe === "monthly" &&
          (txDate.getMonth() !== now.getMonth() ||
            txDate.getFullYear() !== now.getFullYear())
        )
          continue;
        if (chartTimeframe === "yearly" && txDate.getFullYear() !== now.getFullYear())
          continue;
      }
      dataMap[tx.category] =
        (dataMap[tx.category] || 0) +
        convertToDefault(Math.abs(tx.amount), tx.currency);
    }

    const data = Object.entries(dataMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLOR_MAP[name] ?? COLOR_MAP["other"],
    }));

    const isEmpty = data.length === 0;
    if (isEmpty) {
      data.push({
        name: chartType === "expense" ? "No Expenses" : "No Income",
        value: 0.1,
        color: "#1A1A1A",
      });
    }
    return { chartData: data, isEmptyChart: isEmpty };
  }, [transactions, chartType, chartTimeframe, convertToDefault]);


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

          <AnimatePresence mode="wait" custom={direction}>
            {view === "overview" && (
              <motion.div
                key="overview"
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8"
              >
                {/* Left Column: Summary & Chart */}
                <div className="lg:col-span-1 xl:col-span-1 space-y-6 relative z-20">
                  {/* Currency Selector above Balance */}
                  <div className="flex gap-1 glass-panel p-1 rounded-full mb-2" role="group" aria-label="Currency selection" translate="no">
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
                              <span 
                                className={`${fontSize} font-bold text-bright tracking-tight block whitespace-nowrap transition-all duration-300`}
                                translate="no"
                              >
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
                                <div 
                                  className={`${fontSize} font-bold text-bright whitespace-nowrap transition-all duration-300`}
                                  translate="no"
                                >
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
                                <div 
                                  className={`${fontSize} font-bold text-bright whitespace-nowrap transition-all duration-300`}
                                  translate="no"
                                >
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
                        {chartType === "expense" ? "Spending" : "Income"} Overview
                      </h3>
                      <div className="flex items-center gap-3">
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
                  </div>
                  <GlassyDonutChart
                      data={chartData}
                      totalText={chartType === "expense" ? "Expenses" : "Income"}
                      currencySymbol={currencySymbol(defaultCurrency)}
                      forceZeroTotal={isEmptyChart}
                    />

                    {/* Centered Toggle Buttons under the Chart */}
                    <div className="flex justify-center mt-6 mb-2">
                      <div className="flex bg-bg-card/30 p-1 rounded-full border border-bg-border backdrop-blur-sm relative">
                        <button
                          onClick={() => setChartType("expense")}
                          className={`relative px-4 py-2 text-[10px] sm:text-xs font-bold rounded-full transition-all duration-300 z-10 ${
                            chartType === "expense"
                              ? "text-rose-400"
                              : "text-muted hover:text-bright"
                          }`}
                        >
                          {chartType === "expense" && (
                            <motion.div
                              layoutId="chart-type-pill-footer"
                              className="absolute inset-0 bg-rose-500/10 border border-rose-500/20 rounded-full z-[-1]"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          EXPENSES
                        </button>
                        <button
                          onClick={() => setChartType("income")}
                          className={`relative px-4 py-2 text-[10px] sm:text-xs font-bold rounded-full transition-all duration-300 z-10 ${
                            chartType === "income"
                              ? "text-emerald-400"
                              : "text-muted hover:text-bright"
                          }`}
                        >
                          {chartType === "income" && (
                            <motion.div
                              layoutId="chart-type-pill-footer"
                              className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-full z-[-1]"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          INCOME
                        </button>
                      </div>
                    </div>
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
            )}
            {view === "monthly" && (
              <motion.div
                key="monthly"
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
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
            )}
            {view === "rates" && (
              <motion.div
                key="rates"
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <ExchangeRatesPanel
                  latestRates={exchangeRates}
                  ratesLoading={ratesLoading}
                  lastUpdatedDate={lastUpdatedDate}
                />
              </motion.div>
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
              onClick={() => handleSetView("overview")}
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
              onClick={() => handleSetView("monthly")}
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
              onClick={() => handleSetView("rates")}
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
          defaultCurrency={defaultCurrency}
          transactions={transactions}
        />

        {/* Write-error toast */}
        <AnimatePresence>
          {writeError && (
            <motion.div
              key="write-error-toast"
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 bg-rose-500/90 text-white text-sm font-bold rounded-full shadow-2xl backdrop-blur-md border border-rose-400/30 whitespace-nowrap pointer-events-none"
              role="alert"
              aria-live="assertive"
            >
              <span aria-hidden="true">⚠️</span>
              {writeError}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </LayoutGroup>
  );
};
