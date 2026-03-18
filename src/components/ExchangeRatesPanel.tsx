import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";

const BASE_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "PLN"] as const;
type BaseCurrency = (typeof BASE_CURRENCIES)[number];

const TRACKED_CURRENCIES: Record<BaseCurrency, string[]> = {
  USD: ["EUR", "GBP", "JPY", "PLN", "CHF", "CAD", "AUD", "CNY", "SEK", "NOK"],
  EUR: ["USD", "GBP", "JPY", "PLN", "CHF", "CAD", "AUD", "SEK", "NOK", "DKK"],
  GBP: ["USD", "EUR", "JPY", "PLN", "CHF", "CAD", "AUD", "SEK", "NOK", "DKK"],
  JPY: ["USD", "EUR", "GBP", "PLN", "CHF", "CAD", "AUD", "CNY", "SEK", "NOK"],
  PLN: ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "SEK", "NOK", "DKK"],
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", PLN: "🇵🇱",
  CHF: "🇨🇭", CAD: "🇨🇦", AUD: "🇦🇺", CNY: "🇨🇳", SEK: "🇸🇪",
  NOK: "🇳🇴", DKK: "🇩🇰",
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
  PLN: "Polish Złoty", CHF: "Swiss Franc", CAD: "Canadian Dollar",
  AUD: "Australian Dollar", CNY: "Chinese Yuan", SEK: "Swedish Krona",
  NOK: "Norwegian Krone", DKK: "Danish Krone",
};

interface HistoricalPoint {
  date: string;
  rate: number;
}

interface CurrencyCardProps {
  code: string;
  rate: number;
  base: string;
  weekOldRate?: number;
  isSelected: boolean;
  onSelect: () => void;
  historicalLoading: boolean;
  historicalData: HistoricalPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel px-3 py-2 rounded-xl text-xs border border-white/10">
        <p className="text-muted mb-0.5">{label}</p>
        <p className="text-bright font-bold">{payload[0].value?.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

const CurrencyCard: React.FC<CurrencyCardProps> = ({
  code, rate, base, weekOldRate, isSelected, onSelect,
  historicalLoading, historicalData,
}) => {
  const pctChange =
    weekOldRate && weekOldRate !== 0
      ? ((rate - weekOldRate) / weekOldRate) * 100
      : null;

  const isUp = pctChange !== null && pctChange > 0;
  const isDown = pctChange !== null && pctChange < 0;

  // Strength: normalize rate on a rough log scale → 0-100%
  const strengthPct = Math.min(100, Math.max(5, Math.log10(rate + 1) * 45));
  const strengthColor =
    strengthPct > 65 ? "#10B981" : strengthPct > 35 ? "#F59E0B" : "#FF4D6D";

  const formatRate = (r: number) => {
    if (r >= 100) return r.toFixed(2);
    if (r >= 1) return r.toFixed(4);
    return r.toFixed(6);
  };

  return (
    <motion.div
      layout
      className="relative"
    >
      <div
        className={`glass-panel rounded-2xl p-4 transition-all duration-300 ${
          isSelected
            ? "border-accent/40 bg-accent/10 shadow-[0_0_25px_rgba(255,0,55,0.12)]"
            : "border-bg-border/50 hover:border-bg-border hover:bg-white/5"
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{CURRENCY_FLAGS[code] ?? "💱"}</span>
            <div>
              <p className="text-bright font-bold text-sm leading-tight">{code}</p>
              <p className="text-muted text-[10px] leading-tight">{CURRENCY_NAMES[code] ?? code}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-1.5">
            {pctChange !== null ? (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isUp
                    ? "text-emerald-400 bg-emerald-400/10"
                    : isDown
                    ? "text-rose-400 bg-rose-400/10"
                    : "text-muted bg-muted/10"
                }`}
              >
                {isUp ? "+" : ""}
                {pctChange.toFixed(2)}%
              </span>
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${
                isSelected 
                  ? "bg-accent text-white border-accent shadow-[0_0_15px_rgba(255,0,55,0.4)]" 
                  : "bg-bg-card/50 text-muted border-bg-border hover:text-bright hover:border-bg-border/80"
              }`}
              aria-label={isSelected ? "Collapse" : "Expand"}
            >
              <motion.div
                animate={{ rotate: isSelected ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Rate */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">
              1 {base} =
            </p>
            <p className="text-bright font-black text-xl tracking-tight">
              {formatRate(rate)}{" "}
              <span className="text-muted text-sm font-normal">{code}</span>
            </p>
          </div>
          {pctChange !== null && (
            <div className="mb-1">
              {isUp ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : isDown ? (
                <TrendingDown className="w-5 h-5 text-rose-400" />
              ) : (
                <Minus className="w-5 h-5 text-muted" />
              )}
            </div>
          )}
        </div>

        {/* Strength bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-muted uppercase tracking-widest">Strength</span>
          </div>
          <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strengthPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: strengthColor }}
            />
          </div>
        </div>

        {/* Expanded chart */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 120, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden mt-4"
            >
              {historicalLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-muted animate-spin" />
                </div>
              ) : historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={historicalData}
                    margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                  >
                    <defs>
                      <linearGradient id={`grad-${code}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isUp ? "#10B981" : isDown ? "#FF4D6D" : "#6366F1"}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={isUp ? "#10B981" : isDown ? "#FF4D6D" : "#6366F1"}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      tickFormatter={(v) =>
                        v >= 100 ? v.toFixed(1) : v >= 1 ? v.toFixed(3) : v.toFixed(5)
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke={isUp ? "#10B981" : isDown ? "#FF4D6D" : "#6366F1"}
                      strokeWidth={2}
                      fill={`url(#grad-${code})`}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted text-xs">No data available</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface ExchangeRatesPanelProps {
  /** Pass-through of already-fetched rates (base=USD) from Dashboard */
  latestRates: Record<string, number>;
  ratesLoading: boolean;
}

export const ExchangeRatesPanel: React.FC<ExchangeRatesPanelProps> = ({
  latestRates,
  ratesLoading,
}) => {
  const [base, setBase] = useState<BaseCurrency>("USD");
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  // Historical data for the selected currency (7 days)
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState(false);

  // We also fetch 7-day-old rates for ALL tracked currencies to show % change
  const [weekOldRates, setWeekOldRates] = useState<Record<string, number>>({});

  // Fetch week-old rates whenever base changes
  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 7);
    const dateStr = endDate.toISOString().split("T")[0];

    const symbols = TRACKED_CURRENCIES[base].join(",");
    fetch(`https://api.frankfurter.app/${dateStr}?base=${base}&symbols=${symbols}`)
      .then((r) => r.json())
      .then((data) => {
        setWeekOldRates(data.rates ?? {});
      })
      .catch(() => setWeekOldRates({}));
  }, [base]);

