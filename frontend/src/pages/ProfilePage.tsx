import React, { useState, useEffect } from "react";
import { User, Save, Radio } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useSaveCallerUserProfile } from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProfilePage() {
  const { identity, login } = useInternetIdentity();
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [form, setForm] = useState({ name: "", callSign: "", bio: "" });

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name, callSign: profile.callSign, bio: profile.bio });
    }
  }, [profile]);

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 text-amber mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground font-display mb-3">My Profile</h1>
        <p className="text-muted-foreground mb-6">Log in to manage your profile.</p>
        <Button onClick={login} className="bg-amber text-navy hover:bg-amber-dark font-bold">
          Login
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProfile.mutateAsync(form);
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground font-display mb-2 flex items-center gap-3">
          <User className="w-7 h-7 text-amber" />
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Principal: {identity.getPrincipal().toString().slice(0, 30)}...
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Radio className="w-8 h-8 text-amber animate-pulse" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-foreground">
              Display Name *
            </Label>
            <Input
              id="name"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              className="bg-navy-light border-border text-foreground mt-1"
            />
          </div>
          <div>
            <Label htmlFor="callSign" className="text-foreground">
              Call Sign
            </Label>
            <Input
              id="callSign"
              placeholder="W1ABC"
              value={form.callSign}
              onChange={(e) => setForm((p) => ({ ...p, callSign: e.target.value.toUpperCase() }))}
              className="bg-navy-light border-border text-foreground mt-1 uppercase"
            />
          </div>
          <div>
            <Label htmlFor="bio" className="text-foreground">
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              className="bg-navy-light border-border text-foreground mt-1"
              rows={3}
            />
          </div>
          <Button
            type="submit"
            disabled={saveProfile.isPending}
            className="w-full bg-amber text-navy hover:bg-amber-dark font-bold"
          >
            {saveProfile.isPending ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
