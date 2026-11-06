import { weekendSessions } from "./weekend";

// iCalendar (RFC 5545) export, built in the browser: no backend, no requests.

const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // 20261108T170000Z
const day = (d) => d.toISOString().slice(0, 10).replace(/-/g, ""); // 20261108

const escape = (text) =>
  String(text).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");

// Lines longer than 75 octets continue on the next line after a space. Greek is 2 bytes a
// letter, so this counts UTF-8 bytes, never splitting a character.
const encoder = new TextEncoder();
const fold = (line) => {
  const out = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
};

// One VEVENT per session of each race. `t` names the sessions in the active language.
// Untimed sessions (old seasons, unconfirmed slots) become all-day events without an alarm.
export function buildCalendar(races, t) {
  const now = stamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//F1 Dashboard//Race weekends//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const race of races) {
    const loc = race.Circuit.Location;
    const location = `${race.Circuit.circuitName}, ${loc.locality}, ${loc.country}`;
    for (const s of weekendSessions(race)) {
      const title = `${race.raceName}: ${t(`overview.sessions.${s.key}`)}`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${race.season}-${race.round}-${s.key}@f1-dashboard`,
        `DTSTAMP:${now}`,
        ...(s.timed
          ? [`DTSTART:${stamp(s.start)}`, `DTEND:${stamp(s.end)}`]
          : [
              `DTSTART;VALUE=DATE:${day(s.start)}`,
              `DTEND;VALUE=DATE:${day(new Date(s.start.getTime() + 86_400_000))}`,
            ]),
        `SUMMARY:${escape(title)}`,
        `LOCATION:${escape(location)}`,
        ...(race.url ? [`URL:${race.url}`] : []),
        ...(s.timed
          ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escape(title)}`, "TRIGGER:-PT15M", "END:VALARM"]
          : []),
        "END:VEVENT"
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadCalendar(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // Some browsers start the download asynchronously; release the URL afterwards.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
