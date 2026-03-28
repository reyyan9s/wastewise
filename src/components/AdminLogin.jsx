import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Lock } from 'lucide-react';

export default function AdminLogin({ onLogin, onBack }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passcode === 'admin123' || passcode === 'bmc2024') {
      onLogin();
    } else {
      setError('Invalid admin credentials.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPasscode('');
    }
  };

  return (
    <div className="w-full h-screen bg-[#0a0f0a] flex items-center justify-center relative overflow-hidden">
      {/* Background Thematic Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-60">
        <img src="/wastewise-bg-topo.png" alt="" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a] via-transparent to-[#0a0f0a]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm px-6 relative z-10"
      >
        <div className="liquid-glass-strong rounded-[2rem] p-8 shadow-2xl shadow-black/50 ring-1 ring-white/10 relative overflow-hidden">
          
          {/* Decorative Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-amber-500 rounded-full blur-md opacity-50" />

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Shield size={28} className="text-amber-400" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white font-display italic tracking-tight">BMC Access</h2>
            <p className="text-xs text-white/50 mt-1 uppercase tracking-[0.15em] font-semibold">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <button
              type="button"
              onClick={onBack}
              className="absolute top-8 right-8 text-amber-500 hover:text-white transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={16} className="text-white/40" />
                </div>
                <motion.input
                  ref={inputRef}
                  animate={shaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  type="password"
                  placeholder="Enter Passcode..."
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:bg-black/60 transition-all duration-300 shadow-inner
                    ${error ? 'ring-2 ring-red-500/50 focus:ring-red-500' : 'ring-1 ring-white/10 focus:ring-amber-500/50'}`}
                />
              </div>
              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-semibold mt-2 text-center">
                  {error}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-300 bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40 hover:bg-amber-500 hover:text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 group cursor-pointer"
            >
              Authenticate
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-white/30 text-center mt-4">Hint: Use admin123 or bmc2024</p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
