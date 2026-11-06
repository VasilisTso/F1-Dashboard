// Converts the circuit layouts from bacinger/f1-circuits (MIT) into small SVG path files,
// one per Jolpica circuitId, under src/data/circuits/. Run when the source data changes:
//
//   node scripts/build-circuits.mjs [path-or-url-to-f1-circuits.geojson]
//
// The output is committed, so builds never touch the network.

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";

const SOURCE = "https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson";
const OUT = new URL("../src/data/circuits/", import.meta.url);

// bacinger id -> Jolpica circuitId. Only these are written; unknown ids are reported.
const IDS = {
  "ae-2009": "yas_marina",
  "ar-1952": "galvez",
  "at-1969": "red_bull_ring",
  "au-1953": "albert_park",
  "az-2016": "baku",
  "be-1925": "spa",
  "bh-2002": "bahrain",
  "br-1940": "interlagos",
  "br-1977": "jacarepagua",
  "ca-1978": "villeneuve",
  "cn-2004": "shanghai",
  "de-1927": "nurburgring",
  "de-1932": "hockenheimring",
  "es-1991": "catalunya",
  "es-2026": "madring",
  "fr-1960": "magny_cours",
  "fr-1969": "ricard",
  "gb-1948": "silverstone",
  "hu-1986": "hungaroring",
  "it-1914": "mugello",
  "it-1922": "monza",
  "it-1953": "imola",
  "jp-1962": "suzuka",
  "mc-1929": "monaco",
  "mx-1962": "rodriguez",
  "my-1999": "sepang",
  "nl-1948": "zandvoort",
  "pt-1972": "estoril",
  "pt-2008": "portimao",
  "qa-2004": "losail",
  "ru-2014": "sochi",
  "sa-2021": "jeddah",
  "sg-2008": "marina_bay",
  "tr-2005": "istanbul",
  "us-1909": "indianapolis",
  "us-1956": "watkins_glen",
  "us-2012": "americas",
  "us-2022": "miami",
  "us-2023": "vegas",
  "za-1961": "kyalami",
};

const SIZE = 1000; // longest side of the viewBox
const PAD = 40; // room for the start tick and the stroke
const TOLERANCE = 1.5; // simplification, in viewBox units

// Ramer–Douglas–Peucker: drops points that sit within `eps` of the line through their neighbours.
function simplify(points, eps) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points.at(-1);
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let max = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
    if (d > max) [max, index] = [d, i];
  }
  if (max <= eps) return [points[0], points.at(-1)];
  return [...simplify(points.slice(0, index + 1), eps).slice(0, -1), ...simplify(points.slice(index), eps)];
}

function convert(coordinates) {
  // Local equirectangular projection: fine at circuit scale. y grows downwards in SVG.
  const lat0 = (coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length) * (Math.PI / 180);
  const projected = coordinates.map(([lon, lat]) => [lon * Math.cos(lat0), -lat]);
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  const scale = (SIZE - 2 * PAD) / Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  const points = projected.map(([x, y]) => [(x - minX) * scale + PAD, (y - minY) * scale + PAD]);
  const width = Math.round((Math.max(...xs) - minX) * scale + 2 * PAD);
  const height = Math.round((Math.max(...ys) - minY) * scale + 2 * PAD);

  // The source line starts on the start/finish line and runs in the racing direction.
  const closed = Math.hypot(points[0][0] - points.at(-1)[0], points[0][1] - points.at(-1)[1]) < 1;
  // A closed loop starts and ends on the same point, so simplify each half on its own.
  const [sx0, sy0] = points[0];
  const far = points.reduce((best, [x, y], i) => (Math.hypot(x - sx0, y - sy0) > best.d ? { d: Math.hypot(x - sx0, y - sy0), i } : best), { d: 0, i: 0 }).i;
  const kept = [...simplify(points.slice(0, far + 1), TOLERANCE).slice(0, -1), ...simplify(points.slice(far), TOLERANCE)]
    .map(([x, y]) => [Math.round(x), Math.round(y)]);
  if (closed) kept.pop();
  const d = `M${kept.map(([x, y]) => `${x} ${y}`).join("L")}${closed ? "Z" : ""}`;

  // Direction of travel at the line, from the first point far enough away to be stable.
  const [sx, sy] = points[0];
  const ahead = points.find(([x, y]) => Math.hypot(x - sx, y - sy) > 15) ?? points[1];
  const angle = Math.round((Math.atan2(ahead[1] - sy, ahead[0] - sx) * 180) / Math.PI);
  return { viewBox: `0 0 ${width} ${height}`, d, start: [Math.round(sx), Math.round(sy), angle] };
}

const source = process.argv[2] ?? SOURCE;
const text = /^https?:/.test(source) ? await (await fetch(source)).text() : await readFile(source, "utf8");
const { features } = JSON.parse(text);

await mkdir(OUT, { recursive: true });
for (const file of await readdir(OUT)) if (file.endsWith(".json")) await rm(new URL(file, OUT));

let bytes = 0;
for (const { properties, geometry } of features) {
  const id = IDS[properties.id];
  if (!id) {
    console.warn(`skipped ${properties.id} (${properties.Name}): no Jolpica id mapped`);
    continue;
  }
  const json = JSON.stringify({ name: properties.Name, length: properties.length, ...convert(geometry.coordinates) });
  bytes += json.length;
  await writeFile(new URL(`${id}.json`, OUT), `${json}\n`);
}
console.log(`${features.length} circuits, ${(bytes / 1024).toFixed(1)} KB`);
