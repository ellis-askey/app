// components/transactions/TransactionTable.tsx
// Fixed-column transaction list.
// Columns: Property | Assigned To | Expected Exchange | Status
// Uses table-fixed layout so columns never shift regardless of content length.

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { TransactionStatus } from "@prisma/client";

type TransactionRow = {
  id: string;
  propertyAddress: string;
  status: TransactionStatus;
  expectedExchangeDate: Date | null;
  createdAt: Date;
  assignedUser: { id: string; name: string } | null;
};

/**
 * Split a full address string into a display line and a muted location line.
 * e.g. "14 Elmwood Avenue, Bristol, BS6 7TH"
 *   → line: "14 Elmwood Avenue"
 *   → location: "Bristol, BS6 7TH"
 */
function splitAddress(address: string): { line: string; location: string } {
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length <= 1) return { line: address, location: "" };
  const line = parts.slice(0, -2).join(", ") || parts[0];
  const location = parts.slice(-2).join(", ");
  return { line, location };
}

export function TransactionTable({ transactions }: { transactions: TransactionRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#e4e9f0] overflow-hidden"
         style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

      {/* ── Table header ──────────────────────────────────────────────── */}
      <div className="grid gap-0 border-b border-[#f0f4f8] bg-gray-50/60"
           style={{ gridTemplateColumns: "minmax(0,1fr) 160px 170px 130px" }}>
        {["Property", "Assigned To", "Expected Exchange", "Status"].map((col) => (
          <div key={col} className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {col}
          </div>
        ))}
      </div>

      {/* ── Rows ──────────────────────────────────────────────────────── */}
      {transactions.map((tx, i) => {
        const { line, location } = splitAddress(tx.propertyAddress);
        return (
          <Link
            key={tx.id}
            href={`/transactions/${tx.id}`}
            className={`grid items-center gap-0 px-0 hover:bg-[#f7f9fc] transition-colors ${
              i !== transactions.length - 1 ? "border-b border-[#f0f4f8]" : ""
            }`}
            style={{ gridTemplateColumns: "minmax(0,1fr) 160px 170px 130px" }}
          >
            {/* Property */}
            <div className="px-5 py-4 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate leading-snug">{line}</p>
              {location && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{location}</p>
              )}
            </div>

            {/* Assigned to */}
            <div className="px-5 py-4">
              {tx.assignedUser ? (
                <span className="text-sm text-gray-600">{tx.assignedUser.name}</span>
              ) : (
                <span className="text-sm text-gray-300 italic">Unassigned</span>
              )}
            </div>

            {/* Expected exchange */}
            <div className="px-5 py-4">
              <span className="text-sm text-gray-600">{formatDate(tx.expectedExchangeDate)}</span>
            </div>

            {/* Status */}
            <div className="px-5 py-4">
              <StatusBadge status={tx.status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
