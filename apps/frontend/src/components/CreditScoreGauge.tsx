"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

type Props = {
  score: number;
  maxScore?: number;
  label?: string;
};

function getScoreColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.8) return { stroke: "#34D399", label: "Excellent", textClass: "text-success" };
  if (pct >= 0.6) return { stroke: "#A78BFA", label: "Good", textClass: "text-accent-light" };
  if (pct >= 0.4) return { stroke: "#FBBF24", label: "Fair", textClass: "text-warning" };
  return { stroke: "#F87171", label: "Poor", textClass: "text-danger" };
}

export default function CreditScoreGauge({
  score,
  maxScore = 1000,
  label,
}: Props) {
  const config = getScoreColor(score, maxScore);
  const pct = Math.min(score / maxScore, 1);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct * 0.75);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-52 h-44">
        <svg
          viewBox="0 0 200 160"
          className="w-full h-full"
          style={{ transform: "rotate(-225deg)" }}
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgb(var(--color-border))"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference * 0.75 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <motion.p
            className="text-4xl font-bold tabular-nums"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {score}
          </motion.p>
          <p className={clsx("text-sm font-medium", config.textClass)}>
            {label ?? config.label}
          </p>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-1">
        AI-powered score (0–{maxScore})
      </p>
    </div>
  );
}
