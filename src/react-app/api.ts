// Utility to fetch live train departures from Huxley2 API
// https://huxley2.azurewebsites.net/swagger/index.html

const HUXLEY_BASE = "https://huxley2.azurewebsites.net";

type Departure = {
  time: string;
  destination: string;
  platform: string;
  status: string;
};

export type PlatformDepartures = {
  platform: string;
  departures: Departure[];
};

type HuxleyDestination = {
  locationName?: string;
};

type HuxleyService = {
  std?: string;
  etd?: string;
  platform?: string;
  destination?: HuxleyDestination[];
};

type HuxleyDeparturesResponse = {
  trainServices?: HuxleyService[];
};

/**
 * Fetch next live departures for a UK station code
 * @param crs 3-letter station code (e.g. EUS)
 */
export async function fetchLiveDepartures(
  crs: string,
): Promise<PlatformDepartures[]> {
  const accessToken = import.meta.env.VITE_HUXLEY_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Missing VITE_HUXLEY_ACCESS_TOKEN");
  }

  const url = `${HUXLEY_BASE}/departures/${encodeURIComponent(
    crs,
  )}/9?expand=true&accessToken=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");

  const data = (await res.json()) as HuxleyDeparturesResponse;

  if (!Array.isArray(data.trainServices)) return [];

  const departures: Departure[] = data.trainServices.map((svc) => ({
    time: svc.std || svc.etd || "N/A",
    destination: svc.destination?.[0]?.locationName || "Unknown",
    platform: svc.platform || "—",
    status: svc.etd === "On time" ? "On time" : svc.etd || "Unknown",
  }));

  const grouped: Record<string, Departure[]> = {};
  for (const dep of departures) {
    const plat = dep.platform;
    (grouped[plat] ??= []).push(dep);
  }

  return Object.entries(grouped).map(([platform, deps]) => ({
    platform,
    departures: deps,
  }));
}
