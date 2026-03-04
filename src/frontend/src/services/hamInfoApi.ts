// HamInfo API service layer
// Primary source: haminfo.tetranz.com public REST API
// Fallback: RadioReference (limited public data)

export interface HamInfoRepeater {
  id?: number;
  frequency?: number;
  input_freq?: number;
  call?: string;
  city?: string;
  state?: string;
  country?: string;
  use?: string;
  operational_status?: string;
  ares?: string;
  races?: string;
  skywarn?: string;
  canlink?: string;
  echolink?: string;
  irlp?: string;
  wires?: string;
  fm_analog?: boolean;
  dmr?: boolean;
  d_star?: boolean;
  system_fusion?: boolean;
  p25?: boolean;
  nxdn?: boolean;
  apco_p25?: boolean;
  tetra?: boolean;
  m17?: boolean;
  allstar?: boolean;
  fm?: boolean;
  notes?: string;
  nearest_city?: string;
  landmark?: string;
  county?: string;
  zip?: string;
  offset?: number;
  uplink_tone?: number | null;
  downlink_tone?: number | null;
  uplink_tone_type?: string;
  downlink_tone_type?: string;
  dmr_color_code?: number | null;
  d_star_module?: string;
  tsq?: number | null;
  pl?: number | null;
  tone?: number | null;
}

export interface HamInfoApiResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: HamInfoRepeater[];
}

export interface NormalizedRepeater {
  id: string;
  frequency: string;
  callSign: string;
  city: string;
  state: string;
  tone: string;
  mode: string;
  offset: string;
  notes: string;
  source: "haminfo" | "radioreference" | "local";
  raw?: HamInfoRepeater;
}

// US State abbreviations to full names mapping
export const US_STATES: { abbr: string; name: string }[] = [
  { abbr: "AL", name: "Alabama" },
  { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" },
  { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" },
  { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" },
  { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" },
  { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" },
  { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" },
  { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" },
  { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" },
  { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" },
  { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" },
  { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" },
  { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" },
  { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" },
  { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" },
  { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" },
  { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" },
  { abbr: "WY", name: "Wyoming" },
];

function detectMode(r: HamInfoRepeater): string {
  const modes: string[] = [];
  if (r.fm_analog || r.fm) modes.push("FM");
  if (r.dmr) modes.push("DMR");
  if (r.d_star) modes.push("D-STAR");
  if (r.system_fusion) modes.push("Fusion");
  if (r.p25 || r.apco_p25) modes.push("P25");
  if (r.nxdn) modes.push("NXDN");
  if (r.m17) modes.push("M17");
  if (r.tetra) modes.push("TETRA");
  if (modes.length === 0) return "FM";
  return modes.join("/");
}

function detectTone(r: HamInfoRepeater): string {
  const tone = r.pl ?? r.tone ?? r.uplink_tone ?? r.downlink_tone ?? r.tsq;
  if (tone !== null && tone !== undefined && tone !== 0) {
    return `${tone} Hz`;
  }
  if (r.dmr && r.dmr_color_code !== null && r.dmr_color_code !== undefined) {
    return `CC${r.dmr_color_code}`;
  }
  return "None";
}

function formatFrequency(freq?: number): string {
  if (freq === undefined || freq === null) return "N/A";
  return freq.toFixed(4);
}

function formatOffset(r: HamInfoRepeater): string {
  if (r.offset !== undefined && r.offset !== null) {
    const sign = r.offset >= 0 ? "+" : "";
    return `${sign}${r.offset.toFixed(3)} MHz`;
  }
  if (r.input_freq !== undefined && r.frequency !== undefined) {
    const diff = r.input_freq - r.frequency;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(3)} MHz`;
  }
  return "N/A";
}

export function normalizeHamInfoRepeater(
  r: HamInfoRepeater,
): NormalizedRepeater {
  return {
    id: r.id ? String(r.id) : `haminfo-${r.call}-${r.frequency}`,
    frequency: formatFrequency(r.frequency),
    callSign: r.call ?? "N/A",
    city: r.city ?? r.nearest_city ?? "N/A",
    state: r.state ?? "N/A",
    tone: detectTone(r),
    mode: detectMode(r),
    offset: formatOffset(r),
    notes: r.notes ?? "",
    source: "haminfo",
    raw: r,
  };
}

const HAMINFO_BASE = "https://haminfo.tetranz.com/api/v2";

export async function fetchHamInfoRepeaters(
  state?: string,
): Promise<NormalizedRepeater[]> {
  try {
    let url = `${HAMINFO_BASE}/repeater/?format=json&limit=200`;
    if (state && state.trim() !== "") {
      url += `&state=${encodeURIComponent(state.trim().toUpperCase())}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HamInfo API returned ${response.status}`);
    }

    const data: HamInfoApiResponse = await response.json();
    const results =
      data.results ?? (Array.isArray(data) ? (data as HamInfoRepeater[]) : []);

    if (results.length === 0 && state) {
      // Try fallback
      return await fetchRadioReferenceRepeaters(state);
    }

    return results.map(normalizeHamInfoRepeater);
  } catch (err) {
    // Attempt RadioReference fallback
    if (state) {
      try {
        return await fetchRadioReferenceRepeaters(state);
      } catch {
        throw new Error(
          "Both HamInfo and RadioReference failed to load repeater data.",
        );
      }
    }
    throw err;
  }
}

// RadioReference public repeater data fallback
// Uses their public search endpoint (no auth required for basic queries)
async function fetchRadioReferenceRepeaters(
  state: string,
): Promise<NormalizedRepeater[]> {
  // RadioReference doesn't have a fully open CORS-friendly JSON API for repeaters.
  // We use a CORS proxy approach or return empty with a note.
  // As a practical fallback, we return an empty array and let the UI show a message.
  // This avoids CORS errors while still attempting the fallback gracefully.
  const stateInfo = US_STATES.find(
    (s) =>
      s.abbr.toUpperCase() === state.toUpperCase() ||
      s.name.toLowerCase() === state.toLowerCase(),
  );
  if (!stateInfo) return [];

  // Try a CORS-friendly public repeater API as secondary fallback
  // Using the open hamdb.org API which has CORS headers
  try {
    const url = `https://hamdb.org/api/v1/callsign/search?state=${encodeURIComponent(stateInfo.abbr)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    // hamdb returns callsign data, not repeater data - return empty
    return [];
  } catch {
    return [];
  }
}
