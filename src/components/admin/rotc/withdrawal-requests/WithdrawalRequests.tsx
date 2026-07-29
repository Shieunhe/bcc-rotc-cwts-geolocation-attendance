"use client";

import { useState, useEffect, useCallback } from "react";
import AdminPageLayout from "@/components/layout/AdminPageLayout";
import PageIntroPanel from "@/components/common/PageIntroPanel";
import { adminService } from "@/services/admin.service";

type WithdrawalRequest = {
  id: number;
  studentId: string;
  studentUid: string;
  firstName: string;
  lastName: string;
  course: string;
  sex: string;
  reason: string;
  status: string;
  adminRemarks: string | null;
  createdAt: string;
};

const STATUS_BADGE: Record<string, { className: string; dot: string; label: string }> = {
  pending: { className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500", label: "Pending" },
  approved: { className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500", label: "Approved" },
  rejected: { className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Rejected" },
};

export default function WithdrawalRequests() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<WithdrawalRequest | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchRequests = useCallback(async () => {
    try {
      const data = await adminService.getWithdrawalRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch withdrawal requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (req: WithdrawalRequest) => {
    if (!confirm(`Approve withdrawal for ${req.firstName} ${req.lastName}? They will be reverted to a regular cadet and auto-assigned to ${req.sex === "Male" ? "Battalion 1" : "Battalion 2"}.`)) return;
    setProcessing(req.id);
    try {
      await adminService.approveWithdrawal(req.id);
      await fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal || !rejectRemarks.trim()) return;
    setProcessing(showRejectModal.id);
    try {
      await adminService.rejectWithdrawal(showRejectModal.id, rejectRemarks.trim());
      setShowRejectModal(null);
      setRejectRemarks("");
      await fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <AdminPageLayout program="ROTC">
      <PageIntroPanel
        title="Withdrawal Requests"
        subtitle="Manage advance course withdrawal requests from ROTC students."
        variant="sky"
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-yellow-400 text-yellow-900 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-400">Loading requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">No {filter !== "all" ? filter : ""} withdrawal requests</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === "pending" ? "All requests have been processed." : "No requests found for this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const badge = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending;
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white">
                          {req.firstName[0]}{req.lastName[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-800">
                          {req.lastName}, {req.firstName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{req.studentId} &middot; {req.course}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Submitted {new Date(req.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold shrink-0 ${badge.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Reason for Withdrawal</p>
                    <p className="text-sm text-gray-700">{req.reason}</p>
                  </div>

                  {/* Admin remarks (for rejected) */}
                  {req.status === "rejected" && req.adminRemarks && (
                    <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-[11px] text-red-400 uppercase tracking-wide font-medium mb-1">Admin Remarks</p>
                      <p className="text-sm text-red-700">{req.adminRemarks}</p>
                    </div>
                  )}

                  {/* Approved info */}
                  {req.status === "approved" && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-xs text-green-700">
                        Student has been reverted to a regular cadet and auto-assigned to {req.sex === "Male" ? "Battalion 1" : "Battalion 2"}.
                      </p>
                    </div>
                  )}

                  {/* Actions for pending */}
                  {req.status === "pending" && (
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={processing === req.id}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processing === req.id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => { setShowRejectModal(req); setRejectRemarks(""); }}
                        disabled={processing === req.id}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Reject Withdrawal Request</h3>
              <p className="text-xs text-gray-500 mt-1">
                Rejecting request from {showRejectModal.firstName} {showRejectModal.lastName}. Please provide a reason.
              </p>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                rows={3}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(null)}
                disabled={processing !== null}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing !== null || !rejectRemarks.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {processing !== null ? "Processing..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
