// Utility to fetch live train departures via our Worker API.

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

/**
 * Fetch next live departures for a UK station code
 * @param crs 3-letter station code (e.g. EUS)
 */
export async function fetchLiveDepartures(
  crs: string,
): Promise<PlatformDepartures[]> {
  const code = crs.trim().toUpperCase();
  const res = await fetch(`/api/departures/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error("API error");

  return (await res.json()) as PlatformDepartures[];
}
