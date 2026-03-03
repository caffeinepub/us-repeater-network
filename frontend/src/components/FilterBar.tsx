import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

// Full list of US states with abbreviations
const US_STATES = [
  { abbr: 'AL', name: 'Alabama' },
  { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },
  { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },
  { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },
  { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },
  { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },
  { abbr: 'WY', name: 'Wyoming' },
  { abbr: 'DC', name: 'District of Columbia' },
];

export interface FilterState {
  search: string;
  state: string;
  mode: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableStates?: string[];
  resultCount?: number;
  visibleCount?: number;
  isUnfilteredAll?: boolean;
}

export default function FilterBar({
  filters,
  onFiltersChange,
  availableStates,
  resultCount,
  visibleCount,
  isUnfilteredAll = false,
}: FilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleStateChange = (value: string) => {
    onFiltersChange({ ...filters, state: value === 'all' ? '' : value });
  };

  const handleModeChange = (value: string) => {
    onFiltersChange({ ...filters, mode: value === 'all' ? '' : value });
  };

  // Build state options: if availableStates provided, filter to those; otherwise show all
  // Normalize available states to abbreviations for matching
  const normalizedAvailable = availableStates
    ? availableStates.map(s => {
        if (s.length === 2) return s.toUpperCase();
        // Try to find abbreviation for full name
        const found = US_STATES.find(
          st => st.name.toLowerCase() === s.toLowerCase() || st.abbr.toLowerCase() === s.toLowerCase()
        );
        return found ? found.abbr : s.toUpperCase();
      })
    : null;

  const stateOptions = US_STATES.filter(st =>
    !normalizedAvailable || normalizedAvailable.includes(st.abbr)
  );

  // Determine count display
  let countDisplay: string | null = null;
  if (isUnfilteredAll && visibleCount !== undefined && resultCount !== undefined) {
    countDisplay = `Showing ${visibleCount.toLocaleString()} of ${resultCount.toLocaleString()} repeaters (scroll for more)`;
  } else if (resultCount !== undefined && !isUnfilteredAll) {
    countDisplay = `${resultCount.toLocaleString()} repeater${resultCount !== 1 ? 's' : ''} found`;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search call sign, city, frequency..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* State filter */}
        <Select
          value={filters.state || 'all'}
          onValueChange={handleStateChange}
        >
          <SelectTrigger className="w-full sm:w-52 bg-card border-border text-foreground">
            <Filter className="w-4 h-4 text-muted-foreground mr-1" />
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-72 overflow-y-auto">
            <SelectItem value="all" className="text-foreground">All States</SelectItem>
            {stateOptions.map(st => (
              <SelectItem key={st.abbr} value={st.abbr} className="text-foreground">
                {st.name} ({st.abbr})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mode filter */}
        <Select
          value={filters.mode || 'all'}
          onValueChange={handleModeChange}
        >
          <SelectTrigger className="w-full sm:w-40 bg-card border-border text-foreground">
            <SelectValue placeholder="All Modes" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-foreground">All Modes</SelectItem>
            <SelectItem value="FM" className="text-foreground">FM</SelectItem>
            <SelectItem value="NFM" className="text-foreground">NFM</SelectItem>
            <SelectItem value="AM" className="text-foreground">AM</SelectItem>
            <SelectItem value="DV" className="text-foreground">DV (D-STAR)</SelectItem>
            <SelectItem value="DN" className="text-foreground">DN (DMR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      {countDisplay && (
        <p className="text-xs text-muted-foreground">{countDisplay}</p>
      )}
    </div>
  );
}
