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
      initial={{ opacity: 0, rotateY: -8 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      style={{ perspective: "1000px" }}
    >
      <div className="relative w-full aspect-[1.586/1] max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2744] via-[#0f1a30] to-[#0a1020]" />
        <div className="absolute inset-0 border border-accent/20 rounded-2xl" />

        <div className="relative z-10 flex flex-col justify-between h-full p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-accent text-[10px] uppercase tracking-[0.25em] font-semibold">
                NexusFi
              </p>
              <p className="text-white/50 text-[10px] mt-0.5 tracking-wider">
                Decentralized Credit
              </p>
            </div>
            <Wifi size={20} className="text-accent/60 rotate-90" />
          </div>

          <div>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] mb-0.5">
              Card Number
            </p>
            <p className="text-white/80 text-base tracking-[0.25em] font-mono font-light">
              •••• •••• •••• {lastFour}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-[0.2em]">
                Holder
              </p>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                {name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-[9px] uppercase tracking-[0.2em]">
                Available
              </p>
              <p className="text-accent text-sm font-semibold">
                {formatCurrency(available)}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <motion.div
            className="h-full bg-accent/60"
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
