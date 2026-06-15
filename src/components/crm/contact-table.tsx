"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2, User, Building2, Mail, Phone, MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  lifecycleStage: string;
  leadStatus: string;
  avatarUrl: string | null;
}

interface ContactTableProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
}

const LIFECYCLE_COLORS: Record<string, string> = {
  subscriber: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20",
  lead: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  qualified: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
  opportunity: "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20",
  customer: "bg-[#5e6ad2]/10 text-[#5e6ad2] border-[#5e6ad2]/20",
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "bg-[#3b82f6]/10 text-[#3b82f6]",
  open: "bg-[#10b981]/10 text-[#10b981]",
  in_progress: "bg-[#f59e0b]/10 text-[#f59e0b]",
  connected: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
  unqualified: "bg-[#62666d]/10 text-[#62666d]",
};

export function ContactTable({ contacts, onEdit, onDelete }: ContactTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-[#0f1011] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/[0.06] bg-[#0f1011]">
        <div className="col-span-1">
          <input
            type="checkbox"
            checked={selected.length === contacts.length}
            onChange={(e) => setSelected(e.target.checked ? contacts.map(c => c.id) : [])}
            className="w-4 h-4 rounded border-white/[0.06] bg-[#191a1b] text-[#5e6ad2] focus:ring-[#5e6ad2]/20"
          />
        </div>
        <div className="col-span-3 text-[#8a8f98] text-xs font-medium uppercase tracking-wide">Contact</div>
        <div className="col-span-2 text-[#8a8f98] text-xs font-medium uppercase tracking-wide">Status</div>
        <div className="col-span-2 text-[#8a8f98] text-xs font-medium uppercase tracking-wide">Company</div>
        <div className="col-span-2 text-[#8a8f98] text-xs font-medium uppercase tracking-wide">Contact Info</div>
        <div className="col-span-2 text-[#8a8f98] text-xs font-medium uppercase tracking-wide text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-white/[0.06]">
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "grid grid-cols-12 gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors",
              selected.includes(contact.id) && "bg-[#5e6ad2]/5"
            )}
          >
            {/* Select */}
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selected.includes(contact.id)}
                onChange={() => toggleSelect(contact.id)}
                className="w-4 h-4 rounded border-white/[0.06] bg-[#191a1b] text-[#5e6ad2] focus:ring-[#5e6ad2]/20"
              />
            </div>

            {/* Contact Name */}
            <div className="col-span-3 flex items-center gap-3">
              {contact.avatarUrl ? (
                <img src={contact.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {(contact.firstName?.[0] || contact.lastName?.[0] || "?").toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-[#f7f8f8] font-medium text-sm">
                  {contact.firstName || contact.lastName ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() : "—"}
                </p>
                <p className="text-[#8a8f98] text-xs">{contact.jobTitle || "—"}</p>
              </div>
            </div>

            {/* Lifecycle & Lead Status */}
            <div className="col-span-2 flex items-center gap-2">
              <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium border", LIFECYCLE_COLORS[contact.lifecycleStage] || LIFECYCLE_COLORS.subscriber)}>
                {contact.lifecycleStage}
              </span>
              <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", LEAD_STATUS_COLORS[contact.leadStatus] || LEAD_STATUS_COLORS.new)}>
                {contact.leadStatus.replace("_", " ")}
              </span>
            </div>

            {/* Company */}
            <div className="col-span-2 flex items-center">
              <Building2 className="w-4 h-4 text-[#62666d] mr-2" />
              <span className="text-[#d0d6e0] text-sm">{contact.company || "—"}</span>
            </div>

            {/* Contact Info */}
            <div className="col-span-2 flex items-center gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-[#8a8f98] hover:text-[#5e6ad2] transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-xs truncate max-w-[120px]">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-[#8a8f98] hover:text-[#5e6ad2] transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-xs">{contact.phone}</span>
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={() => onEdit?.(contact)}
                className="p-1.5 text-[#62666d] hover:text-[#5e6ad2] hover:bg-[#5e6ad2]/10 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(contact.id)}
                className="p-1.5 text-[#62666d] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMenuOpen(menuOpen === contact.id ? null : contact.id)}
                className="p-1.5 text-[#62666d] hover:text-[#d0d6e0] hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {contacts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.02] flex items-center justify-center">
            <User className="w-8 h-8 text-[#62666d]" />
          </div>
          <h3 className="text-[#d0d6e0] font-medium mb-1">No contacts yet</h3>
          <p className="text-[#8a8f98] text-sm mb-4">Add your first contact to get started</p>
        </div>
      )}
    </div>
  );
}
