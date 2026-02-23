"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  ArrowDownToLine,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/deposit", label: "Deposit", icon: ArrowDownToLine },
  { href: "/credit", label: "Credit", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/90 backdrop-blur-xl border-t border-border/30 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2.5 pb-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                active
                  ? "text-accent"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.6}
              />
              <span className="text-[10px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
