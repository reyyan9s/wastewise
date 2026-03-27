import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { onLocalReportsChange } from '../reportStore';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createColoredIcon(color, pulse = false) {
  return L.divIcon({
    html: `<div style="position:relative" class="animate-float">
      <div class="marker-hover-group">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15))">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
          <circle cx="12" cy="11.5" r="4.5" fill="#fff"/>
        </svg>
        ${pulse ? `<div style="position:absolute;top:-4px;left:-6px;width:44px;height:44px;border-radius:50%;border:4px solid ${color};opacity:0.4;animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite"></div>` : ''}
      </div>
    </div>`,
    className: 'custom-marker',
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -42],
  });
}

function createEwasteIcon() {
  return L.divIcon({
    html: `<div style="position:relative">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="54">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#3B82F6" stroke="#fff" stroke-width="1.5"/>
        <text x="12" y="15" text-anchor="middle" font-size="11">♻️</text>
      </svg>
      <div style="position:absolute;top:-4px;left:-4px;width:44px;height:44px;border-radius:50%;border:3px solid #3B82F6;opacity:0.3;animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite"></div>
    </div>`,
    className: 'ewaste-marker',
    iconSize: [36, 54],
    iconAnchor: [18, 54],
    popupAnchor: [0, -54],
  });
}

function createTruckIcon() {
  return L.divIcon({
    html: `<div style="position:relative">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1D9E75,#147a59);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(29,158,117,0.5);border:3px solid #fff">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
      <div style="position:absolute;top:-6px;left:-6px;width:60px;height:60px;border-radius:50%;border:3px solid #1D9E75;opacity:0.4;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
      <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:#1D9E75;color:white;font-size:9px;font-weight:800;padding:2px 8px;border-radius:6px;white-space:nowrap;letter-spacing:0.05em;box-shadow:0 2px 8px rgba(0,0,0,0.2)">START</div>
    </div>`,
    className: 'custom-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -30],
  });
}

function getPriority(level) {
  const map = { critical: 0, high: 1, normal: 2 };
  return map[level] ?? 2;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function calculateDistance(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return total;
}

// Priority-based nearest-neighbor routing: critical first, then high, then normal
function optimizeRoute(reports) {
  const valid = reports.filter((r) => r.lat && r.lng);
  if (valid.length === 0) return [];

  // Group by priority tier
  const tiers = { critical: [], high: [], normal: [] };
  valid.forEach((r) => {
    const tier = tiers[r.level] || tiers.normal;
    tier.push([r.lat, r.lng]);
  });

  // Within each tier, apply nearest-neighbor to find the shortest local path
  function nearestNeighborOrder(points, startCoord) {
    if (points.length === 0) return [];
    const remaining = [...points];
    const ordered = [];
    let current = startCoord;

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversineKm(current, remaining[i]);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      current = remaining.splice(bestIdx, 1)[0];
      ordered.push(current);
    }
    return ordered;
  }

  // Build route: critical → high → normal, each tier nearest-neighbor chained
  const route = [];
  let lastCoord = tiers.critical[0] || tiers.high[0] || tiers.normal[0];

  for (const tier of [tiers.critical, tiers.high, tiers.normal]) {
    const ordered = nearestNeighborOrder(tier, lastCoord);
    route.push(...ordered);
    if (ordered.length > 0) lastCoord = ordered[ordered.length - 1];
  }

  return route;
}

