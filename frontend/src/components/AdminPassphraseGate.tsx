import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useRegisterAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle, Loader2 } from 'lucide-react';

interface AdminPassphraseGateProps {
  children: React.ReactNode;
}

// The UI-level passphrase that the admin enters in the browser.
// After validation, we call registerAdmin on the backend with the backend passphrase.
const UI_ADMIN_PASSPHRASE = 'WendellAdmin2024';
// The backend passphrase used to register the admin principal on-chain.
const BACKEND_ADMIN_PASSPHRASE = 'adminPassphrase';

export default function AdminPassphraseGate({ children }: AdminPassphraseGateProps) {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [passphrase, setPassphrase] = useState('');
  const [passphraseValidated, setPassphraseValidated] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: isAdmin, isLoading: adminLoading, isFetched: adminFetched } = useIsCallerAdmin();
  const registerAdmin = useRegisterAdmin();

  const isAuthenticated = !!identity;

  const handlePassphraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Step 1: Validate the UI passphrase
    if (passphrase !== UI_ADMIN_PASSPHRASE) {
      setLocalError('Invalid passphrase. Please try again.');
      return;
    }

    setIsRegistering(true);
    try {
      // Step 2: Call registerAdmin on the backend to register this principal as admin.
      // If admin is already registered (same principal), this will succeed.
      // If a different admin is already registered, this will throw.
      await registerAdmin.mutateAsync(BACKEND_ADMIN_PASSPHRASE);
    } catch (err: unknown) {
      // If the error is "Admin already registered", that means a different principal
      // is already the admin. But we still need to check if THIS caller is the admin.
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('Admin already registered')) {
        // A real error (wrong passphrase on backend, anonymous caller, etc.)
        setLocalError('Failed to verify admin status with the network. Please log out and log back in.');
        setIsRegistering(false);
        return;
      }
      // "Admin already registered" means we just need to check isCallerAdmin
    }

    // Step 3: Force a fresh check of admin status
    await queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    await queryClient.refetchQueries({ queryKey: ['isCallerAdmin'] });

    setPassphraseValidated(true);
    setIsRegistering(false);
  };

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-foreground font-display">Admin Access Required</CardTitle>
            <CardDescription className="text-muted-foreground">
              You must be logged in to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Passphrase not yet validated — show the passphrase form
  if (!passphraseValidated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-foreground font-display">Admin Passphrase</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter the admin passphrase to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePassphraseSubmit} className="space-y-4">
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
                  disabled={isRegistering}
                />
              </div>
              {localError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{localError}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isRegistering || !passphrase}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Access Admin Panel'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Passphrase validated — now check backend admin status
  if (adminLoading || !adminFetched) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Verifying admin privileges on the network...</p>
        </div>
      </div>
    );
  }

  // Backend says not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-foreground font-display">Admin Privileges Not Detected</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your account is not registered as an admin on this network. CSV import and other admin
              actions will be blocked. If you believe this is an error, try logging out and back in,
              or contact the system administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPassphraseValidated(false);
                setPassphrase('');
                setLocalError('');
                queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin confirmed — render children
  return <>{children}</>;
}
