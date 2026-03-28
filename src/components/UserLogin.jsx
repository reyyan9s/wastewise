import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Mail, Lock } from 'lucide-react';
import BlurText from './BlurText';

export default function UserLogin({ onLogin, onBack }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate network delay and mock auth success
    setTimeout(() => {
      onLogin({ uid: `mock-${Date.now()}`, email });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0f0a] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Thematic Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-60">
        <img src="/logo.png" alt="" className="w-[150%] h-[150%] max-w-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.03] blur-[2px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] mix-blend-overlay opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm px-6 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center overflow-hidden shadow-[0_4px_24px_rgba(29,158,117,0.4)] ring-[1.5px] ring-[#1D9E75]/30 bg-black/40">
            <img src="/logo.png" alt="WasteWise Logo" className="w-[85%] h-[85%] object-contain" />
          </div>
          <h1 className="text-4xl text-white font-display italic tracking-tight drop-shadow-lg">
            <BlurText text="WasteWise" delay={0.1} />
          </h1>
          <p className="text-[#1D9E75] text-[13px] font-bold tracking-widest uppercase">Civic Action Network</p>
        </div>

        <div className="liquid-glass-strong rounded-[2rem] p-8 shadow-2xl shadow-black/50 ring-1 ring-white/10 relative overflow-hidden">
          {/* Decorative Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#1D9E75] rounded-full blur-md opacity-40" />

          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {isRegistering ? 'Create your Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={onBack}
              className="absolute top-8 right-8 text-[#1D9E75] hover:text-white transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-white/40" />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50 focus:bg-black/60 transition-all duration-300 shadow-inner ring-1 ring-white/10"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={16} className="text-white/40" />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50 focus:bg-black/60 transition-all duration-300 shadow-inner ring-1 ring-white/10"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-1">
                <p className="text-red-400 text-xs font-semibold text-center mt-2">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 mt-2 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer border border-[#1D9E75]/30
                ${loading 
                  ? 'bg-[#1D9E75]/50 text-white/50 cursor-wait' 
                  : 'bg-[#1D9E75]/20 text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white hover:shadow-[0_0_20px_rgba(29,158,117,0.4)]'
                }`}
            >
              {loading ? (isRegistering ? 'Registering...' : 'Signing in...') : (isRegistering ? 'Register' : 'Sign In')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-xs text-white/40 text-center mt-6">
            {isRegistering ? 'Already have an account?' : 'New here?'}
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="ml-1 text-[#1D9E75] font-bold hover:underline underline-offset-4 cursor-pointer"
            >
              {isRegistering ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
