// lib/services/transactions.ts
// All PropertyTransaction database access lives here.
// Every query is scoped by agencyId — never expose cross-agency data.

import { prisma } from "@/lib/prisma";
import type { TransactionStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionSummary = {
  id: string;
  propertyAddress: string;
  status: TransactionStatus;
  expectedExchangeDate: Date | null;
  createdAt: Date;
  assignedUser: { id: string; name: string } | null;
};

export type TransactionDetail = TransactionSummary & {
  agency: { id: string; name: string };
  contacts: ContactSummary[];
};

export type ContactSummary = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  roleType: string;
  createdAt: Date;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** List all transactions for an agency, newest first */
export async function listTransactions(agencyId: string): Promise<TransactionSummary[]> {
  return prisma.propertyTransaction.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      propertyAddress: true,
      status: true,
      expectedExchangeDate: true,
      createdAt: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });
}

/** Count transactions per status for dashboard summary cards */
export async function countTransactionsByStatus(agencyId: string) {
  const counts = await prisma.propertyTransaction.groupBy({
    by: ["status"],
    where: { agencyId },
    _count: { id: true },
  });

  // Return a predictable object regardless of which statuses exist
  const result = { active: 0, on_hold: 0, completed: 0, withdrawn: 0 };
  for (const row of counts) {
    result[row.status] = row._count.id;
  }
  return result;
}

/** Fetch full transaction detail (agency-scoped) */
export async function getTransaction(id: string, agencyId: string): Promise<TransactionDetail | null> {
  return prisma.propertyTransaction.findFirst({
    where: { id, agencyId },
    select: {
      id: true,
      propertyAddress: true,
      status: true,
      expectedExchangeDate: true,
      createdAt: true,
      agency: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
      contacts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          roleType: true,
          createdAt: true,
        },
      },
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CreateTransactionInput = {
  propertyAddress: string;
  status: TransactionStatus;
  agencyId: string;
  assignedUserId?: string | null;
  expectedExchangeDate?: Date | null;
};

/** Create a new transaction, returning just the id for redirect */
export async function createTransaction(input: CreateTransactionInput): Promise<{ id: string }> {
  const tx = await prisma.propertyTransaction.create({
    data: {
      propertyAddress: input.propertyAddress,
      status: input.status,
      agencyId: input.agencyId,
      assignedUserId: input.assignedUserId ?? null,
      expectedExchangeDate: input.expectedExchangeDate ?? null,
    },
    select: { id: true },
  });
  return tx;
}

export type UpdateTransactionInput = Partial<Omit<CreateTransactionInput, "agencyId">>;

/** Update a transaction (agency-scoped) */
export async function updateTransaction(
  id: string,
  agencyId: string,
  input: UpdateTransactionInput
) {
  return prisma.propertyTransaction.updateMany({
    where: { id, agencyId },
    data: input,
  });
}
