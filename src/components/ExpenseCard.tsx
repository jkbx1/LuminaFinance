import React, { useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
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
} from "lucide-react";
import { GlassCard } from "./ui/GlassCard";

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
  currency: string; // ISO code e.g. "USD", "EUR"
  date: Date;
}

interface ExpenseCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
  defaultCurrency?: string;
  convertToDefault?: (amount: number, from: string) => number;
}

const CategoryIcon = ({ category }: { category: string }) => {
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

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useMotionTemplate`${mouseYSpring}deg`;
  const rotateY = useMotionTemplate`${mouseXSpring}deg`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct * 15); // max rotation
    y.set(yPct * -15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const isIncome = transaction.type === "income";

  return (
    // Outer: layoutId only, no custom transforms that would conflict with layout animations
    <motion.div
      layoutId={`expense-card-${transaction.id}`}
      animate={{ opacity: isEditing ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      className={`relative ${isHovered ? "z-30" : "z-10"} ${isEditing ? "pointer-events-none" : ""}`}
    >
      {/* Inner: 3D tilt effect, separated so it doesn't interfere with layoutId */}
      <motion.div
        style={{
          rotateX: isEditing ? 0 : rotateX,
          rotateY: isEditing ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <GlassCard className="flex items-center justify-between p-4 transition-all duration-300 hover:bg-white/15 border border-white/5 hover:border-white/20">
          <div
            className="flex items-center gap-4"
            style={{ transform: "translateZ(30px)" }}
          >
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <CategoryIcon category={transaction.category} />
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

          <div
            className="flex items-center gap-1.5"
            style={{ transform: "translateZ(40px)" }}
          >
            {/* Edit button — its own AnimatePresence for a clean fade */}
            <AnimatePresence>
              {isHovered && !showDeleteConfirm && (
                <motion.button
                  key="edit-btn"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => onEdit?.(transaction)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 border border-white/10 text-slate-400 hover:text-teal-400 hover:bg-teal-500/15 hover:border-teal-500/30 transition-all duration-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Trash button ↔ Confirm pill — shared layoutId morph */}
            <AnimatePresence>
              {isHovered && !showDeleteConfirm && (
                <motion.button
                  key="trash-btn"
                  layoutId={`delete-morph-${transaction.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/30 transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              )}
              {showDeleteConfirm && (
                <motion.div
                  key="confirm-pill"
                  layoutId={`delete-morph-${transaction.id}`}
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
                  {currencySymbol(transaction.currency)} {isIncome ? "+" : "-"}
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
                      {currencySymbol(defaultCurrency)} {isIncome ? "+" : "-"}
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
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};
