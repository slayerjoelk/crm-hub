"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// ─── Stagger Container ───────────────────────────────────────
export function StaggerContainer({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page Fade In ────────────────────────────────────────────
export function PageFade({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Glass Card ──────────────────────────────────────────────
export function GlassCard({ children, className = "", onClick, hover = true }: { children: ReactNode; className?: string; onClick?: () => void; hover?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={[
        "rounded-xl border border-white/[0.06] bg-surface/80 backdrop-blur-sm",
        "shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]",
        hover && "hover:border-white/[0.10] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "transition-all duration-300",
        className,
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Counter Wrapper ────────────────────────────────
export function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number | string; prefix?: string; suffix?: string }) {
  const num = typeof value === "number" ? value : parseInt(value as string) || 0;
  return (
    <motion.span
      key={num}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="inline-block tabular-nums"
    >
      {prefix}{num.toLocaleString()}{suffix}
    </motion.span>
  );
}

// ─── Slide Panel ─────────────────────────────────────────────
export function SlidePanel({ children, open, onClose, className = "" }: { children: ReactNode; open: boolean; onClose: () => void; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={["fixed right-0 top-0 h-full w-[480px] max-w-full z-50 bg-elevated border-l border-white/[0.06] shadow-2xl overflow-y-auto", className].join(" ")}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Animated Badge ──────────────────────────────────────────
export function AnimatedBadge({ children, color = "brand" }: { children: ReactNode; color?: "brand" | "success" | "warning" | "danger" | "info" | "muted" }) {
  const colors = {
    brand: "bg-brand/10 text-brand-light border border-brand/20",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    info: "bg-info/10 text-info border border-info/20",
    muted: "bg-white/[0.04] text-muted border border-white/[0.06]",
  };
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase ${colors[color]}`}
    >
      {children}
    </motion.span>
  );
}
