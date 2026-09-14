import { createFileRoute } from "@tanstack/react-router";
import { 
  KeyRound, 
  CheckCircle, 
  Clock, 
  Briefcase, 
  AlertTriangle,
  FileText
} from "lucide-react";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { StatCard } from "@/components/execom/StatCard";
import { StatusBadge } from "@/components/execom/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalKeyStatus } from "@/components/GlobalKeyStatus";
import { getDashboardStats, mockRequests, mockKeys } from "@/lib/mock-data";

export const Route = createFileRoute("/execom/")({
  component: DashboardHome,
});

function DashboardHome() {
  const stats = getDashboardStats();
  const recentRequests = mockRequests.filter(r => r.status === "Pending").slice(0, 3);
  const overdueKeys = mockKeys.filter(k => k.status === "Overdue").slice(0, 3);

  return (
    <>
      <ExecomPageHeading
        title="EXECom Dashboard"
        subtitle="Overview of the entire C-ROB key locker system."
        right={<GlobalKeyStatus />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Keys"
          value={stats.totalKeys}
          icon={<KeyRound className="size-4" />}
          className="bg-card/40"
        />
        <StatCard
          title="Available Keys"
          value={stats.availableKeys}
          icon={<CheckCircle className="size-4 text-success" />}
          className="bg-card/40 border-success/20"
        />
        <StatCard
          title="Keys in Use"
          value={stats.keysInUse}
          icon={<KeyRound className="size-4 text-info" />}
          className="bg-card/40 border-info/20"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={<FileText className="size-4 text-warning" />}
          className="bg-card/40 border-warning/20"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={<Briefcase className="size-4 text-primary" />}
          className="bg-card/40 border-primary/20"
        />
        <StatCard
          title="Overdue Returns"
          value={stats.overdueReturns}
          icon={<AlertTriangle className="size-4 text-destructive" />}
          className="bg-card/40 border-destructive/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests Preview */}
        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5 text-warning" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No pending requests
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map(req => (
                  <div key={req.id} className="flex flex-col sm:flex-row justify-between p-3 border border-border/50 rounded-lg bg-background/50">
                    <div>
                      <div className="font-medium">{req.projectName}</div>
                      <div className="text-xs text-muted-foreground">
                        {req.applicant} • {req.teamSize} members • {req.requestedKey}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-2">
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Keys Preview */}
        <Card className="panel border-destructive/40 bg-destructive/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-destructive/10 to-transparent pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Overdue Returns
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {overdueKeys.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No overdue keys
              </div>
            ) : (
              <div className="space-y-4">
                {overdueKeys.map(key => (
                  <div key={key.id} className="flex flex-col sm:flex-row justify-between p-3 border border-destructive/20 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm">
                    <div>
                      <div className="font-medium text-destructive">{key.number}</div>
                      <div className="text-xs text-muted-foreground">
                        Project: {key.assignedProject} • {key.responsibleMember}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-destructive mt-1 font-semibold">
                        <Clock className="size-3" /> Expected: {new Date(key.expectedReturnDate!).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center">
                      <StatusBadge status={key.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
