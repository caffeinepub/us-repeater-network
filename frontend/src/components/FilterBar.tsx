import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGetApprovedStates } from '../hooks/useQueries';

export interface FilterState {
  state: string;
  city: string;
  zipCode: string;
  radius: number;
  searchMode: 'browse' | 'zip';
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onZipSearch: () => void;
  isSearching: boolean;
  resultCount: number;
}

const RADIUS_OPTIONS = [10, 25, 50, 100];

export default function FilterBar({ filters, onChange, onZipSearch, isSearching, resultCount }: FilterBarProps) {
  const { data: states = [] } = useGetApprovedStates();

  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  const clearFilters = () => {
    onChange({ state: '', city: '', zipCode: '', radius: 25, searchMode: 'browse' });
  };

  const hasActiveFilters = filters.state || filters.city || (filters.searchMode === 'zip' && filters.zipCode);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Search mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => update({ searchMode: 'browse' })}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
            filters.searchMode === 'browse'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-secondary text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          Browse by State/City
        </button>
        <button
          onClick={() => update({ searchMode: 'zip' })}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
            filters.searchMode === 'zip'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-secondary text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          Search by Zip Code
        </button>
      </div>

      {filters.searchMode === 'browse' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">State</label>
            <Select value={filters.state} onValueChange={(v) => update({ state: v === 'all' ? '' : v, city: '' })}>
              <SelectTrigger className="bg-input border-border text-foreground h-9">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-muted-foreground">All States</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s} value={s} className="font-mono">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">City</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={filters.city}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="Filter by city..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 pl-8"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Zip Code</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={filters.zipCode}
                onChange={(e) => update({ zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                placeholder="Enter 5-digit zip..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 pl-8 font-mono"
                maxLength={5}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Radius</label>
            <Select value={String(filters.radius)} onValueChange={(v) => update({ radius: Number(v) })}>
              <SelectTrigger className="bg-input border-border text-foreground h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {RADIUS_OPTIONS.map((r) => (
                  <SelectItem key={r} value={String(r)} className="font-mono">{r} miles</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-mono">
          {resultCount} repeater{resultCount !== 1 ? 's' : ''} found
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
          {filters.searchMode === 'zip' && (
            <Button
              size="sm"
              onClick={onZipSearch}
              disabled={filters.zipCode.length !== 5 || isSearching}
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {isSearching ? (
                <div className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              Search
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
