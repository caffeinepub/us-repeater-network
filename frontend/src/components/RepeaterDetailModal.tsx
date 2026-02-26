import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Radio, MapPin, Signal, Zap, Info, Link2, Phone, ExternalLink } from "lucide-react";
import type { Repeater } from "../backend";
import type { MappedRepeaterBookRepeater } from "../services/repeaterBookApi";
import type { DisplayRepeater } from "./RepeaterCard";
import FavoriteButton from "./FavoriteButton";

interface RepeaterDetailModalProps {
  repeater: DisplayRepeater | null;
  open: boolean;
  onClose: () => void;
}

function isRepeaterBookEntry(r: DisplayRepeater): r is MappedRepeaterBookRepeater {
  return (r as MappedRepeaterBookRepeater).source === "repeaterbook";
}

function na(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === "" || val === "N/A") return "N/A";
  return String(val);
}

function getField(r: DisplayRepeater, field: keyof Repeater | keyof MappedRepeaterBookRepeater): string {
  const val = (r as any)[field];
  return na(val);
}

export default function RepeaterDetailModal({
  repeater,
  open,
  onClose,
}: RepeaterDetailModalProps) {
  if (!repeater) return null;

  const isRB = isRepeaterBookEntry(repeater);

  const freq = isRB ? repeater.frequency : (repeater as Repeater).frequency;
  const offset = isRB ? repeater.offset : (repeater as Repeater).offset;
  const callSign = isRB ? repeater.callSign : (repeater as Repeater).callSign;
  const city = isRB ? repeater.city : (repeater as Repeater).city;
  const state = isRB ? repeater.state : (repeater as Repeater).state;
  const zipCode = isRB ? (repeater.zipCode || "N/A") : (repeater as Repeater).zipCode;
  const ctcss = isRB ? repeater.ctcssTone : (repeater as Repeater).ctcssTone;
  const dcs = isRB ? repeater.dcsCode : (repeater as Repeater).dcsCode;
  const toneMode = isRB ? repeater.toneMode : (repeater as Repeater).toneMode;
  const sponsor = isRB ? repeater.sponsor : (repeater as Repeater).sponsor;
  const coverage = isRB ? repeater.coverageDescription : (repeater as Repeater).coverageDescription;
  const notes = isRB ? repeater.operationalNotes : (repeater as Repeater).operationalNotes;
  const autopatch = isRB ? repeater.autopatchInfo : (repeater as Repeater).autopatchInfo;
  const linkInfo = isRB ? repeater.linkInfo : (repeater as Repeater).linkInfo;

  const statusRaw = isRB
    ? repeater.status
    : (() => {
        const s = (repeater as Repeater).status;
        return typeof s === "object" ? Object.keys(s)[0] : String(s);
      })();
  const isActive = statusRaw === "active";

  const offsetStr =
    offset === 0 ? "0" : offset > 0 ? `+${offset.toFixed(3)}` : offset.toFixed(3);

  // For local repeaters, get the bigint id
  const localId = !isRB ? (repeater as Repeater).id : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-bold text-amber font-display flex items-center gap-2">
                <Radio className="w-6 h-6" />
                {callSign}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                {freq.toFixed(4)} MHz — {city}, {state}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isRB ? (
                <Badge className="bg-amber text-navy font-bold">RepeaterBook</Badge>
              ) : (
                <Badge variant="outline" className="border-teal text-teal font-bold">
                  Local
                </Badge>
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive
                      ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"
                      : "bg-red-400"
                  }`}
                />
                <span className="text-xs text-muted-foreground capitalize">{statusRaw}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Frequency Details */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Frequency Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DetailItem icon={<Signal className="w-4 h-4 text-amber" />} label="Output Freq" value={`${freq.toFixed(4)} MHz`} />
              <DetailItem icon={<Signal className="w-4 h-4 text-amber" />} label="Offset" value={`${offsetStr} MHz`} />
              <DetailItem icon={<Zap className="w-4 h-4 text-amber" />} label="CTCSS Tone" value={na(ctcss)} />
              <DetailItem icon={<Zap className="w-4 h-4 text-amber" />} label="DCS Code" value={na(dcs)} />
              <DetailItem icon={<Radio className="w-4 h-4 text-amber" />} label="Mode" value={na(toneMode)} />
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Location
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DetailItem icon={<MapPin className="w-4 h-4 text-amber" />} label="City" value={na(city)} />
              <DetailItem icon={<MapPin className="w-4 h-4 text-amber" />} label="State" value={na(state)} />
              {!isRB && (
                <DetailItem icon={<MapPin className="w-4 h-4 text-amber" />} label="Zip Code" value={na(zipCode)} />
              )}
            </div>
          </section>

          {/* Sponsor / Coverage */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Sponsor & Coverage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailItem icon={<Info className="w-4 h-4 text-amber" />} label="Sponsor" value={na(sponsor)} />
              <DetailItem icon={<Info className="w-4 h-4 text-amber" />} label="Coverage" value={na(coverage)} />
            </div>
          </section>

          {/* Notes & Links */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Notes & Links
            </h3>
            <div className="space-y-2">
              <DetailItem icon={<Info className="w-4 h-4 text-amber" />} label="Operational Notes" value={na(notes)} fullWidth />
              <DetailItem icon={<Phone className="w-4 h-4 text-amber" />} label="Autopatch" value={na(autopatch)} fullWidth />
              <DetailItem icon={<Link2 className="w-4 h-4 text-amber" />} label="Link Info" value={na(linkInfo)} fullWidth />
            </div>
          </section>

          {/* RepeaterBook attribution */}
          {isRB && (
            <div className="flex items-center gap-2 p-3 bg-amber/10 border border-amber/30 rounded text-sm">
              <ExternalLink className="w-4 h-4 text-amber flex-shrink-0" />
              <span className="text-muted-foreground">
                Data sourced from{" "}
                <a
                  href="https://www.repeaterbook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber hover:underline"
                >
                  RepeaterBook.com
                </a>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            {!isRB && localId !== null ? (
              <FavoriteButton repeaterId={localId} />
            ) : (
              <FavoriteButton
                repeaterId={BigInt(0)}
                disabled
                disabledReason="Favoriting is only available for locally submitted repeaters. RepeaterBook data is live and not stored locally."
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullWidth?: boolean;
}

function DetailItem({ icon, label, value, fullWidth }: DetailItemProps) {
  return (
    <div className={`bg-navy-light rounded p-2.5 ${fullWidth ? "col-span-full" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-sm text-foreground font-medium break-words">{value}</span>
    </div>
  );
}
