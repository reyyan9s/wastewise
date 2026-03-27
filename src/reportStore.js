const listeners = new Set();
let localReports = [];

export function addLocalReport(report) {
  localReports = [...localReports, report];
  listeners.forEach((fn) => fn(localReports));
}

export function getLocalReports() {
  return localReports;
}

export function onLocalReportsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
