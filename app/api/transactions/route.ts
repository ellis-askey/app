// app/api/transactions/route.ts
// POST: create a new PropertyTransaction

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTransaction } from "@/lib/services/transactions";
import { prisma } from "@/lib/prisma";
import type { TransactionStatus } from "@prisma/client";

const VALID_STATUSES: TransactionStatus[] = ["active", "on_hold", "completed", "withdrawn"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const { propertyAddress, status, assignedUserId, expectedExchangeDate } = body;

  // Validate required fields
  if (!propertyAddress?.trim()) {
    return NextResponse.json({ error: "Property address is required" }, { status: 400 });
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Validate assigned user belongs to same agency
  if (assignedUserId) {
    const user = await prisma.user.findFirst({
      where: { id: assignedUserId, agencyId: session.user.agencyId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Assigned user not found" }, { status: 400 });
    }
  }

  const tx = await createTransaction({
    propertyAddress: propertyAddress.trim(),
    status,
    agencyId: session.user.agencyId,
    assignedUserId: assignedUserId || null,
    expectedExchangeDate: expectedExchangeDate ? new Date(expectedExchangeDate) : null,
  });

  return NextResponse.json(tx, { status: 201 });
}
