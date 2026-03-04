import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Radio, Signal, Zap } from "lucide-react";
import React from "react";
import { type Repeater, Status } from "../backend";
import FavoriteButton from "./FavoriteButton";

interface RepeaterCardProps {
  repeater: Repeater;
  onClick?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: bigint, isFav: boolean) => void;
  favoritesDisabled?: boolean;
}

function formatFrequency(freq: number): string {
  return `${freq.toFixed(4).replace(/\.?0+$/, "")} MHz`;
}

function formatOffset(offset: number): string {
  if (offset === 0) return "Simplex";
  const sign = offset > 0 ? "+" : "";
  return `${sign}${offset.toFixed(3).replace(/\.?0+$/, "")} MHz`;
}

function formatTone(tone: string): string {
  if (
    !tone ||
    tone.trim() === "" ||
    tone.toLowerCase() === "none" ||
    tone === "0" ||
    tone === "0.0"
  ) {
    return "None";
  }
  const num = Number.parseFloat(tone);
  if (!Number.isNaN(num) && num > 0) {
    return `${num.toFixed(1)} Hz`;
  }
  return tone;
}

export default function RepeaterCard({
  repeater,
  onClick,
  isFavorite = false,
  onFavoriteToggle,
  favoritesDisabled = false,
}: RepeaterCardProps) {
  const isActive = repeater.status === Status.active;
  const hasTone =
    repeater.ctcssTone &&
    repeater.ctcssTone.trim() !== "" &&
    repeater.ctcssTone.toLowerCase() !== "none" &&
    repeater.ctcssTone !== "0" &&
    repeater.ctcssTone !== "0.0";

  return (
    <Card
      className={`border-border bg-card hover:bg-card/80 transition-colors cursor-pointer group ${
        !isActive ? "opacity-60" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Left: main info */}
          <div className="flex-1 min-w-0">
            {/* Call sign + status */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-display font-bold text-foreground text-base truncate">
                {repeater.callSign || "Unknown"}
              </span>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={`text-xs shrink-0 ${
                  isActive
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs shrink-0 border-primary/30 text-primary"
              >
                CHIRP
              </Badge>
            </div>

            {/* Location */}
            {(repeater.city || repeater.state) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {[repeater.city, repeater.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {/* Frequency row */}
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-primary shrink-0" />
                <span className="text-foreground font-mono font-medium">
                  {formatFrequency(repeater.frequency)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Signal className="w-3 h-3 shrink-0" />
                <span className="font-mono text-xs">
                  {formatOffset(repeater.offset)}
                </span>
              </div>
              {hasTone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Zap className="w-3 h-3 shrink-0 text-amber-400" />
                  <span className="font-mono text-xs text-amber-400">
                    PL {formatTone(repeater.ctcssTone)}
                  </span>
                </div>
              )}
            </div>

            {/* Mode */}
            {repeater.toneMode && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="text-xs border-border text-muted-foreground"
                >
                  {repeater.toneMode}
                </Badge>
              </div>
            )}
          </div>

          {/* Right: favorite button */}
          <div
            className="shrink-0"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.stopPropagation();
            }}
          >
            <FavoriteButton
              isFavorite={isFavorite}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.(repeater.id, isFavorite);
              }}
              disabled={favoritesDisabled || !onFavoriteToggle}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
