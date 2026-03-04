import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { type Repeater, Status, SubmissionStatus } from "../backend";
import AdminPassphraseGate from "../components/AdminPassphraseGate";
import { useActor } from "../hooks/useActor";
import { parseChirpCsv } from "../utils/csvParser";

interface ImportSummary {
  total: number;
  saved: number;
  skipped: number;
  byState: Record<string, number>;
  errors: string[];
}

const BATCH_SIZE = 200;

const ADMIN_PASSPHRASE = "WendellAdmin2024";

export default function AdminPage() {
  return (
    <AdminPassphraseGate>
      <AdminImportContent />
    </AdminPassphraseGate>
  );
}

function AdminImportContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) {
      setFile(dropped);
      setSummary(null);
      setError(null);
    } else {
      setError("Please drop a valid .csv file.");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setSummary(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file || !actor) return;
    setIsImporting(true);
    setError(null);
    setSummary(null);
    setProgress(0);
    setProgressLabel("Parsing CSV...");

    try {
      const text = await file.text();
      const { repeaters: parsed, errors: parseErrors } = parseChirpCsv(text);

      if (parsed.length === 0) {
        setError("No valid repeaters found in the CSV file.");
        setIsImporting(false);
        return;
      }

      setProgressLabel(
        `Parsed ${parsed.length} repeaters. Preparing to save...`,
      );

      // Convert parsed repeaters to backend Repeater type
      // Use a large base ID offset to avoid collisions with existing IDs
      // The backend will use these IDs directly and update nextRepeaterId
      const baseId = Date.now(); // Use timestamp as base to ensure uniqueness
      const repeatersToSave: Repeater[] = parsed.map((p, idx) => ({
        id: BigInt(baseId + idx),
        frequency: p.frequency,
        offset: p.offset,
        callSign: p.callSign,
        sponsor: p.sponsor || "",
        city: p.city,
        state: p.state,
        zipCode: p.zipCode || "",
        ctcssTone: p.ctcssTone || "",
        dcsCode: p.dcsCode || "",
        toneMode: p.toneMode || "FM",
        coverageDescription: p.coverageDescription || "",
        operationalNotes: p.operationalNotes || "",
        autopatchInfo: p.autopatchInfo || "",
        linkInfo: p.linkInfo || "",
        status: Status.active,
        submissionStatus: SubmissionStatus.approved,
        submittedBy: "CSV Import",
        timestamp: BigInt(Date.now()) * BigInt(1_000_000), // nanoseconds
      }));

      const totalBatches = Math.ceil(repeatersToSave.length / BATCH_SIZE);
      let saved = 0;
      let skipped = 0;
      const byState: Record<string, number> = {};

      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        const batchStart = batchIdx * BATCH_SIZE;
        const batch = repeatersToSave.slice(
          batchStart,
          batchStart + BATCH_SIZE,
        );

        setProgressLabel(`Saving batch ${batchIdx + 1} of ${totalBatches}...`);
        setProgress(Math.round((batchIdx / totalBatches) * 100));

        try {
          await actor.bulkAddRepeatersWithPassphrase(ADMIN_PASSPHRASE, batch);
          saved += batch.length;

          // Tally by state
          for (const r of batch) {
            byState[r.state] = (byState[r.state] || 0) + 1;
          }
        } catch (batchErr) {
          skipped += batch.length;
          console.error(`Batch ${batchIdx + 1} failed:`, batchErr);
        }
      }

      setProgress(100);
      setProgressLabel("Import complete!");

      // Invalidate query caches so DirectoryPage refetches the new data
      await queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
      await queryClient.invalidateQueries({
        queryKey: ["approvedRepeatersInfinite"],
      });

      setSummary({
        total: parsed.length,
        saved,
        skipped,
        byState,
        errors: parseErrors.slice(0, 20),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Import failed: ${msg}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setError(null);
    setProgress(0);
    setProgressLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Import CHIRP CSV
          </h1>
          <p className="text-muted-foreground">
            Bulk-import repeaters from a CHIRP radio memory manager CSV export.
            All imported repeaters are immediately approved and visible in the
            directory.
          </p>
        </div>

        {/* Drop zone */}
        {/* biome-ignore lint/a11y/useSemanticElements: div needed for drag-and-drop with nested button */}
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (!file) fileInputRef.current?.click();
            }
          }}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
            ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            ${file ? "cursor-default" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="ml-4 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">
                Drop your CHIRP CSV here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>
          )}
        </div>

        {/* Import button */}
        {file && !summary && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="min-w-[140px]"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Repeaters"
              )}
            </Button>
          </div>
        )}

        {/* Progress */}
        {isImporting && (
          <div className="mt-6 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progressLabel}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="mt-6 bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Import Complete</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-background rounded-lg p-3">
                <p className="text-2xl font-bold text-foreground">
                  {summary.total}
                </p>
                <p className="text-xs text-muted-foreground">Parsed</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-2xl font-bold text-green-500">
                  {summary.saved}
                </p>
                <p className="text-xs text-muted-foreground">Saved</p>
              </div>
              <div className="bg-background rounded-lg p-3">
                <p className="text-2xl font-bold text-destructive">
                  {summary.skipped}
                </p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>

            {Object.keys(summary.byState).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  By State
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.byState)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([state, count]) => (
                      <span
                        key={state}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        {state}: {count}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {summary.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Parse Warnings ({summary.errors.length})
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {summary.errors.map((e, i) => (
                    <p
                      key={`${i}-${e.slice(0, 32)}`}
                      className="text-xs text-muted-foreground font-mono"
                    >
                      {e}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              ✅ Imported repeaters are now visible in the{" "}
              <a href="/directory" className="text-primary underline">
                repeater directory
              </a>
              .
            </p>

            <Button variant="outline" onClick={handleReset} className="w-full">
              Import Another File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
