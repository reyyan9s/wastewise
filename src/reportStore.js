// ── Truck Type Definitions ──────────────────────────────────────────────────
export const TRUCK_TYPES = {
  large: { label: 'Large Truck', capacity: 2000, color: '#1D9E75' },
  small: { label: 'Mini Truck', capacity: 500, color: '#3B82F6' },
};

// ── Report Status Constants ─────────────────────────────────────────────────
export const STATUSES = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  COLLECTED: 'collected',
};

// ── Simulated Volume / Density helpers ──────────────────────────────────────
export function randomVolume() {
  return Math.floor(50 + Math.random() * 550); // 50–600 kg
}

export function densityFromLevel(level) {
  return level === 'critical' || level === 'high' ? 'high' : 'low';
}

export function truckTypeForDensity(density) {
  return density === 'high' ? 'large' : 'small';
}

// ── Core Store ──────────────────────────────────────────────────────────────
const listeners = new Set();
let localReports = [];

export function addLocalReport(report) {
  // Ensure every report has status, density, wasteVolume
  const enriched = {
    status: STATUSES.PENDING,
    density: densityFromLevel(report.level),
    wasteVolume: randomVolume(),
    ...report,
  };
  localReports = [...localReports, enriched];
  listeners.forEach((fn) => fn(localReports));
}

export function getLocalReports() {
  return localReports;
}

export function onLocalReportsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Status Mutation Helpers ─────────────────────────────────────────────────
export function updateReportStatus(id, newStatus) {
  localReports = localReports.map((r) =>
    r.id === id ? { ...r, status: newStatus } : r
  );
  listeners.forEach((fn) => fn(localReports));
}

export function markRouteReportsAssigned(reportIds) {
  const idSet = new Set(reportIds);
  localReports = localReports.map((r) =>
    idSet.has(r.id) ? { ...r, status: STATUSES.ASSIGNED } : r
  );
  listeners.forEach((fn) => fn(localReports));
}
