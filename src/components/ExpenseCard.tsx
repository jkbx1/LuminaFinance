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
  counterparty?: string;
  batchId?: string; // Links transactions from the same import
  batchName?: string; // Original CSV filename
  isBatchHeader?: boolean; // Marker for the session header
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
  onDelete?: (id: string, batchId?: string) => void;
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
    return <Icon className="w-5 h-5 text-accent" />;
  }

  switch (category.toLowerCase()) {
    case "food":
      return <Coffee className="w-5 h-5 text-accent" />;
    case "shopping":
      return <ShoppingBag className="w-5 h-5 text-muted" />;
    case "housing":
      return <Home className="w-5 h-5 text-muted" />;
    case "utilities":
      return <Zap className="w-5 h-5 text-bright" />;
    case "salary":
      return <Briefcase className="w-5 h-5 text-accent" />;
    case "freelance":
      return <Globe className="w-5 h-5 text-muted" />;
    case "investment":
      return <TrendingUp className="w-5 h-5 text-accent" />;
    case "gift":
      return <Gift className="w-5 h-5 text-accent" />;
    default:
      return <MoreHorizontal className="w-5 h-5 text-muted" aria-hidden="true" />;
  }
};

interface ScrollingTextProps {
  text: string;
  className?: string;
  active?: boolean;
  isTitle?: boolean;
  isAmount?: boolean;
  isExpanded?: boolean;
}

