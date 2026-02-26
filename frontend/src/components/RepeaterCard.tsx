import React from "react";
import { Radio, MapPin, Signal, Zap, ExternalLink } from "lucide-react";
import type { Repeater } from "../backend";
import type { MappedRepeaterBookRepeater } from "../services/repeaterBookApi";
import { Badge } from "@/components/ui/badge";

export type DisplayRepeater = Repeater | MappedRepeaterBookRepeater;

interface RepeaterCardProps {
  repeater: DisplayRepeater;
  onClick: (repeater: DisplayRepeater) => void;
}

function isRepeaterBookEntry(r: DisplayRepeater): r is MappedRepeaterBookRepeater {
  return (r as MappedRepeaterBookRepeater).source === "repeaterbook";
}

function getFrequency(r: DisplayRepeater): number {
  return isRepeaterBookEntry(r) ? r.frequency : (r as Repeater).frequency;
}

function getCallSign(r: DisplayRepeater): string {
  return isRepeaterBookEntry(r) ? r.callSign : (r as Repeater).callSign;
}

function getCity(r: DisplayRepeater): string {
  return isRepeaterBookEntry(r) ? r.city : (r as Repeater).city;
}

function getState(r: DisplayRepeater): string {
  return isRepeaterBookEntry(r) ? r.state : (r as Repeater).state;
}

function getCtcss(r: DisplayRepeater): string {
  return isRepeaterBookEntry(r) ? r.ctcssTone : (r as Repeater).ctcssTone;
}

function getToneMode(r: DisplayRepeater): string {
  return isRepeaterBookEntry(r) ? r.toneMode : (r as Repeater).toneMode;
}

function getOffset(r: DisplayRepeater): number {
  return isRepeaterBookEntry(r) ? r.offset : (r as Repeater).offset;
}

function getStatus(r: DisplayRepeater): string {
  if (isRepeaterBookEntry(r)) return r.status;
  const s = (r as Repeater).status;
  return typeof s === "object" ? Object.keys(s)[0] : String(s);
}

export default function RepeaterCard({ repeater, onClick }: RepeaterCardProps) {
  const isRB = isRepeaterBookEntry(repeater);
  const freq = getFrequency(repeater);
  const callSign = getCallSign(repeater);
  const city = getCity(repeater);
  const state = getState(repeater);
  const ctcss = getCtcss(repeater);
  const toneMode = getToneMode(repeater);
  const offset = getOffset(repeater);
  const status = getStatus(repeater);
  const isActive = status === "active";

  const offsetStr =
    offset === 0 ? "0" : offset > 0 ? `+${offset.toFixed(3)}` : offset.toFixed(3);

  return (
    <div
      onClick={() => onClick(repeater)}
      className="relative bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-amber hover:shadow-amber-glow transition-all duration-200 group"
    >
      {/* Source Badge */}
      <div className="absolute top-3 right-3">
        {isRB ? (
          <Badge className="bg-amber text-navy text-xs font-bold px-2 py-0.5 rounded">
            RepeaterBook
          </Badge>
        ) : (
          <Badge variant="outline" className="border-teal text-teal text-xs font-bold px-2 py-0.5 rounded">
            Local
          </Badge>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-start gap-3 pr-24">
        <div className="mt-0.5">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1 ${
              isActive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-red-400"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          {/* Call Sign + Frequency */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-amber font-display tracking-wide">
              {callSign}
            </span>
            <span className="text-base font-mono font-semibold text-foreground">
              {freq.toFixed(4)} MHz
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {city}, {state}
            </span>
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-navy-light rounded px-2 py-1 text-xs">
          <Signal className="w-3 h-3 text-amber" />
          <span className="text-muted-foreground">Offset:</span>
          <span className="text-foreground font-mono">{offsetStr}</span>
        </div>
        <div className="flex items-center gap-1 bg-navy-light rounded px-2 py-1 text-xs">
          <Zap className="w-3 h-3 text-amber" />
          <span className="text-muted-foreground">CTCSS:</span>
          <span className="text-foreground font-mono">{ctcss || "None"}</span>
        </div>
        <div className="flex items-center gap-1 bg-navy-light rounded px-2 py-1 text-xs">
          <Radio className="w-3 h-3 text-amber" />
          <span className="text-foreground">{toneMode}</span>
        </div>
      </div>
    </div>
  );
}
