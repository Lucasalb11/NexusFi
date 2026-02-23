"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";

type ToastData = {
  message: string;
  type: "success" | "error" | "info";
} | null;

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLOR_MAP = {
  success: "bg-success/10 border-success/30 text-success",
  error: "bg-danger/10 border-danger/30 text-danger",
  info: "bg-accent/10 border-accent/30 text-accent",
};

export default function Toast({ toast }: { toast: ToastData }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-[100] flex justify-center"
        >
          <div
            className={clsx(
              "flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-xl max-w-sm",
              COLOR_MAP[toast.type],
            )}
          >
            {(() => {
              const Icon = ICON_MAP[toast.type];
              return <Icon size={16} />;
            })()}
            <span className="text-sm font-medium text-text-primary">
              {toast.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
