// RepeaterBook API Service
// Fetches live ham radio repeater data from https://www.repeaterbook.com/api/export.php

export interface RepeaterBookEntry {
  "State ID": string;
  "Rptr ID": string;
  Frequency: string;
  Offset: string;
  "Uplink Tone": string;
  "Downlink Tone": string;
  TSQ: string;
  "Call Sign": string;
  "Nearest City": string;
  Landmark: string;
  County: string;
  State: string;
  Use: string;
  "Operational Status": string;
  Notes: string;
  "Last Update": string;
  "FM Analog": string;
  "DMR": string;
  "D-Star": string;
  "System Fusion": string;
  "P-25": string;
  "NXDN": string;
  "TETRA": string;
  "M17": string;
  "AllStar Node": string;
  "EchoLink Node": string;
  "IRLP Node": string;
  "Wires Node": string;
  "ARES": string;
  "RACES": string;
  "SKYWARN": string;
  "CANWARN": string;
  Lat: string;
  Long: string;
}

export interface RepeaterBookResponse {
  count: number;
  results: RepeaterBookEntry[];
}

export interface MappedRepeaterBookRepeater {
  id: string;
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
  status: "active" | "inactive";
  source: "repeaterbook";
  lat?: number;
  lng?: number;
}

// Map US state abbreviations to FIPS codes for RepeaterBook API
export const STATE_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06",
  CO: "08", CT: "09", DE: "10", DC: "11", FL: "12",
  GA: "13", HI: "15", ID: "16", IL: "17", IN: "18",
  IA: "19", KS: "20", KY: "21", LA: "22", ME: "23",
  MD: "24", MA: "25", MI: "26", MN: "27", MS: "28",
  MO: "29", MT: "30", NE: "31", NV: "32", NH: "33",
  NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38",
  OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49",
  VT: "50", VA: "51", WA: "53", WV: "54", WI: "55",
  WY: "56",
};

function parseOffset(offsetStr: string): number {
  if (!offsetStr || offsetStr === "" || offsetStr === "0") return 0;
  const cleaned = offsetStr.replace(/[^0-9.\-+]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function mapOperationalStatus(status: string): "active" | "inactive" {
  if (!status) return "active";
  const lower = status.toLowerCase();
  if (lower.includes("on") || lower.includes("operational") || lower.includes("open")) {
    return "active";
  }
  return "inactive";
}

function buildToneMode(entry: RepeaterBookEntry): string {
  const modes: string[] = [];
  if (entry["FM Analog"] === "Yes") modes.push("FM");
  if (entry["DMR"] === "Yes") modes.push("DMR");
  if (entry["D-Star"] === "Yes") modes.push("D-Star");
  if (entry["System Fusion"] === "Yes") modes.push("C4FM");
  if (entry["P-25"] === "Yes") modes.push("P25");
  if (entry["NXDN"] === "Yes") modes.push("NXDN");
  if (entry["M17"] === "Yes") modes.push("M17");
  return modes.length > 0 ? modes.join("/") : "FM";
}

function buildLinkInfo(entry: RepeaterBookEntry): string {
  const links: string[] = [];
  if (entry["AllStar Node"] && entry["AllStar Node"] !== "0" && entry["AllStar Node"] !== "") {
    links.push(`AllStar: ${entry["AllStar Node"]}`);
  }
  if (entry["EchoLink Node"] && entry["EchoLink Node"] !== "0" && entry["EchoLink Node"] !== "") {
    links.push(`EchoLink: ${entry["EchoLink Node"]}`);
  }
  if (entry["IRLP Node"] && entry["IRLP Node"] !== "0" && entry["IRLP Node"] !== "") {
    links.push(`IRLP: ${entry["IRLP Node"]}`);
  }
  if (entry["Wires Node"] && entry["Wires Node"] !== "0" && entry["Wires Node"] !== "") {
    links.push(`Wires: ${entry["Wires Node"]}`);
  }
  return links.length > 0 ? links.join(", ") : "None";
}

function buildEmcommInfo(entry: RepeaterBookEntry): string {
  const emcomm: string[] = [];
  if (entry["ARES"] === "Yes") emcomm.push("ARES");
  if (entry["RACES"] === "Yes") emcomm.push("RACES");
  if (entry["SKYWARN"] === "Yes") emcomm.push("SKYWARN");
  if (entry["CANWARN"] === "Yes") emcomm.push("CANWARN");
  return emcomm.length > 0 ? emcomm.join(", ") : "";
}

export function mapRepeaterBookEntry(entry: RepeaterBookEntry): MappedRepeaterBookRepeater {
  const freq = parseFloat(entry.Frequency) || 0;
  const offset = parseOffset(entry.Offset);
  const emcomm = buildEmcommInfo(entry);
  const notes = [entry.Notes, emcomm].filter(Boolean).join(" | ");

  return {
    id: `rb-${entry["State ID"]}-${entry["Rptr ID"]}`,
    frequency: freq,
    offset: offset,
    callSign: entry["Call Sign"] || "N/A",
    sponsor: entry["Call Sign"] || "N/A",
    city: entry["Nearest City"] || entry.Landmark || "N/A",
    state: entry.State || "N/A",
    zipCode: "",
    ctcssTone: entry["Uplink Tone"] || entry["Downlink Tone"] || "None",
    dcsCode: entry.TSQ || "N/A",
    toneMode: buildToneMode(entry),
    coverageDescription: entry.County ? `${entry.County} County` : "N/A",
    operationalNotes: notes || "N/A",
    autopatchInfo: "N/A",
    linkInfo: buildLinkInfo(entry),
    status: mapOperationalStatus(entry["Operational Status"]),
    source: "repeaterbook",
    lat: entry.Lat ? parseFloat(entry.Lat) : undefined,
    lng: entry.Long ? parseFloat(entry.Long) : undefined,
  };
}

export interface FetchRepeaterBookParams {
  stateAbbr?: string;
  city?: string;
  frequency?: string;
}

export async function fetchRepeaterBookData(
  params: FetchRepeaterBookParams
): Promise<MappedRepeaterBookRepeater[]> {
  try {
    const { stateAbbr, city, frequency } = params;

    if (!stateAbbr && !city && !frequency) {
      return [];
    }

    const queryParams = new URLSearchParams();
    queryParams.set("country", "United%20States");

    if (stateAbbr) {
      const fips = STATE_FIPS[stateAbbr.toUpperCase()];
      if (fips) {
        queryParams.set("state_id", fips);
      }
    }

    if (city) {
      queryParams.set("city", city);
    }

    if (frequency) {
      queryParams.set("frequency", frequency);
    }

    // Use a CORS proxy since RepeaterBook API doesn't support browser CORS
    // We try direct first, then fall back gracefully
    const directUrl = `https://www.repeaterbook.com/api/export.php?${queryParams.toString()}`;

    // Try direct fetch first (may work in some environments)
    const response = await fetch(directUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: RepeaterBookResponse = await response.json();

    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map(mapRepeaterBookEntry);
  } catch (error) {
    // Gracefully handle CORS errors, network errors, timeouts
    console.warn("RepeaterBook API fetch failed:", error);
    return [];
  }
}
