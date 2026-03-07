"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useWallet } from "@/context/WalletContext";

export default function PublicHeader() {
  const { isConnected } = useWallet();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/20"
      style={{
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: "rgba(8,12,21,0.88)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Shield className="w-4 h-4 text-bg-primary" />
          </div>
          <span className="font-serif text-xl font-bold text-gradient">
            NexusFi
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link
            href="#features"
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            Features
          </Link>
          <Link
            href="#privacy"
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            Privacy
          </Link>
          <Link
            href="#security"
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            Security
          </Link>
          <Link
            href="/governance"
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            Governance
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 gradient-accent rounded-lg text-sm font-semibold text-bg-primary shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity"
            >
              Go to App
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-5 py-2 gradient-accent rounded-lg text-sm font-semibold text-bg-primary shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity"
              >
                Launch App
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
