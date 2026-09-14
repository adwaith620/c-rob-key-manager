import { createFileRoute } from "@tanstack/react-router";
import { Search, Filter, Clock } from "lucide-react";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { StatusBadge } from "@/components/execom/StatusBadge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockActiveProjects } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/execom/active-projects")({
  component: ActiveProjectsPage,
});

function ActiveProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = mockActiveProjects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.responsibleMember.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <ExecomPageHeading
        title="Active Projects"
        subtitle="Monitor projects currently using lab keys."
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search active projects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" /> Filter
        </Button>
      </div>

      <Card className="panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-3 font-medium">Project Name</th>
                <th className="px-6 py-3 font-medium">Team Size</th>
                <th className="px-6 py-3 font-medium">Assigned Key</th>
                <th className="px-6 py-3 font-medium">Responsible Member</th>
                <th className="px-6 py-3 font-medium">Start Date</th>
                <th className="px-6 py-3 font-medium">Expected Return</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No active projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-primary">{project.projectName}</td>
                    <td className="px-6 py-4">{project.teamSize} members</td>
                    <td className="px-6 py-4">{project.assignedKey}</td>
                    <td className="px-6 py-4">{project.responsibleMember}</td>
                    <td className="px-6 py-4">{new Date(project.startDate).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        {new Date(project.expectedReturn).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
