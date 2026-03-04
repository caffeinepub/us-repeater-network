import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Lock, Shield } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useIsAdminPassphraseValid } from "../hooks/useQueries";

interface AdminPassphraseGateProps {
  children: React.ReactNode;
}

const SESSION_KEY = "admin_unlocked";

export default function AdminPassphraseGate({
  children,
}: AdminPassphraseGateProps) {
  const [passphrase, setPassphrase] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [localError, setLocalError] = useState("");

  const validatePassphrase = useIsAdminPassphraseValid();

  // On mount: check if already unlocked in this session
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    try {
      const valid = await validatePassphrase.mutateAsync(passphrase);
      if (valid) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setUnlocked(true);
      } else {
        setLocalError("Invalid passphrase. Please try again.");
        setPassphrase("");
      }
    } catch {
      setLocalError("Unable to verify passphrase. Please try again.");
    }
  };

  // Already unlocked — render children directly
  if (unlocked) {
    return <>{children}</>;
  }

  // Show passphrase form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-foreground font-display">
            Admin Passphrase
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the admin passphrase to access the import panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passphrase" className="text-foreground">
                Passphrase
              </Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter admin passphrase"
                className="bg-background border-border text-foreground"
                disabled={validatePassphrase.isPending}
                data-ocid="admin.input"
                autoFocus
              />
            </div>
            {localError && (
              <Alert variant="destructive" data-ocid="admin.error_state">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={validatePassphrase.isPending || !passphrase}
              data-ocid="admin.submit_button"
            >
              {validatePassphrase.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Admin Panel"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
