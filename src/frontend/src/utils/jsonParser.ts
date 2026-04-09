// JSON repeater parser — accepts an array of repeater objects and auto-maps
// common field name variations to the internal ParsedRepeater shape.

import type { ParseResult, ParsedRepeater } from "./csvParser";

// Auto-mapping tables: each entry lists accepted field name variations (lowercased, stripped of non-alphanumeric chars)
const FIELD_MAP: Record<keyof ParsedRepeater, string[]> = {
  frequency: [
    "frequency",
    "freq",
    "rxfreq",
    "rx_freq",
    "rxfrequency",
    "outputfreq",
    "outputfrequency",
    "channel_freq",
  ],
  offset: [
    "offset",
    "txoffset",
    "shift",
    "shiftfreq",
    "shift_freq",
    "txshift",
    "repeateroffset",
  ],
  callSign: [
    "callsign",
    "call_sign",
    "call",
    "callsignid",
    "callid",
    "station",
    "repeater",
    "repeatercall",
    "id",
    "name",
    "label",
  ],
  sponsor: ["sponsor", "club", "organization", "org", "trustee", "owner"],
  city: ["city", "location", "loc", "town", "municipality"],
  state: [
    "state",
    "st",
    "province",
    "region",
    "statecode",
    "stateabbr",
    "statename",
  ],
  zipCode: ["zipcode", "zip", "zip_code", "postalcode", "postal"],
  ctcssTone: [
    "ctcsstonefreq",
    "ctcsstonefrequency",
    "ctcss",
    "ctcsstone",
    "tone",
    "pltone",
    "pl",
    "pl_tone",
    "ctcss_tone",
    "squelch",
    "ctcss_encode",
    "tx_ctcss",
    "ctonefreq",
    "ctone",
    "ctonesq",
  ],
  dcsCode: ["dcscode", "dcs", "dtcs", "dtcscode", "dcs_code", "digitaltone"],
  toneMode: [
    "tonemode",
    "mode",
    "tone_mode",
    "modulation",
    "squelchmode",
    "radiomode",
  ],
  coverageDescription: [
    "coveragedescription",
    "coverage",
    "area",
    "coveragearea",
    "range",
  ],
  operationalNotes: [
    "operationalnotes",
    "notes",
    "comment",
    "comments",
    "description",
    "remarks",
    "info",
  ],
  autopatchInfo: ["autopatchinfo", "autopatch", "patch", "phonepatch"],
  linkInfo: [
    "linkinfo",
    "link",
    "linking",
    "echolink",
    "irlp",
    "wires",
    "fusion",
  ],
};

// Full US state name → abbreviation map (same as csvParser)
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
  return upper;
}

function normalizeTone(raw: string | number | undefined): string {
  if (raw === undefined || raw === null || raw === "" || raw === 0) return "";
  const str = String(raw).trim();
  if (str === "0" || str === "0.0" || str === "88.5") return "";
  const num = Number.parseFloat(str);
  if (Number.isNaN(num) || num === 0 || num === 88.5) return "";
  return num.toFixed(1);
}

/**
 * Normalize an object key to lowercase alphanumeric for consistent matching.
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Look up a value in an object using a list of accepted key variations.
 * Returns the first matching value or undefined.
 */
function pick(obj: Record<string, unknown>, variants: string[]): unknown {
  const variantSet = new Set(variants);
  for (const rawKey of Object.keys(obj)) {
    if (variantSet.has(normalizeKey(rawKey))) {
      return obj[rawKey];
    }
  }
  return undefined;
}

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function parseJsonRepeaters(jsonText: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      repeaters: [],
      errors: [
        "Invalid JSON: could not parse the file. Make sure it is a valid JSON array.",
      ],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      repeaters: [],
      errors: [
        "JSON must be an array of repeater objects (e.g. [{...}, {...}]).",
      ],
    };
  }

  if (parsed.length === 0) {
    return {
      repeaters: [],
      errors: ["JSON array is empty — no repeaters to import."],
    };
  }

  const repeaters: ParsedRepeater[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    const rowNum = i + 1;

    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      errors.push(
        `Item ${rowNum}: Expected an object, got ${typeof item}. Skipping.`,
      );
      continue;
    }

    const obj = item as Record<string, unknown>;

    // Frequency (required)
    const freqRaw = pick(obj, FIELD_MAP.frequency);
    const frequency = Number.parseFloat(str(freqRaw));
    if (Number.isNaN(frequency) || frequency <= 0) {
      errors.push(
        `Item ${rowNum}: Missing or invalid frequency ("${freqRaw}"). Skipping.`,
      );
      continue;
    }

    // Offset
    const offsetRaw = pick(obj, FIELD_MAP.offset);
    const offset = Number.parseFloat(str(offsetRaw)) || 0;

    // Call sign
    const callSignRaw = str(pick(obj, FIELD_MAP.callSign)).toUpperCase();

    // Sponsor
    const sponsor = str(pick(obj, FIELD_MAP.sponsor));

    // City
    const city = str(pick(obj, FIELD_MAP.city)) || "Unknown";

    // State
    const stateRaw = str(pick(obj, FIELD_MAP.state));
    const state = normalizeState(stateRaw) || "Unknown";

    // Zip code
    const zipCode = str(pick(obj, FIELD_MAP.zipCode));

    // CTCSS tone
    const ctcssToneRaw = pick(obj, FIELD_MAP.ctcssTone);
    const ctcssTone = normalizeTone(
      ctcssToneRaw as string | number | undefined,
    );

    // DCS code
    const dcsCode = str(pick(obj, FIELD_MAP.dcsCode));

    // Tone / mode
    const toneModeRaw = str(pick(obj, FIELD_MAP.toneMode));
    const toneMode = toneModeRaw || "FM";

    // Optional text fields
    const coverageDescription = str(pick(obj, FIELD_MAP.coverageDescription));
    const operationalNotes = str(pick(obj, FIELD_MAP.operationalNotes));
    const autopatchInfo = str(pick(obj, FIELD_MAP.autopatchInfo));
    const linkInfo = str(pick(obj, FIELD_MAP.linkInfo));

    repeaters.push({
      frequency,
      offset,
      callSign: callSignRaw || `JSON-${rowNum}`,
      sponsor,
      city,
      state,
      zipCode,
      ctcssTone,
      dcsCode,
      toneMode,
      coverageDescription,
      operationalNotes,
      autopatchInfo,
      linkInfo,
    });
  }

  return { repeaters, errors };
}
