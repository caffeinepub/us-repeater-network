import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPendingRepeaters, useGetApprovedRepeaters } from '../hooks/useQueries';
import AdminPassphraseGate from '../components/AdminPassphraseGate';
import PendingRepeatersList from '../components/PendingRepeatersList';
import ApprovedRepeatersAdmin from '../components/ApprovedRepeatersAdmin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Clock, CheckCircle, LogOut, LogIn, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

function AdminDashboard() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: pendingRepeaters = [], isLoading: pendingLoading, error: pendingError } = useGetPendingRepeaters();
  const { data: approvedRepeaters = [], isLoading: approvedLoading } = useGetApprovedRepeaters();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground tracking-wide">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage repeater submissions and directory</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-border text-muted-foreground hover:text-foreground gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-foreground">{pendingRepeaters.length}</div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-foreground">{approvedRepeaters.length}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </div>
        </div>
      </div>

      {pendingError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          Note: You need admin role to view pending submissions.
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="bg-card border border-border w-full mb-6">
          <TabsTrigger
            value="pending"
            className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pending
            {pendingRepeaters.length > 0 && (
              <Badge className="ml-2 h-4 px-1.5 text-xs bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {pendingRepeaters.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Approved ({approvedRepeaters.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingRepeatersList repeaters={pendingRepeaters} isLoading={pendingLoading} />
        </TabsContent>

        <TabsContent value="approved">
          <ApprovedRepeatersAdmin repeaters={approvedRepeaters} isLoading={approvedLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { identity, loginStatus, login } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Login Required</h2>
            <p className="text-muted-foreground">
              You must be logged in with an admin account to access the admin dashboard.
            </p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full font-semibold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminPassphraseGate>
      <AdminDashboard />
    </AdminPassphraseGate>
  );
}
