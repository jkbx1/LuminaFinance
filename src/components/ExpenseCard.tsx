import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coffee,
  ShoppingBag,
  Home,
  Zap,
  MoreHorizontal,
  Edit2,
  Trash2,
  Briefcase,
  Globe,
  TrendingUp,
  Gift,
  Monitor,
  Car,
  Heart,
  Music,
  Book,
  Wifi,
  Smartphone,
  Camera,
  PenTool,
  MapPin,
  Utensils,
  Moon,
  Sun,
  Star,
  Bus,
  Plane,
  Train,
} from "lucide-react";

/** Maps ISO currency code → symbol */
export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  PLN: "zł",
  JPY: "¥",
  CAD: "CA$",
};
export const currencySymbol = (code: string) => CURRENCY_SYMBOL[code] ?? code;

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string; // open string — supports built-in + custom categories
  customIcon?: string; // name of the icon from CUSTOM_ICONS_MAP
  currency: string; // ISO code e.g. "USD", "EUR"
  date: Date;
}

export const CUSTOM_ICONS_MAP: Record<string, React.FC<any>> = {
  Monitor,
  Car,
  Heart,
  Music,
  Book,
  Wifi,
  Smartphone,
  Camera,
  PenTool,
  MapPin,
  Utensils,
  Moon,
  Sun,
  Star,
  Bus,
  Plane,
  Train,
};

interface ExpenseCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
  defaultCurrency?: string;
  convertToDefault?: (amount: number, from: string) => number;
}

const CategoryIcon = ({
  category,
  customIcon,
}: {
  category: string;
  customIcon?: string;
}) => {
  if (customIcon && CUSTOM_ICONS_MAP[customIcon]) {
    const Icon = CUSTOM_ICONS_MAP[customIcon];
    return <Icon className="w-5 h-5 text-teal-400" />;
  }

  switch (category.toLowerCase()) {
    case "food":
      return <Coffee className="w-5 h-5 text-orange-400" />;
    case "shopping":
      return <ShoppingBag className="w-5 h-5 text-purple-400" />;
    case "housing":
      return <Home className="w-5 h-5 text-blue-400" />;
    case "utilities":
      return <Zap className="w-5 h-5 text-yellow-400" />;
    case "salary":
      return <Briefcase className="w-5 h-5 text-teal-400" />;
    case "freelance":
      return <Globe className="w-5 h-5 text-cyan-400" />;
    case "investment":
      return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    case "gift":
      return <Gift className="w-5 h-5 text-pink-400" />;
    default:
      return <MoreHorizontal className="w-5 h-5 text-slate-400" />;
  }
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  isEditing,
  defaultCurrency,
  convertToDefault,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if device supports hover (desktop) vs touch (mobile)
  const [isHoverable, setIsHoverable] = useState(true);

  React.useEffect(() => {
    setIsHoverable(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
  }, []);

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isIncome = transaction.type === "income";

  return (
    // Outer: layout wrapper only
    <div
      className={`relative ${isHovered ? "z-30" : "z-10"} ${isEditing ? "pointer-events-none" : ""}`}
    >
      <div
        onMouseEnter={isHoverable ? () => setIsHovered(true) : undefined}
        onMouseLeave={isHoverable ? handleMouseLeave : undefined}
      >
        <div className="relative w-full h-full group transition-transform hover:scale-[1.01]">
          {/* Hover Background Container wraps the entire inner card visually */}
          <div
            style={{ borderRadius: 16, overflow: "hidden" }}
            className="glass-panel border border-white/5 group-hover:bg-white/15 group-hover:border-white/20 transition-all duration-300 relative"
          >
            {/* Inner Content that fades out/in when editing */}
            <motion.div
              initial={false}
              animate={{ opacity: isEditing ? 0 : 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <CategoryIcon
                    category={transaction.category}
                    customIcon={transaction.customIcon}
                  />
                </div>
                <div>
                  <h3 className="text-slate-200 font-medium text-lg">
                    {transaction.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {transaction.date.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Edit button — its own AnimatePresence for a clean fade */}
                <AnimatePresence>
                  {(isHovered || !isHoverable) && !showDeleteConfirm && (
                    <motion.button
                      key="edit-btn"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      onClick={() => onEdit?.(transaction)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 border border-white/10 text-slate-400 hover:text-teal-400 active:text-teal-400 hover:bg-teal-500/15 active:bg-teal-500/15 transition-all duration-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Trash button ↔ Confirm pill */}
                <AnimatePresence mode="wait">
                  {(isHovered || !isHoverable) && !showDeleteConfirm && (
                    <motion.button
                      key="trash-btn"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 border border-white/10 text-slate-400 hover:text-rose-400 active:text-rose-400 hover:bg-rose-500/15 active:bg-rose-500/15 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                  {showDeleteConfirm && (
                    <motion.div
                      key="confirm-pill"
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 bg-rose-500/10 p-1 pl-3 pr-1 rounded-full border border-rose-500/20 backdrop-blur-md"
                    >
                      <span className="text-xs text-rose-300 font-medium whitespace-nowrap">
                        Delete?
                      </span>
                      <button
                        onClick={() => onDelete?.(transaction.id)}
                        className="p-1 px-2 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="p-1 px-2 rounded-full hover:bg-white/10 text-slate-300 text-xs transition-colors"
                      >
                        No
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1">
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-rose-400" />
                    )}
                    <span
                      className={`font-semibold text-lg tracking-wide ${isIncome ? "text-emerald-400" : "text-slate-200"}`}
                    >
                      {currencySymbol(transaction.currency)}{" "}
                      {isIncome ? "+" : "-"}
                      {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </div>

                  {/* Converted amount shown when transaction currency ≠ default */}
                  {convertToDefault &&
                    defaultCurrency &&
                    transaction.currency !== defaultCurrency && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>→</span>
                        <span
                          className={
                            isIncome ? "text-emerald-600" : "text-slate-500"
                          }
                        >
                          {currencySymbol(defaultCurrency)}{" "}
                          {isIncome ? "+" : "-"}
                          {Math.abs(
                            convertToDefault(
                              transaction.amount,
                              transaction.currency,
                            ),
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
