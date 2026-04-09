import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  FileJson,
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
import { parseJsonRepeaters } from "../utils/jsonParser";

type ImportType = "csv" | "json";

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
  const [importType, setImportType] = useState<ImportType>("csv");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedExt = importType === "csv" ? ".csv" : ".json";
  const acceptedMime =
    importType === "csv"
      ? "text/csv,application/csv"
      : "application/json,text/json";

  const handleSwitchType = (type: ImportType) => {
    setImportType(type);
    setFile(null);
    setSummary(null);
    setError(null);
    setProgress(0);
    setProgressLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      const ext = importType === "csv" ? ".csv" : ".json";
      if (dropped?.name.endsWith(ext)) {
        setFile(dropped);
        setSummary(null);
        setError(null);
      } else {
        setError(`Please drop a valid ${ext} file.`);
      }
    },
    [importType],
  );

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
    const typeLabel = importType === "csv" ? "CSV" : "JSON";
    setProgressLabel(`Parsing ${typeLabel}...`);

    try {
      const text = await file.text();

      const { repeaters: parsed, errors: parseErrors } =
        importType === "csv" ? parseChirpCsv(text) : parseJsonRepeaters(text);

      if (parsed.length === 0) {
        setError(
          `No valid repeaters found in the ${typeLabel} file.${parseErrors.length > 0 ? ` ${parseErrors[0]}` : ""}`,
        );
        setIsImporting(false);
        return;
      }

      setProgressLabel(
        `Parsed ${parsed.length} repeaters. Preparing to save...`,
      );

      const baseId = Date.now();
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
        submittedBy: `${typeLabel} Import`,
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
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
            Import Repeaters
          </h1>
          <p className="text-muted-foreground">
            Bulk-import repeaters from a CHIRP CSV export or a JSON array of
            repeater objects. All imported repeaters are immediately approved
            and visible in the directory.
          </p>
        </div>

        {/* Import type tabs */}
        <div
          className="flex gap-2 mb-6 bg-muted rounded-lg p-1 w-full sm:w-fit"
          data-ocid="admin.import_type.tab"
        >
          <button
            type="button"
            data-ocid="admin.csv_tab"
            onClick={() => handleSwitchType("csv")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              importType === "csv"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            CHIRP CSV
          </button>
          <button
            type="button"
            data-ocid="admin.json_tab"
            onClick={() => handleSwitchType("json")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              importType === "json"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileJson className="h-4 w-4" />
            JSON
          </button>
        </div>

        {/* JSON format hint */}
        {importType === "json" && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              Expected JSON format
            </p>
            <p>
              An array of repeater objects. Common field names are auto-mapped —
              for example <code className="text-primary">freq</code>,{" "}
              <code className="text-primary">frequency</code>, or{" "}
              <code className="text-primary">rxfreq</code> all map to frequency.
            </p>
            <pre className="mt-2 text-xs bg-background rounded p-2 overflow-x-auto">{`[
  {
    "callsign": "W4ABC",
    "frequency": 147.195,
    "offset": 0.6,
    "tone": 100.0,
    "mode": "FM",
    "city": "Louisville",
    "state": "KY"
  }
]`}</pre>
          </div>
        )}

        {/* Drop zone */}
        {/* biome-ignore lint/a11y/useSemanticElements: div needed for drag-and-drop with nested button */}
        <div
          role="button"
          tabIndex={0}
          data-ocid="admin.dropzone"
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
            accept={`${acceptedExt},${acceptedMime}`}
            className="hidden"
            onChange={handleFileSelect}
            data-ocid="admin.upload_button"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              {importType === "csv" ? (
                <FileText className="h-8 w-8 text-primary" />
              ) : (
                <FileJson className="h-8 w-8 text-primary" />
              )}
              <div className="text-left">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                data-ocid="admin.file_remove.button"
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
                Drop your {importType === "csv" ? "CHIRP CSV" : "JSON"} file
                here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files ({acceptedExt})
              </p>
            </div>
          )}
        </div>

        {/* Import button */}
        {file && !summary && (
          <div className="mt-4 flex justify-end">
            <Button
              data-ocid="admin.import.primary_button"
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
          <div
            className="mt-6 space-y-2"
            data-ocid="admin.import.loading_state"
          >
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progressLabel}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            data-ocid="admin.import.error_state"
            className="mt-6 flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4"
          >
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div
            data-ocid="admin.import.success_state"
            className="mt-6 bg-card border border-border rounded-xl p-6 space-y-4"
          >
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
              Imported repeaters are now visible in the{" "}
              <a href="/directory" className="text-primary underline">
                repeater directory
              </a>
              .
            </p>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full"
              data-ocid="admin.import_another.button"
            >
              Import Another File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
