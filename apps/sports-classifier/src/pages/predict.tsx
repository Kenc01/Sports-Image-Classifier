import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileImage, ImagePlus, LoaderCircle, RotateCcw, UploadCloud } from 'lucide-react';
import { useGetClassifierOverview, usePredictClassifier, type Prediction } from '@workspace/api-client-react';
import { formatPercent, SectionKicker } from '@/components/app-shell';

function getErrorMessage(error: unknown) {
  if (!error) return '';
  if (typeof error === 'object' && error !== null && 'error' in error) return String((error as { error?: string }).error);
  if (error instanceof Error) return error.message;
  return 'The service could not classify this image. Try again.';
}

export default function Predict() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [result, setResult] = useState<Prediction | null>(null);
  const overviewQuery = useGetClassifierOverview();
  const predictMutation = usePredictClassifier();
  const overview = overviewQuery.data;

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFileError('Choose an image file to continue.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setFileError('Images must be smaller than 12 MB.');
      return;
    }
    setFileError('');
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!preview || predictMutation.isPending) return;
    predictMutation.mutate({ data: { imageData: preview, fileName } }, { onSuccess: (prediction) => setResult(prediction) });
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 md:px-10 md:py-12">
      <div className="reveal mb-9 max-w-2xl"><SectionKicker>Live inference / single image</SectionKicker><h1 className="font-display text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-6xl">What does the<br /><span className="text-secondary">model see?</span></h1><p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">Drop in one image. The latest checkpoint will return its strongest class, confidence, and the alternatives it considered.</p></div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <section className="reveal reveal-delay-1">
          <input ref={inputRef} type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readFile(file); }} className="sr-only" data-testid="input-image-file" />
          <button type="button" onClick={() => inputRef.current?.click()} data-testid="button-choose-image" className={`corner-frame group relative flex min-h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-colors ${preview ? 'border-secondary/60 bg-foreground' : 'border-border bg-card hover:border-secondary hover:bg-secondary/5'}`}>
            {preview ? <img src={preview} alt="Selected test image preview" data-testid="img-selected-preview" className="absolute inset-0 size-full object-contain opacity-90" /> : <><div className="relative mb-5 grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[5px_5px_0_hsl(var(--secondary))] transition-transform group-hover:-translate-y-1"><UploadCloud size={28} /></div><span className="font-display text-xl font-bold">Choose a test image</span><span className="mt-2 text-xs text-muted-foreground">PNG, JPG, WEBP / up to 12 MB</span><span className="mt-7 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground"><ImagePlus size={12} /> Browse files</span></>}
            {preview && <span className="absolute bottom-4 left-4 rounded-full bg-background/90 px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.1em] text-foreground backdrop-blur">{fileName}</span>}
          </button>
          {fileError && <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-destructive"><AlertTriangle size={14} /> {fileError}</div>}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="min-w-0"><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Checkpoint status</p><p className="mt-1 truncate text-xs">{overviewQuery.isLoading ? 'Reading project status…' : overview?.inferenceReady ? `${overview.model} / ready to infer` : overview?.inferenceMessage ?? 'Status unavailable'}</p></div>
            <button type="button" onClick={handleSubmit} disabled={!preview || predictMutation.isPending} data-testid="button-run-prediction" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0">{predictMutation.isPending ? <><LoaderCircle size={16} className="animate-spin" /> Reading image</> : <>Run prediction <span aria-hidden>→</span></>}</button>
          </div>
          {predictMutation.isError && <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm"><AlertTriangle className="mt-0.5 shrink-0 text-accent" size={17} /><div><p className="font-bold">Inference did not run</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{getErrorMessage(predictMutation.error)}</p></div></div>}
        </section>

        <section className="reveal reveal-delay-2">
          {!result && !predictMutation.isPending && (
            <div className="flex min-h-[420px] flex-col justify-between rounded-2xl border border-border bg-card p-6 md:p-8">
              <div><SectionKicker>Prediction output</SectionKicker><h2 className="font-display text-3xl font-bold tracking-tight">Awaiting an image</h2><p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{overview?.inferenceReady ? 'The classifier will expose its top signal here, alongside the near-misses.' : 'The model checkpoint is not ready yet. You can still submit an image to see the API’s honest response.'}</p></div>
              <div className="relative mt-10 grid place-items-center py-8"><div className="absolute size-44 rounded-full border border-dashed border-secondary/35" style={{ animation: 'pulse-ring 3s ease-in-out infinite' }} /><div className="absolute size-28 rounded-full border border-secondary/20" /><div className="grid size-16 place-items-center rounded-full bg-secondary text-secondary-foreground"><FileImage size={25} /></div></div>
              <div className="flex items-center gap-2 border-t border-border pt-4 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground"><span className="size-1.5 rounded-full bg-muted-foreground/50" /> No output yet</div>
            </div>
          )}
          {predictMutation.isPending && <div className="min-h-[420px] rounded-2xl border border-border bg-card p-6 md:p-8"><SectionKicker>Prediction output</SectionKicker><h2 className="font-display text-3xl font-bold tracking-tight">Reading visual signal</h2><div className="mt-12 space-y-5"><div className="h-16 animate-pulse rounded-xl bg-muted" /><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-3 w-1/2 animate-pulse rounded bg-muted" /><div className="mt-12 grid grid-cols-2 gap-3"><div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-20 animate-pulse rounded-xl bg-muted" /></div></div></div>}
          {result && <div className="min-h-[420px] rounded-2xl border border-foreground/10 bg-foreground p-6 text-background shadow-[8px_8px_0_hsl(var(--primary))] md:p-8"><div className="flex items-start justify-between"><div><div className="mb-3 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary"><CheckCircle2 size={14} /> Result returned</div><h2 className="font-display text-5xl font-bold tracking-[-.04em]">{result.label}</h2></div><button type="button" onClick={() => setResult(null)} data-testid="button-reset-prediction" className="grid size-9 place-items-center rounded-lg border border-background/15 text-background/60 transition-colors hover:bg-background/10 hover:text-background" aria-label="Clear prediction"><RotateCcw size={15} /></button></div><div className="mt-10 flex items-end gap-3"><span className="font-display text-7xl font-bold leading-none text-primary">{formatPercent(result.confidence)}</span><span className="pb-1 font-mono-ui text-[10px] uppercase tracking-[.14em] text-background/45">confidence</span></div><div className="mt-8 h-2 overflow-hidden rounded-full bg-background/10"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, result.confidence <= 1 ? result.confidence * 100 : result.confidence)}%` }} /></div><div className="mt-8 border-t border-background/15 pt-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-background/45">Alternatives</p><div className="mt-3 space-y-3">{result.alternatives.map((alternative) => <div key={alternative.label} className="flex items-center justify-between text-sm"><span>{alternative.label}</span><span className="font-mono-ui text-xs text-background/55">{formatPercent(alternative.confidence)}</span></div>)}</div></div><div className="mt-7 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.12em] text-background/45"><span>Model / {result.model}</span></div></div>}
        </section>
      </div>
    </div>
  );
}
