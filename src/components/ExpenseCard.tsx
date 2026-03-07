import React, { useState } from "react";
import { motion } from "framer-motion";
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
  onEdit?: (transaction: Transaction, target?: HTMLElement) => void;
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

// Rename base component to allow React.memo wrapping below
const ExpenseCardComponent: React.FC<ExpenseCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  isEditing,
  defaultCurrency,
  convertToDefault,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const renderActions = () => {
    // Determine visibility via CSS to ensure physical width reclaiming on mobile compact views
    const visibilityClass = isExpanded ? "flex" : "hidden sm:flex";

    return (
      <div
        className={`${visibilityClass} items-center gap-1 sm:gap-1.5 shrink-0 relative z-20`}
      >
        {/* Edit Button */}
        <button
          id={`edit-btn-${transaction.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(transaction, e.currentTarget);
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 flex shrink-0 items-center justify-center rounded-full bg-white/8 border border-white/10 text-slate-400 hover:text-teal-400 active:text-teal-400 hover:bg-teal-500/15 active:bg-teal-500/15 transition-all duration-300 ${
            (isExpanded || isHovered) && !showDeleteConfirm
              ? "opacity-100 pointer-events-auto scale-100"
              : "opacity-0 pointer-events-none scale-75"
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Trash button ↔ Confirm pill */}
        {showDeleteConfirm ? (
          <motion.div
            key="confirm-pill"
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="flex items-center gap-2 bg-rose-500/10 p-1 pl-3 pr-1 rounded-full border border-rose-500/20 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="p-1 px-2 rounded-full hover:bg-white/10 text-slate-300 text-xs transition-colors"
            >
              No
            </button>
          </motion.div>
        ) : (
          <button
            key="trash-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 flex shrink-0 items-center justify-center rounded-full bg-white/8 border border-white/10 text-slate-400 hover:text-rose-400 active:text-rose-400 hover:bg-rose-500/15 active:bg-rose-500/15 transition-all duration-300 ${
              isExpanded || isHovered
                ? "opacity-100 pointer-events-auto scale-100"
                : "opacity-0 pointer-events-none scale-75"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const renderAmounts = () => (
    <motion.div
      layoutId={`amounts-${transaction.id}`}
      className="flex flex-col items-end gap-0.5 shrink-0"
    >
      <div className="flex items-center gap-1">
        {isIncome ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-rose-400" />
        )}
        <span
          className={`font-semibold tracking-wide ${isIncome ? "text-emerald-400" : "text-slate-200"} ${isExpanded ? "text-xl sm:text-2xl" : "text-lg"}`}
        >
          {currencySymbol(transaction.currency)} {isIncome ? "+" : "-"}
          {Math.abs(transaction.amount).toFixed(2)}
        </span>
      </div>

      {/* Converted amount shown when transaction currency ≠ default */}
      {convertToDefault &&
        defaultCurrency &&
        transaction.currency !== defaultCurrency && (
          <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
            <span>→</span>
            <span className={isIncome ? "text-emerald-600" : "text-slate-500"}>
              {currencySymbol(defaultCurrency)} {isIncome ? "+" : "-"}
              {Math.abs(
                convertToDefault(transaction.amount, transaction.currency),
              ).toFixed(2)}
            </span>
          </div>
        )}
    </motion.div>
  );

  return (
    // Outer: layout wrapper only
    <motion.div
      layout
      id={`expense-card-${transaction.id}`}
      className={`relative transform-gpu will-change-transform ${isHovered || isExpanded ? "z-30" : "z-10"} ${isEditing ? "pointer-events-none" : ""}`}
    >
      <div
        onMouseEnter={isHoverable ? () => setIsHovered(true) : undefined}
        onMouseLeave={isHoverable ? handleMouseLeave : undefined}
        onClick={() => {
          if (showDeleteConfirm) return;
          setIsExpanded(!isExpanded);
        }}
        className="cursor-pointer"
      >
        <motion.div
          layout
          className="relative w-full h-full group transition-transform hover:scale-[1.01]"
        >
          {/* Hover Background Container wraps the entire inner card visually */}
          <motion.div
            layout
            style={{ borderRadius: 16, overflow: "hidden" }}
            className={`glass-panel border group-hover:bg-white/15 transition-all duration-300 relative transform-gpu will-change-transform ${isExpanded ? "bg-white/10 border-white/20 shadow-xl shadow-black/20" : "border-white/5 group-hover:border-white/20"}`}
          >
            {/* Inner Content that fades out/in when editing */}
            <motion.div
              layout
              initial={false}
              animate={{ opacity: isEditing ? 0 : 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className={`relative z-10 flex ${isExpanded ? "flex-col p-4 sm:p-5 gap-3 sm:gap-4" : "items-center justify-between p-3 sm:p-4 gap-2 sm:gap-4"}`}
            >
              {isExpanded ? (
                // --- EXPANDED VIEW ---
                <>
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
                      <motion.div
                        layoutId={`icon-${transaction.id}`}
                        className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shrink-0"
                      >
                        <CategoryIcon
                          category={transaction.category}
                          customIcon={transaction.customIcon}
                        />
                      </motion.div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <motion.h3
                          layoutId={`title-${transaction.id}`}
                          className="text-slate-100 font-semibold text-lg sm:text-xl break-words leading-tight"
                        >
                          {transaction.title}
                        </motion.h3>
                        <motion.div
                          layoutId={`category-${transaction.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1.5 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                          <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">
                            {transaction.category}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                    <div className="shrink-0 mt-1">{renderAmounts()}</div>
                  </div>

                  <div className="flex justify-between items-end w-full mt-1 pt-3 sm:pt-4 border-t border-white/5">
                    <motion.p
                      layoutId={`time-${transaction.id}`}
                      className="text-slate-400 text-sm font-medium"
                    >
                      {transaction.date.toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </motion.p>
                    {renderActions()}
                  </div>
                </>
              ) : (
                // --- COMPACT VIEW ---
                <>
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <motion.div
                      layoutId={`icon-${transaction.id}`}
                      className="p-2.5 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-md shrink-0"
                    >
                      <CategoryIcon
                        category={transaction.category}
                        customIcon={transaction.customIcon}
                      />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <motion.h3
                        layoutId={`title-${transaction.id}`}
                        className="text-slate-200 font-medium text-base sm:text-lg overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {transaction.title}
                      </motion.h3>
                      <motion.p
                        layoutId={`time-${transaction.id}`}
                        className="text-slate-400 text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {transaction.date.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </motion.p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* On compact view, totally remove actions from DOM on mobile to avoid wasting width */}
                    {renderActions()}
                    {renderAmounts()}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const ExpenseCard = React.memo(ExpenseCardComponent, (prev, next) => {
  return (
    prev.transaction === next.transaction &&
    prev.isEditing === next.isEditing &&
    prev.defaultCurrency === next.defaultCurrency &&
    prev.convertToDefault === next.convertToDefault &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete
  );
});
