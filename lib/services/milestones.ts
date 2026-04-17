// lib/services/milestones.ts
// All milestone business logic lives here.
// Sprint 2: completions, exchange readiness, implied predecessor detection.

import { prisma } from "@/lib/prisma";
import type { MilestoneSide, MilestoneDefinition, MilestoneCompletion } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DefinitionWithCompletion = MilestoneDefinition & {
  activeCompletion: MilestoneCompletion | null;
  // Derived state
  isComplete: boolean;
  isNotRequired: boolean;
  isAvailable: boolean; // Can this milestone be actioned right now?
};

export type MilestonesByTransaction = {
  vendor: DefinitionWithCompletion[];
  purchaser: DefinitionWithCompletion[];
  exchangeReady: boolean;
  vendorGateReady: boolean;   // All vendor blockers satisfied
  purchaserGateReady: boolean; // All purchaser blockers satisfied
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Load all milestone definitions for both sides, enriched with the active
 * completion for the given transaction (if any).
 */
export async function getMilestonesForTransaction(
  transactionId: string,
  agencyId: string
): Promise<MilestonesByTransaction> {
  // Verify transaction belongs to this agency
  const transaction = await prisma.propertyTransaction.findFirst({
    where: { id: transactionId, agencyId },
    select: { id: true },
  });
  if (!transaction) throw new Error("Transaction not found");

  // Load all definitions ordered by side + orderIndex
  const definitions = await prisma.milestoneDefinition.findMany({
    orderBy: [{ side: "asc" }, { orderIndex: "asc" }],
  });

  // Load all active completions for this transaction
  const completions = await prisma.milestoneCompletion.findMany({
    where: { transactionId, isActive: true },
  });

  const completionMap = new Map<string, MilestoneCompletion>();
  completions.forEach((c) => completionMap.set(c.milestoneDefinitionId, c));

  const vendorDefs = definitions.filter((d) => d.side === "vendor");
  const purchaserDefs = definitions.filter((d) => d.side === "purchaser");

  const enrich = (defs: MilestoneDefinition[], side: "vendor" | "purchaser"): DefinitionWithCompletion[] => {
    return defs.map((def, i) => {
      const completion = completionMap.get(def.id) ?? null;
      const isComplete = !!completion && !completion.isNotRequired;
      const isNotRequired = !!completion?.isNotRequired;
      const satisfied = isComplete || isNotRequired;

      // Exchange gate milestones are only available when all prior blockers are done
      let isAvailable = true;
      if (def.isExchangeGate) {
        const priorBlockers = defs.filter((d) => d.blocksExchange && d.orderIndex < def.orderIndex);
        isAvailable = priorBlockers.every((d) => {
          const c = completionMap.get(d.id);
          return c && (c.isActive && (!c.isNotRequired ? true : c.isNotRequired));
        });
      }

      return { ...def, activeCompletion: completion, isComplete, isNotRequired, isAvailable };
    });
  };

  const vendor = enrich(vendorDefs, "vendor");
  const purchaser = enrich(purchaserDefs, "purchaser");

  // Exchange readiness: all blocking milestones on BOTH sides complete or not-required
  // Exchange gate milestones (VM20/PM27) and post-exchange are excluded from gate
  const vendorGateReady = vendor
    .filter((d) => d.blocksExchange)
    .every((d) => d.isComplete || d.isNotRequired);

  const purchaserGateReady = purchaser
    .filter((d) => d.blocksExchange)
    .every((d) => d.isComplete || d.isNotRequired);

  const exchangeReady = vendorGateReady && purchaserGateReady;

  return { vendor, purchaser, exchangeReady, vendorGateReady, purchaserGateReady };
}

/**
 * Find all incomplete milestone definitions that are logically implied
 * by completing the given milestone (full predecessor chain).
 * Used to power the "This milestone implies others" pop-up.
 */
export async function getImpliedPredecessors(
  milestoneDefinitionId: string,
  transactionId: string
): Promise<MilestoneDefinition[]> {
  const target = await prisma.milestoneDefinition.findUnique({
    where: { id: milestoneDefinitionId },
  });
  if (!target) return [];

  // All definitions on the same side with a lower orderIndex
  const predecessors = await prisma.milestoneDefinition.findMany({
    where: {
      side: target.side,
      orderIndex: { lt: target.orderIndex },
    },
    orderBy: { orderIndex: "asc" },
  });

  if (predecessors.length === 0) return [];

  // Find which ones don't have an active completion
  const completions = await prisma.milestoneCompletion.findMany({
    where: {
      transactionId,
      isActive: true,
      milestoneDefinitionId: { in: predecessors.map((p) => p.id) },
    },
    select: { milestoneDefinitionId: true },
  });

  const completedIds = new Set(completions.map((c) => c.milestoneDefinitionId));

  // Return predecessors that are neither complete nor marked not-required
  return predecessors.filter((p) => !completedIds.has(p.id));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type CompleteMilestoneInput = {
  transactionId: string;
  milestoneDefinitionId: string;
  completedById: string;
  eventDate?: Date | null;
  completedAt?: Date;
};

/**
 * Mark a milestone as complete.
 * If an active completion already exists, deactivates it first (audit trail).
 * Returns the new active completion.
 */
export async function completeMilestone(input: CompleteMilestoneInput) {
  const def = await prisma.milestoneDefinition.findUnique({
    where: { id: input.milestoneDefinitionId },
    select: { timeSensitive: true },
  });

  if (def?.timeSensitive && !input.eventDate) {
    throw new Error("event_date is required for time-sensitive milestones");
  }

  // Deactivate any existing active completion (preserves history)
  await prisma.milestoneCompletion.updateMany({
    where: { transactionId: input.transactionId, milestoneDefinitionId: input.milestoneDefinitionId, isActive: true },
    data: { isActive: false, statusReason: "Superseded by new completion" },
  });

  return prisma.milestoneCompletion.create({
    data: {
      transactionId: input.transactionId,
      milestoneDefinitionId: input.milestoneDefinitionId,
      isActive: true,
      isNotRequired: false,
      completedAt: input.completedAt ?? new Date(),
      eventDate: input.eventDate ?? null,
      completedById: input.completedById,
    },
  });
}

/**
 * Bulk complete multiple milestones at once (used for implied predecessors).
 * Each gets today's date. Time-sensitive milestones get no eventDate (must be edited later).
 */
export async function bulkCompleteMilestones(
  milestoneDefinitionIds: string[],
  transactionId: string,
  completedById: string
) {
  const now = new Date();
  const results = [];
  for (const defId of milestoneDefinitionIds) {
    // Deactivate existing
    await prisma.milestoneCompletion.updateMany({
      where: { transactionId, milestoneDefinitionId: defId, isActive: true },
      data: { isActive: false, statusReason: "Superseded by bulk completion" },
    });
    const result = await prisma.milestoneCompletion.create({
      data: {
        transactionId,
        milestoneDefinitionId: defId,
        isActive: true,
        isNotRequired: false,
        completedAt: now,
        completedById,
        statusReason: "Bulk completed via implied predecessor",
      },
    });
    results.push(result);
  }
  return results;
}

/**
 * Reverse (deactivate) an active completion.
 */
export async function reverseMilestone(
  transactionId: string,
  milestoneDefinitionId: string,
  reason?: string
) {
  return prisma.milestoneCompletion.updateMany({
    where: { transactionId, milestoneDefinitionId, isActive: true },
    data: { isActive: false, statusReason: reason ?? "Reversed by user" },
  });
}

/**
 * Mark a milestone as not required.
 * This satisfies the exchange gate just like a completion.
 */
export async function markNotRequired(
  transactionId: string,
  milestoneDefinitionId: string,
  completedById: string,
  reason?: string
) {
  // Deactivate any existing active completion
  await prisma.milestoneCompletion.updateMany({
    where: { transactionId, milestoneDefinitionId, isActive: true },
    data: { isActive: false, statusReason: "Marked not required" },
  });

  return prisma.milestoneCompletion.create({
    data: {
      transactionId,
      milestoneDefinitionId,
      isActive: true,
      isNotRequired: true,
      completedAt: new Date(),
      completedById,
      notRequiredReason: reason ?? null,
      statusReason: "Marked not required",
    },
  });
}