const ScrollingText: React.FC<ScrollingTextProps> = ({
  text,
  className,
  active = false,
  isTitle = false,
  isAmount = false,
  isExpanded = false,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollAmount, setScrollAmount] = useState(0);

  // Dynamic font scaling logic
  const getFontSize = () => {
    const len = text.length;
    if (isTitle) {
      if (isExpanded) {
        return len > 30 ? "text-base sm:text-lg" : len > 20 ? "text-lg sm:text-xl" : "text-xl sm:text-2xl";
      }
      return len > 25 ? "text-sm sm:text-base" : len > 18 ? "text-base" : "text-base sm:text-lg";
    }
    if (isAmount) {
      if (isExpanded) {
        return len > 16 ? "text-lg sm:text-xl" : len > 12 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl";
      }
      return len > 14 ? "text-sm sm:text-base" : len > 10 ? "text-base sm:text-lg" : "text-lg sm:text-xl";
    }
    return "";
  };

  const fontSizeClass = getFontSize();

  // Measure overflow after font size is applied
  React.useEffect(() => {
    const measure = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.offsetWidth;
        if (textWidth > containerWidth) {
          setShouldScroll(true);
          setScrollAmount(textWidth - containerWidth + 24); // 24px extra buffer
        } else {
          setShouldScroll(false);
          setScrollAmount(0);
        }
      }
    };
    
    // Slight timeout to ensure layout is stable
    const timer = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [text, fontSizeClass, isExpanded]);

  return (
    <div ref={containerRef} className={`overflow-hidden relative ${fontSizeClass} ${className}`}>
      <motion.span
        ref={textRef}
        initial={{ x: 0 }}
        animate={shouldScroll && active ? { x: [0, -scrollAmount, 0] } : { x: 0 }}
        transition={active ? {
          x: {
            duration: Math.max(3, scrollAmount / 25),
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 1.5,
          }
        } : {
          x: {
            duration: 0.2, // Quick reset to start
            ease: "easeOut"
          }
        }}
        className="inline-block whitespace-nowrap"
      >
        {text}
      </motion.span>
      {/* Subtle fade effect on the right when it overflows but is not scrolling yet */}
      {shouldScroll && !active && (
        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-bg-card/40 to-transparent pointer-events-none" />
      )}
    </div>
  );
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

  // Detect mobile Chrome synchronously
  const isMobileChrome = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isChrome =
      /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
    return isAndroid && isChrome;
  }, []);

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
          aria-label={`Edit ${transaction.title}`}
          className={`w-7 h-7 sm:w-8 sm:h-8 flex shrink-0 items-center justify-center rounded-full bg-bg-card/50 border border-bg-border text-muted hover:text-accent active:text-accent hover:bg-accent/15 active:bg-accent/15 transition-all duration-300 ${
            (isExpanded || isHovered) && !showDeleteConfirm
              ? "opacity-100 pointer-events-auto scale-100"
              : "opacity-0 pointer-events-none scale-75"
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        {/* Trash button ↔ Confirm pill */}
        {showDeleteConfirm ? (
          <motion.div
            key="confirm-pill"
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className={`flex items-center gap-2 bg-rose-500/10 p-1 pl-3 pr-1 rounded-full border border-rose-500/20 backdrop-blur-md ${transaction.isBatchHeader ? "ring-2 ring-rose-500/30" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-rose-300 font-bold whitespace-nowrap">
              {transaction.isBatchHeader ? "Delete Batch?" : "Delete?"}
            </span>
            <button
              onClick={() => onDelete?.(transaction.id, transaction.isBatchHeader ? transaction.batchId : undefined)}
              className="p-1 px-3 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-black uppercase tracking-tight transition-colors shadow-lg shadow-rose-500/20"
            >
              Confirm
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="p-1 px-2 rounded-full hover:bg-bg-card/50 text-muted text-xs transition-colors"
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
            aria-label={`Delete ${transaction.title}`}
            className={`w-7 h-7 sm:w-8 sm:h-8 flex shrink-0 items-center justify-center rounded-full bg-bg-card/50 border border-bg-border text-muted hover:text-rose-400 active:text-rose-400 hover:bg-rose-500/15 active:bg-rose-500/15 transition-all duration-300 ${
              isExpanded || isHovered
                ? "opacity-100 pointer-events-auto scale-100"
                : "opacity-0 pointer-events-none scale-75"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  };

  const renderAmounts = () => {
    const primaryAmount = `${currencySymbol(transaction.currency)} ${isIncome ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}`;
    
    return (
      <motion.div
        layoutId={isMobileChrome ? undefined : `amounts-${transaction.id}`}
        className="flex flex-col items-end gap-0.5 min-w-0"
        aria-label={`${isIncome ? "Income" : "Expense"} amount: ${primaryAmount}`}
      >
        <div className="flex items-center gap-1 w-full justify-end" aria-hidden="true">
          {isIncome ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <ScrollingText
            active={isExpanded || isHovered}
            text={primaryAmount}
            isAmount={true}
            isExpanded={isExpanded}
            className={`font-semibold tracking-wide ${isIncome ? "text-emerald-400" : "text-bright"}`}
          />
        </div>

        {/* Converted amount shown when transaction currency ≠ default */}
        {convertToDefault &&
          defaultCurrency &&
          transaction.currency !== defaultCurrency && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted w-full justify-end" aria-label={`Converted to ${defaultCurrency}: ${currencySymbol(defaultCurrency)}${Math.abs(convertToDefault(transaction.amount, transaction.currency)).toFixed(2)}`}>
              <span aria-hidden="true" className="shrink-0">→</span>
              <ScrollingText
                active={isExpanded || isHovered}
                isAmount={true}
                isExpanded={isExpanded}
                text={`${currencySymbol(defaultCurrency)} ${isIncome ? "+" : "-"}${Math.abs(convertToDefault(transaction.amount, transaction.currency)).toFixed(2)}`}
                className={isIncome ? "text-emerald-600" : "text-muted"}
              />
            </div>
          )}
      </motion.div>
    );
  };

  return (
    // Outer: layout wrapper only
    <motion.article
      layout={!isMobileChrome}
      id={`expense-card-${transaction.id}`}
      aria-expanded={isExpanded}
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
          layout={!isMobileChrome}
          className={`relative w-full h-full group ${
            isMobileChrome ? "" : "transition-transform hover:scale-[1.01]"
          }`}
        >
          {/* Hover Background Container wraps the entire inner card visually */}
          <motion.div
            layout={!isMobileChrome}
            style={{ borderRadius: 16, overflow: "hidden" }}
            initial={false}
            animate={
              isMobileChrome
                ? { opacity: isExpanded ? 1 : 0.96 }
                : undefined
            }
            transition={
              isMobileChrome ? { duration: 0.18, ease: "easeOut" } : undefined
            }
            className={`glass-panel border group-hover:bg-bg-card/40 transition-all duration-300 relative transform-gpu will-change-transform ${isExpanded ? "bg-bg-card/40 border-accent/20 shadow-xl shadow-black/10" : "border-bg-border group-hover:border-accent/20"}`}
          >
            {/* Inner Content that fades out/in when editing */}
            <motion.div
              layout={!isMobileChrome}
              initial={false}
              animate={{ opacity: isEditing ? 0 : 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className={`relative z-10 flex ${isExpanded ? "flex-col p-4 sm:p-5 gap-3 sm:gap-4" : "items-center p-3 sm:p-4 gap-4"}`}
            >
              {isExpanded ? (
                // --- EXPANDED VIEW ---
                <>
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
                      <motion.div
                        layoutId={
                          isMobileChrome ? undefined : `icon-${transaction.id}`
                        }
                        className="p-3 bg-bg-card/50 rounded-2xl border border-bg-border backdrop-blur-md shrink-0"
                      >
                        <CategoryIcon
                          category={transaction.category}
                          customIcon={transaction.customIcon}
                        />
                      </motion.div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <motion.h3
                          layoutId={
                            isMobileChrome ? undefined : `title-${transaction.id}`
                          }
                          className="text-bright font-semibold leading-tight"
                        >
                          <ScrollingText 
                             text={transaction.title}
                             active={true} // In expanded view, always allow scroll if needed
                             isTitle={true}
                             isExpanded={true}
                          />
                        </motion.h3>
                        <motion.div
                          layoutId={
                            isMobileChrome
                              ? undefined
                              : `category-${transaction.id}`
                          }
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1.5 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                          <span className="text-accent text-xs font-bold uppercase tracking-widest">
                            {transaction.category}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                    <div className="shrink-0 mt-1 max-w-[40%]">{renderAmounts()}</div>
                  </div>

                  <div className="flex justify-between items-end w-full mt-1 pt-3 sm:pt-4 border-t border-bg-border">
                    <motion.p
                      layoutId={
                        isMobileChrome ? undefined : `time-${transaction.id}`
                      }
                      className="text-muted text-sm font-medium"
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
                  <div className="flex items-center gap-3 sm:gap-4 flex-[1.5] min-w-0">
                    <motion.div
                      layoutId={
                        isMobileChrome ? undefined : `icon-${transaction.id}`
                      }
                      className="p-2.5 sm:p-3 bg-bg-card/50 rounded-xl sm:rounded-2xl border border-bg-border backdrop-blur-md shrink-0"
                    >
                      <CategoryIcon
                        category={transaction.category}
                        customIcon={transaction.customIcon}
                      />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <motion.h3
                        layoutId={
                          isMobileChrome ? undefined : `title-${transaction.id}`
                        }
                        className="text-bright font-medium"
                      >
                        <ScrollingText 
                          text={transaction.title} 
                          active={isHovered}
                          isTitle={true}
                          isExpanded={false}
                        />
                      </motion.h3>
                      <motion.p
                        layoutId={
                          isMobileChrome ? undefined : `time-${transaction.id}`
                        }
                        className="text-muted text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {transaction.date.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </motion.p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end min-w-0">
                    <div className="hidden sm:flex shrink-0">
                      {renderActions()}
                    </div>
                    <div className="min-w-0 text-right">
                       {renderAmounts()}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.article>
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
