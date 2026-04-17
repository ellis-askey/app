"use client";
// components/contacts/ContactsSection.tsx
// Shows existing contacts and an inline form to add new ones.
// Light theme. Applies titleCase to contact names before saving.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTACT_ROLES, CONTACT_ROLE_LABELS, titleCase } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ContactRole } from "@prisma/client";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  roleType: string;
  createdAt: Date;
};

const EMPTY_FORM = {
  name:     "",
  roleType: "vendor" as ContactRole,
  email:    "",
  phone:    "",
};

const INPUT =
  "w-full px-3 py-2 rounded-lg border border-[#e4e9f0] bg-white text-sm text-gray-800 " +
  "placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

const SELECT = INPUT + " pr-8";

/** Colour dot per contact role */
const ROLE_DOT: Record<ContactRole, string> = {
  vendor:    "bg-blue-400",
  purchaser: "bg-green-500",
  solicitor: "bg-violet-400",
  broker:    "bg-amber-400",
  other:     "bg-gray-300",
};

/** Light badge per contact role */
const ROLE_BADGE: Record<ContactRole, string> = {
  vendor:    "bg-blue-50    text-blue-600   border-blue-100",
  purchaser: "bg-green-50   text-green-700  border-green-100",
  solicitor: "bg-violet-50  text-violet-700 border-violet-100",
  broker:    "bg-amber-50   text-amber-700  border-amber-100",
  other:     "bg-gray-50    text-gray-500   border-gray-100",
};

export function ContactsSection({
  transactionId,
  contacts,
}: {
  transactionId: string;
  contacts: Contact[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyTransactionId: transactionId,
          name:     titleCase(form.name),
          email:    form.email.trim() || null,
          phone:    form.phone.trim() || null,
          roleType: form.roleType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add contact");
      setForm(EMPTY_FORM);
      setShowForm(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(contactId: string) {
    setDeleting(contactId);
    try {
      const res = await fetch(`/api/contacts?id=${contactId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section>
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Contacts</h2>
          {contacts.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
              {contacts.length}
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            + Add contact
          </button>
        )}
      </div>

      {/* ── Existing contacts ────────────────────────────────────────────── */}
      {contacts.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e4e9f0] overflow-hidden mb-4"
             style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {contacts.map((contact, i) => {
            const role = contact.roleType as ContactRole;
            return (
              <div
                key={contact.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i !== contacts.length - 1 ? "border-b border-[#f0f4f8]" : ""
                }`}
              >
                {/* Left: dot + name + role badge + contact details */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ROLE_DOT[role] ?? "bg-gray-300"}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{contact.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[role] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                        {CONTACT_ROLE_LABELS[role]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`}
                           className="text-xs text-blue-500 hover:underline">
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`}
                           className="text-xs text-gray-400 hover:text-gray-600">
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleDelete(contact.id)}
                  disabled={deleting === contact.id}
                  className="ml-4 flex-shrink-0 text-xs text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  {deleting === contact.id ? "…" : "Remove"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state (no contacts, no form) */}
      {contacts.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-[#e4e9f0]"
             style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <EmptyState
            title="No contacts yet"
            description="Add vendors, purchasers, solicitors, and other parties."
            action={
              <button
                onClick={() => setShowForm(true)}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                Add first contact
              </button>
            }
          />
        </div>
      )}

      {/* ── Add contact form ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5"
             style={{ boxShadow: "0 1px 4px rgba(59,130,246,0.08)" }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">New contact</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Full name or company"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  name="roleType"
                  value={form.roleType}
                  onChange={handleChange}
                  className={SELECT}
                >
                  {CONTACT_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="07700 900 000"
                  className={INPUT}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-sm font-medium text-white transition-colors shadow-sm"
              >
                {loading ? "Adding…" : "Add contact"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); setForm(EMPTY_FORM); }}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
