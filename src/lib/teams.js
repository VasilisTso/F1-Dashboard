// Team colors keyed by Jolpica `constructorId` (stable across rebrands of the display name).
export const teamColors = {
  red_bull: "#264287",
  ferrari: "#EF1A2D",
  mclaren: "#FF8000",
  mercedes: "#00A19B",
  aston_martin: "#037A68",
  williams: "#1868DB",
  rb: "#FFFFFF",
  haas: "#9C9FA2",
  alpine: "#960963",
  audi: "#F50537",
  cadillac: "#FFB81C",
  // Recent predecessors, so older seasons still get colors.
  sauber: "#52E252",
  alfa: "#A42134",
  alphatauri: "#2B4562",
  toro_rosso: "#469BFF",
  racing_point: "#F596C8",
  force_india: "#F596C8",
  renault: "#FFF500",
  lotus_f1: "#FFB800",
  manor: "#ED1C24",
  marussia: "#6E0000",
  caterham: "#005030",
};

export const FALLBACK_TEAM_COLOR = "#6B7280";

export const getTeamColor = (constructorId) => teamColors[constructorId] ?? FALLBACK_TEAM_COLOR;
