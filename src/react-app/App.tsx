import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { fetchLiveDepartures } from "./api";
import { fetchStations } from "./stations";
import "./App.css";

interface Station {
  stationName: string;
  crsCode: string;
}

interface Departure {
  time: string;
  destination: string;
  status: string;
}

interface DepartureGroup {
  platform: string;
  departures: Departure[];
}

function Home() {
  const [station, setStation] = useState<string>("");
  const [departures, setDepartures] = useState<DepartureGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [stations, setStations] = useState<Station[]>([]);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStations().then(setStations);
  }, []);

  useEffect(() => {
    if (station.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const s = station.trim().toLowerCase();
    const filtered = stations
      .filter(
        (st) =>
          st.stationName.toLowerCase().includes(s) ||
          st.crsCode.toLowerCase().startsWith(s),
      )
      .slice(0, 8);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [station, stations]);

  function handleSuggestionClick(s: Station) {
    setStation(s.crsCode);
    setShowSuggestions(false);
    inputRef.current && inputRef.current.blur();
  }

  async function fetchDepartures(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDepartures([]);
    try {
      const code = station.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) {
        setError("Please enter a valid 3-letter station code (e.g. EUS)");
        setLoading(false);
        return;
      }
      const deps = await fetchLiveDepartures(code);
      if (deps.length === 0) setError("No departures found.");
      setDepartures(deps);
    } catch (err: any) {
      setError(`Failed to fetch departures. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen h-screen bg-red-100 flex flex-col items-center justify-start py-10 px-4 bg-red-50">
      <h1 className="font-bold mb-6">Live Departures</h1>
      <form
        onSubmit={fetchDepartures}
        className="flex flex-col items-center gap-4 w-full max-w-md bg-white p-6 rounded shadow"
      >
        <div className="relative w-full">
          <input
            id="station-name"
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter station name or code (e.g. EUS)"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            autoComplete="off"
            ref={inputRef}
            required
          />
          {showSuggestions && (
            <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded mt-1 max-h-56 overflow-y-auto shadow-lg">
              {suggestions.map((s) => (
                <li
                  key={s.crsCode}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-100 flex justify-between"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  <span>{s.stationName}</span>
                  <span className="text-gray-500 ml-2">{s.crsCode}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Next 3 Departures"}
        </button>
      </form>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {departures.length > 0 && (
        <div className="platform-board">
          <h2>Departures</h2>
          {departures.map((group, idx) => (
            <div key={group.platform || idx} style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  color: "#ffe600",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  marginBottom: "0.5rem",
                }}
              >
                Platform {group.platform}
              </div>
              <table className="departures-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Destination</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.departures.slice(0, 3).map((dep, i) => (
                    <tr key={group.platform + "-" + i}>
                      <td>{dep.time}</td>
                      <td>{dep.destination}</td>
                      <td className="status">{dep.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
