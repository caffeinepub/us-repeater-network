# US Repeater Network

## Current State
A ham radio repeater directory app with:
- Backend: Repeater CRUD, bulk CSV import (admin-gated), favorites, user profiles, zip code proximity search
- Frontend: Directory page, admin CSV import page (AdminPage.tsx), Header with nav links
- Admin auth: Uses a two-step approach — UI passphrase `WendellAdmin2024` + backend principal registration via `registerAdmin`. The `adminPrincipal` is stored in a non-stable var so it resets on every canister redeploy, breaking admin access
- The Header shows "Import CSV" only when `isCallerAdmin()` returns true from backend, which also fails after redeploy

## Requested Changes (Diff)

### Add
- Backend: `bulkAddRepeatersWithPassphrase(passphrase: Text, newRepeaters: [Repeater])` — accepts a passphrase directly, checks it against hardcoded `"WendellAdmin2024"`, and inserts all repeaters as approved. No principal registration required.
- Backend: `isAdminPassphraseValid(passphrase: Text)` — returns bool, lets frontend verify passphrase without side effects

### Modify
- Backend: Keep existing `registerAdmin`, `isCallerAdmin`, `bulkAddRepeaters` for backward compatibility, but add the new passphrase-based functions
- Frontend AdminPassphraseGate: Simplify to passphrase-only validation (no backend `isCallerAdmin` check, no `registerAdmin` call). Store validated state in sessionStorage so it persists across navigations. Use `isAdminPassphraseValid` to verify against backend.
- Frontend AdminPage: Call `bulkAddRepeatersWithPassphrase` (passing the passphrase) instead of `bulkAddRepeaters`
- Frontend Header: Always show "Import CSV" nav link (not conditional on isAdmin). The AdminPassphraseGate on the page itself handles access control.

### Remove
- Frontend: Remove dependency on `useIsCallerAdmin` and `useRegisterAdmin` from AdminPassphraseGate and Header

## Implementation Plan
1. Regenerate backend with new `bulkAddRepeatersWithPassphrase` and `isAdminPassphraseValid` functions
2. Update AdminPassphraseGate.tsx to use passphrase-only flow with sessionStorage persistence
3. Update AdminPage.tsx to call `bulkAddRepeatersWithPassphrase` with the stored passphrase
4. Update Header.tsx to always show "Import CSV" link regardless of admin status
5. Build and deploy
