import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "sage" | "dusty" | "warm" | "terracotta" | "rust";
}

const COLOR_STYLES: Record<
  NonNullable<StatsCardProps["color"]>,
  {
    gradient: string;
    accent: string;
    text: string;
    chip: string;
  }
> = {
  sage: {
    gradient: "from-boho-sage/45 via-boho-sage/30 to-boho-cream/60",
    accent: "bg-boho-sage/80 text-boho-cream",
    text: "text-boho-sage",
    chip: "bg-boho-sage/15 text-boho-sage",
  },
  dusty: {
    gradient: "from-boho-dusty/50 via-boho-dusty/30 to-boho-cream/60",
    accent: "bg-boho-dusty/80 text-boho-cream",
    text: "text-boho-dusty",
    chip: "bg-boho-dusty/15 text-boho-dusty",
  },
  warm: {
    gradient: "from-boho-warm/50 via-boho-warm/30 to-boho-cream/60",
    accent: "bg-boho-warm/80 text-boho-brown",
    text: "text-boho-warm",
    chip: "bg-boho-warm/20 text-boho-warm",
  },
  terracotta: {
    gradient: "from-boho-terracotta/55 via-boho-terracotta/30 to-boho-cream/60",
    accent: "bg-boho-terracotta/85 text-boho-cream",
    text: "text-boho-terracotta",
    chip: "bg-boho-terracotta/15 text-boho-terracotta",
  },
  rust: {
    gradient: "from-boho-rust/55 via-boho-rust/30 to-boho-cream/60",
    accent: "bg-boho-rust/85 text-boho-cream",
    text: "text-boho-rust",
    chip: "bg-boho-rust/15 text-boho-rust",
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "sage",
}) => {
  const styles = COLOR_STYLES[color];

  return (
    <article className="boho-card group relative overflow-hidden p-6 transition-transform duration-500 hover:-translate-y-1">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-70 transition-opacity duration-500 group-hover:opacity-90`}
      />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <span className="ever-section-title text-[0.65rem] uppercase tracking-[0.4em]">
              {title}
            </span>
            <p className="text-4xl font-semibold text-boho-brown boho-heading">
              {value}
            </p>
          </div>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-[var(--ever-radius-md)] border border-boho-brown/10 bg-boho-cream/70 shadow-inner shadow-boho-brown/10 transition-transform duration-500 group-hover:scale-105 ${styles.text}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {trend && (
          <div className="flex items-center justify-between text-sm">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${styles.chip}`}
            >
              <span>{trend.isPositive ? "▲" : "▼"}</span>
              <span>
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            </span>
            <span className="text-xs text-boho-brown/70">
              спрямо миналия месец
            </span>
          </div>
        )}
      </div>
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl transition-all duration-500 group-hover:scale-110 ${styles.accent}`}
      />
    </article>
  );
};
