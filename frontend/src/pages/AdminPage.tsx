import React, { useState } from "react";
import { Shield, Check, X, Trash2, Edit, Loader2, Lock } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetPendingRepeaters,
  useApproveRepeater,
  useDeleteRepeater,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import type { Repeater } from "../backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ADMIN_PASSPHRASE = "WendellAdmin2024";

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const [passphrase, setPassphrase] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [passphraseError, setPassphraseError] = useState("");

  const { data: isAdmin } = useIsCallerAdmin();
  const { data: pendingRepeaters = [], isLoading } = useGetPendingRepeaters();
  const approveRepeater = useApproveRepeater();
  const deleteRepeater = useDeleteRepeater();

  const handlePassphraseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase === ADMIN_PASSPHRASE) {
      setAuthenticated(true);
      setPassphraseError("");
    } else {
      setPassphraseError("Incorrect passphrase. Please try again.");
    }
  };

  const handleApprove = async (repeater: Repeater, approve: boolean) => {
    try {
      await approveRepeater.mutateAsync({
        repeaterId: repeater.id,
        passphrase: "adminPassphrase",
        approve,
      });
      toast.success(approve ? "Repeater approved!" : "Repeater rejected");
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    }
  };

  const handleDelete = async (repeater: Repeater) => {
    if (!confirm(`Delete repeater ${repeater.callSign}?`)) return;
    try {
      await deleteRepeater.mutateAsync({
        repeaterId: repeater.id,
        passphrase: "adminPassphrase",
      });
      toast.success("Repeater deleted");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Shield className="w-16 h-16 text-amber mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground font-display mb-3">Admin Access</h1>
        <p className="text-muted-foreground">Please log in to access the admin panel.</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-amber mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-foreground font-display">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter the admin passphrase</p>
          </div>
          <form onSubmit={handlePassphraseSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Admin passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="bg-navy-light border-border text-foreground"
            />
            {passphraseError && (
              <p className="text-red-400 text-sm">{passphraseError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-amber text-navy hover:bg-amber-dark font-bold"
            >
              Access Admin Panel
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="w-7 h-7 text-amber" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage pending repeater submissions</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">
            Pending Submissions
            {pendingRepeaters.length > 0 && (
              <Badge className="ml-2 bg-amber text-navy">{pendingRepeaters.length}</Badge>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber animate-spin" />
          </div>
        ) : pendingRepeaters.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Check className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p>No pending submissions. All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pendingRepeaters.map((r) => (
              <div key={r.id.toString()} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-amber font-display">{r.callSign}</span>
                      <span className="font-mono text-sm text-foreground">
                        {r.frequency.toFixed(4)} MHz
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {r.toneMode}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {r.city}, {r.state} {r.zipCode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted by: {r.submittedBy.slice(0, 20)}...
                    </p>
                    {r.operationalNotes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {r.operationalNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(r, true)}
                      disabled={approveRepeater.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(r, false)}
                      disabled={approveRepeater.isPending}
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(r)}
                      disabled={deleteRepeater.isPending}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
