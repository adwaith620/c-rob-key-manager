import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Search, Filter } from "lucide-react";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { StatusBadge } from "@/components/execom/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockKeys } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/execom/key-locker")({
  component: KeyLockerPage,
});

function KeyLockerPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredKeys = mockKeys.filter(
    (key) =>
      key.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (key.assignedProject &&
        key.assignedProject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (key.responsibleMember &&
        key.responsibleMember.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <>
      <ExecomPageHeading title="Key Locker" subtitle="Manage all physical keys and lockers." />

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by key, project, or member..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" /> Filter Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKeys.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No keys found matching your search.
          </div>
        ) : (
          filteredKeys.map((key) => (
            <Card
              key={key.id}
              className="panel hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <KeyRound className="size-5" />
                  </div>
                  <StatusBadge status={key.status} />
                </div>
                <CardTitle className="mt-4 text-lg">{key.number}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                {key.status === "Available" || key.status === "Maintenance" ? (
                  <p className="py-2">Not currently assigned to any project.</p>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Project:</span>
                      <span className="text-foreground font-medium">{key.assignedProject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Responsible:</span>
                      <span className="text-foreground font-medium">{key.responsibleMember}</span>
                    </div>
                    {key.expectedReturnDate && (
                      <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                        <span>Expected Return:</span>
                        <span className="text-foreground">
                          {new Date(key.expectedReturnDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
