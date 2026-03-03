// CHIRP CSV Parser - Comprehensive implementation for all CHIRP CSV column mappings

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
  status: 'active' | 'inactive';
  submittedBy: string;
}

export interface ParseResult {
  repeaters: ParsedRepeater[];
  skipped: number;
  errors: string[];
}

// Full US state name to abbreviation mapping
const STATE_NAME_TO_ABBR: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
};

const STATE_ABBRS = new Set(Object.values(STATE_NAME_TO_ABBR));

function normalizeStateToAbbr(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (STATE_ABBRS.has(upper)) return upper;
  const lower = trimmed.toLowerCase();
  if (STATE_NAME_TO_ABBR[lower]) return STATE_NAME_TO_ABBR[lower];
  // Try partial match for multi-word states
  for (const [name, abbr] of Object.entries(STATE_NAME_TO_ABBR)) {
    if (lower.includes(name)) return abbr;
  }
  return trimmed;
}

// Extract city and state from various CHIRP CSV fields
function extractCityState(comment: string, name: string, location: string): { city: string; state: string } {
  // Try Comment field first - common formats: "City, ST" or "City ST" or "City, State"
  const sources = [comment, name, location].filter(Boolean);

  for (const source of sources) {
    // Pattern: "City, ST" or "City, State"
    const commaMatch = source.match(/^([^,]+),\s*([A-Za-z\s]+)$/);
    if (commaMatch) {
      const city = commaMatch[1].trim();
      const stateRaw = commaMatch[2].trim();
      const state = normalizeStateToAbbr(stateRaw);
      if (state && city) return { city, state };
    }

    // Pattern: ends with " ST" (2-letter state abbr)
    const abbrMatch = source.match(/^(.*?)\s+([A-Z]{2})$/);
    if (abbrMatch) {
      const city = abbrMatch[1].trim();
      const state = abbrMatch[2];
      if (STATE_ABBRS.has(state) && city) return { city, state };
    }

    // Pattern: "City State" where State is a full name
    for (const [stateName, stateAbbr] of Object.entries(STATE_NAME_TO_ABBR)) {
      const stateRegex = new RegExp(`^(.*?)\\s+${stateName}\\s*$`, 'i');
      const match = source.match(stateRegex);
      if (match && match[1].trim()) {
        return { city: match[1].trim(), state: stateAbbr };
      }
    }
  }

  // Fallback: use location as city if nothing else works
  if (location && location.trim()) {
    return { city: location.trim(), state: '' };
  }

  return { city: '', state: '' };
}

// Normalize CTCSS/PL tone value
// CHIRP uses 88.5 Hz as "no tone" sentinel
function normalizeTone(toneStr: string): string {
  if (!toneStr || toneStr.trim() === '' || toneStr.trim() === '0' || toneStr.trim() === '0.0') {
    return '';
  }
  const val = parseFloat(toneStr);
  if (isNaN(val) || val === 88.5) return '';
  // Return as string with one decimal place
  return val.toFixed(1);
}

// Parse a CSV line respecting quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseChirpCsv(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    return { repeaters: [], skipped: 0, errors: ['CSV file is empty or has no data rows'] };
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map(h => h.trim().replace(/^#\s*/, '').trim());

  // Build column index map (case-insensitive)
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    colIndex[h.toLowerCase()] = i;
  });

  const getCol = (row: string[], ...names: string[]): string => {
    for (const name of names) {
      const idx = colIndex[name.toLowerCase()];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx].trim();
      }
    }
    return '';
  };

  const repeaters: ParsedRepeater[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const row = parseCsvLine(line);

      // Extract frequency - required field
      const freqStr = getCol(row, 'Frequency', 'freq');
      const frequency = parseFloat(freqStr);
      if (isNaN(frequency) || frequency <= 0) {
        skipped++;
        continue;
      }

      // Extract offset/duplex
      const duplexStr = getCol(row, 'Duplex', 'duplex');
      const offsetStr = getCol(row, 'Offset', 'offset');
      let offset = parseFloat(offsetStr) || 0;
      if (duplexStr === '-') offset = -Math.abs(offset);
      else if (duplexStr === '+') offset = Math.abs(offset);
      else if (duplexStr === '') offset = 0;

      // Extract call sign from Name field
      const nameField = getCol(row, 'Name', 'name');
      // CHIRP Name field often contains call sign or description
      const callSign = nameField || `CH${getCol(row, 'Location', 'location') || i}`;

      // Extract tone information
      const toneField = getCol(row, 'Tone', 'tone');
      const rToneFreq = getCol(row, 'rToneFreq', 'rtonefreq', 'r_tone_freq');
      const cToneFreq = getCol(row, 'cToneFreq', 'ctonefreq', 'c_tone_freq');
      const dtcsCode = getCol(row, 'DtcsCode', 'dtcscode', 'dtcs_code', 'DtcsRxCode');

      // Determine tone mode and CTCSS tone
      let ctcssTone = '';
      let dcsCode = '';
      let toneMode = getCol(row, 'Mode', 'mode') || 'FM';

      // CHIRP Tone field values: "", "Tone", "TSQL", "DTCS", "Cross", etc.
      if (toneField === 'Tone' || toneField === 'TSQL') {
        // Use cToneFreq for encode, rToneFreq for decode
        ctcssTone = normalizeTone(cToneFreq) || normalizeTone(rToneFreq);
      } else if (toneField === 'DTCS') {
        dcsCode = dtcsCode || '';
        ctcssTone = '';
      } else if (toneField === 'Cross') {
        ctcssTone = normalizeTone(cToneFreq) || normalizeTone(rToneFreq);
      } else {
        // No tone or unknown - try rToneFreq/cToneFreq anyway
        ctcssTone = normalizeTone(cToneFreq) || normalizeTone(rToneFreq);
      }

      // Extract location info from Comment field
      const commentField = getCol(row, 'Comment', 'comment', 'comments');
      const locationField = getCol(row, 'Location', 'location');

      const { city, state } = extractCityState(commentField, nameField, locationField);

      const repeater: ParsedRepeater = {
        frequency,
        offset,
        callSign: callSign.toUpperCase(),
        sponsor: '',
        city: city || 'Unknown',
        state: state || 'Unknown',
        zipCode: '',
        ctcssTone,
        dcsCode: dcsCode || 'N/A',
        toneMode,
        coverageDescription: commentField || '',
        operationalNotes: '',
        autopatchInfo: '',
        linkInfo: '',
        status: 'active',
        submittedBy: 'CHIRP Import',
      };

      repeaters.push(repeater);
    } catch (err) {
      skipped++;
      if (errors.length < 10) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
      }
    }
  }

  return { repeaters, skipped, errors };
}
