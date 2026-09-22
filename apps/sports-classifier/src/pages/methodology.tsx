import {
  ArrowRight,
  Check,
  CircleDot,
  Crop,
  Dices,
  GitBranch,
  Layers,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import { useGetClassifierOverview } from "@workspace/api-client-react";
import { SectionKicker } from "@/components/app-shell";

const augmentations = [
  {
    name: "Random crop",
    detail: "Keeps the object legible when framing shifts.",
    icon: Crop,
  },
  {
    name: "Horizontal flip",
    detail: "Adds viewpoint variety without changing class identity.",
    icon: Dices,
  },
  {
    name: "Color jitter",
    detail: "Separates game context from lighting conditions.",
    icon: ScanFace,
  },
];

export default function Methodology() {
  const overviewQuery = useGetClassifierOverview();
  const overview = overviewQuery.data;
  const inputSize = overview?.inputSize ?? 224;
  const model = overview?.model ?? "EfficientNet-B0";

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 md:px-10 md:py-12">
      <div className="reveal mb-12 max-w-3xl">
        <SectionKicker>Lab notes / methodology</SectionKicker>
        <h1 className="font-display text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-6xl">
          Small dataset.
          <br />
          <span className="text-secondary">Clear decisions.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          The goal is not to hide the machinery. It is to make every choice
          inspectable — from the first split to the final prediction.
        </p>
      </div>

      <section className="reveal reveal-delay-1 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl bg-foreground p-7 text-background shadow-[8px_8px_0_hsl(var(--primary))] md:p-9">
          <SectionKicker>01 / dataset split</SectionKicker>
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Three views of the same evidence.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-background/65">
            The split protects the final test set from our learning loop. We
            tune against validation, then evaluate once on images the model has
            never seen.
          </p>
          <div className="mt-10 flex items-center gap-2">
            <div className="h-2 flex-[7] rounded-full bg-secondary" />
            <div className="h-2 flex-[2] rounded-full bg-primary" />
            <div className="h-2 flex-[1] rounded-full bg-background/40" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 font-mono-ui text-[10px] uppercase tracking-[.12em] text-background/55">
            <span>70% train</span>
            <span>15% validation</span>
            <span>15% test</span>
          </div>
          <div className="mt-9 flex items-center gap-3 border-t border-background/15 pt-5">
            <GitBranch size={17} className="text-primary" />
            <span className="font-mono-ui text-[10px] uppercase tracking-[.13em] text-background/55">
              {overview?.dataset?.split ?? "stratified split"} / class
              proportions preserved
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7 md:p-9">
          <SectionKicker>02 / augmentation</SectionKicker>
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Teach invariance, not noise.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Augmentations create plausible alternate views of the same play.
                They help the model notice shape and structure instead of
                memorizing one camera or one afternoon.
              </p>
            </div>
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Layers size={27} />
            </div>
          </div>
          <div className="mt-8 divide-y divide-border">
            {augmentations.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-secondary">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="reveal reveal-delay-2 mt-5 rounded-2xl border border-border bg-card p-7 md:p-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionKicker>03 / transfer learning</SectionKicker>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Start with seeing. Fine-tune for sport.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Rather than asking a small student dataset to learn edges,
              textures, and composition from zero, we reuse a visual backbone
              that already understands generic image structure — then specialize
              its final decision layer for three classes.
            </p>
          </div>
          <div className="font-mono-ui text-right text-[10px] uppercase tracking-[.16em] text-muted-foreground">
            Backbone <span className="ml-2 text-secondary">{model}</span>
          </div>
        </div>
        <div className="mt-9 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="rounded-xl border border-border bg-muted/50 p-5">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">
              Frozen start
            </p>
            <p className="mt-2 font-display text-xl font-bold">
              ImageNet features
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Edges, texture, composition
            </p>
          </div>
          <ArrowRight className="hidden text-secondary md:block" size={20} />
          <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-5">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-secondary">
              Adapt
            </p>
            <p className="mt-2 font-display text-xl font-bold">Train head</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Learn the sport-specific signal
            </p>
          </div>
          <ArrowRight className="hidden text-secondary md:block" size={20} />
          <div className="rounded-xl border border-primary/50 bg-primary/15 p-5">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-foreground">
              Output
            </p>
            <p className="mt-2 font-display text-xl font-bold">3 class head</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Baseball / softball / cricket
            </p>
          </div>
        </div>
      </section>

      <section className="reveal reveal-delay-3 mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-border bg-card p-7 md:p-9">
          <SectionKicker>04 / why this backbone</SectionKicker>
          <h2 className="font-display text-3xl font-bold tracking-tight">
            {model} is the useful middle.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            It gives this project a strong visual prior without turning a
            student experiment into a heavyweight infrastructure project. At{" "}
            {inputSize} × {inputSize}, it keeps iteration practical and the
            result presentable.
          </p>
          <div className="mt-8 space-y-3">
            {[
              [
                "EfficientNet-B0",
                "Selected",
                "Balanced accuracy, parameter count, and iteration speed.",
                true,
              ],
              [
                "ResNet-50",
                "Alternative",
                "A credible baseline, but a larger compute footprint for this scope.",
                false,
              ],
              [
                "Vision Transformer",
                "Alternative",
                "Powerful with scale; less forgiving when the dataset is small.",
                false,
              ],
            ].map(([name, status, detail, selected]) => (
              <div
                key={String(name)}
                className={`flex items-center gap-4 rounded-xl border p-4 ${selected ? "border-primary/60 bg-primary/10" : "border-border bg-muted/30"}`}
              >
                <div
                  className={`grid size-8 shrink-0 place-items-center rounded-full ${selected ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
                >
                  {selected ? <Check size={15} /> : <CircleDot size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{String(name)}</span>
                    <span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">
                      {String(status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(detail)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="corner-frame rounded-2xl border border-secondary/30 bg-secondary/5 p-7 md:p-9">
          <div className="flex items-center gap-2 text-secondary">
            <ShieldCheck size={20} />
            <span className="font-mono-ui text-[10px] uppercase tracking-[.18em]">
              Research principle
            </span>
          </div>
          <h2 className="mt-7 font-display text-3xl font-bold tracking-tight">
            A prediction is only as useful as the context around it.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            That is why this workspace surfaces confidence, alternatives, split
            logic, and readiness in the open. A model that is not trained is not
            quietly presented as ready.
          </p>
          <div className="mt-8 border-t border-secondary/20 pt-5 font-mono-ui text-[10px] uppercase tracking-[.15em] text-secondary">
            Transparent by default / inspect the method
          </div>
        </div>
      </section>
    </div>
  );
}
