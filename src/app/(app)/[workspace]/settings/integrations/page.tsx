"use client";

import { useState } from "react";
import { Mail, CalendarDays, MessageSquare, Phone, FileSpreadsheet, Cloud, CreditCard, Link2, CheckCircle2, ExternalLink } from "lucide-react";

const INTEGRATIONS = [
  { id: "email", name: "Email Sync", description: "Sync Gmail or Outlook emails to contact activity timeline.", icon: <Mail className="w-5 h-5" />, color: "bg-sky-500/10 text-sky-400", connected: false, comingSoon: false },
  { id: "calendar", name: "Calendar", description: "Connect Google Calendar or Outlook Calendar for meeting logging.", icon: <CalendarDays className="w-5 h-5" />, color: "bg-violet-500/10 text-violet-400", connected: false, comingSoon: false },
  { id: "slack", name: "Slack", description: "Get deal updates and task notifications in your Slack workspace.", icon: <MessageSquare className="w-5 h-5" />, color: "bg-fuchsia-500/10 text-fuchsia-400", connected: false, comingSoon: true },
  { id: "stripe", name: "Stripe", description: "Sync customer payments and subscriptions to deal revenue.", icon: <CreditCard className="w-5 h-5" />, color: "bg-[#10b981]/[0.12] text-[#10b981]", connected: false, comingSoon: true },
  { id: "csv", name: "CSV Import", description: "Bulk import contacts and companies from CSV files.", icon: <FileSpreadsheet className="w-5 h-5" />, color: "bg-amber-500/10 text-amber-400", connected: false, comingSoon: false },
  { id: "twilio", name: "Twilio", description: "Send SMS and WhatsApp messages from within the CRM.", icon: <Phone className="w-5 h-5" />, color: "bg-red-500/10 text-red-400", connected: false, comingSoon: true },
  { id: "intercom", name: "Intercom", description: "Sync support conversations to contact activity timeline.", icon: <MessageSquare className="w-5 h-5" />, color: "bg-teal-500/10 text-teal-400", connected: false, comingSoon: true },
  { id: "github", name: "GitHub", description: "Link repos to deals and track engineering milestones.", icon: <Link2 className="w-5 h-5" />, color: "bg-white/[0.04] text-[#8a8f98]", connected: false, comingSoon: true },
  { id: "webhook", name: "Webhooks", description: "Send real-time events to your own endpoints.", icon: <Link2 className="w-5 h-5" />, color: "bg-orange-500/10 text-orange-400", connected: false, comingSoon: false },
  { id: "api", name: "REST API", description: "Programmatic access to all CRM data via API keys.", icon: <Cloud className="w-5 h-5" />, color: "bg-indigo-500/10 text-indigo-400", connected: true, comingSoon: false },
];

export default function IntegrationsPage() {
  const [items, setItems] = useState(INTEGRATIONS);

  function toggle(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  }

  const connected = items.filter(i => i.connected);
  const available = items.filter(i => !i.connected);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f7f8f8]">Integrations</h1>
          <p className="text-[#62666d] text-sm mt-1">Connect external apps to CRM Hub</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#62666d]">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" /> {connected.length} connected
          </span>
        </div>
      </div>

      {/* Connected */}
      {connected.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">Connected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {connected.map(i => (
              <IntegrationCard key={i.id} item={i} onToggle={() => toggle(i.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Available */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">Available</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {available.map(i => (
            <IntegrationCard key={i.id} item={i} onToggle={() => toggle(i.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ item, onToggle }: { item: typeof INTEGRATIONS[0]; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-4 flex flex-col gap-3 hover:border-white/[0.06] transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center border border-current/10`}>
          {item.icon}
        </div>
        {item.connected ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#10b981]/[0.12] text-[#10b981] border border-[#10b981]/[0.08]">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        ) : item.comingSoon ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#191a1b] text-[#8a8f98] border border-white/[0.06]">Coming soon</span>
        ) : null}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-[#d0d6e0]">{item.name}</div>
        <div className="text-xs text-[#62666d] mt-0.5 leading-relaxed">{item.description}</div>
      </div>
      <div className="pt-2">
        {item.connected ? (
          <button
            onClick={onToggle}
            className="w-full h-8 rounded-lg border border-white/[0.06] text-[#8a8f98] text-xs font-medium hover:bg-[#191a1b] transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Manage
          </button>
        ) : item.comingSoon ? (
          <button disabled className="w-full h-8 rounded-lg bg-[#191a1b] text-[#62666d] text-xs font-medium cursor-not-allowed">
            Notify me
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="w-full h-8 rounded-lg bg-[#5e6ad2] text-[#f7f8f8] text-xs font-medium hover:bg-[#5e6ad2] transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
