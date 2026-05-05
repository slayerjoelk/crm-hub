"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Send,
  Plus,
  X,
  FileText,
  Check,
  Inbox,
  Clock,
  User,
} from "lucide-react";

const TEMPLATES = [
  {
    id: "t1",
    name: "Follow-up",
    subject: "Quick follow-up on {{topic}}",
    body: "Hi {{firstName}},\n\nJust checking in on {{topic}}. Let me know if you have any questions!\n\nBest,\n{{sender}}",
  },
  {
    id: "t2",
    name: "Meeting request",
    subject: "Meeting: {{topic}}",
    body: "Hi {{firstName}},\n\nWould you be available for a quick meeting about {{topic}}?\n\nBest,\n{{sender}}",
  },
  {
    id: "t3",
    name: "Proposal sent",
    subject: "Proposal for {{company}}",
    body: "Hi {{firstName}},\n\nYour proposal for {{company}} is ready.\n\nBest,\n{{sender}}",
  },
];

function applyTemplate(
  template: any,
  contact: any
): { subject: string; body: string } {
  if (!template) return { subject: "", body: "" };
  let s = template.subject,
    b = template.body;
  const vars: Record<string, string> = {
    firstName: contact?.firstName || "{{firstName}}",
    lastName: contact?.lastName || "{{lastName}}",
    company: contact?.company || "{{company}}",
    topic: "our discussion",
    sender: "Team",
  };
  Object.entries(vars).forEach(([k, v]) => {
    s = s.replace(new RegExp(`{{${k}}}`, "g"), v);
    b = b.replace(new RegExp(`{{${k}}}`, "g"), v);
  });
  return { subject: s, body: b };
}

export default function EmailsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [tab, setTab] = useState<"inbox" | "templates">("inbox");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((r) => setContacts(r.data ?? []));
    loadEmails();
  }, []);

  async function loadEmails() {
    setLoading(true);
    try {
      const r = await fetch("/api/emails");
      const j = await r.json();
      if (j.success) setEmails(j.data ?? []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    const contact = contacts.find((c) => c.id === selectedContact);
    const { subject: s, body: b } = applyTemplate(selectedTemplate, contact);
    setSubject(s);
    setBody(b);
  }, [selectedContact, selectedTemplate]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const contact = contacts.find((c) => c.id === selectedContact);
    if (!contact?.email) {
      setSending(false);
      return;
    }
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: contact.email,
          toName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
          contactId: contact.id,
          subject,
          textBody: body,
          sendNow: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to send");
        setSending(false);
        return;
      }
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setShowCompose(false);
        setSubject("");
        setBody("");
        setSelectedTemplate(null);
        setSelectedContact("");
        loadEmails();
      }, 1500);
    } catch (e: any) {
      alert(e.message);
      setSending(false);
    }
  }

  const inputCls =
    "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emails</h1>
          <p className="text-slate-500 text-sm mt-1">Communication center</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
        >
          <Plus className="w-4 h-4" /> Compose
        </button>
      </div>

      <div className="flex rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
        {(["inbox", "templates"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-4 py-1.5 text-xs font-medium capitalize transition-colors flex items-center gap-1.5 ${
              tab === v
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {v === "inbox" ? <Inbox className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            {v}
          </button>
        ))}
      </div>

      {tab === "templates" && (
        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTemplate(t);
                setShowCompose(true);
              }}
              className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">{t.name}</span>
              </div>
              <div className="text-xs text-slate-500 truncate">{t.subject}</div>
            </button>
          ))}
        </div>
      )}

      {tab === "inbox" && (
        <div className="space-y-2">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && emails.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <Mail className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No emails yet. Use Compose to send.</p>
            </div>
          )}

          {emails.map((em) => (
            <div
              key={em.id}
              className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {em.subject}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-slate-800 text-slate-400 border-slate-700 uppercase">
                    {em.direction}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>To: {em.toName || em.toEmail}</span>
                  {em.sentAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(em.sentAt).toLocaleString()}
                    </span>
                  )}
                  {!em.sentAt && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" /> Queued
                    </span>
                  )}
                </div>
                {em.textBody && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{em.textBody}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCompose(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-white">Compose</h2>
              </div>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={send} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  To
                </label>
                <select
                  value={selectedContact}
                  onChange={(e) => setSelectedContact(e.target.value)}
                  className={`${inputCls} appearance-none`}
                  required
                >
                  <option value="" className="bg-slate-900">-- Select contact --</option>
                  {contacts.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.firstName} {c.lastName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Template
                </label>
                <select
                  value={selectedTemplate?.id || ""}
                  onChange={(e) =>
                    setSelectedTemplate(
                      TEMPLATES.find((t) => t.id === e.target.value) || null
                    )
                  }
                  className={`${inputCls} appearance-none`}
                >
                  <option value="" className="bg-slate-900">
                    -- Select template (optional) --
                  </option>
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={`${inputCls} h-48 py-2 resize-none`}
                  placeholder="Type your message here..."
                  rows={10}
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] text-slate-500">
                  {`Supports variables: {{firstName}}, {{lastName}}, {{company}}`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !selectedContact || !subject}
                    className="h-9 px-5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : sent ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {sent ? "Sent!" : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
