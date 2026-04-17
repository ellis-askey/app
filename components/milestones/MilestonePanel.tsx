"use client";
// components/milestones/MilestonePanel.tsx
// Renders vendor + purchaser milestone sections on the transaction detail page.
// Refreshes via router.refresh() after any completion action.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MilestoneRow } from "@/components/milestones/MilestoneRow";
import type { MilestoneDefinition, MilestoneCompletion } from "@prisma/client";

type EnrichedDef = MilestoneDefinition & {
  activeCompletion: MilestoneCompletion | null;
  isComplete: boolean;
  isNotRequired: boolean;
  isAvailable: boolean;
};

type Props = {
  transactionId: string;
  vendor: EnrichedDef[];
  purchaser: EnrichedDef[];
  exchangeReady: boolean;
  vendorGateReady: boolean;
  purchaserGateReady: boolean;
};

export function MilestonePanel({
  transactionId,
  vendor,
  purchaser,
  exchangeReady,
  vendorGateReady,
  purchaserGateReady,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"vendor" | "purchaser">("vendor");

  function refresh() {
    router.refresh();
  }

  const milestones = activeTab === "vendor" ? vendor : purchaser;
  const gateReady = activeTab === "vendor" ? vendorGateReady : purchaserGateReady;

  const completed = milestones.filter((m) => m.isComplete || m.isNotRequired).length;
  const blocking = milestones.filter((m) => m.blocksExchange).length;
  const blockingDone = milestones.filter((m) => m.blocksExchange && (m.isComplete || m.isNotRequired)).length;
  const progress = blocking > 0 ? Math.round((blockingDone / blocking) * 100) : 0;

  return (
    <section>
      {/* ── Exchange readiness banner ──────────────────────────────────── */}
      {exchangeReady ? (
        <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Ready to exchange</p>
            <p className="text-xs text-green-600">All blocking milestones are complete on both sides</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {blockingDone}/{blocking} blocking milestones complete
          </span>
        </div>
      )}

      {/* ── Side tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-4 bg-gray-50 rounded-xl border border-[#e4e9f0] p-1 w-fit">
        {(["vendor", "purchaser"] as const).map((side) => {
          const mils = side === "vendor" ? vendor : purchaser;
          const done = mils.filter((m) => !m.isPostExchange && !m.isExchangeGate && (m.isComplete || m.isNotRequired)).length;
          const total = mils.filter((m) => !m.isPostExchange && !m.isExchangeGate).length;
          const gateOk = side === "vendor" ? vendorGateReady : purchaserGateReady;
          return (
            <button
              key={side}
              onClick={() => setActiveTab(side)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === side
                  ? "bg-white text-gray-800 shadow-sm border border-[#e4e9f0]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="capitalize">{side}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                gateOk
                  ? "bg-green-100 text-green-700"
                  : activeTab === side
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Milestone list ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e4e9f0] overflow-hidden"
           style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        {milestones.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No milestones found</div>
        ) : (
          milestones.map((def) => (
            <MilestoneRow
              key={def.id}
              def={def}
              transactionId={transactionId}
              onRefresh={refresh}
            />
          ))
        )}
      </div>

      {/* Gate readiness note */}
      {gateReady && (
        <p className="mt-3 text-xs text-green-600 text-center">
          ✓ {activeTab === "vendor" ? "Vendor" : "Purchaser"} side ready — exchange gate milestone is now available
        </p>
      )}
    </section>
  );
}
