export type KeyStatus =
  "Available" | "In Use" | "Reserved" | "Pending Return" | "Overdue" | "Maintenance" | "Disabled";

export type RequestStatus = "Pending" | "Approved" | "Rejected" | "Completed" | "Active";
export type ProjectStatus = "Active" | "Pending Return" | "Overdue" | "Completed";

export interface Member {
  id: string;
  name: string;
  project: string;
  teamSize: number;
  currentKey: string | null;
  status: "Active" | "Inactive";
  requestHistory: number;
}

export interface KeyLocker {
  id: string;
  number: string;
  status: KeyStatus;
  assignedProject: string | null;
  responsibleMember: string | null;
  issuedDate: string | null;
  expectedReturnDate: string | null;
}

export interface ProjectRequest {
  id: string;
  projectName: string;
  applicant: string;
  teamSize: number;
  teamMembers: string[];
  purposeOfVisit: string | null;
  requestedKey: string;
  requestDate: string;
  requestedDurationHours: number;
  status: RequestStatus;
  assignedKey: string | null;
}

export interface ActiveProject {
  id: string;
  projectName: string;
  teamSize: number;
  assignedKey: string;
  responsibleMember: string;
  startDate: string;
  expectedReturn: string;
  status: ProjectStatus;
}

export interface Activity {
  id: string;
  action: string;
  relatedItem: string;
  person: string;
  timestamp: string;
}

// Initial Mock Data
export const mockKeys: KeyLocker[] = [
  {
    id: "k1",
    number: "Locker A-1 (Main Lab)",
    status: "Available",
    assignedProject: null,
    responsibleMember: null,
    issuedDate: null,
    expectedReturnDate: null,
  },
  {
    id: "k2",
    number: "Locker A-2 (Soldering Station)",
    status: "In Use",
    assignedProject: "Robo Arm V2",
    responsibleMember: "John Doe",
    issuedDate: new Date(Date.now() - 2 * 3600000).toISOString(),
    expectedReturnDate: new Date(Date.now() + 1 * 3600000).toISOString(),
  },
  {
    id: "k3",
    number: "Locker B-1 (3D Printer)",
    status: "Overdue",
    assignedProject: "Drone Frame Print",
    responsibleMember: "Alice Smith",
    issuedDate: new Date(Date.now() - 6 * 3600000).toISOString(),
    expectedReturnDate: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: "k4",
    number: "Locker C-1 (Storage)",
    status: "Maintenance",
    assignedProject: null,
    responsibleMember: null,
    issuedDate: null,
    expectedReturnDate: null,
  },
];

export const mockRequests: ProjectRequest[] = [
  {
    id: "REQ-001",
    projectName: "Autonomous Rover",
    applicant: "Bob Johnson",
    teamSize: 4,
    teamMembers: ["Bob Johnson", "Sarah Lee", "Mike Chen", "Emma Watson"],
    purposeOfVisit: "Testing new motor drivers",
    requestedKey: "Locker A-1 (Main Lab)",
    requestDate: new Date(Date.now() - 3600000).toISOString(),
    requestedDurationHours: 4,
    status: "Pending",
    assignedKey: null,
  },
  {
    id: "REQ-002",
    projectName: "Robo Arm V2",
    applicant: "John Doe",
    teamSize: 2,
    teamMembers: ["John Doe", "Jane Doe"],
    purposeOfVisit: null,
    requestedKey: "Locker A-2 (Soldering Station)",
    requestDate: new Date(Date.now() - 86400000).toISOString(),
    requestedDurationHours: 5,
    status: "Approved",
    assignedKey: "Locker A-2 (Soldering Station)",
  },
];

export const mockActiveProjects: ActiveProject[] = [
  {
    id: "PROJ-1",
    projectName: "Robo Arm V2",
    teamSize: 2,
    assignedKey: "Locker A-2",
    responsibleMember: "John Doe",
    startDate: new Date(Date.now() - 2 * 3600000).toISOString(),
    expectedReturn: new Date(Date.now() + 1 * 3600000).toISOString(),
    status: "Active",
  },
  {
    id: "PROJ-2",
    projectName: "Drone Frame Print",
    teamSize: 1,
    assignedKey: "Locker B-1",
    responsibleMember: "Alice Smith",
    startDate: new Date(Date.now() - 6 * 3600000).toISOString(),
    expectedReturn: new Date(Date.now() - 1 * 3600000).toISOString(),
    status: "Overdue",
  },
];

export const mockMembers: Member[] = [
  {
    id: "m1",
    name: "John Doe",
    project: "Robo Arm V2",
    teamSize: 2,
    currentKey: "Locker A-2",
    status: "Active",
    requestHistory: 5,
  },
  {
    id: "m2",
    name: "Alice Smith",
    project: "Drone Frame Print",
    teamSize: 1,
    currentKey: "Locker B-1",
    status: "Active",
    requestHistory: 12,
  },
  {
    id: "m3",
    name: "Bob Johnson",
    project: "Autonomous Rover",
    teamSize: 4,
    currentKey: null,
    status: "Active",
    requestHistory: 2,
  },
];

export const mockActivities: Activity[] = [
  {
    id: "act1",
    action: "Key issued",
    relatedItem: "Locker A-2",
    person: "Execom Member",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "act2",
    action: "New request submitted",
    relatedItem: "Autonomous Rover",
    person: "Bob Johnson",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Helper to calculate statistics
export const getDashboardStats = () => {
  return {
    totalKeys: mockKeys.length,
    availableKeys: mockKeys.filter((k) => k.status === "Available").length,
    keysInUse: mockKeys.filter((k) => k.status === "In Use").length,
    pendingRequests: mockRequests.filter((r) => r.status === "Pending").length,
    activeProjects: mockActiveProjects.length,
    overdueReturns: mockKeys.filter((k) => k.status === "Overdue").length,
  };
};
