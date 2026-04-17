// app/transactions/[id]/page.tsx
// Single transaction detail page — light theme.
// Structured for future milestone/reminder sections.

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getTransaction } from "@/lib/services/transactions";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ContactsSection } from "@/components/contacts/ContactsSection";
import { formatDate } from "@/lib/utils";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const transaction = await getTransaction(id, session.user.agencyId);

  if (!transaction) notFound();

  return (
    <AppShell session={session}>
      <PageHeader
        title={transaction.propertyAddress}
        subtitle={transaction.agency.name}
        action={
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Dashboard
          </Link>
        }
      />

      <div className="px-8 py-7 space-y-7 max-w-4xl">

        {/* ── Transaction metadata card ──────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Transaction Details
          </h2>
          <div className="bg-white rounded-xl border border-[#e4e9f0] overflow-hidden"
               style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#f0f4f8]">
              <MetaField label="Status">
                <StatusBadge status={transaction.status} />
              </MetaField>
              <MetaField label="Assigned to">
                <span className="text-sm text-gray-700">
                  {transaction.assignedUser?.name ?? (
                    <span className="text-gray-300 italic">Unassigned</span>
                  )}
                </span>
              </MetaField>
              <MetaField label="Expected exchange">
                <span className="text-sm text-gray-700">
                  {formatDate(transaction.expectedExchangeDate)}
                </span>
              </MetaField>
              <MetaField label="Created">
                <span className="text-sm text-gray-700">
                  {formatDate(transaction.createdAt)}
                </span>
              </MetaField>
            </div>
          </div>
        </section>

        {/* ── Contacts ──────────────────────────────────────────────────── */}
        <ContactsSection
          transactionId={transaction.id}
          contacts={transaction.contacts}
        />

        {/*
          ── Future sections ─────────────────────────────────────────────
          Sprint 2: Milestone tracking (vendor / purchaser / agent sides)
          Sprint 3: Reminder logs and chase tasks
          Sprint 4: Exchange readiness indicator
        */}
      </div>
    </AppShell>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
