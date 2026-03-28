import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Truck, BarChart3, CheckCircle, Clock, AlertCircle, Package } from 'lucide-react';
import { TRUCK_TYPES } from '../reportStore';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'status-pending',   dot: 'bg-slate-400' },
  assigned:  { label: 'Assigned',  cls: 'status-assigned',  dot: 'bg-blue-400' },
  collected: { label: 'Collected', cls: 'status-collected', dot: 'bg-emerald-400' },
};

const LEVEL_COLORS = { critical: 'text-red-400', high: 'text-amber-400', normal: 'text-emerald-400' };

function StatCard({ icon, label, value, accent }) {
  return (
    <div className={`liquid-glass rounded-2xl p-5 flex items-center gap-4 ring-1 ${accent}`}>
      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{label}</p>
        <p className="text-3xl font-bold font-display italic text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard({ reports, onStatusChange }) {
  const stats = useMemo(() => ({
    total:     reports.length,
    pending:   reports.filter(r => r.status === 'pending').length,
    assigned:  reports.filter(r => r.status === 'assigned').length,
    collected: reports.filter(r => r.status === 'collected').length,
  }), [reports]);

  // Derive simulated truck routes from assigned reports
  const truckSummary = useMemo(() => {
    const assigned = reports.filter(r => r.status === 'assigned');
    if (assigned.length === 0) return [];
    const large = assigned.filter(r => r.density === 'high');
    const small = assigned.filter(r => r.density === 'low');
    const result = [];
    if (large.length > 0) {
      result.push({ type: 'large', label: TRUCK_TYPES.large.label, capacity: TRUCK_TYPES.large.capacity,
        stops: large.length, volume: large.reduce((s, r) => s + (r.wasteVolume || 100), 0), color: '#1D9E75' });
    }
    if (small.length > 0) {
      result.push({ type: 'small', label: TRUCK_TYPES.small.label, capacity: TRUCK_TYPES.small.capacity,
        stops: small.length, volume: small.reduce((s, r) => s + (r.wasteVolume || 100), 0), color: '#3B82F6' });
    }
    return result;
  }, [reports]);

  const markCollected = (id) => onStatusChange([id], 'collected');
  const markAllCollected = () => {
    const assignedIds = reports.filter(r => r.status === 'assigned').map(r => r.id);
    if (assignedIds.length > 0) onStatusChange(assignedIds, 'collected');
  };

  return (
    <div className="w-full h-full bg-[#0a0f0a] overflow-y-auto pt-28 pb-12 px-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-60">
        <img src="/wastewise-bg-topo.png" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0a]/80 via-transparent to-[#0a0f0a]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber-400 font-bold mb-1">BMC Control Panel</p>
          <h1 className="text-4xl font-bold text-white font-display italic tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">K-West Ward — Waste Collection Overview</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard icon={<Package size={20} className="text-white/60" />}  label="Total Reports" value={stats.total}     accent="ring-white/5" />
          <StatCard icon={<Clock size={20} className="text-slate-400" />}    label="Pending"       value={stats.pending}    accent="ring-slate-500/20" />
          <StatCard icon={<Truck size={20} className="text-blue-400" />}     label="Assigned"      value={stats.assigned}   accent="ring-blue-500/20" />
          <StatCard icon={<CheckCircle size={20} className="text-emerald-400" />} label="Collected" value={stats.collected} accent="ring-emerald-500/20" />
        </motion.div>

        {/* Truck Routes Summary */}
        {truckSummary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="liquid-glass rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/50 flex items-center gap-2">
                <Truck size={14} /> Active Truck Routes
              </p>
              <button
                onClick={markAllCollected}
                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                Mark All Collected
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {truckSummary.map((t, i) => {
                const pct = Math.min(100, Math.round((t.volume / t.capacity) * 100));
                return (
                  <div key={t.type} className="bg-black/20 rounded-2xl p-4 ring-1 ring-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.color + '22', border: `1px solid ${t.color}44` }}>
                        <Truck size={16} style={{ color: t.color }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white">{t.label}</p>
                        <p className="text-[10px] text-white/40">{t.stops} stops · {t.volume} kg / {t.capacity} kg</p>
                      </div>
                      <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.color + '22', color: t.color }}>
                        Route {i + 1}
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden ring-1 ring-white/5">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: t.color }} />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">{pct}% capacity used</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="liquid-glass rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/50 flex items-center gap-2">
              <BarChart3 size={14} /> All Reports
            </p>
            <span className="text-[11px] text-white/30">{reports.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Level</th>
                  <th>Density</th>
                  <th>Volume</th>
                  <th>Truck</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...reports]
                  .sort((a, b) => {
                    const p = { critical: 0, high: 1, normal: 2 };
                    return (p[a.level] ?? 2) - (p[b.level] ?? 2);
                  })
                  .map(r => {
                    const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                    const truckLabel = r.density === 'high'
                      ? TRUCK_TYPES.large.label
                      : TRUCK_TYPES.small.label;
                    return (
                      <tr key={r.id}>
                        <td>
                          <p className="font-semibold text-white/90">{r.location}</p>
                          <p className="text-[11px] text-white/30">{r.ward}</p>
                        </td>
                        <td>
                          <span className={`text-[12px] font-bold uppercase ${LEVEL_COLORS[r.level] || 'text-white/60'}`}>
                            {r.level}
                          </span>
                        </td>
                        <td>
                          <span className="text-[12px] text-white/60 capitalize">{r.density || 'low'}</span>
                        </td>
                        <td>
                          <span className="text-[12px] text-white/60">{r.wasteVolume || '—'} kg</span>
                        </td>
                        <td>
                          <span className="text-[11px] text-white/50">{truckLabel}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${sc.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td>
                          {r.status === 'pending' && (
                            <button
                              onClick={() => onStatusChange([r.id], 'assigned')}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20 hover:bg-orange-500/20 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Assign Truck
                            </button>
                          )}
                          {r.status === 'assigned' && (
                            <button
                              onClick={() => markCollected(r.id)}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              ✓ Collected
                            </button>
                          )}
                          {r.status === 'collected' && (
                            <span className="text-[11px] text-emerald-500/60 font-bold whitespace-nowrap">✓ Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
