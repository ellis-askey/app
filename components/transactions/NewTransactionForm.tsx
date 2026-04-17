"use client";
// components/transactions/NewTransactionForm.tsx
// Create a new PropertyTransaction.
// Address is collected as structured fields and assembled before saving.
// titleCase formatting is applied to address and name fields.
// Expected exchange date defaults to today + 12 months.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRANSACTION_STATUSES, titleCase, defaultExchangeDate } from "@/lib/utils";
import type { TransactionStatus } from "@prisma/client";

type AgencyUser = { id: string; name: string; role: string };

const INPUT =
  "w-full px-3 py-2.5 rounded-lg border border-[#e4e9f0] bg-[#f7f9fc] text-sm text-gray-800 " +
  "placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

const SELECT = INPUT + " pr-8";

export function NewTransactionForm({
  agencyUsers,
  currentUserId,
}: {
  agencyUsers: AgencyUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    addressLine1:        "",
    addressLine2:        "",
    town:                "",
    county:              "",
    postcode:            "",
    status:              "active" as TransactionStatus,
    assignedUserId:      currentUserId,
    expectedExchangeDate: defaultExchangeDate(),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /** Assemble address parts into a single canonical string */
  function buildAddress(): string {
    const parts = [
      titleCase(form.addressLine1),
      form.addressLine2 ? titleCase(form.addressLine2) : null,
      titleCase(form.town),
      form.county ? titleCase(form.county) : null,
      form.postcode.trim().toUpperCase(),
    ].filter(Boolean);
    return parts.join(", ");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const propertyAddress = buildAddress();
    if (!propertyAddress) {
      setError("Please complete the address fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress,
          status: form.status,
          assignedUserId: form.assignedUserId || null,
          expectedExchangeDate: form.expectedExchangeDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create transaction");
      router.push(`/transactions/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Address ────────────────────────────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-4">Property address</legend>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Address line 1 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              required
              placeholder="14 Elmwood Avenue"
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Address line 2 <span className="text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Flat 3, Apartment name, etc."
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Town / City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="town"
                value={form.town}
                onChange={handleChange}
                required
                placeholder="Bristol"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                County <span className="text-gray-300">(optional)</span>
              </label>
              <input
                type="text"
                name="county"
                value={form.county}
                onChange={handleChange}
                placeholder="Somerset"
                className={INPUT}
              />
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Postcode <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="postcode"
              value={form.postcode}
              onChange={handleChange}
              required
              placeholder="BS6 7TH"
              className={INPUT}
            />
          </div>
        </div>
      </fieldset>

      <div className="border-t border-[#f0f4f8]" />

      {/* ── Transaction details ────────────────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-4">Transaction details</legend>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={SELECT}
              >
                {TRANSACTION_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Assigned to
              </label>
              <select
                name="assignedUserId"
                value={form.assignedUserId}
                onChange={handleChange}
                className={SELECT}
              >
                <option value="">— Unassigned —</option>
                {agencyUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Expected exchange date
            </label>
            <input
              type="date"
              name="expectedExchangeDate"
              value={form.expectedExchangeDate}
              onChange={handleChange}
              className={INPUT}
            />
            <p className="text-xs text-gray-400 mt-1.5">Defaults to 12 months from today</p>
          </div>
        </div>
      </fieldset>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-sm font-medium text-white transition-colors shadow-sm"
        >
          {loading ? "Creating…" : "Create transaction"}
        </button>
      </div>
    </form>
  );
}
