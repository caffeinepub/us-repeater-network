import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, MapPin, Radio, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Repeater } from "../backend";
import { useApproveRepeater } from "../hooks/useQueries";

interface PendingRepeatersListProps {
  repeaters: Repeater[];
  isLoading: boolean;
  passphrase?: string;
}

function PendingCard({ repeater }: { repeater: Repeater }) {
  const { mutateAsync: approveRepeater, isPending } = useApproveRepeater();
  const offsetStr =
    repeater.offset >= 0
      ? `+${repeater.offset.toFixed(1)}`
      : repeater.offset.toFixed(1);

  const handleAction = async (approve: boolean) => {
    try {
      await approveRepeater({ repeaterId: repeater.id, approve });
      toast.success(
        approve
          ? `${repeater.callSign} approved and published!`
          : `${repeater.callSign} rejected.`,
      );
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Action failed");
    }
  };

  return (
    <div className="ham-card p-4 space-y-3 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5 text-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-primary text-base tracking-wider">
                {repeater.callSign}
              </span>
              <Badge
                variant="outline"
                className="text-xs font-mono border-amber/40 text-amber bg-amber/10"
              >
                <Clock className="w-3 h-3 mr-1" />
                PENDING
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-sm">
              <span className="font-mono font-semibold text-foreground">
                {repeater.frequency.toFixed(4)} MHz
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {offsetStr} MHz
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <Zap className="w-3 h-3" />
                {repeater.ctcssTone !== "None"
                  ? `${repeater.ctcssTone} Hz`
                  : "No Tone"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          <span>
            {repeater.city}, {repeater.state} {repeater.zipCode}
          </span>
        </div>
        <div className="truncate">
          <span className="text-muted-foreground/60">Sponsor: </span>
          {repeater.sponsor || "—"}
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground/60">Submitted by: </span>
          {repeater.submittedBy}
        </div>
        {repeater.coverageDescription && (
          <div className="col-span-2">
            <span className="text-muted-foreground/60">Coverage: </span>
            {repeater.coverageDescription}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <Button
          size="sm"
          onClick={() => handleAction(true)}
          disabled={isPending}
          className="flex-1 h-8 bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 text-xs font-medium"
          variant="outline"
        >
          {isPending ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          onClick={() => handleAction(false)}
          disabled={isPending}
          className="flex-1 h-8 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 text-xs font-medium"
          variant="outline"
        >
          {isPending ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
          )}
          Reject
        </Button>
      </div>
    </div>
  );
}

export default function PendingRepeatersList({
  repeaters,
  isLoading,
}: PendingRepeatersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {["s1", "s2", "s3"].map((k) => (
          <div key={k} className="ham-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg bg-secondary" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 bg-secondary" />
                <Skeleton className="h-3 w-40 bg-secondary" />
              </div>
            </div>
            <Skeleton className="h-8 w-full bg-secondary" />
          </div>
        ))}
      </div>
    );
  }

  if (repeaters.length === 0) {
    return (
      <div className="ham-card p-8 text-center">
        <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
        <p className="font-tech font-semibold text-foreground">All clear!</p>
        <p className="text-sm text-muted-foreground mt-1">
          No pending submissions to review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {repeaters.map((r) => (
        <PendingCard key={r.id.toString()} repeater={r} />
      ))}
    </div>
  );
}
