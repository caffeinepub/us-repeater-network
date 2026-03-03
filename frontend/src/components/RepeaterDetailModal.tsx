import React from 'react';
import { Repeater, Status } from '../backend';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Radio, MapPin, Signal, Zap, Info, Phone, Link, FileText } from 'lucide-react';

interface RepeaterDetailModalProps {
  repeater: Repeater | null;
  open: boolean;
  onClose: () => void;
}

function formatFrequency(freq: number): string {
  return freq.toFixed(4).replace(/\.?0+$/, '') + ' MHz';
}

function formatOffset(offset: number): string {
  if (offset === 0) return 'Simplex';
  const sign = offset > 0 ? '+' : '';
  return `${sign}${offset.toFixed(3).replace(/\.?0+$/, '')} MHz`;
}

function formatTone(tone: string | undefined | null): string {
  if (!tone || tone.trim() === '' || tone.toLowerCase() === 'none' || tone === '0' || tone === '0.0') {
    return 'None';
  }
  const num = parseFloat(tone);
  if (!isNaN(num) && num > 0) {
    return `${num.toFixed(1)} Hz`;
  }
  return tone;
}

function DetailRow({
  icon,
  label,
  value,
  mono = false,
  highlight = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <div className="mt-0.5 text-primary shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
        <div
          className={`text-sm ${mono ? 'font-mono' : ''} ${
            highlight ? 'text-primary font-semibold' : 'text-foreground'
          } break-words`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function RepeaterDetailModal({ repeater, open, onClose }: RepeaterDetailModalProps) {
  if (!repeater) return null;

  const isActive = repeater.status === Status.active;
  const toneDisplay = formatTone(repeater.ctcssTone);
  const hasTone = toneDisplay !== 'None';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="font-display text-xl text-foreground">
              {repeater.callSign || 'Unknown Repeater'}
            </DialogTitle>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={
                isActive
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              CHIRP
            </Badge>
          </div>
          <DialogDescription className="text-muted-foreground">
            {[repeater.city, repeater.state].filter(Boolean).join(', ') || 'Location unknown'}
          </DialogDescription>
        </DialogHeader>

        <Separator className="bg-border" />

        {/* Frequency & RF details */}
        <div className="space-y-0">
          <DetailRow
            icon={<Radio className="w-4 h-4" />}
            label="Output Frequency"
            value={formatFrequency(repeater.frequency)}
            mono
            highlight
          />
          <DetailRow
            icon={<Signal className="w-4 h-4" />}
            label="Offset"
            value={formatOffset(repeater.offset)}
            mono
          />
          <DetailRow
            icon={<Zap className="w-4 h-4" />}
            label="CTCSS / PL Tone"
            value={
              hasTone ? (
                <span className="text-amber-400 font-mono font-semibold">{toneDisplay}</span>
              ) : (
                <span className="text-muted-foreground">None</span>
              )
            }
          />
          {repeater.dcsCode && repeater.dcsCode !== '' && repeater.dcsCode !== 'N/A' && (
            <DetailRow
              label="DCS Code"
              value={repeater.dcsCode}
              mono
            />
          )}
          <DetailRow
            label="Mode"
            value={repeater.toneMode || 'FM'}
          />
        </div>

        <Separator className="bg-border" />

        {/* Location */}
        <div>
          <DetailRow
            icon={<MapPin className="w-4 h-4" />}
            label="Location"
            value={[repeater.city, repeater.state, repeater.zipCode].filter(Boolean).join(', ') || 'N/A'}
          />
          {repeater.sponsor && (
            <DetailRow
              label="Sponsor / Club"
              value={repeater.sponsor}
            />
          )}
        </div>

        {/* Optional fields */}
        {(repeater.coverageDescription || repeater.operationalNotes || repeater.autopatchInfo || repeater.linkInfo) && (
          <>
            <Separator className="bg-border" />
            <div>
              {repeater.coverageDescription && (
                <DetailRow
                  icon={<Info className="w-4 h-4" />}
                  label="Coverage"
                  value={repeater.coverageDescription}
                />
              )}
              {repeater.operationalNotes && (
                <DetailRow
                  icon={<FileText className="w-4 h-4" />}
                  label="Operational Notes"
                  value={repeater.operationalNotes}
                />
              )}
              {repeater.autopatchInfo && (
                <DetailRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Autopatch"
                  value={repeater.autopatchInfo}
                />
              )}
              {repeater.linkInfo && (
                <DetailRow
                  icon={<Link className="w-4 h-4" />}
                  label="Link Info"
                  value={repeater.linkInfo}
                />
              )}
            </div>
          </>
        )}

        <Separator className="bg-border" />

        <div className="text-xs text-muted-foreground">
          Submitted by: {repeater.submittedBy || 'Unknown'}
        </div>
      </DialogContent>
    </Dialog>
  );
}