// Simulation: random Mumbai-area waste reports
const SIM_LOCATIONS = [
  { location: 'Jogeshwari East', ward: 'K-East', lat: 19.1345, lng: 72.8560 },
  { location: 'D.N. Nagar', ward: 'K-West', lat: 19.1268, lng: 72.8358 },
  { location: 'Santacruz West', ward: 'H-West', lat: 19.0810, lng: 72.8407 },
  { location: 'Vile Parle East', ward: 'K-West', lat: 19.0990, lng: 72.8590 },
  { location: 'Marol Naka', ward: 'K-East', lat: 19.1120, lng: 72.8780 },
  { location: 'Chakala Junction', ward: 'K-East', lat: 19.1175, lng: 72.8695 },
  { location: 'Andheri Station East', ward: 'K-East', lat: 19.1197, lng: 72.8686 },
  { location: 'Powai Lake Road', ward: 'L-Ward', lat: 19.1190, lng: 72.9083 },
  { location: 'Aarey Colony Gate', ward: 'S-Ward', lat: 19.1630, lng: 72.8660 },
  { location: 'Kandivali West', ward: 'R-North', lat: 19.2067, lng: 72.8400 },
];
const SIM_LEVELS = ['critical', 'high', 'high', 'normal', 'critical'];

const LEVEL_COLORS = { critical: '#EF4444', high: '#F59E0B', normal: '#1D9E75' };
const ANDHERI_CENTER = [19.1360, 72.8296];

const FALLBACK_REPORTS = [
  { id: 'd1',  location: 'Lokhandwala Market',      lat: 19.1395, lng: 72.8310, level: 'critical', ward: 'K-West', notes: 'Overflowing bins — 3 days uncollected' },
  { id: 'd2',  location: 'DN Nagar Metro Station',  lat: 19.1268, lng: 72.8358, level: 'critical', ward: 'K-West', notes: 'Construction debris blocking sidewalk' },
  { id: 'd3',  location: 'Versova Fish Market',     lat: 19.1340, lng: 72.8155, level: 'critical', ward: 'K-West', notes: 'Wet waste — requires urgent pickup' },
  { id: 'd4',  location: 'Four Bungalows Junction', lat: 19.1432, lng: 72.8265, level: 'critical', ward: 'K-West', notes: 'Mixed waste pile-up near junction' },
  { id: 'd5',  location: 'Gilbert Hill Road',       lat: 19.1285, lng: 72.8420, level: 'critical', ward: 'K-West', notes: 'E-waste dumped near residential area' },
  { id: 'd6',  location: 'Yari Road',               lat: 19.1480, lng: 72.8230, level: 'high',     ward: 'K-West', notes: '80% full — pickup by evening' },
  { id: 'd7',  location: 'Amboli Naka',             lat: 19.1360, lng: 72.8440, level: 'high',     ward: 'K-West', notes: 'Large bin nearing capacity' },
  { id: 'd8',  location: 'Juhu Tara Road',          lat: 19.1060, lng: 72.8275, level: 'high',     ward: 'K-West', notes: 'Plastic waste accumulating' },
  { id: 'd9',  location: 'Oshiwara Bus Depot',      lat: 19.1510, lng: 72.8355, level: 'high',     ward: 'K-West', notes: 'Bins 75% full' },
  { id: 'd10', location: 'Model Town Lane',         lat: 19.1190, lng: 72.8340, level: 'high',     ward: 'K-West', notes: 'Weekly bulk collection due' },
  { id: 'd11', location: 'Seven Bungalows',         lat: 19.1455, lng: 72.8170, level: 'normal',   ward: 'K-West', notes: 'Regular schedule — no issues' },
  { id: 'd12', location: 'Azad Nagar Metro',        lat: 19.1310, lng: 72.8395, level: 'normal',   ward: 'K-West', notes: 'Collected this morning' },
  { id: 'd13', location: 'Infinity Mall Area',      lat: 19.1225, lng: 72.8310, level: 'normal',   ward: 'K-West', notes: 'Mall waste handled by contractor' },
  { id: 'd14', location: 'JP Road Garden',          lat: 19.1120, lng: 72.8250, level: 'normal',   ward: 'K-West', notes: 'Low volume — park area' },
  { id: 'd15', location: 'Lallubhai Park',          lat: 19.1175, lng: 72.8430, level: 'normal',   ward: 'K-West', notes: 'Composting active' },
  { id: 'd16', location: 'Nehru Road',              lat: 19.1400, lng: 72.8480, level: 'normal',   ward: 'K-West', notes: 'Recently cleared' },
  { id: 'd17', location: 'Mogra Village',           lat: 19.1530, lng: 72.8425, level: 'normal',   ward: 'K-West', notes: 'Dry waste sorted' },
  { id: 'd18', location: 'JVPD Scheme',             lat: 19.1095, lng: 72.8365, level: 'normal',   ward: 'K-West', notes: 'Society manages internally' },
];

