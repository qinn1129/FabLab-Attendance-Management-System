import React from "react";
import { ResponsiveContainer, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell } from "recharts";
import { PageHeader, StatCard, StatusBadge } from "../../components/common";
import { CHART_COMMISSION, CHART_STATUS } from "../../constants/mockData";
import { type Commission } from "../../services/sheetsService";

/**
 * Renders the Admin Dashboard overview.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminDashboard({ commissions }: { commissions: Commission[] }) {
  const totalComs = commissions.length;
  const awaitingApproval = commissions.filter(c => c.status === "Awaiting Approval").length;
  const completedComs = commissions.filter(c => c.status === "Completed").length;

  return (
    <div className="p-6">

      {/*Dynamic Header*/}
      <PageHeader title="Dashboard" sub={`FabLab overview · ${totalComs} Total Commissions`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Commissions" value={totalComs} sub="Synced from Sheets" color="text-foreground" />
        <StatCard label="Pending Approval" value={awaitingApproval} sub="Requires action" color="text-orange-500" />
        <StatCard label="Active RMs" value={4} sub="1 on leave" color="text-emerald-600" />
        <StatCard label="Completed Jobs" value={completedComs} sub="All time" color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Commissions This Week</h3>

          <ResponsiveContainer width="100%" height={180}>

            {/*The Actual Bar Chart*/}
            <ReBarChart data={CHART_COMMISSION} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>

        {/*Status Breakdown Pie Chart*/}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={CHART_STATUS} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {CHART_STATUS.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>

          {/*Legend*/}
          <div className="mt-2 space-y-1">
            {CHART_STATUS.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-mono font-semibold text-card-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*Recent Commissions*/}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Recent Commissions</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["ID","Client","Service","Assigned RM","Status"].map(h => (
                <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commissions.slice().reverse().slice(0, 5).map(c => (
              <tr key={c.id} className="border-b border-muted hover:bg-muted/50 transition">
                <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="py-2 pr-4 font-medium text-foreground">{c.client}</td>
                <td className="py-2 pr-4 text-muted-foreground">{c.service}</td>
                <td className="py-2 pr-4 text-muted-foreground">{c.rm || <span className="text-muted-foreground italic">Unassigned</span>}</td>
                <td className="py-2"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
