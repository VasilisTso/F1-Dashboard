import express from "express";
import cors from "cors";
import NodeCache from "node-cache";

const app = express();
const cache = new NodeCache({ stdTTL: 60 * 5 });
const PORT = import.meta.env.PORT || 4000;
const API_BASE = import.meta.env.API_BASE || "https://ergast.com/api";

app.use(cors());
app.use(express.json());

const proxyFetch = async (reqPath) => {
  // join our API_BASE with the path we receive.
  const url = `${API_BASE.replace(/\/$/, "")}${reqPath}`;
  const cached = cache.get(url);
  if (cached) return cached;

  const resp = await fetch(url);
  const data = await resp.text(); // return raw to avoid parsing errors
  cache.set(url, data);
  return data;
};

// Generic endpoint: forward any GET path to target API
app.get('/f1/*', async (req, res) => {
  try {
    const path = req.originalUrl; // e.g. /f1/current/driverStandings.json
    const result = await proxyFetch(path);
    // content-type as json
    res.header('Content-Type', 'application/json');
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "proxy error" });
  }
});

app.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));
