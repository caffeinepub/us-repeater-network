import { Skeleton } from "@/components/ui/skeleton";
import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Repeater } from "../backend";
import FilterBar from "../components/FilterBar";
import RepeaterCard from "../components/RepeaterCard";
import RepeaterDetailModal from "../components/RepeaterDetailModal";
import { useGetApprovedRepeaters } from "../hooks/useQueries";

const PAGE_SIZE = 20;

interface Filters {
  search: string;
  state: string;
  mode: string;
}

export default function DirectoryPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    state: "",
    mode: "",
  });
  const [selectedRepeater, setSelectedRepeater] = useState<Repeater | null>(
    null,
  );
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: allRepeaters = [], isLoading } = useGetApprovedRepeaters();

  const isFiltered = !!(filters.search || filters.state || filters.mode);

  const filteredRepeaters = React.useMemo(() => {
    let result = [...allRepeaters];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.callSign.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.sponsor.toLowerCase().includes(q) ||
          String(r.frequency).includes(q),
      );
    }
    if (filters.state) {
      result = result.filter(
        (r) => r.state.toUpperCase() === filters.state.toUpperCase(),
      );
    }
    if (filters.mode) {
      result = result.filter((r) =>
        r.toneMode.toUpperCase().includes(filters.mode.toUpperCase()),
      );
    }
    return result;
  }, [allRepeaters, filters]);

  const displayedRepeaters = isFiltered
    ? filteredRepeaters
    : filteredRepeaters.slice(0, displayCount);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (
        target.isIntersecting &&
        !isFiltered &&
        displayCount < filteredRepeaters.length
      ) {
        setDisplayCount((prev) => prev + PAGE_SIZE);
      }
    },
    [isFiltered, displayCount, filteredRepeaters.length],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Reset display count when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset on filter change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [filters]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const resultCount = isFiltered
    ? filteredRepeaters.length
    : allRepeaters.length;
  const showingCount = displayedRepeaters.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Repeater Directory
          </h1>
          <p className="text-muted-foreground">
            Browse and search ham radio repeaters across the United States.
          </p>
        </div>

        {/* FilterBar — no availableStates prop so all 50 states always show */}
        <FilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          resultCount={resultCount}
          showingCount={isFiltered ? undefined : showingCount}
          totalCount={isFiltered ? undefined : allRepeaters.length}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
              <Skeleton key={k} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : displayedRepeaters.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {isFiltered
                ? "No repeaters match your filters."
                : "No repeaters found."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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

            {/* Infinite scroll loader */}
            {!isFiltered && displayCount < filteredRepeaters.length && (
              <div ref={loaderRef} className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}

            {!isFiltered &&
              displayCount >= filteredRepeaters.length &&
              filteredRepeaters.length > 0 && (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Showing all {filteredRepeaters.length} repeaters
                </p>
              )}
          </>
        )}
      </div>

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
