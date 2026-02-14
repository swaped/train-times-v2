import { Hono } from "hono";

type Bindings = {
  HUXLEY_ACCESS_TOKEN: string;
};

const HUXLEY_BASE = "https://huxley2.azurewebsites.net";

type Departure = {
  time: string;
  destination: string;
  platform: string;
  status: string;
};

type PlatformDepartures = {
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

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/departures/:crs", async (c) => {
  const crs = (c.req.param("crs") ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(crs)) {
    return c.json({ error: "Invalid CRS code" }, 400);
  }

  const accessToken = c.env.HUXLEY_ACCESS_TOKEN;
  if (!accessToken) {
    return c.json({ error: "Missing HUXLEY_ACCESS_TOKEN" }, 500);
  }

  const url = `${HUXLEY_BASE}/departures/${encodeURIComponent(
    crs,
  )}/9?expand=true&accessToken=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  if (!res.ok) {
    return c.json({ error: "Upstream API error" }, 502);
  }

  const data = (await res.json()) as HuxleyDeparturesResponse;
  if (!Array.isArray(data.trainServices))
    return c.json([] satisfies PlatformDepartures[]);

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

  return c.json(
    Object.entries(grouped).map(([platform, deps]) => ({
      platform,
      departures: deps,
    })),
  );
});

export default app;