  // Fetch 7-day historical data when a currency is selected
  const fetchHistorical = useCallback(
    async (code: string, baseCurrency: string) => {
      setHistoricalLoading(true);
      setHistoricalError(false);
      setHistoricalData([]);

      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const start = startDate.toISOString().split("T")[0];
        const end = endDate.toISOString().split("T")[0];

        const res = await fetch(
          `https://api.frankfurter.app/${start}..${end}?base=${baseCurrency}&symbols=${code}`
        );
        const data = await res.json();

        if (data.rates) {
          const points: HistoricalPoint[] = Object.entries(data.rates)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, rateObj]) => ({
              date,
              rate: (rateObj as Record<string, number>)[code] ?? 0,
            }));
          setHistoricalData(points);
        }
      } catch {
        setHistoricalError(true);
      } finally {
        setHistoricalLoading(false);
      }
    },
    []
  );

  const handleSelectCurrency = (code: string) => {
    if (selectedCurrency === code) {
      setSelectedCurrency(null);
      return;
    }
    setSelectedCurrency(code);
    fetchHistorical(code, base);
  };

  // Convert Dashboard's USD-base rates to the current base
  const getRateForCode = (code: string): number => {
    if (base === "USD") {
      return latestRates[code] ?? 1;
    }
    const baseInUsd = latestRates[base] ?? 1;
    const codeInUsd = code === "USD" ? 1 : latestRates[code] ?? 1;
    return codeInUsd / baseInUsd;
  };

  const trackedCurrencies = TRACKED_CURRENCIES[base];

  return (
    <motion.div
      key="rates"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-bright tracking-tight">
            Exchange Rates
          </h2>
          <p className="text-muted text-sm mt-0.5">
            Live rates · Tap a currency to see 7-day chart
          </p>
        </div>

        {/* Base currency selector */}
        <div
          className="flex gap-1 glass-panel p-1 rounded-full self-start sm:self-auto"
          role="group"
          aria-label="Base currency"
        >
          {BASE_CURRENCIES.map((code) => (
            <button
              key={code}
              onClick={() => {
                setBase(code);
                setSelectedCurrency(null);
              }}
              aria-label={`Set base to ${code}`}
              aria-pressed={base === code}
              className={`relative px-3 py-1.5 text-[10px] font-bold rounded-full transition-colors z-10 ${
                base === code ? "text-bright" : "text-muted hover:text-bright"
              }`}
            >
              {base === code && (
                <motion.div
                  layoutId="rates-base-pill"
                  className="absolute inset-0 bg-accent/20 border border-accent/20 rounded-full z-[-1]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {!ratesLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Base",
              value: base,
              sub: CURRENCY_NAMES[base],
              icon: CURRENCY_FLAGS[base],
            },
            {
              label: "Currencies Tracked",
              value: trackedCurrencies.length.toString(),
              sub: "Major pairs",
              icon: "📊",
            },
            {
              label: "Last Updated",
              value: "Live",
              sub: "Via frankfurter.app",
              icon: "🔄",
            },
          ].map((stat) => (
            <GlassCard key={stat.label} className="!p-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">{stat.icon}</span>
                <div className="min-w-0">
                  <p className="text-muted text-[9px] uppercase tracking-widest mb-0.5 truncate">
                    {stat.label}
                  </p>
                  <p className="text-bright font-black text-sm truncate">{stat.value}</p>
                  <p className="text-muted text-[9px] truncate">{stat.sub}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Currency cards */}
      {ratesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl border border-bg-border bg-bg-card/40 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {trackedCurrencies.map((code) => (
            <CurrencyCard
              key={`${base}-${code}`}
              code={code}
              rate={getRateForCode(code)}
              base={base}
              weekOldRate={weekOldRates[code]}
              isSelected={selectedCurrency === code}
              onSelect={() => handleSelectCurrency(code)}
              historicalLoading={historicalLoading && selectedCurrency === code}
              historicalData={selectedCurrency === code ? historicalData : []}
            />
          ))}
        </motion.div>
      )}

      {historicalError && (
        <p className="text-rose-400 text-xs text-center mt-4">
          Failed to load historical data. Check your connection.
        </p>
      )}
    </motion.div>
  );
};
