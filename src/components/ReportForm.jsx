import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { addLocalReport } from '../reportStore';
import { CheckCircle, Recycle } from 'lucide-react';

const WARDS = [
  { name: 'K-West (Andheri West)',  lat: 19.1360, lng: 72.8296 },
  { name: 'K-East (Andheri East)',  lat: 19.1197, lng: 72.8610 },
  { name: 'K-West (Versova)',       lat: 19.1340, lng: 72.8155 },
  { name: 'K-West (Lokhandwala)',   lat: 19.1395, lng: 72.8310 },
  { name: 'K-East (MIDC Marol)',    lat: 19.1120, lng: 72.8780 },
];

const LEVELS = [
  { id: 'critical', label: 'Critical', color: 'bg-[#EF4444]', ring: 'ring-[#EF4444]/30', emoji: '🔴' },
  { id: 'high',     label: 'High',     color: 'bg-[#F59E0B]', ring: 'ring-[#F59E0B]/30', emoji: '🟡' },
  { id: 'normal',   label: 'Normal',   color: 'bg-[#1D9E75]', ring: 'ring-[#1D9E75]/30', emoji: '🟢' },
];

const EMPTY = { location: '', ward: '', level: '', notes: '' };

export default function ReportForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location.trim()) return setError('Location is required.');
    if (!form.ward)            return setError('Please select a ward.');
    if (!form.level)           return setError('Please select a fill level.');

    setSubmitting(true);
    setError('');

    const ward = WARDS.find((w) => w.name === form.ward);
    const lat  = ward.lat + (Math.random() - 0.5) * 0.006;
    const lng  = ward.lng + (Math.random() - 0.5) * 0.006;

    const report = {
      id: `local-${Date.now()}`,
      location: form.location.trim(),
      ward: form.ward,
      level: form.level,
      notes: form.notes.trim(),
      createdAt: new Date(),
      lat,
      lng,
    };

    addLocalReport(report);
    setForm(EMPTY);
    setToast(true);
    setSubmitting(false);

    try {
      await addDoc(collection(db, 'waste_reports'), {
        location: report.location,
        ward: report.ward,
        level: report.level,
        notes: report.notes,
        createdAt: serverTimestamp(),
        lat,
        lng,
      });
    } catch {}
  };

  return (
    <div className="w-full h-full bg-[#0a0f0a] overflow-y-auto relative flex flex-col pt-36 pb-12">
      {/* ── Background Thematic Elements ── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-80">
        <img src="/wastewise-bg-topo.png" alt="" className="w-full h-full object-cover saturate-[1.1] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] mix-blend-overlay opacity-30" />
      </div>
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] animate-slide-down">
          <div className="liquid-glass rounded-2xl px-6 py-4 flex items-center gap-4 whitespace-nowrap">
            <CheckCircle className="text-[#1D9E75]" size={24} />
            <div>
              <p className="text-[15px] font-bold text-[#1D9E75] font-display">Report submitted</p>
              <p className="text-xs text-white/70 font-medium mt-0.5">Switch to Route Map to see the new marker.</p>
            </div>
            <button
              onClick={() => setToast(false)}
              className="ml-3 text-white/50 hover:text-white text-xl leading-none cursor-pointer transition-colors"
            >×</button>
          </div>
        </div>
      )}

      <div className="max-w-[32rem] w-full mx-auto px-6 sm:px-10 py-10 liquid-glass-strong rounded-[2rem] relative z-10 shadow-2xl shadow-black/40">
        <h1 className="text-3xl font-bold text-white font-display tracking-tight">Report Waste</h1>
        <p className="text-[15px] text-white/50 mt-2 mb-8 leading-relaxed">
          Help keep Mumbai clean — report waste for faster collection.
        </p>

        {error && (
          <div className="mb-8 bg-red-50/80 backdrop-blur-sm rounded-xl shadow-sm p-4 border border-red-100 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2 tracking-wide">Location Name</label>
            <input
              type="text"
              placeholder="e.g. Near Lokhandwala Circle"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-sm text-text placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1D9E75]/15 focus:border-[#1D9E75] shadow-sm transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2 tracking-wide">Ward</label>
            <div className="relative">
              <select
                value={form.ward}
                onChange={(e) => set('ward', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-sm text-text focus:outline-none focus:ring-4 focus:ring-[#1D9E75]/15 focus:border-[#1D9E75] shadow-sm transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-gray-400">Select your ward...</option>
                {WARDS.map((w) => (
                  <option key={w.name} value={w.name} className="text-gray-900">{w.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-3 tracking-wide">Fill Level</label>
            <div className="flex gap-3">
              {LEVELS.map((lvl) => {
                const active = form.level === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => set('level', lvl.id)}
                    className={`flex-1 py-3.5 rounded-xl text-[13px] sm:text-sm font-bold border transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5
                      ${active
                        ? `${lvl.color} text-white border-transparent shadow-[0_0_15px_rgba(dropdown,0.4)] ${lvl.ring}`
                        : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:border-white/30'
                      }`}
                  >
                    <span className="mb-1 block text-lg sm:inline sm:mb-0 sm:mr-1.5">{lvl.emoji}</span> {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2 tracking-wide">
              Notes <span className="text-white/40 font-normal ml-1">(Optional)</span>
            </label>
            <textarea
              placeholder="Describe the issue... (e.g. blocking the road)"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-sm text-text placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1D9E75]/15 focus:border-[#1D9E75] shadow-sm transition-all duration-300 resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl text-base font-bold font-display transition-all duration-300 cursor-pointer overflow-hidden relative group
                ${submitting
                  ? 'bg-gray-100 text-[#1D9E75] cursor-wait'
                  : 'bg-gradient-to-r from-[#1D9E75] to-[#147a59] text-white shadow-lg shadow-[#1D9E75]/25 hover:shadow-xl hover:shadow-[#1D9E75]/40 hover:-translate-y-0.5 active:scale-[0.98]'
                }`}
            >
              {!submitting && (
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Report'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
