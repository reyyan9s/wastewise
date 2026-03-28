import { motion } from 'framer-motion';
import { MapPin, Clock, CheckCircle, Package } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending review', icon: <Clock size={14} />,  cls: 'bg-gray-500/10 text-gray-400 ring-gray-500/30' },
  assigned:  { label: 'Truck Assigned', icon: <Package size={14} />, cls: 'bg-orange-500/10 text-orange-400 ring-orange-500/30' },
  collected: { label: 'Collected',      icon: <CheckCircle size={14} />, cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' },
};

const LEVEL_COLORS = {
  critical: 'text-red-400',
  high: 'text-amber-400',
  normal: 'text-emerald-400',
};

export default function MyReports({ reports, user }) {
  const myReports = reports.filter((r) => r.userId === user?.uid).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-full h-full bg-[#0a0f0a] overflow-y-auto pt-36 pb-12 px-6">
      {/* Background  */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-80">
        <img src="/wastewise-bg-topo.png" alt="" className="w-full h-full object-cover saturate-[1.1] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] mix-blend-overlay opacity-30" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pl-2">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#1D9E75] font-bold mb-1">User Activity</p>
          <h1 className="text-4xl font-bold text-white font-display italic tracking-tight">My Reports</h1>
          <p className="text-sm text-white/40 mt-1">Track the status of the waste issues you've reported.</p>
        </motion.div>

        {myReports.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="liquid-glass rounded-[2rem] p-12 text-center ring-1 ring-white/5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <MapPin size={28} className="text-white/20" />
            </div>
            <p className="text-white/80 font-bold mb-1">No reports yet</p>
            <p className="text-sm text-white/40">Head over to the Report Waste tab to submit your first issue.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {myReports.map((report, idx) => {
              const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
              const date = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
              
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="liquid-glass rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ring-1 ring-white/10 hover:ring-white/20 transition-all cursor-default"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white/90">{report.location}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${LEVEL_COLORS[report.level] || 'text-white/50'}`}>
                        {report.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{report.ward}</span>
                      <span>•</span>
                      <span>{date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {report.notes && (
                      <p className="text-sm text-white/60 mt-3 italic">"{report.notes}"</p>
                    )}
                  </div>
                  
                  <div className="shrink-0 flex sm:justify-end">
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase ring-1 ${statusCfg.cls}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
