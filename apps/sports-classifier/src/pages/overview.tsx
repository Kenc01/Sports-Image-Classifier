import { Link } from "wouter";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  Database,
  Image,
  ImageUp,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  useGetClassifierOverview,
  useHealthCheck,
} from "@workspace/api-client-react";
import {
  formatPercent,
  formatRunDate,
  SectionKicker,
} from "@/components/app-shell";

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-[1320px] space-y-6 px-5 py-8 md:px-10 md:py-12">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="h-20 w-3/4 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export default function Overview() {
  const overviewQuery = useGetClassifierOverview();
  const healthQuery = useHealthCheck();
  const overview = overviewQuery.data;

  if (overviewQuery.isLoading) return <OverviewSkeleton />;
  if (
    overviewQuery.isError ||
    !overview ||
    !overview.dataset ||
    !overview.classes ||
    !overview.metrics
  ) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent">
          <RefreshCw size={25} />
        </div>
        <SectionKicker>Console unavailable</SectionKicker>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          The project readout is offline.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We could not load the classifier overview. Check the service and try
          again.
        </p>
        <button
          type="button"
          onClick={() => overviewQuery.refetch()}
          data-testid="button-retry-overview"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
        >
          <RefreshCw size={15} /> Retry readout
        </button>
      </div>
    );
  }

  const dataset = overview.dataset;
  const total = Math.max(dataset.totalImages, 1);
  const splitRows = [
    { label: "Train", value: dataset.trainImages, color: "bg-secondary" },
    {
      label: "Validation",
      value: dataset.validationImages,
      color: "bg-accent",
    },
    { label: "Test", value: dataset.testImages, color: "bg-foreground" },
  ];

  return (
    <div className="mx-auto max-w-[1320px] px-5 py-8 md:px-10 md:py-12">
      <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="reveal">
          <SectionKicker>Experiment 01 / readiness dashboard</SectionKicker>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-6xl">
            Teach a model to see
            <br />
            <span className="text-secondary">the game.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            A focused visual-learning console for sorting baseball, softball,
            and cricket imagery — one dataset, one honest readout at a time.
          </p>
        </div>
        <div className="reveal reveal-delay-1 flex items-center gap-3 lg:pb-1">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${overview.inferenceReady ? "border-primary/50 bg-primary/20 text-foreground" : "border-accent/40 bg-accent/10 text-foreground"}`}
          >
            <span
              className={`size-2 rounded-full ${overview.inferenceReady ? "bg-primary" : "bg-accent"}`}
            />
            {overview.inferenceReady ? "Inference ready" : "Training required"}
          </div>
          <Link
            href="/predict"
            data-testid="link-open-predict"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
          >
            Open predictor <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="reveal reveal-delay-1 corner-frame scanline overflow-hidden rounded-2xl border border-foreground/10 bg-foreground p-6 text-background shadow-[8px_8px_0_hsl(var(--primary))] md:p-8">
          <div className="relative z-[1] flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-md">
              <div className="mb-8 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">
                <Sparkles size={14} /> Model brief
              </div>
              <p className="font-mono-ui text-[11px] uppercase tracking-[.18em] text-background/45">
                {overview.modelFamily}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                {overview.model}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-background/65">
                {overview.modelRationale}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start md:items-end">
              <div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-background/45">
                Input window
              </div>
              <div className="mt-2 font-display text-5xl font-bold text-primary">
                {overview.inputSize}
                <span className="ml-1 text-lg">px</span>
              </div>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-background/15 px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.12em] text-background/55">
                <LockKeyhole size={12} /> checkpoint gated
              </div>
            </div>
          </div>
        </section>

        <section className="reveal reveal-delay-2 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
          <div className="flex items-start justify-between">
            <div>
              <SectionKicker>Dataset signal</SectionKicker>
              <h2 className="font-display text-2xl font-bold">
                {dataset.readinessLabel}
              </h2>
            </div>
            <Database className="text-secondary" size={21} />
          </div>
          <div className="mt-8 flex items-end gap-2">
            <span className="font-display text-5xl font-bold tracking-tight">
              {dataset.totalImages.toLocaleString()}
            </span>
            <span className="pb-1 font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">
              images indexed
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
            <div className="flex h-full">
              {splitRows.map((row) => (
                <div
                  key={row.label}
                  className={`${row.color} h-full transition-all`}
                  style={{ width: `${(row.value / total) * 100}%` }}
                  title={`${row.label}: ${row.value}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {splitRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground">
                  <span className={`size-1.5 ${row.color}`} />
                  {row.label}
                </div>
                <div className="mt-1 font-display text-lg font-bold">
                  {row.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">
            Split / {dataset.split}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[.95fr_1.05fr]">
        <section className="reveal reveal-delay-2 rounded-2xl border border-border bg-card p-6 md:p-7">
          <div className="flex items-start justify-between">
            <div>
              <SectionKicker>Classes in scope</SectionKicker>
              <h2 className="font-display text-2xl font-bold">
                Three visual languages
              </h2>
            </div>
            <Layers3 className="text-secondary" size={20} />
          </div>
          <div className="mt-6 divide-y divide-border">
            {overview.classes.map((item, index) => (
              <div
                key={item.slug}
                data-testid={`class-row-${item.slug}`}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-lg font-mono-ui text-xs font-bold ${index === 1 ? "bg-primary text-primary-foreground" : index === 2 ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{item.label}</div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold">
                    {(dataset.classCounts[item.slug] ?? 0).toLocaleString()}
                  </div>
                  <div className="font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground">
                    images / {item.targetCount} target
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal reveal-delay-3 rounded-2xl border border-border bg-card p-6 md:p-7">
          <div className="flex items-start justify-between">
            <div>
              <SectionKicker>Latest evaluation</SectionKicker>
              <h2 className="font-display text-2xl font-bold">
                {overview.metrics.lastRun
                  ? "Metrics from last run"
                  : "Waiting for first run"}
              </h2>
            </div>
            <BarChart3 className="text-secondary" size={20} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Accuracy", overview.metrics.accuracy],
              ["Precision", overview.metrics.precision],
              ["Recall", overview.metrics.recall],
              ["Epochs", overview.metrics.epochs] as const,
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted/60 p-4">
                <div className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">
                  {label}
                </div>
                <div className="mt-2 font-display text-2xl font-bold">
                  {label === "Epochs"
                    ? (value ?? "—")
                    : formatPercent(typeof value === "number" ? value : null)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">
            <span>Last run / {formatRunDate(overview.metrics.lastRun)}</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${healthQuery.isSuccess ? "bg-primary" : "bg-accent"}`}
              />{" "}
              service {healthQuery.isSuccess ? "online" : "checking"}
            </span>
          </div>
          {!overview.inferenceReady && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
              <Image className="mt-0.5 shrink-0 text-accent" size={16} />
              <p className="text-xs leading-relaxed text-foreground/75">
                {overview.inferenceMessage}
              </p>
            </div>
          )}
          {overview.metrics.confusionMatrix && (
            <div className="mt-6 border-t border-border pt-5">
              <div className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">
                Test confusion matrix / actual rows · predicted columns
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[360px] border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border-b border-border px-2 py-2 text-left font-mono-ui text-[9px] font-normal uppercase tracking-[.1em] text-muted-foreground">
                        Actual
                      </th>
                      {overview.classes.map((item) => (
                        <th
                          key={item.slug}
                          className="border-b border-border px-2 py-2 text-center font-mono-ui text-[9px] font-normal uppercase tracking-[.1em] text-muted-foreground"
                        >
                          {item.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.metrics.confusionMatrix.map((row, rowIndex) => (
                      <tr key={overview.classes[rowIndex]?.slug ?? rowIndex}>
                        <th className="border-b border-border px-2 py-2 text-left font-bold">
                          {overview.classes[rowIndex]?.label ?? "Unknown"}
                        </th>
                        {row.map((value, columnIndex) => (
                          <td
                            key={`${rowIndex}-${columnIndex}`}
                            className={`border-b border-border px-2 py-2 text-center font-display text-base font-bold ${rowIndex === columnIndex ? "bg-primary/20" : ""}`}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-secondary/25 bg-secondary/5 px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <ImageUp size={17} />
          </div>
          <div>
            <p className="text-sm font-bold">Have a test image?</p>
            <p className="text-xs text-muted-foreground">
              Send one through the live checkpoint and inspect its thinking.
            </p>
          </div>
        </div>
        <Link
          href="/predict"
          data-testid="link-try-prediction"
          className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:underline"
        >
          Try a prediction <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}
