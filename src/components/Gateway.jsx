import { motion } from 'framer-motion';
import { User, Shield, ArrowRight } from 'lucide-react';
import BlurText from './BlurText';

export default function Gateway({ onSelectUser, onSelectAdmin }) {
  return (
    <div className="w-full min-h-screen bg-[#0a0f0a] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Thematic Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src="/wastewise-bg-topo.png" alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a] via-transparent to-[#0a0f0a]" />
        
        {/* Central Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] max-w-[800px] h-[60vw] max-h-[800px] bg-[#1D9E75]/[0.07] blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[500px] px-4 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center overflow-hidden shadow-[0_4px_24px_rgba(29,158,117,0.4)] ring-[1.5px] ring-[#1D9E75]/30 bg-black/40">
            <img src="/logo.png" alt="WasteWise Logo" className="w-[85%] h-[85%] object-contain" />
          </div>
          <h1 className="text-4xl text-white font-display italic tracking-tight drop-shadow-lg">
            <BlurText text="WasteWise" delay={0.1} />
          </h1>
          <p className="text-[#1D9E75] text-[13px] font-bold tracking-widest uppercase text-center mt-2">Civic Action Network</p>
        </div>

        <div className="liquid-glass-strong rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-black/50 ring-1 ring-white/10 relative overflow-hidden flex flex-col gap-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm" />
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Select Portal</h2>
            <p className="text-[13px] text-white/50 mt-1.5">Identify your operative role to continue</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={onSelectUser}
              className="w-full flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1D9E75]/[0.03] ring-1 ring-white/10 hover:bg-[#1D9E75]/10 hover:ring-[#1D9E75]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1D9E75]/20 transition-all duration-300 group cursor-pointer text-center gap-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1D9E75]/0 via-[#1D9E75]/0 to-[#1D9E75]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-full bg-[#1D9E75]/10 ring-1 ring-[#1D9E75]/20 group-hover:bg-[#1D9E75]/20 flex items-center justify-center text-[#1D9E75] group-hover:text-[#24c08e] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(29,158,117,0.3)]">
                <User size={26} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white/90 group-hover:text-white transition-colors">Citizen</p>
                <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">Report issues & track the resolution progress.</p>
              </div>
            </button>

            <button
              onClick={onSelectAdmin}
              className="w-full flex flex-col items-center justify-center p-6 rounded-2xl bg-amber-500/[0.03] ring-1 ring-white/10 hover:bg-amber-500/10 hover:ring-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 group cursor-pointer text-center gap-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-full bg-amber-500/10 ring-1 ring-amber-500/20 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:text-amber-400 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Shield size={26} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white/90 group-hover:text-white transition-colors">BMC Admin</p>
                <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">Manage routing protocols & fleet status.</p>
              </div>
            </button>
          </div>

          <div className="pt-2 flex justify-center border-t border-white/5">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
                 <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">System Online</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
