"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Play,
  Pause,
  Plus,
  X,
  Clock,
  Users,
  Mail,
  ChevronRight,
  Save,
  ArrowRight,
  UserPlus,
  Trash2,
} from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  sentCount: number;
  openRate: number;
  replyRate: number;
  stepCount: number;
  enrolledCount: number;
  createdAt: string;
}

interface Step {
  id: string;
  sequenceId: string;
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
  delayHours: number;
}

interface Enrollment {
  id: string;
  contactId: string;
  status: string;
  currentStep: number;
  enrolledAt: string;
}

export default function SequencesPage() {
  const params = useParams();
  const ws = params?.workspace as string;
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Create form
  const [seqName, setSeqName] = useState("");
  const [seqDesc, setSeqDesc] = useState("");
  const [seqType, setSeqType] = useState("cold_outreach");

  // Detail: steps
  const [steps, setSteps] = useState<Step[]>([]);
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepSubject, setStepSubject] = useState("");
  const [stepBody, setStepBody] = useState("");
  const [stepDelayDays, setStepDelayDays] = useState(1);
  const [stepDelayHours, setStepDelayHours] = useState(0);

  // Enrollment
  const [enrollContactId, setEnrollContactId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [seqRes, contactsRes] = await Promise.all([
        fetch("/api/sequences"),
        fetch("/api/contacts"),
      ]);
      const seqJson = await seqRes.json().catch(() => ({ success: false }));
      const contactsJson = await contactsRes.json().catch(() => ({ success: false }));
      if (seqJson.success) setSequences(seqJson.data);
      if (contactsJson.success) setContacts(contactsJson.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createSequence(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: seqName, description: seqDesc, type: seqType }),
      });
      const json = await res.json();
      if (json.success) {
        setSequences((prev) => [json.data, ...prev]);
        setModalOpen(false);
        setSeqName("");
        setSeqDesc("");
        setSeqType("cold_outreach");
      } else alert(json.error || "Failed");
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/sequences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (json.success) {
        setSequences((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: next } as Sequence : s))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function openDetail(id: string) {
    setDetailId(id);
    try {
      const res = await fetch(`/api/sequences/${id}`);
      const json = await res.json();
      if (json.success) {
        setSteps(json.data.steps || []);
        setEnrollments(json.data.enrollments || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    if (!detailId || !stepSubject.trim()) return;
    try {
      const res = await fetch(`/api/sequences/${detailId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: stepSubject,
          body: stepBody,
          delayDays: stepDelayDays,
          delayHours: stepDelayHours,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSteps((prev) => [...prev, json.data]);
        setShowAddStep(false);
        setStepSubject("");
        setStepBody("");
        setStepDelayDays(1);
        setStepDelayHours(0);
        setSequences((prev) =>
          prev.map((s) =>
            s.id === detailId ? { ...s, stepCount: s.stepCount + 1 } : s
          )
        );
      } else alert(json.error || "Failed");
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function enrollContact(e: React.FormEvent) {
    e.preventDefault();
    if (!detailId || !enrollContactId) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/sequences/${detailId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [enrollContactId] }),
      });
      const json = await res.json();
      if (json.success) {
        setEnrollContactId("");
        // Refresh enrollments
        const detailRes = await fetch(`/api/sequences/${detailId}`);
        const d = await detailRes.json();
        if (d.success) {
          setEnrollments(d.data.enrollments || []);
          setSequences((prev) =>
            prev.map((s) =>
              s.id === detailId
                ? { ...s, enrolledCount: d.data.enrollments?.length || s.enrolledCount }
                : s
            )
          );
        }
      } else alert(json.error || "Failed");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEnrolling(false);
    }
  }

  async function removeEnrollment(enrollmentId: string) {
    if (!detailId) return;
    setUnenrolling(true);
    try {
      const res = await fetch(`/api/sequences/${detailId}/enroll`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });
      const json = await res.json();
      if (json.success) {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
        setSequences((prev) =>
          prev.map((s) =>
            s.id === detailId
              ? { ...s, enrolledCount: Math.max(0, s.enrolledCount - 1) }
              : s
          )
        );
      } else alert(json.error || "Failed");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUnenrolling(false);
    }
  }

  const detailSeq = sequences.find((s) => s.id === detailId);

  // Contacts not yet enrolled in this sequence
  const availableContacts = contacts.filter(
    (c) => !enrollments.some((e) => e.contactId === c.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" /> Sequences
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Email drip campaigns with step builder.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Sequence
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sequences.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No sequences yet. Create your first drip campaign.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sequences.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition-colors cursor-pointer"
              onClick={() => openDetail(s.id)}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{s.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      s.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : s.status === "paused"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-slate-700/50 text-slate-400 border-slate-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {s.stepCount} step{s.stepCount === 1 ? "" : "s"} · {s.enrolledCount}{" "}
                  enrolled · {s.sentCount} sent
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(s.id, s.status);
                  }}
                  className={`p-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                    s.status === "active"
                      ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  {s.status === "active" ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  {s.status === "active" ? "Pause" : "Run"}
                </button>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">New Sequence</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createSequence} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Name</label>
                <input
                  value={seqName}
                  onChange={(e) => setSeqName(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="e.g. Cold Outreach Q3"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Description</label>
                <input
                  value={seqDesc}
                  onChange={(e) => setSeqDesc(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Optional..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Type</label>
                <select
                  value={seqType}
                  onChange={(e) => setSeqType(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="cold_outreach">Cold Outreach</option>
                  <option value="nurture">Nurture</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailId && detailSeq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDetailId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <div>
                <h2 className="text-sm font-semibold text-white">{detailSeq.name}</h2>
                <p className="text-xs text-slate-500">
                  {detailSeq.description || detailSeq.type} · {detailSeq.stepCount} steps ·{" "}
                  {detailSeq.enrolledCount} enrolled
                </p>
              </div>
              <button
                onClick={() => setDetailId(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Enrollment section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Enrolled Contacts
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {enrollments.length}
                  </span>
                </div>

                {enrollments.length > 0 && (
                  <div className="space-y-1.5">
                    {enrollments.map((en) => {
                      const contact = contacts.find((c) => c.id === en.contactId);
                      return (
                        <div
                          key={en.id}
                          className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-semibold">
                              {(contact?.firstName?.[0] || "") +
                                (contact?.lastName?.[0] || "")}
                            </div>
                            <div>
                              <div className="text-xs text-slate-200">
                                {contact
                                  ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                  : "Unknown contact"}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {en.status} · step {en.currentStep} · enrolled{" "}
                                {new Date(en.enrolledAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeEnrollment(en.id)}
                            disabled={unenrolling}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {availableContacts.length > 0 && (
                  <form
                    onSubmit={enrollContact}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                  >
                    <UserPlus className="w-4 h-4 text-slate-500 shrink-0" />
                    <select
                      value={enrollContactId}
                      onChange={(e) => setEnrollContactId(e.target.value)}
                      required
                      className="flex-1 h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="">Select contact to enroll</option>
                      {availableContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {`${c.firstName || ""} ${c.lastName || ""}`.trim()} ({c.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={enrolling}
                      className="h-7 px-3 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {enrolling ? "..." : "Enroll"}
                    </button>
                  </form>
                )}
              </div>

              {/* Steps list */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Steps
                  </h3>
                </div>
                {steps.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No steps yet. Add the first email below.
                  </p>
                )}
                {steps.map((st, i) => (
                  <div key={st.id} className="relative pl-6 border-l border-slate-700">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-200">{st.subject}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />+{st.delayDays}d{" "}
                          {st.delayHours > 0 ? `${st.delayHours}h` : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{st.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add step form */}
              {showAddStep ? (
                <form
                  onSubmit={addStep}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <ArrowRight className="w-3.5 h-3.5" /> Add Step {steps.length + 1}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-slate-500">Subject</label>
                    <input
                      value={stepSubject}
                      onChange={(e) => setStepSubject(e.target.value)}
                      required
                      className="w-full h-9 px-3 rounded bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-slate-500">Body</label>
                    <textarea
                      value={stepBody}
                      onChange={(e) => setStepBody(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs text-slate-500">Delay (days)</label>
                      <input
                        type="number"
                        min={0}
                        value={stepDelayDays}
                        onChange={(e) => setStepDelayDays(Number(e.target.value))}
                        className="w-24 h-9 px-3 rounded bg-slate-900 border border-slate-800 text-sm text-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs text-slate-500">Delay (hours)</label>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={stepDelayHours}
                        onChange={(e) => setStepDelayHours(Number(e.target.value))}
                        className="w-24 h-9 px-3 rounded bg-slate-900 border border-slate-800 text-sm text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddStep(false)}
                      className="h-8 px-3 rounded border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-8 px-3 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Step
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddStep(true)}
                  className="flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
