// app/api/milestones/route.ts
// POST: complete a milestone
// DELETE: reverse a milestone

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  completeMilestone,
  reverseMilestone,
  markNotRequired,
  bulkCompleteMilestones,
} from "@/lib/services/milestones";

// POST /api/milestones
// Body: { action, transactionId, milestoneDefinitionId, eventDate?, reason?, impliedIds? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { action, transactionId, milestoneDefinitionId, eventDate, reason, impliedIds } = body;

  if (!transactionId || !milestoneDefinitionId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify transaction belongs to this agency
  const tx = await prisma.propertyTransaction.findFirst({
    where: { id: transactionId, agencyId: session.user.agencyId },
    select: { id: true },
  });
  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  try {
    if (action === "complete") {
      // 1. If implied predecessors supplied, bulk complete them first
      if (impliedIds && Array.isArray(impliedIds) && impliedIds.length > 0) {
        await bulkCompleteMilestones(impliedIds, transactionId, session.user.id);
      }
      // 2. Complete the target milestone
      const result = await completeMilestone({
        transactionId,
        milestoneDefinitionId,
        completedById: session.user.id,
        eventDate: eventDate ? new Date(eventDate) : null,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "reverse") {
      await reverseMilestone(transactionId, milestoneDefinitionId, reason);
      return NextResponse.json({ success: true });
    }

    if (action === "not_required") {
      const result = await markNotRequired(transactionId, milestoneDefinitionId, session.user.id, reason);
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Operation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
