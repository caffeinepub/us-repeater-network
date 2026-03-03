import React, { useState, useRef, useCallback } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { parseChirpCsv, ParsedRepeater } from '../utils/csvParser';
import { useIsCallerAdmin } from '../hooks/useQueries';
import type { Repeater } from '../backend';
import { Status, SubmissionStatus } from '../backend';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Radio,
  LogIn,
  ShieldOff,
  X,
} from 'lucide-react';
import AdminPassphraseGate from '../components/AdminPassphraseGate';

const BATCH_SIZE = 200;

interface ImportStats {
  totalParsed: number;
  totalSaved: number;
  totalSkipped: number;
  batchErrors: string[];
  stateBreakdown: Record<string, number>;
}

interface ImportProgress {
  currentBatch: number;
  totalBatches: number;
  isImporting: boolean;
  isDone: boolean;
  stats: ImportStats | null;
}

function AdminPageContent() {
  const { actor } = useActor();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<{ repeaters: ParsedRepeater[]; skipped: number; errors: string[] } | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    currentBatch: 0,
    totalBatches: 0,
    isImporting: false,
    isDone: false,
    stats: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a CSV file exported from CHIRP.');
      return;
    }
    setSelectedFile(file);
    setParseResult(null);
    setProgress({ currentBatch: 0, totalBatches: 0, isImporting: false, isDone: false, stats: null });

    const text = await file.text();
    const result = parseChirpCsv(text);
    setParseResult(result);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = useCallback(async () => {
    if (!parseResult || !actor) return;

    const { repeaters: parsed, skipped: parseSkipped } = parseResult;
    if (parsed.length === 0) return;

    const totalBatches = Math.ceil(parsed.length / BATCH_SIZE);
    const stats: ImportStats = {
      totalParsed: parsed.length,
      totalSaved: 0,
      totalSkipped: parseSkipped,
      batchErrors: [],
      stateBreakdown: {},
    };

    setProgress({ currentBatch: 0, totalBatches, isImporting: true, isDone: false, stats: null });

    // Convert parsed repeaters to backend Repeater type
    const now = BigInt(Date.now()) * BigInt(1_000_000); // nanoseconds

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batchStart = batchIdx * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, parsed.length);
      const batch = parsed.slice(batchStart, batchEnd);

      const backendRepeaters: Repeater[] = batch.map((r, idx) => ({
        id: BigInt(batchStart + idx + 1000), // temporary IDs, backend will use nextRepeaterId
        frequency: r.frequency,
        offset: r.offset,
        callSign: r.callSign,
        sponsor: r.sponsor,
        city: r.city,
        state: r.state,
        zipCode: r.zipCode,
        ctcssTone: r.ctcssTone,
        dcsCode: r.dcsCode,
        toneMode: r.toneMode,
        coverageDescription: r.coverageDescription,
        operationalNotes: r.operationalNotes,
        autopatchInfo: r.autopatchInfo,
        linkInfo: r.linkInfo,
        status: r.status === 'active' ? Status.active : Status.inactive,
        submissionStatus: SubmissionStatus.approved,
        submittedBy: r.submittedBy,
        timestamp: now,
      }));

      try {
        await actor.bulkAddRepeaters(backendRepeaters);
        stats.totalSaved += batch.length;

        // Track state breakdown
        for (const r of batch) {
          const st = r.state || 'Unknown';
          stats.stateBreakdown[st] = (stats.stateBreakdown[st] || 0) + 1;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        stats.batchErrors.push(`Batch ${batchIdx + 1}: ${errMsg}`);
        stats.totalSkipped += batch.length;
      }

      setProgress({
        currentBatch: batchIdx + 1,
        totalBatches,
        isImporting: batchIdx + 1 < totalBatches,
        isDone: batchIdx + 1 >= totalBatches,
        stats: batchIdx + 1 >= totalBatches ? stats : null,
      });
    }
  }, [parseResult, actor]);

  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setProgress({ currentBatch: 0, totalBatches: 0, isImporting: false, isDone: false, stats: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const progressPercent = progress.totalBatches > 0
    ? Math.round((progress.currentBatch / progress.totalBatches) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">CHIRP CSV Import</h1>
          </div>
          <p className="text-muted-foreground">
            Import repeater data from a CHIRP radio memory manager CSV export. All repeaters will be saved to the US Repeater Network database.
          </p>
        </div>

        {/* Info Banner */}
        <Alert className="mb-6 border-primary/30 bg-primary/5">
          <FileText className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-semibold">CHIRP CSV Format</AlertTitle>
          <AlertDescription className="text-muted-foreground text-sm">
            Export your repeater list from CHIRP as a CSV file (File → Export → CSV). The importer supports all standard CHIRP columns including Frequency, Duplex, Offset, Tone, rToneFreq, cToneFreq, DtcsCode, Mode, and Comment.
          </AlertDescription>
        </Alert>

        {/* Drop Zone */}
        {!selectedFile && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
              ${isDragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-border hover:border-primary/60 hover:bg-primary/5'
              }
            `}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground mb-1">Drop your CHIRP CSV here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
            <p className="text-xs text-muted-foreground mt-2">.csv files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* File Selected + Parse Result */}
        {selectedFile && parseResult && !progress.isImporting && !progress.isDone && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Parse summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <p className="text-2xl font-bold text-primary font-display">{parseResult.repeaters.length.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Repeaters Found</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <p className="text-2xl font-bold text-amber-500 font-display">{parseResult.skipped.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Rows Skipped</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <p className="text-2xl font-bold text-foreground font-display">
                  {Math.ceil(parseResult.repeaters.length / BATCH_SIZE)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Batches</p>
              </div>
            </div>

            {/* Parse errors */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Parse Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                    {parseResult.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>...and {parseResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parseResult.repeaters.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Valid Repeaters</AlertTitle>
                <AlertDescription>
                  No valid repeaters could be parsed from this file. Please check the CSV format.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  className="flex-1 font-semibold"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import {parseResult.repeaters.length.toLocaleString()} Repeaters
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Import Progress */}
        {progress.isImporting && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <p className="font-semibold text-foreground">
                  Saving batch {progress.currentBatch} of {progress.totalBatches}...
                </p>
              </div>
              <Progress value={progressPercent} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground text-right">{progressPercent}% complete</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please keep this page open while the import is in progress.
            </p>
          </div>
        )}

        {/* Import Complete */}
        {progress.isDone && progress.stats && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-foreground font-display">Import Complete!</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-2xl font-bold text-green-500 font-display">
                    {progress.stats.totalSaved.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Saved</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-2xl font-bold text-amber-500 font-display">
                    {progress.stats.totalSkipped.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Skipped</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-2xl font-bold text-primary font-display">
                    {progress.stats.totalParsed.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Parsed</p>
                </div>
              </div>

              {/* Batch errors */}
              {progress.stats.batchErrors.length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Batch Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                      {progress.stats.batchErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* State breakdown */}
              {Object.keys(progress.stats.stateBreakdown).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">By State:</p>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {Object.entries(progress.stats.stateBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([state, count]) => (
                        <Badge key={state} variant="secondary" className="text-xs">
                          {state}: {count}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Import Another File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { identity, loginStatus, login } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Login Required</h2>
            <p className="text-muted-foreground">
              You must be logged in with an admin account to access the CHIRP CSV import tool.
            </p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full font-semibold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminPassphraseGate>
      <AdminPageContent />
    </AdminPassphraseGate>
  );
}
