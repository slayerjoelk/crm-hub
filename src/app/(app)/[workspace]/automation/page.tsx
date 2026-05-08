"use client";

import { useState } from "react";
import {
  Brain, Send, Radio, CheckSquare, Zap,
  TrendingUp, Users, MailOpen, RefreshCw,
  Play, Activity, AlertTriangle, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AutomationResult {
  type: string;
  status: "running" | "success" | "error";
  data?: any;
  error?: string;
}

export default function AutomationPage() {
  const [results, setResults] = useState<AutomationResult[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  async function runEngine(type: string, endpoint: string, body?: any) {
    setRunning(type);
    setResults(prev => [{ type, status: "running" }, ...prev]);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });
      const json = await res.json();

      setResults(prev =>
        prev.map(r => r.type === type && r.status === "running"
          ? { type, status: "success", data: json.data || json }
          : r)
      );
    } catch (e: any) {
      setResults(prev =>
        prev.map(r => r.type === type && r.status === "running"
          ? { type, status: "error", error: e.message }
          : r)
      );
    }
    setRunning(null);
  }

  async function runAll() {
    setRunning("all");
    const engines = [
      { type: "Lead Scoring", endpoint: "/api/automation/score" },
      { type: "Sequences", endpoint: "/api/automation/sequences/process" },
      { type: "Task Automation", endpoint: "/api/automation/tasks/process" },
    ];

    for (const engine of engines) {
      await runEngine(engine.type, engine.endpoint);
    }
    setRunning(null);
  }

  const engines = [
    {
      id: "scoring",
      icon: Brain,
      title: "Lead Scoring",
      description: "Score all contacts by demographic, behavioral, engagement, source, and lifecycle data",
      endpoint: "/api/automation/score",
      color: "from-purple-500 to-blue-500",
      badge: "All contacts",
    },
    {
      id: "sequences",
      icon: Send,
      title: "Sequence Processor",
      description: "Process active email sequences — advance contacts through drip campaigns",
      endpoint: "/api/automation/sequences/process",
      color: "from-emerald-500 to-teal-500",
      badge: "Active enrollments",
    },
    {
      id: "webhooks",
      icon: Radio,
      title: "Webhook Engine",
      description: "Dispatch event webhooks to connected external systems",
      endpoint: "/api/automation/webhooks/trigger",
      color: "from-orange-500 to-amber-500",
      badge: "On events",
    },
    {
      id: "tasks",
      icon: CheckSquare,
      title: "Task Automation",
      description: "Auto-create follow-ups, escalate overdue tasks, re-engage stale contacts",
      endpoint: "/api/automation/tasks/process",
      color: "from-rose-500 to-pink-500",
      badge: "Auto-pilot",
    },
  ];

  const inputCls = "w-full h-10 px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/30";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Automation</h1>
        </div>
        <p className="text-[13px] text-[#8a8f98] mt-1">
          Run automation engines to score leads, process sequences, dispatch webhooks, and manage tasks.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runAll}
          disabled={running === "all"}
          className="h-10 px-5 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-[#5e6ad2]/20 transition-all disabled:opacity-50"
        >
          {running === "all"
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Play className="w-4 h-4 fill-current" />}
          Run All Engines
        </motion.button>
      </div>

      {/* Engine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {engines.map((engine) => {
          const Icon = engine.icon;
          const result = results.find(r => r.type === engine.title);
          const isRunning = running === engine.title || (running === "all" && result?.status === "running");

          return (
            <motion.div
              key={engine.id}
              whileHover={{ y: -2 }}
              className="rounded-xl bg-[#0f1011] border border-white/[0.06] overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${engine.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.04] text-[#8a8f98]">
                    {engine.badge}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-[#f7f8f8] mb-1">{engine.title}</h3>
                <p className="text-[12px] text-[#8a8f98] leading-relaxed mb-4">
                  {engine.description}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => runEngine(engine.title, engine.endpoint)}
                  disabled={isRunning}
                  className="w-full h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#d0d6e0] text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-white/[0.06] hover:border-white/[0.10] transition-all disabled:opacity-50"
                >
                  {isRunning
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <Play className="w-3.5 h-3.5 fill-current" />}
                  {isRunning ? "Running..." : "Run Now"}
                </motion.button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/[0.06]"
                  >
                    <div className="p-4">
                      {result.status === "running" && (
                        <div className="flex items-center gap-2 text-[12px] text-[#8a8f98]">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Processing...
                        </div>
                      )}
                      {result.status === "success" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[12px] text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Complete
                          </div>
                          {result.data && (
                            <div className="text-[11px] text-[#8a8f98] font-mono bg-[#08090a] rounded-md p-2.5 overflow-x-auto">
                              {JSON.stringify(result.data, null, 1)}
                            </div>
                          )}
                        </div>
                      )}
                      {result.status === "error" && (
                        <div className="flex items-center gap-2 text-[12px] text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {result.error}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Cron Job Info */}
      <div className="rounded-xl bg-[#0f1011] border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#5e6ad2]" strokeWidth={1.5} />
          <h3 className="text-[13px] font-semibold text-[#f7f8f8]">Scheduled Automation</h3>
        </div>
        <p className="text-[12px] text-[#8a8f98] leading-relaxed mb-3">
          Configure a cron job to run all engines automatically. Use Vercel Cron or a scheduled HTTP request:
        </p>
        <div className="text-[11px] font-mono text-[#5e6ad2] bg-[#08090a] rounded-md p-3">
          POST /api/automation/cron<br/>
          Authorization: Bearer your-cron-secret
        </div>
        <p className="text-[11px] text-[#62666d] mt-3">
          The cron endpoint runs Lead Scoring → Sequences → Task Automation for all active workspaces.
        </p>
      </div>
    </div>
  );
}
