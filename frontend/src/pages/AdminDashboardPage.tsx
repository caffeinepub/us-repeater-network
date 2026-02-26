import { useState } from 'react';
import { Shield, Clock, CheckCircle, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminPassphraseGate from '../components/AdminPassphraseGate';
import PendingRepeatersList from '../components/PendingRepeatersList';
import ApprovedRepeatersAdmin from '../components/ApprovedRepeatersAdmin';
import { useGetPendingRepeaters, useGetApprovedRepeaters } from '../hooks/useQueries';

function AdminDashboard({ passphrase, onLogout }: { passphrase: string; onLogout: () => void }) {
  const { data: pendingRepeaters = [], isLoading: pendingLoading, error: pendingError } = useGetPendingRepeaters();
  const { data: approvedRepeaters = [], isLoading: approvedLoading } = useGetApprovedRepeaters();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-tech font-bold text-2xl text-foreground tracking-wide">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage repeater submissions and directory</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="border-border text-muted-foreground hover:text-foreground gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="ham-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-DEFAULT" />
          </div>
          <div>
            <div className="font-tech font-bold text-2xl text-foreground">{pendingRepeaters.length}</div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </div>
        </div>
        <div className="ham-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="font-tech font-bold text-2xl text-foreground">{approvedRepeaters.length}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </div>
        </div>
      </div>

      {pendingError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          Note: You need admin role to view pending submissions. Contact the system administrator.
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="bg-secondary border border-border w-full mb-6">
          <TabsTrigger value="pending" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pending
            {pendingRepeaters.length > 0 && (
              <Badge className="ml-2 h-4 px-1.5 text-xs bg-amber/20 text-amber-DEFAULT border border-amber/30">
                {pendingRepeaters.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Approved ({approvedRepeaters.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingRepeatersList
            repeaters={pendingRepeaters}
            isLoading={pendingLoading}
            passphrase={passphrase}
          />
        </TabsContent>

        <TabsContent value="approved">
          <ApprovedRepeatersAdmin
            repeaters={approvedRepeaters}
            isLoading={approvedLoading}
            passphrase={passphrase}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [adminPassphrase, setAdminPassphrase] = useState<string | null>(null);

  if (!adminPassphrase) {
    return <AdminPassphraseGate onAuthenticated={setAdminPassphrase} />;
  }

  return (
    <AdminDashboard
      passphrase={adminPassphrase}
      onLogout={() => setAdminPassphrase(null)}
    />
  );
}
