import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Radio, User } from 'lucide-react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [callSign, setCallSign] = useState('');
  const [bio, setBio] = useState('');
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveProfile({ name: name.trim(), callSign: callSign.trim().toUpperCase(), bio: bio.trim() });
      toast.success('Profile saved! Welcome to US Repeater Network.');
    } catch {
      toast.error('Failed to save profile. Please try again.');
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="bg-card border-border max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-tech text-lg text-foreground">Welcome, Operator!</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Set up your profile to get started
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="callSign" className="text-sm font-medium text-foreground">
              Call Sign <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="callSign"
              value={callSign}
              onChange={(e) => setCallSign(e.target.value.toUpperCase())}
              placeholder="e.g. W1AW"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm font-medium text-foreground">
              Bio <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-tech font-semibold"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Profile & Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
