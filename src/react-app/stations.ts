// Utility to fetch and cache stations list
type Station = { stationName: string; crsCode: string };

declare global {
  interface Window {
    _stationsCache?: Station[];
  }
}

export async function fetchStations(): Promise<Station[]> {
  if (!window._stationsCache) {
    const res = await fetch("/data/stations.json");
    if (!res.ok) throw new Error("Failed to load /data/stations.json");
    window._stationsCache = await res.json();
  }
  return window._stationsCache!;
}
