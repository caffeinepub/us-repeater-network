import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteApprovedRepeaters, useGetApprovedRepeaters } from '../hooks/useQueries';
import RepeaterCard from '../components/RepeaterCard';
import RepeaterDetailModal from '../components/RepeaterDetailModal';
import FilterBar, { FilterState } from '../components/FilterBar';
import type { Repeater } from '../backend';
import { Loader2, Radio, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Normalize state values to abbreviations for consistent filtering
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

function normalizeState(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const lower = trimmed.toLowerCase();
  return STATE_NAME_TO_ABBR[lower] || upper;
}

export default function DirectoryPage() {
  const [filters, setFilters] = useState<FilterState>({ search: '', state: '', mode: '' });
  const [selectedRepeater, setSelectedRepeater] = useState<Repeater | null>(null);

  const hasFilters = !!(filters.search || filters.state || filters.mode);

  // When filters are active, fetch all repeaters for client-side filtering
  const allRepeatersQuery = useGetApprovedRepeaters();

  // When no filters, use infinite scroll
  const infiniteQuery = useInfiniteApprovedRepeaters();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (!hasFilters && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      infiniteQuery.fetchNextPage();
    }
  }, [hasFilters, infiniteQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loadMore]);

  // Compute displayed repeaters
  let displayedRepeaters: Repeater[] = [];
  let totalCount = 0;
  let isLoading = false;
  let isError = false;

  if (hasFilters) {
    isLoading = allRepeatersQuery.isLoading;
    isError = allRepeatersQuery.isError;
    const all = allRepeatersQuery.data || [];
    totalCount = all.length;

    displayedRepeaters = all.filter((r) => {
      const normalizedRState = normalizeState(r.state);
      if (filters.state && normalizedRState !== filters.state) return false;
      if (filters.mode && r.toneMode.toUpperCase() !== filters.mode.toUpperCase()) return false;
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches =
          r.callSign.toLowerCase().includes(term) ||
          r.city.toLowerCase().includes(term) ||
          r.state.toLowerCase().includes(term) ||
          r.frequency.toString().includes(term) ||
          r.sponsor.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  } else {
    isLoading = infiniteQuery.isLoading;
    isError = infiniteQuery.isError;
    const pages = infiniteQuery.data?.pages || [];
    displayedRepeaters = pages.flat();
    totalCount = displayedRepeaters.length;
  }

  // Available states from loaded data (for filter bar dropdown)
  const availableStates = React.useMemo(() => {
    const source = hasFilters
      ? (allRepeatersQuery.data || [])
      : (infiniteQuery.data?.pages.flat() || []);
    const stateSet = new Set<string>();
    source.forEach((r) => {
      const norm = normalizeState(r.state);
      if (norm) stateSet.add(norm);
    });
    return Array.from(stateSet).sort();
  }, [hasFilters, allRepeatersQuery.data, infiniteQuery.data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading repeater directory...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load repeaters. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Repeater Directory</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Browse and search the US Repeater Network database.
          </p>
        </div>

        {/* Filter Bar — uses FilterState interface (filters + onFiltersChange) */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          availableStates={availableStates}
          resultCount={hasFilters ? displayedRepeaters.length : totalCount}
          visibleCount={hasFilters ? undefined : displayedRepeaters.length}
          isUnfilteredAll={!hasFilters}
        />

        {/* Results */}
        {displayedRepeaters.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Radio className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-lg font-semibold text-foreground">No repeaters found</p>
            <p className="text-muted-foreground text-sm">
              {hasFilters
                ? 'Try adjusting your search filters.'
                : 'No repeaters have been added yet. Import a CHIRP CSV to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {displayedRepeaters.map((repeater) => (
                <RepeaterCard
                  key={Number(repeater.id)}
                  repeater={repeater}
                  onClick={() => setSelectedRepeater(repeater)}
                  onFavoriteToggle={() => {}}
                  favoritesDisabled={false}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {!hasFilters && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {infiniteQuery.isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading more repeaters...</span>
                  </div>
                ) : infiniteQuery.hasNextPage ? (
                  <button
                    onClick={loadMore}
                    className="text-sm text-primary hover:underline"
                  >
                    Load more
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    All {totalCount.toLocaleString()} repeaters loaded
                  </p>
                )}
              </div>
            )}

            {hasFilters && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing {displayedRepeaters.length.toLocaleString()} of {totalCount.toLocaleString()} repeaters
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRepeater && (
        <RepeaterDetailModal
          repeater={selectedRepeater}
          open={!!selectedRepeater}
          onClose={() => setSelectedRepeater(null)}
        />
      )}
    </div>
  );
}
