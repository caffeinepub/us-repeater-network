// CHIRP CSV parser — converts CHIRP radio memory manager exports to repeater objects

export interface ParsedRepeater {
  frequency: number;
  offset: number;
  callSign: string;
  sponsor: string;
  city: string;
  state: string;
  zipCode: string;
  ctcssTone: string;
  dcsCode: string;
  toneMode: string;
  coverageDescription: string;
  operationalNotes: string;
  autopatchInfo: string;
  linkInfo: string;
}

export interface ParseResult {
  repeaters: ParsedRepeater[];
  errors: string[];
}

// Full US state name → abbreviation map
const STATE_NAME_TO_ABBR: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const VALID_STATE_ABBRS = new Set(Object.values(STATE_NAME_TO_ABBR));

function normalizeState(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (VALID_STATE_ABBRS.has(upper)) return upper;
  const lower = trimmed.toLowerCase();
  if (STATE_NAME_TO_ABBR[lower]) return STATE_NAME_TO_ABBR[lower];
  return upper; // return as-is if unrecognized
}

function normalizeTone(raw: string): string {
  if (!raw || raw === "0" || raw === "0.0" || raw === "88.5") return "";
  const num = Number.parseFloat(raw);
  if (Number.isNaN(num) || num === 0 || num === 88.5) return "";
  return num.toFixed(1);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function extractCityState(comment: string): { city: string; state: string } {
  if (!comment) return { city: "", state: "" };

  // Pattern: "City, ST" or "City ST" or "City, State"
  const patterns = [
    /^([^,]+),\s*([A-Z]{2})\b/,
    /^([^,]+),\s*([A-Za-z\s]+)$/,
    /\b([A-Za-z\s]+),\s*([A-Z]{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = comment.match(pattern);
    if (match) {
      const city = match[1].trim();
      const state = normalizeState(match[2].trim());
      if (state) return { city, state };
    }
  }

  return { city: comment.trim(), state: "" };
}

export function parseChirpCsv(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return {
      repeaters: [],
      errors: ["CSV file is empty or has no data rows."],
    };
  }

  // Find header row
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (
      lines[i].toLowerCase().includes("frequency") ||
      lines[i].toLowerCase().includes("freq")
    ) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseCsvLine(lines[headerIdx]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, ""),
  );

  // Column index helpers
  const col = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const freqCol = col(["frequency", "freq", "rxfreq"]);
  const duplexCol = col(["duplex", "shift", "offset_direction"]);
  const offsetCol = col(["offset", "txoffset", "shift_freq"]);
  const toneCol = col(["tone", "tonemode", "tone_mode", "squelch"]);
  const rToneCol = col([
    "rtonesq",
    "rtonefreq",
    "rtone",
    "ctcss_decode",
    "rx_ctcss",
  ]);
  const cToneCol = col([
    "ctonesq",
    "ctonefreq",
    "ctone",
    "ctcss",
    "ctcss_encode",
    "tx_ctcss",
    "pl",
  ]);
  const dtcsCol = col(["dtcscode", "dtcs", "dcs", "dcs_code"]);
  const modeCol = col(["mode", "modulation"]);
  const nameCol = col(["name", "channel", "label", "description"]);
  const commentCol = col(["comment", "comments", "notes", "location", "city"]);

  if (freqCol === -1) {
    return {
      repeaters: [],
      errors: ["Could not find Frequency column in CSV."],
    };
  }

  const repeaters: ParsedRepeater[] = [];
  const errors: string[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const rowNum = i + 1;

    try {
      // Frequency
      const freqRaw = cols[freqCol] || "";
      const frequency = Number.parseFloat(freqRaw);
      if (Number.isNaN(frequency) || frequency <= 0) {
        errors.push(`Row ${rowNum}: Invalid frequency "${freqRaw}", skipping.`);
        continue;
      }

      // Offset / duplex
      let offset = 0;
      if (offsetCol !== -1 && cols[offsetCol]) {
        offset = Number.parseFloat(cols[offsetCol]) || 0;
      }
      if (duplexCol !== -1 && cols[duplexCol]) {
        const duplex = cols[duplexCol].trim();
        if (duplex === "-") offset = -Math.abs(offset);
        else if (duplex === "+") offset = Math.abs(offset);
        else if (
          duplex === "" ||
          duplex.toLowerCase() === "off" ||
          duplex.toLowerCase() === "simplex"
        )
          offset = 0;
      }

      // Tone mode and CTCSS/DCS
      const toneMode = modeCol !== -1 ? (cols[modeCol] || "FM").trim() : "FM";
      const toneRaw = toneCol !== -1 ? (cols[toneCol] || "").trim() : "";

      let ctcssTone = "";
      let dcsCode = "";

      if (
        toneRaw.toLowerCase().includes("dcs") ||
        toneRaw.toLowerCase().includes("dts")
      ) {
        dcsCode = dtcsCol !== -1 ? (cols[dtcsCol] || "").trim() : "";
      } else {
        // Try cTone first (TX CTCSS), then rTone (RX CTCSS)
        const cToneRaw = cToneCol !== -1 ? (cols[cToneCol] || "").trim() : "";
        const rToneRaw = rToneCol !== -1 ? (cols[rToneCol] || "").trim() : "";
        ctcssTone = normalizeTone(cToneRaw) || normalizeTone(rToneRaw);
      }

      // Call sign / name
      const callSign =
        nameCol !== -1 ? (cols[nameCol] || "").trim().toUpperCase() : "";

      // City / state from comment field
      const comment = commentCol !== -1 ? (cols[commentCol] || "").trim() : "";
      const { city, state } = extractCityState(comment);

      repeaters.push({
        frequency,
        offset,
        callSign: callSign || `IMPORT-${rowNum}`,
        sponsor: "",
        city: city || "Unknown",
        state: state || "Unknown",
        zipCode: "",
        ctcssTone,
        dcsCode,
        toneMode,
        coverageDescription: "",
        operationalNotes: comment,
        autopatchInfo: "",
        linkInfo: "",
      });
    } catch (err) {
      errors.push(
        `Row ${rowNum}: Parse error — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { repeaters, errors };
}
