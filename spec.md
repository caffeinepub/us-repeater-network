# Specification

## Summary
**Goal:** Fix the CHIRP CSV import pipeline so that all 4,000+ repeaters are correctly parsed, stored, and displayed in the US Repeater Network application.

**Planned changes:**
- Add a `bulkAddRepeaters` function to the backend canister (main.mo) that accepts an array of Repeater records and persists all of them in stable storage without truncation or data loss
- Fix the CHIRP CSV parser (`csvParser.ts`) to correctly map all CHIRP CSV columns (Location, Name, Frequency, Duplex, Offset, Tone, rToneFreq, cToneFreq, DtcsCode, Mode, Comment), normalize CTCSS/PL tone values, and reliably extract city/state for all 50 US states
- Update the Admin page (`AdminPage.tsx`) to send all parsed repeaters to the canister in batches (e.g., 200 records per batch) with a progress indicator (e.g., "Saving batch 3 of 20...") and a final summary showing total saved, total skipped, and any errors
- Fix the Directory page (`DirectoryPage.tsx`) to load and display all stored repeaters from the canister without hard-coded limits, and ensure pagination/infinite scroll, search, and filter work across the full dataset
- Require Internet Identity authentication to access the CSV import UI; unauthenticated users see a login prompt, and only admin users can trigger bulk imports

**User-visible outcome:** Admins can upload a CHIRP CSV file with 4,000+ repeaters, see batched progress during import, and have all repeaters fully saved and searchable in the repeater directory after a successful import.
