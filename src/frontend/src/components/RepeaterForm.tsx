import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { NewRepeater } from "../backend";
import { Status } from "../backend";

interface RepeaterFormProps {
  onSubmit: (data: NewRepeater) => Promise<void>;
  isSubmitting: boolean;
  submittedBy: string;
}

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const TONE_MODES = [
  "FM",
  "FM/Digital",
  "Digital",
  "CTCSS",
  "DCS",
  "Tone Squelch",
];

const COMMON_CTCSS = [
  "67.0",
  "71.9",
  "74.4",
  "77.0",
  "79.7",
  "82.5",
  "85.4",
  "88.5",
  "91.5",
  "94.8",
  "97.4",
  "100.0",
  "103.5",
  "107.2",
  "110.9",
  "114.8",
  "118.8",
  "123.0",
  "127.3",
  "131.8",
  "136.5",
  "141.3",
  "146.2",
  "151.4",
  "156.7",
  "162.2",
  "167.9",
  "173.8",
  "179.9",
  "186.2",
  "192.8",
  "203.5",
  "210.7",
  "218.1",
  "225.7",
  "233.6",
  "241.8",
  "250.3",
  "None",
];

export default function RepeaterForm({
  onSubmit,
  isSubmitting,
  submittedBy,
}: RepeaterFormProps) {
  const [form, setForm] = useState({
    frequency: "",
    offset: "",
    callSign: "",
    sponsor: "",
    city: "",
    state: "",
    zipCode: "",
    ctcssTone: "None",
    dcsCode: "N/A",
    toneMode: "FM",
    coverageDescription: "",
    operationalNotes: "",
    autopatchInfo: "",
    linkInfo: "",
    status: "active" as "active" | "inactive",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const freq = Number.parseFloat(form.frequency);
    if (!form.frequency || Number.isNaN(freq) || freq < 1 || freq > 1300) {
      newErrors.frequency = "Enter a valid frequency (1–1300 MHz)";
    }
    const offset = Number.parseFloat(form.offset);
    if (!form.offset || Number.isNaN(offset)) {
      newErrors.offset = "Enter a valid offset (e.g. -0.6 or +5.0)";
    }
    if (!form.callSign.trim()) newErrors.callSign = "Call sign is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state) newErrors.state = "State is required";
    if (!/^\d{5}$/.test(form.zipCode))
      newErrors.zipCode = "Enter a valid 5-digit zip code";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data: NewRepeater = {
      frequency: Number.parseFloat(form.frequency),
      offset: Number.parseFloat(form.offset),
      callSign: form.callSign.trim().toUpperCase(),
      sponsor: form.sponsor.trim(),
      city: form.city.trim(),
      state: form.state,
      zipCode: form.zipCode,
      ctcssTone: form.ctcssTone,
      dcsCode: form.dcsCode,
      toneMode: form.toneMode,
      coverageDescription: form.coverageDescription.trim(),
      operationalNotes: form.operationalNotes.trim(),
      autopatchInfo: form.autopatchInfo.trim() || "Not available",
      linkInfo: form.linkInfo.trim() || "Not linked",
      status: form.status === "active" ? Status.active : Status.inactive,
      submittedBy: submittedBy,
    };

    await onSubmit(data);
  };

  const fieldClass =
    "bg-input border-border text-foreground placeholder:text-muted-foreground";
  const labelClass = "text-sm font-medium text-foreground";
  const errorClass = "text-xs text-destructive mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-secondary/30 rounded-lg p-4 border border-border space-y-4">
        <h3 className="font-tech font-semibold text-sm text-foreground uppercase tracking-wide">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>
              Call Sign <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.callSign}
              onChange={(e) => update("callSign", e.target.value.toUpperCase())}
              placeholder="e.g. W1AW"
              className={`${fieldClass} font-mono uppercase`}
            />
            {errors.callSign && <p className={errorClass}>{errors.callSign}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Sponsor / Club</Label>
            <Input
              value={form.sponsor}
              onChange={(e) => update("sponsor", e.target.value)}
              placeholder="e.g. ARRL"
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      {/* RF Details */}
      <div className="bg-secondary/30 rounded-lg p-4 border border-border space-y-4">
        <h3 className="font-tech font-semibold text-sm text-foreground uppercase tracking-wide">
          RF Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>
              Frequency (MHz) <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.frequency}
              onChange={(e) => update("frequency", e.target.value)}
              placeholder="e.g. 146.940"
              className={`${fieldClass} font-mono`}
              type="number"
              step="0.001"
            />
            {errors.frequency && (
              <p className={errorClass}>{errors.frequency}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>
              Offset (MHz) <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.offset}
              onChange={(e) => update("offset", e.target.value)}
              placeholder="e.g. -0.6 or +5.0"
              className={`${fieldClass} font-mono`}
              type="number"
              step="0.1"
            />
            {errors.offset && <p className={errorClass}>{errors.offset}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Tone Mode</Label>
            <Select
              value={form.toneMode}
              onValueChange={(v) => update("toneMode", v)}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {TONE_MODES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>CTCSS Tone (Hz)</Label>
            <Select
              value={form.ctcssTone}
              onValueChange={(v) => update("ctcssTone", v)}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-48">
                {COMMON_CTCSS.map((t) => (
                  <SelectItem key={t} value={t} className="font-mono">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>DCS Code</Label>
            <Input
              value={form.dcsCode}
              onChange={(e) => update("dcsCode", e.target.value)}
              placeholder="e.g. 023 or N/A"
              className={`${fieldClass} font-mono`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v)}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-secondary/30 rounded-lg p-4 border border-border space-y-4">
        <h3 className="font-tech font-semibold text-sm text-foreground uppercase tracking-wide">
          Location
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 space-y-1.5">
            <Label className={labelClass}>
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g. Los Angeles"
              className={fieldClass}
            />
            {errors.city && <p className={errorClass}>{errors.city}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>
              State <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.state}
              onValueChange={(v) => update("state", v)}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-48">
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s} className="font-mono">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && <p className={errorClass}>{errors.state}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>
              Zip Code <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.zipCode}
              onChange={(e) =>
                update("zipCode", e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="e.g. 90210"
              className={`${fieldClass} font-mono`}
              maxLength={5}
            />
            {errors.zipCode && <p className={errorClass}>{errors.zipCode}</p>}
          </div>
        </div>
      </div>

      {/* Operational Details */}
      <div className="bg-secondary/30 rounded-lg p-4 border border-border space-y-4">
        <h3 className="font-tech font-semibold text-sm text-foreground uppercase tracking-wide">
          Operational Details
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Coverage Description</Label>
            <Textarea
              value={form.coverageDescription}
              onChange={(e) => update("coverageDescription", e.target.value)}
              placeholder="Describe the coverage area..."
              className={`${fieldClass} resize-none`}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Operational Notes</Label>
            <Textarea
              value={form.operationalNotes}
              onChange={(e) => update("operationalNotes", e.target.value)}
              placeholder="Any special notes about this repeater..."
              className={`${fieldClass} resize-none`}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Autopatch Info</Label>
              <Input
                value={form.autopatchInfo}
                onChange={(e) => update("autopatchInfo", e.target.value)}
                placeholder="e.g. Autopatch enabled"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Link Info</Label>
              <Input
                value={form.linkInfo}
                onChange={(e) => update("linkInfo", e.target.value)}
                placeholder="e.g. Linked to 70cm network"
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-tech font-semibold h-11"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Submitting...
          </span>
        ) : (
          "Submit Repeater for Review"
        )}
      </Button>
    </form>
  );
}
