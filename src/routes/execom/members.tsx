import { createFileRoute } from "@tanstack/react-router";
import { Search, User, Filter } from "lucide-react";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { StatusBadge } from "@/components/execom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockMembers } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/execom/members")({
  component: MembersPage,
});

function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = mockMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.project.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <ExecomPageHeading
        title="Members Directory"
        subtitle="Manage and review member project participation."
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name or project..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" /> Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No members found.
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="panel hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <User className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-xs text-muted-foreground">ID: {member.id}</p>
                    </div>
                  </div>
                  <StatusBadge status={member.status} />
                </div>

                <div className="space-y-2 text-sm mt-4">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Current Project</span>
                    <span className="font-medium text-right">{member.project}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Team Size</span>
                    <span>{member.teamSize}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Current Key</span>
                    <span className="font-medium">{member.currentKey || "None"}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Total Requests</span>
                    <span>{member.requestHistory}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
