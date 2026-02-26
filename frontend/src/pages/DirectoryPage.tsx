import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Loader2, Radio, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { useGetApprovedRepeaters } from "../hooks/useQueries";
import {
  fetchRepeaterBookData,
  STATE_FIPS,
  type MappedRepeaterBookRepeater,
} from "../services/repeaterBookApi";
import type { Repeater } from "../backend";
import RepeaterCard, { type DisplayRepeater } from "../components/RepeaterCard";
import RepeaterDetailModal from "../components/RepeaterDetailModal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

export default function DirectoryPage() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [cityInput, setCityInput] = useState<string>("");
  const [freqFilter, setFreqFilter] = useState<string>("");
  const [callSignFilter, setCallSignFilter] = useState<string>("");
  const [selectedRepeater, setSelectedRepeater] = useState<DisplayRepeater | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // RepeaterBook state
  const [rbRepeaters, setRbRepeaters] = useState<MappedRepeaterBookRepeater[]>([]);
  const [rbLoading, setRbLoading] = useState(false);
  const [rbError, setRbError] = useState<string | null>(null);
  const [rbFetched, setRbFetched] = useState(false);

  // Local repeaters from backend
  const { data: localRepeaters = [], isLoading: localLoading } = useGetApprovedRepeaters();

  // Fetch from RepeaterBook when state or city changes
  const fetchFromRepeaterBook = useCallback(async (stateAbbr: string, city: string) => {
    if (!stateAbbr && !city) {
      setRbRepeaters([]);
      setRbFetched(false);
      setRbError(null);
      return;
    }

    setRbLoading(true);
    setRbError(null);

    try {
      const results = await fetchRepeaterBookData({
        stateAbbr: stateAbbr || undefined,
        city: city || undefined,
      });
      setRbRepeaters(results);
      setRbFetched(true);
      if (results.length === 0) {
        setRbError(
          "No results from RepeaterBook API. This may be due to browser CORS restrictions. Try searching on repeaterbook.com directly."
        );
      }
    } catch {
      setRbRepeaters([]);
      setRbError("Failed to fetch from RepeaterBook. CORS restrictions may apply in browser environments.");
      setRbFetched(true);
    } finally {
      setRbLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFromRepeaterBook(selectedState, cityFilter);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedState, cityFilter, fetchFromRepeaterBook]);

  // Handle city input with debounce
  const handleCityInputChange = (val: string) => {
    setCityInput(val);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCityFilter(cityInput);
    }, 800);
    return () => clearTimeout(timer);
  }, [cityInput]);

  // Filter local repeaters
  const filteredLocal = localRepeaters.filter((r) => {
    if (selectedState && r.state !== selectedState) return false;
    if (cityFilter && !r.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (freqFilter && !r.frequency.toFixed(4).includes(freqFilter)) return false;
    if (callSignFilter && !r.callSign.toLowerCase().includes(callSignFilter.toLowerCase())) return false;
    return true;
  });

  // Filter RepeaterBook repeaters
  const filteredRB = rbRepeaters.filter((r) => {
    if (freqFilter && !r.frequency.toFixed(4).includes(freqFilter)) return false;
    if (callSignFilter && !r.callSign.toLowerCase().includes(callSignFilter.toLowerCase())) return false;
    return true;
  });

  const allRepeaters: DisplayRepeater[] = [
    ...filteredLocal,
    ...filteredRB,
  ];

  const handleCardClick = (r: DisplayRepeater) => {
    setSelectedRepeater(r);
    setModalOpen(true);
  };

  const handleStateChange = (val: string) => {
    setSelectedState(val === "all" ? "" : val);
  };

  const handleRefresh = () => {
    fetchFromRepeaterBook(selectedState, cityFilter);
  };

  const isLoading = localLoading || rbLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground font-display mb-2">
          Repeater Directory
        </h1>
        <p className="text-muted-foreground">
          Search ham radio repeaters from RepeaterBook.com and community-submitted GMRS repeaters.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-amber/10 border border-amber/40 rounded-lg">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Radio className="w-5 h-5 text-amber" />
          <span className="font-semibold text-amber text-sm">Live Data</span>
        </div>
        <p className="text-sm text-muted-foreground flex-1">
          Ham radio repeater data is sourced live from{" "}
          <a
            href="https://www.repeaterbook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:underline inline-flex items-center gap-0.5"
          >
            RepeaterBook.com <ExternalLink className="w-3 h-3" />
          </a>
          . GMRS repeaters can be submitted via the{" "}
          <a href="/submit" className="text-amber hover:underline">
            submission form
          </a>
          .
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-amber" />
          <span className="text-sm font-semibold text-foreground">Filter Repeaters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select onValueChange={handleStateChange} value={selectedState || "all"}>
            <SelectTrigger className="bg-navy-light border-border text-foreground">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-64">
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s.abbr} value={s.abbr}>
                  {s.name} ({s.abbr})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by city..."
            value={cityInput}
            onChange={(e) => handleCityInputChange(e.target.value)}
            className="bg-navy-light border-border text-foreground placeholder:text-muted-foreground"
          />

          <Input
            placeholder="Filter by frequency..."
            value={freqFilter}
            onChange={(e) => setFreqFilter(e.target.value)}
            className="bg-navy-light border-border text-foreground placeholder:text-muted-foreground"
          />

          <Input
            placeholder="Filter by call sign..."
            value={callSignFilter}
            onChange={(e) => setCallSignFilter(e.target.value)}
            className="bg-navy-light border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${allRepeaters.length} repeaters found`}
          </span>
          {filteredRB.length > 0 && (
            <Badge className="bg-amber text-navy text-xs">
              {filteredRB.length} from RepeaterBook
            </Badge>
          )}
          {filteredLocal.length > 0 && (
            <Badge variant="outline" className="border-teal text-teal text-xs">
              {filteredLocal.length} Local
            </Badge>
          )}
        </div>
        {(selectedState || cityFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={rbLoading}
            className="text-muted-foreground hover:text-amber"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${rbLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* CORS Warning */}
      {rbFetched && rbError && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-500 mb-1">RepeaterBook API Notice</p>
            <p className="text-muted-foreground">{rbError}</p>
            <p className="text-muted-foreground mt-1">
              Local community-submitted repeaters are still shown below.{" "}
              <a
                href="https://www.repeaterbook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber hover:underline"
              >
                Visit RepeaterBook.com directly ↗
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && allRepeaters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-amber animate-spin" />
          <p className="text-muted-foreground">
            {rbLoading ? "Fetching live data from RepeaterBook..." : "Loading repeaters..."}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && allRepeaters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Radio className="w-12 h-12 text-muted-foreground/40" />
          <div>
            <p className="text-lg font-semibold text-foreground mb-1">No repeaters found</p>
            <p className="text-muted-foreground text-sm max-w-md">
              {selectedState || cityFilter
                ? "Try adjusting your filters or selecting a different state."
                : "Select a state to load live repeater data from RepeaterBook.com."}
            </p>
          </div>
          {!selectedState && !cityFilter && (
            <p className="text-xs text-muted-foreground">
              Local community-submitted repeaters are shown without filters.
            </p>
          )}
        </div>
      )}

      {/* Repeater Grid */}
      {allRepeaters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Show loading overlay while fetching more */}
          {rbLoading && (
            <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber" />
              Fetching live data from RepeaterBook...
            </div>
          )}
          {allRepeaters.map((r, idx) => {
            const key =
              (r as MappedRepeaterBookRepeater).source === "repeaterbook"
                ? (r as MappedRepeaterBookRepeater).id
                : `local-${(r as Repeater).id.toString()}`;
            return (
              <RepeaterCard key={key} repeater={r} onClick={handleCardClick} />
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <RepeaterDetailModal
        repeater={selectedRepeater}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
