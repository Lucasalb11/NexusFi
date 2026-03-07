"use client";

/**
 * PremiumTopNav — NexusFi finance app top navigation toolbar
 *
 * A luxurious horizontal pill-shaped bar with glassmorphism, metallic gold accents,
 * and smooth micro-animations. Designed for premium finance UX.
 *
 * Features:
 * - Golden-bordered balance/token counter (dynamic demo: 0.00 → 88.00 on click)
 * - Activity, Layers, Wallet icons with placeholder actions
 * - Sun/Moon theme toggle with localStorage persistence
 * - 200ms transitions, hover glows, backdrop-blur glass effect
 * - Responsive for mobile/desktop, Inter font, high-contrast typography
 *
 * Usage:
 * - Wrap app with ThemeProvider (see Providers.tsx)
 * - Render <PremiumTopNav /> in your layout; <PremiumHeroSection /> optionally in dashboard
 * - For production: replace balanceDisplay state with props from WalletContext/API
 */

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Layers,
  Wallet,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";

// ─── Theme Context (dark/light with localStorage persistence) ─────────────────
const THEME_KEY = "nexusfi-theme";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const resolved = stored === "dark" || stored === "light" ? stored : "dark";
    setThemeState(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === "dark", setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Icon button with placeholder action logging ──────────────────────────────
function NavIconButton({
  icon: Icon,
  label,
  onClick,
  className,
  "aria-label": ariaLabel,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  "aria-label": string;
}) {
  const handleClick = () => {
    console.log(`[NexusFi] ${label}`);
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={clsx(
        "w-8 h-8 flex items-center justify-center rounded-lg",
        "text-current/80 hover:text-current hover:bg-black/10 dark:hover:bg-white/10",
        "transition-all duration-200 ease-out",
        className
      )}
    >
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );
}

// ─── Main PremiumTopNav component ────────────────────────────────────────────
export default function PremiumTopNav() {
  const { isDark, toggleTheme } = useTheme();
  // Demo: balance counter starts at 0.00, updates to 88.00 on first click
  const [balanceDisplay, setBalanceDisplay] = useState("0.00");
  const [hasClickedBalance, setHasClickedBalance] = useState(false);

  const handleBalanceClick = () => {
    if (!hasClickedBalance) {
      setBalanceDisplay("88.00");
      setHasClickedBalance(true);
      console.log("[NexusFi] Balance counter demo: 0.00 → 88.00");
    }
  };

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50",
        "flex justify-center px-4 pt-4 pb-2",
        "safe-top"
      )}
    >
      <nav
        className={clsx(
          "flex items-center gap-6",
          "h-12 px-4 sm:px-6 rounded-3xl",
          "shadow-xl backdrop-blur-md",
          "transition-colors duration-300 ease-out",
          "max-w-fit",
          isDark
            ? "bg-zinc-950/80 text-white"
            : "bg-white/80 text-zinc-950"
        )}
      >
        {/* 1. Golden-bordered square button with balance counter */}
        <motion.button
          type="button"
          onClick={handleBalanceClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            "w-8 h-8 flex items-center justify-center rounded-xl shrink-0",
            "border border-amber-400/90",
            isDark ? "bg-zinc-900/90" : "bg-zinc-100/90",
            "hover:shadow-[0_0_20px_rgba(251,191,36,0.35)]",
            "active:shadow-[0_0_12px_rgba(251,191,36,0.45)]",
            "transition-all duration-200 ease-out"
          )}
          style={{
            // Metallic gradient feel: subtle bevel + gold reflection
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(251,191,36,0.15)",
          }}
        >
          <span
            className={clsx(
              "font-semibold tracking-tighter text-xs tabular-nums",
              "text-amber-400"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={balanceDisplay}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
              >
                {balanceDisplay}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.button>

        {/* 2. Signal / Activity icon */}
        <NavIconButton
          icon={Activity}
          label="Open Activity / Market Volatility"
          aria-label="Open activity"
        />

        {/* 3. Layers icon */}
        <NavIconButton
          icon={Layers}
          label="Open Portfolio Layers"
          aria-label="Open portfolio"
        />

        {/* 4. Wallet icon */}
        <NavIconButton
          icon={Wallet}
          label="Open Wallet / Payments"
          aria-label="Open wallet"
        />

        {/* 5. Sun/Moon theme toggle */}
        <motion.button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={clsx(
            "w-8 h-8 flex items-center justify-center rounded-lg shrink-0",
            "text-current/80 hover:text-current hover:bg-black/10 dark:hover:bg-white/10",
            "transition-colors duration-300"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Moon size={20} strokeWidth={1.75} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Sun size={20} strokeWidth={1.75} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </nav>
    </header>
  );
}

// ─── Premium Hero Section (sample finance data for dashboard integration) ─────
/**
 * Optional hero strip to display below PremiumTopNav.
 * Shows fake balance, 24h change, and a minimal chart placeholder.
 */
export function PremiumHeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden bg-bg-card/60 backdrop-blur-sm border border-border/30 p-5 mb-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
            Total Portfolio
          </p>
          <p className="text-2xl font-semibold tracking-tighter tabular-nums text-accent">
            $12,450.75
          </p>
          <p className="text-success text-xs font-medium mt-1">+2.34% today</p>
        </div>
        <div className="w-12 h-12 rounded-xl border border-amber-400/30 bg-amber-400/5 flex items-center justify-center">
          <Activity size={20} className="text-amber-400" />
        </div>
      </div>
      {/* Mini chart placeholder */}
      <div className="h-16 rounded-xl bg-black/20 dark:bg-white/5 flex items-end justify-between gap-1 px-2 py-2">
        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.1 + i * 0.03, duration: 0.3 }}
            className="w-full max-w-[20px] rounded-t bg-gradient-to-t from-amber-500/60 to-amber-400/40"
          />
        ))}
      </div>
      <p className="text-text-muted text-[10px] mt-2 tracking-wide">
        Last 10 sessions · NexusFi Premium
      </p>
    </motion.section>
  );
}
