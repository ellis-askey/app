"use client";
// components/milestones/MilestoneRow.tsx
// Single milestone row in the progress panel.
// Handles complete, reverse, not-required, and the implied predecessors pop-up.

import { useState } from "react";
import type { MilestoneDefinition, MilestoneCompletion } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type Props = {
  def: MilestoneDefinition & {
    activeCompletion: MilestoneCompletion | null;
    isComplete: boolean;
    isNotRequired: boolean;
    isAvailable: boolean;
  };
  transactionId: string;
  onRefresh: () => void;
};

export function MilestoneRow({ def, transactionId, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [showEventDate, setShowEventDate] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [showNotRequired, setShowNotRequired] = useState(false);
  const [notRequiredReason, setNotRequiredReason] = useState("");

  // Implied predecessors pop-up state
  const [impliedPredecessors, setImpliedPredecessors] = useState<MilestoneDefinition[]>([]);
  const [showImpliedModal, setShowImpliedModal] = useState(false);

  const isCompleted = def.isComplete;
  const isNotRequired = def.isNotRequired;
  const isDone = isCompleted || isNotRequired;
  const isGate = def.isExchangeGate;
  const isPost = def.isPostExchange;

  async function handleConfirmClick() {
    if (def.timeSensitive) {
      setShowEventDate(true);
      return;
    }
    // Check for implied predecessors
    await checkImplied();
  }

  async function checkImplied(ed?: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/milestones/implied?milestoneDefinitionId=${def.id}&transactionId=${transactionId}`
      );
      const implied: MilestoneDefinition[] = await res.json();
      if (implied.length > 0) {
        setImpliedPredecessors(implied);
        setShowImpliedModal(true);
        setLoading(false);
      } else {
        await doComplete([], ed);
      }
    } catch {
      setLoading(false);
    }
  }

  async function doComplete(impliedIds: string[], ed?: string) {
    setLoading(true);
    try {
      await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          transactionId,
          milestoneDefinitionId: def.id,
          eventDate: ed || eventDate || null,
          impliedIds,
        }),
      });
      setShowImpliedModal(false);
      setShowEventDate(false);
      setEventDate("");
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function doReverse() {
    setLoading(true);
    try {
      await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reverse", transactionId, milestoneDefinitionId: def.id }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function doNotRequired() {
    setLoading(true);
    try {
      await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "not_required",
          transactionId,
          milestoneDefinitionId: def.id,
          reason: notRequiredReason,
        }),
      });
      setShowNotRequired(false);
      setNotRequiredReason("");
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  // Row style
  let rowBg = "bg-white";
  if (isDone) rowBg = isNotRequired ? "bg-gray-50" : "bg-green-50/40";
  if (isGate && !isDone) rowBg = def.isAvailable ? "bg-amber-50/60" : "bg-gray-50/50";
  if (isPost) rowBg = "bg-gray-50/30";

  return (
    <>
      <div className={`flex items-start gap-3 px-5 py-3.5 border-b border-[#f0f4f8] last:border-0 ${rowBg}`}>
        {/* Status icon */}
        <div className="mt-0.5 flex-shrink-0">
          {isNotRequired ? (
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">—</span>
            </div>
          ) : isDone ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : isPost ? (
            <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
          ) : (
            <div className={`w-5 h-5 rounded-full border-2 ${isGate && def.isAvailable ? "border-amber-400" : "border-gray-300"}`} />
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${isDone ? "text-gray-500" : isPost ? "text-gray-400" : "text-gray-800"} ${isGate ? "font-semibold" : ""}`}>
            {def.name}
            {isGate && <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Exchange gate</span>}
            {isNotRequired && <span className="ml-2 text-xs text-gray-400 italic">Not required</span>}
          </p>
          {isDone && def.activeCompletion && (
            <p className="text-xs text-gray-400 mt-0.5">
              {isNotRequired ? "Marked not required" : "Completed"} {formatDate(def.activeCompletion.completedAt)}
              {def.activeCompletion.eventDate && (
                <span className="ml-2">· Event: {formatDate(def.activeCompletion.eventDate)}</span>
              )}
              {def.activeCompletion.notRequiredReason && (
                <span className="ml-1">· {def.activeCompletion.notRequiredReason}</span>
              )}
            </p>
          )}
          {isGate && !def.isAvailable && (
            <p className="text-xs text-gray-400 mt-0.5">Complete all preceding milestones first</p>
          )}

          {/* Event date input for time-sensitive */}
          {showEventDate && (
            <div className="mt-2 flex items-center gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Event date <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-[#e4e9f0] rounded-lg bg-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <button
                onClick={() => checkImplied(eventDate)}
                disabled={!eventDate || loading}
                className="mt-5 px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
              >
                Confirm
              </button>
              <button onClick={() => setShowEventDate(false)} className="mt-5 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </div>
          )}

          {/* Not required form */}
          {showNotRequired && (
            <div className="mt-2 flex items-start gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={notRequiredReason}
                  onChange={(e) => setNotRequiredReason(e.target.value)}
                  placeholder="e.g. Cash buyer, freehold property"
                  className="w-full px-2 py-1.5 text-sm border border-[#e4e9f0] rounded-lg bg-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <button
                onClick={doNotRequired}
                disabled={loading}
                className="mt-5 px-3 py-1.5 text-xs font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                Confirm
              </button>
              <button onClick={() => setShowNotRequired(false)} className="mt-5 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isDone && !isPost && !showEventDate && !showNotRequired && (
            <>
              {(!isGate || def.isAvailable) && (
                <button
                  onClick={handleConfirmClick}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                >
                  {loading ? "…" : "Confirm"}
                </button>
              )}
              <button
                onClick={() => setShowNotRequired(true)}
                className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Mark as not required"
              >
                N/R
              </button>
            </>
          )}
          {isDone && !isPost && (
            <button
              onClick={doReverse}
              disabled={loading}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              Undo
            </button>
          )}
        </div>
      </div>

      {/* ── Implied predecessors modal ───────────────────────────────────── */}
      {showImpliedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl border border-[#e4e9f0] shadow-xl max-w-md w-full p-6"
               style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <h3 className="text-base font-semibold text-gray-900 mb-1">This milestone implies others</h3>
            <p className="text-sm text-gray-500 mb-4">
              You've confirmed <strong>"{def.name}"</strong>. That usually means the following milestone{impliedPredecessors.length > 1 ? "s are" : " is"} also complete:
            </p>
            <div className="rounded-lg border border-[#e4e9f0] divide-y divide-[#f0f4f8] mb-5">
              {impliedPredecessors.map((p) => (
                <div key={p.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{p.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-4">Complete these as well? This will keep your progress clean and avoid confusion later.</p>
            <div className="flex gap-3">
              <button
                onClick={() => doComplete(impliedPredecessors.map((p) => p.id), eventDate || undefined)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium text-white transition-colors"
              >
                {loading ? "Completing…" : "Yes, complete all"}
              </button>
              <button
                onClick={() => doComplete([], eventDate || undefined)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-[#e4e9f0] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                No, just this one
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">You can undo this later from the milestone timeline</p>
          </div>
        </div>
      )}
    </>
  );
}
