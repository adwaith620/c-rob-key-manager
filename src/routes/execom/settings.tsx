import { createFileRoute } from "@tanstack/react-router";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/execom/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <ExecomPageHeading title="Settings" subtitle="Configure dashboard and system preferences." />

      <div className="grid gap-6">
        <Card className="panel">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage how and when you receive system alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Request Alerts</Label>
                <div className="text-sm text-muted-foreground">
                  Receive an alert when a new project request is submitted.
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Overdue Key Alerts</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified when a key is not returned on time.
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader>
            <CardTitle>System Management</CardTitle>
            <CardDescription>Administrative controls for the key locker.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="w-full sm:w-auto">
                Export System Data
              </Button>
              <Button variant="destructive" className="w-full sm:w-auto">
                Reset All Keys (Emergency)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