function FitBounds({ reports }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (reports.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(reports.filter(r => r.lat && r.lng).map(r => [r.lat, r.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      fitted.current = true;
    }
  }, [reports, map]);
  return null;
}

function PanToNewPoint({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], 14, { duration: 1 });
  }, [point, map]);
  return null;
}

function FlyToCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center?.lat && center?.lng) map.flyTo([center.lat, center.lng], 16, { duration: 1.2 });
  }, [center, map]);
  return null;
}

// ── How It Works Modal ────────────────────────────────────────────────────────
function HowItWorksModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative liquid-glass rounded-3xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
        >×</button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1D9E75]/20 flex items-center justify-center border border-[#1D9E75]/30 shadow-inner">
            <span className="text-2xl drop-shadow-md">🧠</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white font-display italic tracking-tight drop-shadow-sm">System Engine</h2>
            <p className="text-[11px] text-[#1D9E75] uppercase tracking-[0.2em] font-bold mt-0.5">Route Optimization</p>
          </div>
        </div>
        <div className="space-y-5">
          {[
            { icon: '📡', title: 'Real-Time Reports', desc: 'Firebase Firestore instantly pushes new waste updates into the map view.' },
            { icon: '🔴', title: 'Priority Classification', desc: 'Critical zones are dynamically forced to the top of the queue.' },
            { icon: '📍', title: 'Nearest-Neighbor Routing', desc: 'Once clustered by priority, the engine calculates the tightest optimal path.' },
            { icon: '📏', title: 'Metrics Tracking', desc: 'Haversine distance logic automatically calculates active distance & fuel drops.' },
            { icon: '🏙️', title: 'Live Simulation', desc: 'Engage "Simulate City" to watch random events disrupt the planning grid.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 group">
              <span className="text-2xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform">{icon}</span>
              <div>
                <p className="text-[13px] font-bold text-white uppercase tracking-wider">{title}</p>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function MapView({ focusedCenter, onClearFocus }) {
  const [reports, setReports] = useState(FALLBACK_REPORTS);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [newPoint, setNewPoint] = useState(null);
  // Task 4 — simulation
  const [simulating, setSimulating] = useState(false);
  const [routeOutdated, setRouteOutdated] = useState(false);
  const [simPoints, setSimPoints] = useState([]); // track sim-added IDs for pulsing
  const simRef = useRef(null);
  // Task 6 — loading states & modal
  const [showModal, setShowModal] = useState(false);
  const [optimizeStep, setOptimizeStep] = useState(0);
  const OPTIMIZE_MESSAGES = [
    '',
    'Analyzing waste density...',
    'Forming nearest-neighbor clusters...',
    'Calculating distance matrices...',
    'Finalizing optimal route...'
  ];

  useEffect(() => {
    return onLocalReportsChange((localReports) => {
      setReports((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const brandNew = localReports.filter((r) => !existingIds.has(r.id));
        if (brandNew.length === 0) return prev;
        const latest = brandNew[brandNew.length - 1];
        setNewPoint(latest);
        setTimeout(() => setNewPoint(null), 4000);
        return [...prev, ...brandNew];
      });
    });
  }, []);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onSnapshot(
        collection(db, 'waste_reports'),
        (snapshot) => {
          const live = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setReports((prev) => {
            const fallbackIds = new Set(FALLBACK_REPORTS.map(r => r.id));
            const prevLiveIds = new Set(prev.filter(r => !fallbackIds.has(r.id)).map(r => r.id));
            const brandNew = live.filter(r => !fallbackIds.has(r.id) && !prevLiveIds.has(r.id));
            if (brandNew.length > 0) {
              const latest = brandNew[brandNew.length - 1];
              if (latest.lat && latest.lng) {
                setNewPoint(latest);
                setTimeout(() => setNewPoint(null), 4000);
              }
            }
            return [...FALLBACK_REPORTS, ...prev.filter(r => !fallbackIds.has(r.id)), ...brandNew];
          });
        },
        (error) => console.error("Snapshot error:", error)
      );
    } catch (e) {
      console.error("Firebase subscription failed:", e);
    }
    return () => unsubscribe?.();
  }, []);

  // Task 4 — simulation ticker (setInterval, single interval only)
  const simCounterRef = useRef(0);

  useEffect(() => {
    if (!simulating) return;

    // Clear any leftover interval
    if (simRef.current) clearInterval(simRef.current);

    const generateReport = () => {
      // Hardcoded center as requested by TASK 3
      const baseLat = 19.1136;
      const baseLng = 72.8697;
      
      const level = SIM_LEVELS[Math.floor(Math.random() * SIM_LEVELS.length)];
      const id = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const report = {
        id,
        location: 'Simulated Hotspot',
        ward: 'K-East',
        level,
        notes: '🔴 Live — auto-generated by simulation',
        lat: baseLat + (Math.random() - 0.5) * 0.015,
        lng: baseLng + (Math.random() - 0.5) * 0.015,
        createdAt: new Date(),
      };
      setReports((prev) => [...prev, report]);
      setSimPoints((prev) => [...prev, id]);
      setNewPoint(report);
      setTimeout(() => setNewPoint(null), 3500);
      setRouteOutdated(true);
    };

    // Fire first report immediately
    generateReport();

    // Then fire every 2.5s
    simRef.current = setInterval(generateReport, 2500);

    return () => {
      if (simRef.current) {
        clearInterval(simRef.current);
        simRef.current = null;
      }
    };
  }, [simulating]);

  // Task 2 — real dynamic stats
  const stats = useMemo(() => {
    const validReports = reports.filter(r => r.lat && r.lng);
    const beforeStops = validReports.length;
    const allCoords = validReports.map(r => [r.lat, r.lng]);
    const distanceBefore = calculateDistance(allCoords);
    const distanceAfter = routeCoords.length > 1 ? calculateDistance(routeCoords) : distanceBefore;
    const afterStops = routeCoords.length > 0 ? routeCoords.length : beforeStops;
    const distanceSaved = Math.max(0, distanceBefore - distanceAfter);
    const improvement = distanceBefore > 0 ? Math.round((distanceSaved / distanceBefore) * 100) : 0;
    const fuelSaved = distanceSaved * 0.2; // fuel saved @ 0.2 L/km
    // Task 5 — efficiency score: realistic hackathon metric (base 50-70, max ~98)
    const baseScore = Math.max(45, 82 - beforeStops); // E.g., 22 stops -> 60
    const efficiencyScore = Math.min(98, baseScore + Math.floor(improvement * 1.5));
    return { beforeStops, afterStops, distanceBefore, distanceAfter, distanceSaved, improvement, fuelSaved, efficiencyScore, baseScore };
  }, [reports, routeCoords]);

  // Task 3 — route explanation data
  // Task 3 & 6 — route explanation data
  const routeExplanation = useMemo(() => {
    const validReports = reports.filter(r => r.lat && r.lng);
    const critical = validReports.filter(r => r.level === 'critical').length;
    const clusters = optimized ? (validReports.length - routeCoords.length) : 0;
    return { critical, clusters };
  }, [reports, routeCoords, optimized]);

  const handleOptimize = useCallback(() => {
    setIsOptimizing(true);
    setRouteOutdated(false);
    setOptimizeStep(1);

    let step = 1;
    const interval = setInterval(() => {
      step++;
      if (step <= 4) setOptimizeStep(step);
    }, 600);

    setTimeout(() => {
      clearInterval(interval);
      setRouteCoords(optimizeRoute(reports));
      setOptimized(true);
      setIsOptimizing(false);
      setOptimizeStep(0);
      setNewPoint(null);
    }, 2500);
  }, [reports]);

  const counts = useMemo(() => ({
    critical: reports.filter(r => r.level === 'critical').length,
    high: reports.filter(r => r.level === 'high').length,
    normal: reports.filter(r => r.level === 'normal').length,
  }), [reports]);

  const simPointSet = useMemo(() => new Set(simPoints), [simPoints]);

  return (
    <div className="relative w-full h-full">
      <MapContainer center={ANDHERI_CENTER} zoom={14} className="w-full h-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds reports={reports} />
        <PanToNewPoint point={newPoint} />

        {reports.map((r) => {
          if (!r.lat || !r.lng) return null;
          const pulse = simPointSet.has(r.id);
          return (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={createColoredIcon(LEVEL_COLORS[r.level] || LEVEL_COLORS.normal, pulse)}>
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <p className="font-semibold">{r.location}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Ward: {r.ward}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white
                    ${r.level === 'critical' ? 'bg-red-500' : r.level === 'high' ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                    {r.level.toUpperCase()}
                  </span>
                  {pulse && <span className="ml-2 text-xs text-orange-500 font-semibold">🔴 LIVE</span>}
                  {r.notes && <p className="text-xs text-gray-500 mt-1">{r.notes}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Optimised route — custom styled flow path */}
        {routeCoords.length > 1 && (
          <Polyline positions={routeCoords} pathOptions={{ color: '#1D9E75', weight: 5, className: 'route-path' }} />
        )}

        {/* Truck start marker */}
        {optimized && routeCoords.length > 0 && (
          <Marker position={routeCoords[0]} icon={createTruckIcon()} zIndexOffset={2000}>
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-bold text-[#1D9E75] text-base">🚛 Route Start</p>
                <p className="text-gray-500 text-xs mt-1">Collection begins here</p>
                <p className="text-gray-400 text-[10px] mt-1">First stop: Critical priority</p>
              </div>
            </Popup>
          </Marker>
        )}

        {focusedCenter && focusedCenter.lat && focusedCenter.lng && (
          <>
            <FlyToCenter center={focusedCenter} />
            <Marker position={[focusedCenter.lat, focusedCenter.lng]} icon={createEwasteIcon()}>
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <p className="font-bold text-blue-600 text-base">♻️ {focusedCenter.name}</p>
                  <p className="text-gray-500 text-xs mt-1">📍 {focusedCenter.area}</p>
                  <p className="text-gray-500 text-xs mt-1">📦 Accepts: {focusedCenter.accepted?.join(', ')}</p>
                  <p className="text-gray-500 text-xs mt-1">🕐 {focusedCenter.hours}</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* ── How It Works Modal ── */}
      {showModal && <HowItWorksModal onClose={() => setShowModal(false)} />}

      {/* ── Focused e-waste center banner ── */}
      {focusedCenter && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1000] animate-slide-down">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-glass border border-blue-100 px-6 py-4 flex items-center gap-4 max-w-md">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="text-2xl">♻️</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-blue-600 font-display truncate">{focusedCenter.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">📍 {focusedCenter.area} · {focusedCenter.hours}</p>
            </div>
            <button onClick={onClearFocus} className="ml-2 text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer transition-colors shrink-0">×</button>
          </div>
        </div>
      )}

      {/* ── Task 5 — Efficiency Score Bar (top center) ── */}
      <motion.div initial={{ y: -20, opacity: 0, filter: 'blur(10px)' }} whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }} viewport={{ once: true, margin: '-50px' }} className="absolute top-28 left-1/2 -translate-x-1/2 z-[999] pointer-events-none" style={{ marginTop: focusedCenter ? '76px' : '0' }}>
        <div className="liquid-glass rounded-2xl px-6 py-3 flex items-center gap-4 min-w-[280px] pointer-events-auto">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] whitespace-nowrap">Efficiency Score</span>
          <div className="flex-1 h-2 bg-black/40 shadow-inner rounded-full overflow-hidden ring-1 ring-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#F59E0B] via-[#1D9E75] to-[#059669] rounded-full transition-all duration-1000"
              style={{ width: `${optimized ? stats.efficiencyScore : stats.baseScore}%` }}
            />
          </div>
          <span className="text-xl font-display italic font-bold text-[#1D9E75] whitespace-nowrap tabular-nums drop-shadow-sm">
            {optimized ? `${stats.baseScore} → ${stats.efficiencyScore}` : `${stats.baseScore}`}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#1D9E75]/20 text-white/60 hover:text-white text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors cursor-pointer ring-1 ring-white/5"
            title="How it works"
          >?</button>
        </div>
      </motion.div>

      {/* ── Left Sidebar Control Panel ── */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="absolute top-28 left-6 z-[1000] w-[300px] flex flex-col gap-5 pointer-events-none pb-[120px] h-[calc(100vh-160px)]">
        
        {/* Current View Card */}
        <motion.div variants={{ hidden: { opacity: 0, y: 30, filter: 'blur(8px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)' } }} className="liquid-glass rounded-3xl p-6 pointer-events-auto transition-transform duration-300 hover:scale-[1.02] shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1D9E75] font-bold mb-1">Live Feed</p>
          <p className="text-3xl font-bold text-white font-display italic tracking-tight drop-shadow-sm">K-West Ward</p>
          <div className="flex items-center justify-between mt-4 bg-black/20 shadow-inner rounded-2xl p-3 ring-1 ring-white/5">
            <span className="flex flex-col items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase font-semibold text-white/50">
              <span className="w-2.5 h-2.5 rounded-full bg-critical shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              {counts.critical} crit
            </span>
            <span className="flex flex-col items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase font-semibold text-white/50">
              <span className="w-2.5 h-2.5 rounded-full bg-high shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
              {counts.high} high
            </span>
            <span className="flex flex-col items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase font-semibold text-white/50">
              <span className="w-2.5 h-2.5 rounded-full bg-normal shadow-[0_0_8px_rgba(29,158,117,0.5)]"></span>
              {counts.normal} norm
            </span>
          </div>
        </motion.div>

        {/* Uncollected Critical Points List */}
        <motion.div variants={{ hidden: { opacity: 0, y: 30, filter: 'blur(8px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)' } }} className="liquid-glass rounded-3xl p-5 pointer-events-auto flex-1 overflow-y-auto scrollbar-hide flex flex-col transition-transform duration-300 hover:scale-[1.02]">
          <p className="text-[11px] font-bold text-white/80 mb-4 uppercase tracking-[0.2em] flex items-center justify-between shrink-0">
            <span>Critical Hotspots</span>
            {counts.critical > 0 && <span className="bg-red-500/20 ring-1 ring-red-500/50 text-red-400 px-2 py-0.5 rounded-full text-[10px] animate-pulse">{counts.critical} Live</span>}
          </p>
          <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
            {reports.filter(r => r.level === 'critical').map(r => (
              <div key={r.id} className="bg-black/20 shadow-inner rounded-2xl p-3.5 ring-1 ring-red-500/20 flex gap-3 group transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:ring-red-500/40 cursor-pointer">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.6)] group-hover:scale-125 transition-transform" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-white/90 truncate">{r.location}</p>
                  <p className="text-[10px] text-white/50 mt-1 line-clamp-2 leading-relaxed">{r.notes}</p>
                </div>
              </div>
            ))}
            {counts.critical === 0 && (
              <div className="h-full flex items-center justify-center flex-col text-[#1D9E75] opacity-60 px-4 text-center">
                <span className="text-3xl mb-2 drop-shadow-sm">✅</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No Critical Hazards</p>
                <p className="text-[10px] mt-1.5 text-white/40">All high-priority zones are clear.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Right card: Priority Legend ── */}
      <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} className="absolute top-28 right-6 z-[1000] pointer-events-none">
        <div className="liquid-glass rounded-3xl p-5 min-w-[150px] pointer-events-auto">
          <p className="text-[10px] font-bold text-white/50 mb-4 uppercase tracking-[0.2em]">Priority Level</p>
          <div className="flex flex-col gap-3">
            {Object.entries(LEVEL_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-3 group">
                <span className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
                <span className="text-[12px] font-bold text-white/80 uppercase tracking-widest">{level}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Task 3 — Route Explanation Card (appears after optimize) ── */}
      {optimized && (
        <motion.div initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} className="absolute top-[172px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none" style={{ marginTop: focusedCenter ? '76px' : '0' }}>
          <div className="liquid-glass rounded-3xl px-6 py-5 min-w-[250px] pointer-events-auto ring-1 ring-[#1D9E75]/30">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#1D9E75] font-bold mb-3 drop-shadow-sm">⚡ Route Optimized</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="w-5 h-5 rounded-full bg-red-500/20 ring-1 ring-red-500/30 flex items-center justify-center text-[10px] drop-shadow-sm">🔴</span>
                <span className="leading-snug"><b>{routeExplanation.critical}</b> critical zones prioritized first</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 ring-1 ring-amber-500/30 flex items-center justify-center text-[10px] drop-shadow-sm">📍</span>
                <span className="leading-snug"><b>{routeExplanation.clusters}</b> stops batched into clusters</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="w-5 h-5 rounded-full bg-[#1D9E75]/20 ring-1 ring-[#1D9E75]/30 flex items-center justify-center text-[10px] drop-shadow-sm">📏</span>
                <span className="leading-snug"><b>{stats.improvement}%</b> distance reduction achieved</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── New report banner ── */}
      {newPoint && (
        <div className="absolute top-[280px] left-1/2 -translate-x-1/2 z-[1000] animate-bounce pointer-events-none">
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-full shadow-xl shadow-red-500/30 text-sm font-bold flex items-center gap-3 border border-red-400/50 backdrop-blur-sm pointer-events-auto">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            New report: {newPoint.location}
          </div>
        </div>
      )}

      {/* ── Task 4 — Route outdated warning ── */}
      {routeOutdated && optimized && (
        <div className="absolute top-[340px] left-1/2 -translate-x-1/2 z-[1000] animate-fade-in pointer-events-none">
          <div className="bg-amber-500/95 backdrop-blur-lg text-white px-5 py-2.5 rounded-full shadow-[0_8px_32px_rgba(245,158,11,0.3)] text-xs font-bold flex items-center gap-2 border border-white/20 pointer-events-auto">
            ⚠️ New reports added — Re-optimize route
          </div>
        </div>
      )}

      {/* ── Bottom full-width stat navbar ── */}
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 120 }} className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="liquid-glass-strong border-t-0 shadow-[0_-8px_40px_rgba(0,0,0,0.6)] px-6 py-5 transition-all duration-500 pointer-events-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto">

            {/* Stats */}
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide px-2">
              <StatItem label="Total Stops" value={`${stats.beforeStops}`} icon="📍" />
              <Divider />
              <StatItem
                label="Optimized"
                value={optimized ? `${stats.afterStops} stops` : `${stats.beforeStops} stops`}
                icon="✅"
                highlight
                max={stats.beforeStops}
                current={optimized ? (stats.beforeStops - stats.afterStops) : 0}
              />
              <Divider />
              <StatItem
                label="Distance Saved"
                value={optimized ? `${stats.distanceSaved.toFixed(1)} km` : `0.0 km`}
                icon="📏"
                highlight
                max={stats.distanceBefore > 0 ? stats.distanceBefore * 0.5 : 10}
                current={optimized ? stats.distanceSaved : 0}
              />
              <Divider />
              <StatItem
                label="Fuel Saved"
                value={optimized ? `${stats.fuelSaved.toFixed(1)} L` : `0.0 L`}
                icon="⛽"
                highlight
                max={stats.distanceBefore > 0 ? (stats.distanceBefore * 0.2) * 0.5 : 5}
                current={optimized ? stats.fuelSaved : 0}
              />
              <Divider />
              <StatItem
                label="Efficiency"
                value={optimized ? `+${stats.improvement}%` : `+0%`}
                icon="🚀"
                highlight
                max={100}
                current={optimized ? stats.improvement : 0}
              />
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              {/* Task 4 — Simulation toggle */}
              <button
                onClick={() => setSimulating(s => !s)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ring-1 shadow-inner
                  ${simulating
                    ? 'bg-orange-500/20 ring-orange-500/50 text-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.2)]'
                    : 'bg-black/40 ring-white/10 text-white/50 hover:ring-white/30 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${simulating ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
                {simulating ? 'Simulating…' : 'Simulate City'}
              </button>

              {/* Optimize button */}
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className={`flex-1 sm:flex-none px-6 py-3.5 rounded-xl text-[13px] tracking-wider uppercase font-bold transition-all duration-300 cursor-pointer overflow-hidden relative group shadow-md
                  ${isOptimizing
                    ? 'bg-black/20 text-[#1D9E75] cursor-wait ring-1 ring-[#1D9E75]/30'
                    : 'bg-gradient-to-r from-[#1D9E75] to-[#147a59] text-white hover:shadow-[0_4px_20px_rgba(29,158,117,0.4)] hover:-translate-y-0.5 active:scale-95 ring-1 ring-white/10'}`}
              >
                {!isOptimizing && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isOptimizing ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Optimizing Route...</span>
                      </div>
                      <span className="text-[10px] font-normal text-white/80 absolute -bottom-5 whitespace-nowrap animate-pulse">
                        {OPTIMIZE_MESSAGES[optimizeStep]}
                      </span>
                    </div>
                  ) : optimized ? '⚡ Re-optimize Map' : '⚡ Optimize Route'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-12 bg-white/10 shrink-0 mx-2" />;
}

function StatItem({ label, value, icon, highlight, max, current }) {
  return (
    <div className="flex flex-col gap-2 min-w-[150px] group cursor-default">
      <div className="flex items-center gap-3.5">
        <div className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 shadow-sm ${highlight ? 'bg-gradient-to-br from-[#1D9E75] to-[#147a59] text-white shadow-lg shadow-[#1D9E75]/30 group-hover:scale-110 group-hover:-translate-y-0.5 ring-1 ring-white/20' : 'bg-black/40 text-white/50 ring-1 ring-white/10 shadow-inner group-hover:bg-black/60 group-hover:text-white/80'}`}>
          <span className="text-[18px] drop-shadow-sm">{icon}</span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1D9E75] font-bold mb-0.5 opacity-80">{label}</p>
          <p className={`text-[26px] leading-none font-bold font-display italic tracking-tight drop-shadow-sm ${highlight ? 'text-white' : 'text-white/80'}`}>{value}</p>
        </div>
      </div>
      {max !== undefined && (
        <div className="h-1.5 bg-black/40 shadow-inner rounded-full overflow-hidden w-full ring-1 ring-inset ring-white/5 mt-0.5">
          <div className="h-full bg-gradient-to-r from-[#1D9E75] to-[#24c08e] transition-all duration-1000 ease-out rounded-full" style={{ width: `${Math.min(100, (current / max) * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
