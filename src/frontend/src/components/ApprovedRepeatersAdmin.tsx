import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Radio, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Repeater } from "../backend";
import { Status } from "../backend";
import { useDeleteRepeater } from "../hooks/useQueries";

interface ApprovedRepeatersAdminProps {
  repeaters: Repeater[];
  isLoading: boolean;
  passphrase?: string;
}

function ApprovedRow({ repeater }: { repeater: Repeater }) {
  const { mutateAsync: deleteRepeater, isPending } = useDeleteRepeater();
  const isActive = repeater.status === Status.active;
  const offsetStr =
    repeater.offset >= 0
      ? `+${repeater.offset.toFixed(1)}`
      : repeater.offset.toFixed(1);

  const handleDelete = async () => {
    try {
      await deleteRepeater(repeater.id);
      toast.success(`${repeater.callSign} deleted from directory.`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to delete repeater");
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border/80 bg-secondary/20 transition-colors">
      <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
        <Radio className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-primary text-sm tracking-wider">
            {repeater.callSign}
          </span>
          <Badge
            variant="outline"
            className={`text-xs font-mono px-1.5 py-0 h-4 ${
              isActive
                ? "border-green-500/40 text-green-400 bg-green-500/10"
                : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
          <span className="font-mono">
            {repeater.frequency.toFixed(4)} ({offsetStr})
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {repeater.city}, {repeater.state}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {repeater.ctcssTone !== "None"
              ? `${repeater.ctcssTone} Hz`
              : "No Tone"}
          </span>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
          >
            {isPending ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-tech text-foreground">
              Delete Repeater?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove{" "}
              <strong className="text-foreground font-mono">
                {repeater.callSign}
              </strong>{" "}
              ({repeater.frequency.toFixed(4)} MHz) from the directory. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ApprovedRepeatersAdmin({
  repeaters,
  isLoading,
}: ApprovedRepeatersAdminProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {["s1", "s2", "s3", "s4", "s5"].map((k) => (
          <Skeleton key={k} className="h-14 w-full bg-secondary rounded-lg" />
        ))}
      </div>
    );
  }

  if (repeaters.length === 0) {
    return (
      <div className="ham-card p-8 text-center">
        <Radio className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-tech font-semibold text-foreground">
          No approved repeaters
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Approve pending submissions to populate the directory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {repeaters.map((r) => (
        <ApprovedRow key={r.id.toString()} repeater={r} />
      ))}
    </div>
  );
}
