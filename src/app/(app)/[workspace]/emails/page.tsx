"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, Send, Plus, Search, X, Clock, User, ChevronRight } from "lucide-react";

interface EmailItem {
  id: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  textBody: string | null;
  sentAt: string | null;
  createdAt: string;
  contactId: string | null;
}

interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export default function EmailsPage() {
  const params = useParams();
  const ws = params?.workspace as string;
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [showContactPicker, setShowContactPicker] = useState(false);

  // Compose form
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [contactId, setContactId] = useState("");
  const [sendNow, setSendNow] = useState(true);

  async function loadEmails() {
    try {
      const res = await fetch("/api/emails");
      const json = await res.json();
      if (json.success) setEmails(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadContacts() {
    try {
      const res = await fetch("/api/contacts");
      const json = await res.json();
      setContacts(json.data || []);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadEmails(); loadContacts(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, toName, subject, textBody: body, contactId, sendNow }),
      });
      const json = await res.json();
      if (json.success) {
        setEmails((prev) => [json.data, ...prev]);
        setComposeOpen(false);
        resetForm();
      } else {
        alert(json.error || "Failed to send");
      }
    } catch (e: any) {
      alert(e.message || "Failed to send");
    } finally { setSending(false); }
  }

  function resetForm() {
    setToEmail(""); setToName(""); setSubject(""); setBody(""); setContactId(""); setSendNow(true); setSearchContact("");
  }

  function pickContact(c: ContactItem) {
    setToEmail(c.email || "");
    setToName(`${c.firstName} ${c.lastName}`.trim());
    setContactId(c.id);
    setShowContactPicker(false);
    setSearchContact("");
  }

  const filteredContacts = searchContact.trim()
    ? contacts.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchContact.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchContact.toLowerCase())
      )
    : contacts.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" /> Emails
          </h1>
          <p className="text-sm text-slate-400 mt-1">Compose and track outbound emails.</p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> Compose
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No emails yet. Compose your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((em) => (
            <div key={em.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{em.subject}</span>
                  {em.sentAt ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">Sent</span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20">Draft</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">
                  To: {em.toName || em.toEmail} · {em.textBody ? em.textBody.slice(0, 60).replace(/\n/g, " ") + "..." : "No content"}
                </div>
              </div>
              <div className="text-xs text-slate-500 shrink-0">
                {em.sentAt ? new Date(em.sentAt).toLocaleDateString() : new Date(em.createdAt).toLocaleDateString()}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setComposeOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Send className="w-4 h-4" /></div>
                <div><h2 className="text-sm font-semibold text-white">Compose Email</h2><p className="text-xs text-slate-500">Send via Resend</p></div>
              </div>
              <button onClick={() => setComposeOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSend} className="p-5 space-y-4">
              {/* To */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">To</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recipient@company.com"
                    className="flex-1 h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowContactPicker(!showContactPicker)}
                    className="h-9 px-3 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" /> Pick Contact
                  </button>
                </div>
                {showContactPicker && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 mt-1 space-y-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        value={searchContact}
                        onChange={(e) => setSearchContact(e.target.value)}
                        placeholder="Search contacts..."
                        className="w-full h-8 pl-8 pr-3 rounded bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                      {filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickContact(c)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-900 text-sm text-slate-300 flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">{(c.firstName[0]||"?").toUpperCase()}</div>
                          <span>{c.firstName} {c.lastName}</span>
                          {c.email && <span className="text-slate-500 ml-auto text-xs">{c.email}</span>}
                        </button>
                      ))}
                      {filteredContacts.length === 0 && <p className="text-xs text-slate-600 px-2 py-1">No contacts found.</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  required
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email..."
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              {/* Send now toggle */}
              <div className="flex items-center gap-2">
                <input
                  id="sendNow"
                  type="checkbox"
                  checked={sendNow}
                  onChange={(e) => setSendNow(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="sendNow" className="text-sm text-slate-300">Send immediately</label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setComposeOpen(false)} className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800">Cancel</button>
                <button
                  type="submit"
                  disabled={sending || !toEmail.trim() || !subject.trim()}
                  className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {sending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <Send className="w-3.5 h-3.5" />
                  {sendNow ? "Send" : "Save Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
