import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search, Plus } from "lucide-react";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { StatusBadge } from "@/components/execom/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { mockRequests, type ProjectRequest } from "@/lib/mock-data";

export const Route = createFileRoute("/execom/project-requests")({
  component: ProjectRequestsPage,
});

function ProjectRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Using mock data directly for read-only view
  const requests = mockRequests;
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  // New Request Form State (Preserved for making a request, NOT for administrative approval)
  const [teamSizeInput, setTeamSizeInput] = useState("");

  const filteredRequests = requests.filter(
    (req) =>
      req.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleTeamSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 30) return;
    setTeamSizeInput(e.target.value);
  };

  return (
    <>
      <ExecomPageHeading
        title="Project Requests"
        subtitle="Monitor project key requests."
        right={
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm glow-subtle">
                <Plus className="size-4" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Project Request</DialogTitle>
                <DialogDescription>
                  Submit a new request for lab usage on behalf of a project team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input id="projectName" placeholder="e.g. Autonomous Rover" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="applicantName">Applicant Name</Label>
                  <Input id="applicantName" placeholder="e.g. John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teamSize" className="font-semibold text-primary">
                    Tell us how many members are working in this project including you
                  </Label>
                  <Input
                    id="teamSize"
                    type="number"
                    min="1"
                    max="30"
                    value={teamSizeInput}
                    onChange={handleTeamSizeChange}
                    className="w-32"
                    placeholder="Max 30"
                  />
                  <p className="text-xs text-muted-foreground">
                    You are automatically included in this total.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose of Visit (Optional)</Label>
                  <Input id="purpose" placeholder="e.g. Testing new motors" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsNewRequestOpen(false)}>Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-3 font-medium">Request ID</th>
                <th className="px-6 py-3 font-medium">Project Name</th>
                <th className="px-6 py-3 font-medium">Applicant</th>
                <th className="px-6 py-3 font-medium">Requested Key</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(req);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 font-medium">{req.id}</td>
                    <td className="px-6 py-4">{req.projectName}</td>
                    <td className="px-6 py-4">
                      {req.applicant}{" "}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({req.teamSize} members)
                      </span>
                    </td>
                    <td className="px-6 py-4">{req.requestedKey}</td>
                    <td className="px-6 py-4">{new Date(req.requestDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Dialog - Read Only */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-8">
                  <DialogTitle className="text-xl">{selectedRequest.projectName}</DialogTitle>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <DialogDescription>Request ID: {selectedRequest.id}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Project Info */}
                <div>
                  <h3 className="font-semibold text-sm text-primary mb-3 uppercase tracking-wider">
                    Project Information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Applicant Name</div>
                    <div className="font-medium">{selectedRequest.applicant}</div>

                    <div className="text-muted-foreground">Team Size</div>
                    <div className="font-medium">{selectedRequest.teamSize} members</div>

                    <div className="text-muted-foreground">Team Members</div>
                    <div className="font-medium">{selectedRequest.teamMembers.join(", ")}</div>

                    <div className="text-muted-foreground">Purpose of Visit</div>
                    <div className="font-medium italic">
                      {selectedRequest.purposeOfVisit
                        ? `"${selectedRequest.purposeOfVisit}"`
                        : "Not provided"}
                    </div>
                  </div>
                </div>

                {/* Key Info */}
                <div className="border-t border-border/50 pt-4">
                  <h3 className="font-semibold text-sm text-primary mb-3 uppercase tracking-wider">
                    Key Information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Requested Key</div>
                    <div className="font-medium">{selectedRequest.requestedKey}</div>

                    <div className="text-muted-foreground">Assigned Key</div>
                    <div className="font-medium">
                      {selectedRequest.assignedKey || "Not assigned yet"}
                    </div>
                  </div>
                </div>

                {/* Request Info */}
                <div className="border-t border-border/50 pt-4">
                  <h3 className="font-semibold text-sm text-primary mb-3 uppercase tracking-wider">
                    Request Information
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Request Date</div>
                    <div className="font-medium">
                      {new Date(selectedRequest.requestDate).toLocaleString()}
                    </div>

                    <div className="text-muted-foreground">Expected Duration</div>
                    <div className="font-medium">
                      {selectedRequest.requestedDurationHours} Hours
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-border/50 pt-4 gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
