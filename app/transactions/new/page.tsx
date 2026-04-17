// app/transactions/new/page.tsx

import { requireSession } from "@/lib/session";
import { listAgencyUsers } from "@/lib/services/users";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewTransactionForm } from "@/components/transactions/NewTransactionForm";
import Link from "next/link";

export default async function NewTransactionPage() {
  const session = await requireSession();
  const agencyUsers = await listAgencyUsers(session.user.agencyId);

  return (
    <AppShell session={session} activePath="/transactions/new">
      <PageHeader
        title="New Transaction"
        subtitle="Create a new property transaction"
        action={
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </Link>
        }
      />
      <div className="px-8 py-7 max-w-2xl">
        <div className="bg-white rounded-xl border border-[#e4e9f0] p-6"
             style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <NewTransactionForm
            agencyUsers={agencyUsers}
            currentUserId={session.user.id}
          />
        </div>
      </div>
    </AppShell>
  );
}
