import { useState } from 'react';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface AdminPassphraseGateProps {
  onAuthenticated: (passphrase: string) => void;
}

const ADMIN_PASSPHRASE = 'WendellAdmin2024';

export default function AdminPassphraseGate({ onAuthenticated }: AdminPassphraseGateProps) {
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 400));

    if (passphrase === ADMIN_PASSPHRASE) {
      onAuthenticated(passphrase);
    } else {
      setError('Incorrect passphrase. Access denied.');
      setPassphrase('');
    }
    setIsChecking(false);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="ham-card p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-tech font-bold text-2xl text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the admin passphrase to access the dashboard
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Passphrase
            </Label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => { setPassphrase(e.target.value); setError(''); }}
                placeholder="Enter admin passphrase"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!passphrase || isChecking}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-tech font-semibold"
          >
            {isChecking ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Access Dashboard
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
