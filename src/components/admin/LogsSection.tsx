import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addHours } from "date-fns";
import { RefreshCw, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatBookingTime(startTime?: string, durationHours?: number) {
  if (!startTime) return "—";
  try {
    const start = new Date(startTime);
    let timeStr = format(start, "d MMMM yyyy, h:mm a");
    if (durationHours) {
      const end = addHours(start, durationHours);
      timeStr += ` – ${format(end, "h:mm a")}`;
    }
    return timeStr;
  } catch (e) {
    return startTime;
  }
}

function deriveStatus(action: string, bookingStatus?: string) {
  if (bookingStatus) return bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1);
  const lower = action.toLowerCase();
  if (lower.includes("approve")) return "Approved";
  if (lower.includes("reject")) return "Rejected";
  if (lower.includes("fail") || lower.includes("cancel")) return "Failed";
  return "Success";
}

export function LogsSection() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState("audit");
  const [exporting, setExporting] = useState(false);

  // Queries
  const {
    data: auditLogs,
    isLoading: isLoadingAudit,
    refetch: refetchAudit,
    isRefetching: isRefetchingAudit,
  } = useQuery({
    queryKey: ["admin_audit_logs"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select(
          `
          *,
          profiles(email, full_name, role),
          bookings(
            *,
            profiles(email, full_name)
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const {
    data: attendanceLogs,
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
    isRefetching: isRefetchingAttendance,
  } = useQuery({
    queryKey: ["execom_attendance_logs"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("execom_attendance_logs")
        .select("*, profiles(email, full_name)")
        .order("scanned_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "attendance" || role === "admin",
  });

  const {
    data: keyAccessLogs,
    isLoading: isLoadingKeyAccess,
    refetch: refetchKeyAccess,
    isRefetching: isRefetchingKeyAccess,
  } = useQuery({
    queryKey: ["execom_key_access_logs"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("execom_key_access_logs")
        .select("*, profiles(email, full_name)")
        .order("scanned_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "key_access" || role === "admin",
  });

  const doExport = async (
    type: "audit" | "attendance" | "key_access",
    formatType: "excel" | "csv",
  ) => {
    try {
      setExporting(true);

      let data;
      let rows: any[] = [];
      let filename = "";

      if (type === "audit") {
        const { data: auditData, error } = await supabase!
          .from("audit_logs")
          .select(
            `
            *,
            profiles(email, full_name, role),
            bookings(
              *,
              profiles(email, full_name)
            )
          `,
          )
          .order("created_at", { ascending: false })
          .limit(1000);
        if (error) throw error;
        data = auditData;

        rows = data.map((log: any) => {
          const b = log.bookings || {};
          const p = log.profiles || {}; // Admin
          const applicant = b.profiles || {}; // Applicant

          return {
            Applicant: applicant.full_name || "Unknown",
            "Applicant Email": applicant.email || b.user_id || "",
            Action: log.action,
            Status: deriveStatus(log.action, b.status),
            "Booking Time": formatBookingTime(b.start_time, b.duration_hours),
            "Booking Type": b.booking_type || "",
            Duration: b.duration_hours || "",
            Purpose: b.purpose || "",
            "Team Size": b.team_size || "",
            Admin: p.full_name || "System",
            "Admin Email": p.email || log.user_id,
            "Booking ID": log.booking_id || "",
            "Key ID": "",
            "Locker ID": "",
            "Access Status": "",
            "Event ID": log.id || "",
          };
        });
        filename = `audit_logs_${format(new Date(), "yyyy-MM-dd")}.${formatType === "excel" ? "xlsx" : "csv"}`;
      } else if (type === "attendance") {
        const { data: attData, error } = await supabase!
          .from("execom_attendance_logs")
          .select("*, profiles(email, full_name, role)")
          .order("scanned_at", { ascending: false })
          .limit(1000);
        if (error) throw error;
        data = attData;

        rows = data.map((log: any) => ({
          "Log ID": log.id,
          Name: log.profiles?.full_name || "",
          Email: log.profiles?.email || "",
          "User ID": log.user_id,
          Role: log.profiles?.role || "",
          "Attendance Date": log.scanned_at ? format(new Date(log.scanned_at), "yyyy-MM-dd") : "",
          "Login Time": log.scanned_at ? format(new Date(log.scanned_at), "HH:mm:ss") : "",
          Status: log.status,
          "Access Method": log.access_method,
          "Device ID": log.device_id || "",
          "Event ID": log.metadata?.idempotency_key || "",
          "Created At": log.scanned_at ? format(new Date(log.scanned_at), "PPP, p") : "",
          "Updated At": "",
        }));
        filename = `execom_attendance_logs_${format(new Date(), "yyyy-MM-dd")}.${formatType === "excel" ? "xlsx" : "csv"}`;
      } else if (type === "key_access") {
        const { data: keyData, error } = await supabase!
          .from("execom_key_access_logs")
          .select("*, profiles(email, full_name, role)")
          .order("scanned_at", { ascending: false })
          .limit(1000);
        if (error) throw error;
        data = keyData;

        rows = data.map((log: any) => ({
          "Log ID": log.id,
          Name: log.profiles?.full_name || "",
          Email: log.profiles?.email || "",
          "User ID": log.user_id,
          Role: log.profiles?.role || "",
          "Booking ID": log.booking_id || "",
          "Key ID": log.key_id || "",
          "Locker ID": log.locker_id || "",
          "Access Date": log.scanned_at ? format(new Date(log.scanned_at), "yyyy-MM-dd") : "",
          "Access Time": log.scanned_at ? format(new Date(log.scanned_at), "HH:mm:ss") : "",
          "Access Method": log.access_method,
          "Access Status": log.status,
          "Access Result": log.action,
          Authorization: log.status === "success" ? "Authorized" : "Denied",
          "Device ID": log.device_id || "",
          "Event ID": log.metadata?.idempotency_key || "",
          "Created At": log.scanned_at ? format(new Date(log.scanned_at), "PPP, p") : "",
          "Updated At": "",
        }));
        filename = `execom_key_access_logs_${format(new Date(), "yyyy-MM-dd")}.${formatType === "excel" ? "xlsx" : "csv"}`;
      }

      if (!data || data.length === 0) {
        toast.info("No member logs found to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);

      if (formatType === "excel") {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Member Logs");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(`${formatType === "excel" ? "Excel file" : "CSV file"} exported successfully`);
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="panel fade-up">
      <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Member Logs</CardTitle>
          <CardDescription>System actions and events.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 h-auto bg-card border border-border/30 p-1">
            <TabsTrigger
              value="audit"
              className="py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Member Logs
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              ExeCom Attendance Logs
            </TabsTrigger>
            <TabsTrigger
              value="key_access"
              className="py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              ExeCom Key Access Logs
            </TabsTrigger>
          </TabsList>

          {/* MEMBER LOGS TAB */}
          <TabsContent value="audit" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="font-semibold text-lg text-foreground/90">Member Logs</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {role === "admin" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => doExport("audit", "excel")}
                      disabled={exporting}
                    >
                      <FileSpreadsheet className="size-4 mr-2" /> Excel (.xlsx)
                    </Button>
                    <div className="flex flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => doExport("audit", "csv")}
                        disabled={exporting}
                      >
                        <FileText className="size-4 mr-2" /> Google Sheets CSV
                      </Button>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center">
                        Import into Google Sheets
                      </span>
                    </div>
                  </>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchAudit()}
                  disabled={isRefetchingAudit}
                  className="size-9 ml-auto sm:ml-0"
                >
                  <RefreshCw className={cn("size-4", isRefetchingAudit && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="space-y-4 overflow-x-auto">
              {isLoadingAudit ? (
                <div className="text-center text-muted-foreground animate-pulse py-8">
                  Loading member logs...
                </div>
              ) : auditLogs?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No member logs found</div>
              ) : (
                auditLogs?.map((log: any) => {
                  const b = log.bookings || {};
                  const applicant = b.profiles || {};
                  return (
                    <div
                      key={log.id}
                      className="bg-card/30 border border-border/30 rounded-md p-4 space-y-2 min-w-[600px]"
                    >
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Applicant Name
                          </div>
                          <div className="text-sm font-medium">
                            {applicant.full_name || "Unknown"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Action Taken
                          </div>
                          <div className="text-sm">{log.action}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Status
                          </div>
                          <div className="text-sm font-medium">
                            {deriveStatus(log.action, b.status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Booking Time
                          </div>
                          <div className="text-sm whitespace-nowrap">
                            {formatBookingTime(b.start_time, b.duration_hours)}
                          </div>
                        </div>
                      </div>
                      {log.details && (
                        <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded mt-2 border border-border/20">
                          {log.details}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* ATTENDANCE LOGS TAB */}
          <TabsContent value="attendance" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="font-semibold text-lg text-foreground/90">ExeCom Attendance Logs</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {role === "admin" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => doExport("attendance", "excel")}
                      disabled={exporting}
                    >
                      <FileSpreadsheet className="size-4 mr-2" /> Excel (.xlsx)
                    </Button>
                    <div className="flex flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => doExport("attendance", "csv")}
                        disabled={exporting}
                      >
                        <FileText className="size-4 mr-2" /> Google Sheets CSV
                      </Button>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center">
                        Import into Google Sheets
                      </span>
                    </div>
                  </>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchAttendance()}
                  disabled={isRefetchingAttendance}
                  className="size-9 ml-auto sm:ml-0"
                >
                  <RefreshCw className={cn("size-4", isRefetchingAttendance && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="space-y-4 overflow-x-auto">
              {isLoadingAttendance ? (
                <div className="text-center text-muted-foreground animate-pulse py-8">
                  Loading attendance logs...
                </div>
              ) : attendanceLogs?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No ExeCom attendance records found
                </div>
              ) : (
                attendanceLogs?.map((log: any) => (
                  <div
                    key={log.id}
                    className="bg-card/30 border border-border/30 rounded-md p-4 space-y-2 min-w-[600px]"
                  >
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Member Name
                        </div>
                        <div className="text-sm font-medium text-primary/90">
                          {log.profiles?.full_name || "Unknown"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Status
                        </div>
                        <div className="text-sm">{log.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Access Method
                        </div>
                        <div className="text-sm">{log.access_method}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Login Time
                        </div>
                        <div className="text-sm whitespace-nowrap">
                          {format(new Date(log.scanned_at), "MMM d, p")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* KEY ACCESS LOGS TAB */}
          <TabsContent value="key_access" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="font-semibold text-lg text-foreground/90">ExeCom Key Access Logs</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {role === "admin" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => doExport("key_access", "excel")}
                      disabled={exporting}
                    >
                      <FileSpreadsheet className="size-4 mr-2" /> Excel (.xlsx)
                    </Button>
                    <div className="flex flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => doExport("key_access", "csv")}
                        disabled={exporting}
                      >
                        <FileText className="size-4 mr-2" /> Google Sheets CSV
                      </Button>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center">
                        Import into Google Sheets
                      </span>
                    </div>
                  </>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchKeyAccess()}
                  disabled={isRefetchingKeyAccess}
                  className="size-9 ml-auto sm:ml-0"
                >
                  <RefreshCw className={cn("size-4", isRefetchingKeyAccess && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="space-y-4 overflow-x-auto">
              {isLoadingKeyAccess ? (
                <div className="text-center text-muted-foreground animate-pulse py-8">
                  Loading key access logs...
                </div>
              ) : keyAccessLogs?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No ExeCom key-access records found
                </div>
              ) : (
                keyAccessLogs?.map((log: any) => (
                  <div
                    key={log.id}
                    className="bg-card/30 border border-border/30 rounded-md p-4 space-y-2 min-w-[600px]"
                  >
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Member Name
                        </div>
                        <div className="text-sm font-medium text-primary/90">
                          {log.profiles?.full_name || "Unknown"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Action
                        </div>
                        <div className="text-sm">{log.action}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Status
                        </div>
                        <div className="text-sm">{log.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Booking ID
                        </div>
                        <div className="text-sm font-mono">
                          {log.booking_id ? log.booking_id.split("-")[0] : "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Access Time
                        </div>
                        <div className="text-sm whitespace-nowrap">
                          {format(new Date(log.scanned_at), "MMM d, p")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
