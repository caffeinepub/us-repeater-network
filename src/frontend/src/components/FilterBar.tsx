import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Radio, Search } from "lucide-react";
import type React from "react";

// Complete list of all 50 US states + DC
const US_STATES: { abbr: string; name: string }[] = [
  { abbr: "AL", name: "Alabama" },
  { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" },
  { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" },
  { abbr: "DC", name: "District of Columbia" },
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

const MODES = [
  "FM",
  "DMR",
  "D-STAR",
  "YSF",
  "P25",
  "NXDN",
  "TETRA",
  "AM",
  "USB",
  "LSB",
];

interface Filters {
  search: string;
  state: string;
  mode: string;
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  resultCount?: number;
  showingCount?: number;
  totalCount?: number;
  /** @deprecated No longer used — all 50 states are always shown */
  availableStates?: string[];
}

export default function FilterBar({
  filters,
  onFiltersChange,
  resultCount,
  showingCount,
  totalCount,
}: FilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleStateChange = (value: string) => {
    onFiltersChange({ ...filters, state: value === "all" ? "" : value });
  };

  const handleModeChange = (value: string) => {
    onFiltersChange({ ...filters, mode: value === "all" ? "" : value });
  };

  const hasFilters = filters.search || filters.state || filters.mode;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search call sign, city, sponsor..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* State filter — always shows all 50 states */}
        <div className="flex items-center gap-2 min-w-[160px]">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={filters.state || "all"}
            onValueChange={handleStateChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s.abbr} value={s.abbr}>
                  {s.abbr} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mode filter */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <Radio className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={filters.mode || "all"}
            onValueChange={handleModeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="mt-3 text-sm text-muted-foreground">
          {hasFilters ? (
            <span>
              {resultCount} repeater{resultCount !== 1 ? "s" : ""} match your
              filters
            </span>
          ) : showingCount !== undefined && totalCount !== undefined ? (
            <span>
              Showing {showingCount} of {totalCount} repeater
              {totalCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <span>
              {resultCount} repeater{resultCount !== 1 ? "s" : ""} total
            </span>
          )}
        </div>
      )}
    </div>
  );
}
