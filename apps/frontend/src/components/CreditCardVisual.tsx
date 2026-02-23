"use client";

import { motion } from "framer-motion";
import { Wifi } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type Props = {
  name: string;
  lastFour: string;
  limit: number;
  used: number;
};

export default function CreditCardVisual({
  name,
  lastFour,
  limit,
  used,
}: Props) {
  const available = limit - used;
  const usagePercent = limit > 0 ? (used / limit) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -10 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      style={{ perspective: "1000px" }}
    >
      <div className="relative w-full aspect-[1.586/1] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-purple-600 to-indigo-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />

        <div className="relative z-10 flex flex-col justify-between h-full p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest">
                NexusFi
              </p>
              <p className="text-white text-xs mt-0.5 font-medium">
                Decentralized Credit
              </p>
            </div>
            <Wifi size={24} className="text-white/80 rotate-90" />
          </div>

          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5">
              Card Number
            </p>
            <p className="text-white text-lg tracking-[0.2em] font-mono">
              •••• •••• •••• {lastFour}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-widest">
                Holder
              </p>
              <p className="text-white text-sm font-medium uppercase">
                {name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-widest">
                Available
              </p>
              <p className="text-white text-sm font-semibold">
                {formatCurrency(available)}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-white/40"
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
