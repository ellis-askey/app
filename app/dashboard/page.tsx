// app/dashboard/page.tsx
// Dashboard: summary cards, status filter tabs, fixed-column transaction table.

import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listTransactions, countTransactionsByStatus } from "@/lib/services/transactions";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { formatDate, STATUS_CARD } from "@/lib/utils";
import type { TransactionStatus } from "@prisma/client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireSession();
  const { filter } = await searchParams;
  const activeFilter = (filter as TransactionStatus | "all") ?? "all";

  const [transactions, counts] = await Promise.all([
    listTransactions(session.user.agencyId),
    countTransactionsByStatus(session.user.agencyId),
  ]);

  const filtered = activeFilter === "all"
    ? transactions
    : transactions.filter((t) => t.status === activeFilter);

  return (
    <AppShell session={session} activePath="/dashboard">
      <PageHeader
        title="Dashboard"
        subtitle={`${session.user.name} · ${session.user.role.replace("_", " ")}`}
        action={
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium text-white transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Transaction
          </Link>
        }
      />

      <div className="px-8 py-7 space-y-7">

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["active", "on_hold", "completed", "withdrawn"] as TransactionStatus[]).map((status) => (
            <SummaryCard
              key={status}
              status={status}
              count={status === "on_hold" ? counts.on_hold : counts[status as keyof typeof counts]}
            />
          ))}
        </div>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1 mb-5 bg-white rounded-xl border border-[#e4e9f0] p-1 w-fit shadow-sm">
            {([
              { value: "all",       label: "All",       count: transactions.length },
              { value: "active",    label: "Active",    count: counts.active },
              { value: "on_hold",   label: "On Hold",   count: counts.on_hold },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "withdrawn", label: "Withdrawn", count: counts.withdrawn },
            ] as { value: string; label: string; count: number }[]).map(({ value, label, count }) => {
              const isActive = activeFilter === value;
              return (
                <Link
                  key={value}
                  href={value === "all" ? "/dashboard" : `/dashboard?filter=${value}`}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-normal ${
                    isActive ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ── Transaction table ─────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e4e9f0] shadow-sm">
              <EmptyState
                title={activeFilter === "all" ? "No transactions yet" : `No ${activeFilter.replace("_", " ")} transactions`}
                description={activeFilter === "all" ? "Create your first property transaction to get started." : "Try a different filter."}
                action={
                  activeFilter === "all" ? (
                    <Link
                      href="/transactions/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium text-white transition-colors"
                    >
                      Create transaction
                    </Link>
                  ) : (
                    <Link href="/dashboard" className="text-sm text-blue-500 hover:text-blue-600">
                      View all
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <TransactionTable transactions={filtered} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Summary card ───────────────────────────────────────────────────────── */

function SummaryCard({ status, count }: { status: TransactionStatus; count: number }) {
  const s = STATUS_CARD[status];
  const labels: Record<TransactionStatus, string> = {
    active: "Active", on_hold: "On Hold", completed: "Completed", withdrawn: "Withdrawn",
  };
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} px-5 py-4`}
         style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
        <span className="text-xs font-medium text-gray-500">{labels[status]}</span>
      </div>
      <p className={`text-3xl font-semibold tracking-tight ${s.number}`}>{count}</p>
    </div>
  );
}
