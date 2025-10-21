import axios from "axios";

// Base API URL
const VITE_BASE = import.meta.env.VITE_API_BASE || "https://ergast.com/api";
const USE_PROXY = import.meta.env.VITE_USE_PROXY === "true";
// If proxy is enabled, use local backend (optional)
const API_BASE = USE_PROXY
  ? (import.meta.env.VITE_PROXY_URL || "http://localhost:4000")
  : VITE_BASE;

// Helper to build URLs
const buildUrl = (path) => {
  // Ensure path starts with a slash
  const suffix = path.startsWith("/") ? path : `/${path}`;

  if (USE_PROXY) {
    // Proxy paths get prefixed with /f1
    return `${API_BASE.replace(/\/$/, "")}${
      suffix.startsWith("/f1") ? suffix : `/f1${suffix}`
    }`;
  }

  // Direct calls:
  return `${API_BASE.replace(/\/$/, "")}${suffix}`;
};

// Generic GET
const get = async (path) => {
  const url = buildUrl(path);
  const res = await axios.get(url);
  return res.data;
};

// API functions 
export const getDriverStandings = async () => get("/current/driverStandings.json");
export const getCurrentSeason = async () => get("/current.json");
export const getNextRace = async () => get("/current/next.json");
export const getLastRaceResults = async () => get("/current/last/results.json");
export const getConstructorStandings = async () => get("/current/constructorStandings.json");