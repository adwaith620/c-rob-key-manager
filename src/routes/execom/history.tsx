import { createFileRoute } from "@tanstack/react-router";
import { History, Search } from "lucide-react";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockActivities } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/execom/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredActivities = mockActivities.filter(a => 
    a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.relatedItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <ExecomPageHeading
        title="Activity History"
        subtitle="Chronological log of all key locker interactions and requests."
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search activity logs..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="panel p-0 overflow-hidden border-border/50">
        <div className="p-6 border-b border-border/50 bg-muted/20">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="size-4 text-primary" /> System Timeline
          </h3>
        </div>
        <CardContent className="p-0">
          <div className="relative border-l border-border ml-8 my-6">
            {filteredActivities.length === 0 ? (
              <div className="pl-8 py-4 text-muted-foreground">No activity found.</div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="mb-8 pl-8 relative">
                  {/* Timeline dot */}
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 border-2 border-background" />
                  
                  <div className="bg-background/60 border border-border/50 p-4 rounded-lg shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                      <span className="font-semibold text-foreground text-base">
                        {activity.action}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium mr-1">Person:</span> {activity.person}
                      </div>
                      <div>
                        <span className="font-medium mr-1">Related:</span> {activity.relatedItem}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
