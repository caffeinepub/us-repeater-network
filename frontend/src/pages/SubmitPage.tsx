import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Radio, Send, Info, AlertCircle } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddRepeater } from "../hooks/useQueries";
import { Status } from "../backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function SubmitPage() {
  const { identity, login } = useInternetIdentity();
  const addRepeater = useAddRepeater();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    frequency: "",
    offset: "",
    callSign: "",
    sponsor: "",
    city: "",
    state: "",
    zipCode: "",
    ctcssTone: "",
    dcsCode: "",
    toneMode: "FM",
    coverageDescription: "",
    operationalNotes: "",
    autopatchInfo: "",
    linkInfo: "",
    status: "active" as "active" | "inactive",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      toast.error("Please log in to submit a repeater");
      return;
    }

    const freq = parseFloat(form.frequency);
    const offset = parseFloat(form.offset);

    if (isNaN(freq) || freq <= 0) {
      toast.error("Please enter a valid frequency");
      return;
    }

    try {
      await addRepeater.mutateAsync({
        frequency: freq,
        offset: isNaN(offset) ? 0 : offset,
        callSign: form.callSign.toUpperCase(),
        sponsor: form.sponsor,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        ctcssTone: form.ctcssTone || "None",
        dcsCode: form.dcsCode || "N/A",
        toneMode: form.toneMode,
        coverageDescription: form.coverageDescription,
        operationalNotes: form.operationalNotes,
        autopatchInfo: form.autopatchInfo || "Not available",
        linkInfo: form.linkInfo || "None",
        status: form.status === "active" ? { active: null } as unknown as Status : { inactive: null } as unknown as Status,
        submittedBy: identity.getPrincipal().toString(),
      });
      toast.success("Repeater submitted for review! An admin will approve it shortly.");
      navigate({ to: "/directory" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit repeater");
    }
  };

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Radio className="w-16 h-16 text-amber mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground font-display mb-3">
          Login Required
        </h1>
        <p className="text-muted-foreground mb-6">
          You need to be logged in to submit a repeater.
        </p>
        <Button onClick={login} className="bg-amber text-navy hover:bg-amber-dark font-bold">
          Login to Submit
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground font-display mb-2">
          Submit a Repeater
        </h1>
        <p className="text-muted-foreground">
          Submit a GMRS or ham radio repeater not listed in RepeaterBook. All submissions are
          reviewed by an admin before appearing in the directory.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 flex items-start gap-3 p-4 bg-amber/10 border border-amber/30 rounded-lg">
        <Info className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <strong className="text-amber">Note:</strong> Ham radio repeaters are automatically
          pulled from RepeaterBook.com. This form is primarily for{" "}
          <strong className="text-foreground">GMRS repeaters</strong> and any ham repeaters not
          yet listed in RepeaterBook.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber" />
            Frequency Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frequency" className="text-foreground">
                Output Frequency (MHz) *
              </Label>
              <Input
                id="frequency"
                type="number"
                step="0.0001"
                placeholder="146.9400"
                value={form.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
                required
                className="bg-navy-light border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="offset" className="text-foreground">
                Offset (MHz)
              </Label>
              <Input
                id="offset"
                type="number"
                step="0.001"
                placeholder="-0.600"
                value={form.offset}
                onChange={(e) => handleChange("offset", e.target.value)}
                className="bg-navy-light border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ctcss" className="text-foreground">
                CTCSS Tone
              </Label>
              <Input
                id="ctcss"
                placeholder="100.0"
                value={form.ctcssTone}
                onChange={(e) => handleChange("ctcssTone", e.target.value)}
                className="bg-navy-light border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dcs" className="text-foreground">
                DCS Code
              </Label>
              <Input
                id="dcs"
                placeholder="N/A"
                value={form.dcsCode}
                onChange={(e) => handleChange("dcsCode", e.target.value)}
                className="bg-navy-light border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="toneMode" className="text-foreground">
                Mode
              </Label>
              <Select
                value={form.toneMode}
                onValueChange={(v) => handleChange("toneMode", v)}
              >
                <SelectTrigger className="bg-navy-light border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["FM", "DMR", "D-Star", "C4FM", "P25", "NXDN", "GMRS", "FM/Digital"].map(
                    (m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status" className="text-foreground">
                Status
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger className="bg-navy-light border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber" />
            Repeater Identity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="callSign" className="text-foreground">
                Call Sign *
              </Label>
              <Input
                id="callSign"
                placeholder="W1ABC"
                value={form.callSign}
                onChange={(e) => handleChange("callSign", e.target.value)}
                required
                className="bg-navy-light border-border text-foreground mt-1 uppercase"
              />
            </div>
            <div>
              <Label htmlFor="sponsor" className="text-foreground">
                Sponsor / Club
              </Label>
              <Input
                id="sponsor"
                placeholder="Local Radio Club"
                value={form.sponsor}
                onChange={(e) => handleChange("sponsor", e.target.value)}
                className="bg-navy-light border-border text-foreground mt-1"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber" />
            Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Label htmlFor="city" className="text-foreground">
                City *
              </Label>
              <Input
                id="city"
                placeholder="Springfield"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                required
                className="bg-navy-light border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state" className="text-foreground">
                State *
              </Label>
              <Select
                value={form.state}
                onValueChange={(v) => handleChange("state", v)}
              >
                <SelectTrigger className="bg-navy-light border-border text-foreground mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-64">
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zipCode" className="text-foreground">
                Zip Code
              </Label>
              <Input
                id="zipCode"
                placeholder="12345"
                value={form.zipCode}
                onChange={(e) => handleChange("zipCode", e.target.value)}
                className="bg-navy-light border-border text-foreground mt-1"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber" />
            Additional Information
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="coverage" className="text-foreground">
                Coverage Description
              </Label>
              <Textarea
                id="coverage"
                placeholder="Covers downtown area and surrounding suburbs..."
                value={form.coverageDescription}
                onChange={(e) => handleChange("coverageDescription", e.target.value)}
                className="bg-navy-light border-border text-foreground mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-foreground">
                Operational Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special notes about this repeater..."
                value={form.operationalNotes}
                onChange={(e) => handleChange("operationalNotes", e.target.value)}
                className="bg-navy-light border-border text-foreground mt-1"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="autopatch" className="text-foreground">
                  Autopatch Info
                </Label>
                <Input
                  id="autopatch"
                  placeholder="Not available"
                  value={form.autopatchInfo}
                  onChange={(e) => handleChange("autopatchInfo", e.target.value)}
                  className="bg-navy-light border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label htmlFor="linkInfo" className="text-foreground">
                  Link Info
                </Label>
                <Input
                  id="linkInfo"
                  placeholder="EchoLink, IRLP, etc."
                  value={form.linkInfo}
                  onChange={(e) => handleChange("linkInfo", e.target.value)}
                  className="bg-navy-light border-border text-foreground mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={addRepeater.isPending}
          className="w-full bg-amber text-navy hover:bg-amber-dark font-bold text-base py-3"
        >
          {addRepeater.isPending ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit for Review
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
