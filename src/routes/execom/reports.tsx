import { createFileRoute } from "@tanstack/react-router";
import { ExecomPageHeading } from "@/components/execom/ExecomLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getDashboardStats } from "@/lib/mock-data";

export const Route = createFileRoute("/execom/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const stats = getDashboardStats();

  // Mock data for charts since we don't have real time series
  const requestHistoryData = [
    { name: 'Mon', requests: 4 },
    { name: 'Tue', requests: 7 },
    { name: 'Wed', requests: 2 },
    { name: 'Thu', requests: 5 },
    { name: 'Fri', requests: 8 },
    { name: 'Sat', requests: 3 },
    { name: 'Sun', requests: 1 },
  ];

  const keyUsageData = [
    { name: 'Available', value: stats.availableKeys, color: 'hsl(var(--success))' },
    { name: 'In Use', value: stats.keysInUse, color: 'hsl(var(--info))' },
    { name: 'Overdue', value: stats.overdueReturns, color: 'hsl(var(--destructive))' },
  ];

  return (
    <>
      <ExecomPageHeading
        title="System Reports"
        subtitle="Analytics and statistics for the key locker usage."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestHistoryData}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader>
            <CardTitle className="text-lg">Current Key Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={keyUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {keyUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
               </PieChart>
             </ResponsiveContainer>
             <div className="flex gap-4 mt-2">
                {keyUsageData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.name} ({entry.value})</span>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center justify-center text-sm text-warning mt-4">
         Note: This report uses mock/demo data for visualization purposes until backend analytics are fully integrated.
      </div>
    </>
  );
}
