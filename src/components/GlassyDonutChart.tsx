import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface GlassyDonutChartProps {
  data: ChartData[];
  totalText?: string;
  currencySymbol?: string;
  forceZeroTotal?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  currencySymbol,
  coordinate,
  viewBox,
}: any) => {
  if (active && payload && payload.length && coordinate) {
    const { x, y } = coordinate;
    const cx = viewBox?.width ? viewBox.width / 2 : 150;
    const cy = viewBox?.height ? viewBox.height / 2 : 140;

    const isLeft = x < cx;
    const isTop = y < cy;

    // On mobile screens, point the tooltip horizontally inward to prevent clipping off the edge of the screen
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const pointLeft = isMobile ? !isLeft : isLeft;

    const translateX = pointLeft ? "-100%" : "0%";
    const translateY = isTop ? "-100%" : "0%";

    const offsetX = pointLeft ? -20 : 20;
    const offsetY = isTop ? -20 : 20;

    return (
      <div
        className="pointer-events-none"
        style={{
          transform: `translate(calc(${translateX} + ${offsetX}px), calc(${translateY} + ${offsetY}px))`,
          whiteSpace: "nowrap",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="p-3 rounded-xl border border-glass-border shadow-2xl bg-bg-card/95 backdrop-blur-md flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]"
              style={{ backgroundColor: payload[0].payload.color }}
            />
            <p className="text-muted text-[10px] font-bold uppercase tracking-widest">
              {payload[0].name}
            </p>
          </div>
          <p className="text-bright text-xl font-bold tracking-tight">
            {currencySymbol} {payload[0].value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </motion.div>
      </div>
    );
  }
  return null;
};

export const GlassyDonutChart: React.FC<GlassyDonutChartProps> = ({
  data,
  totalText,
  currencySymbol = "$",
  forceZeroTotal = false,
}) => {
  const total = forceZeroTotal
    ? 0
    : data.reduce((sum, item) => sum + item.value, 0);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="relative w-full h-[250px] sm:h-[280px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={<CustomTooltip currencySymbol={currencySymbol} />}
            cursor={false}
            offset={0}
            isAnimationActive={false}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 100, pointerEvents: "none" }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={85}
            outerRadius={115}
            paddingAngle={6}
            dataKey="value"
            stroke="var(--glass-border)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  filter: isMobile
                    ? "none"
                    : `drop-shadow(0px 0px 8px ${entry.color}80)`,
                  outline: "none",
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-muted text-sm tracking-wider uppercase">
          {totalText || "Total"}
        </span>
        <span className="text-3xl font-bold tracking-tight text-bright mt-1">
          {currencySymbol}{" "}
          {total.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
};
