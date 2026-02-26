# Specification

## Summary
**Goal:** Integrate the RepeaterBook public API into the Directory Page so that live ham radio repeater data is fetched and displayed alongside locally submitted repeaters.

**Planned changes:**
- Create `frontend/src/services/repeaterBookApi.ts` that queries `https://www.repeaterbook.com/api/export.php` by state abbreviation, optional city, and optional frequency, maps the response to the app's internal Repeater shape, marks entries with `source: 'repeaterbook'`, and returns an empty array on network failure
- Update `DirectoryPage.tsx` to fetch RepeaterBook data when a state or city filter is selected, show a loading indicator during the fetch, render RepeaterBook results in the same RepeaterCard grid as local repeaters, and display a source badge ("RepeaterBook" or "Local") on each card
- Update `RepeaterDetailModal.tsx` to display `N/A` for missing fields on RepeaterBook entries, and disable the favorite button for RepeaterBook entries with a tooltip explaining favoriting is only available for local repeaters
- Add an informational banner on the Directory Page noting that live ham radio data is sourced from RepeaterBook.com (with a link opening in a new tab) and that GMRS repeaters can be submitted via the submission form, styled with the existing dark navy/charcoal theme and amber/orange accents

**User-visible outcome:** Users browsing the Directory Page will see live RepeaterBook data load automatically when filtering by state or city, displayed alongside local repeaters with clear source badges, and a banner crediting RepeaterBook.com.
