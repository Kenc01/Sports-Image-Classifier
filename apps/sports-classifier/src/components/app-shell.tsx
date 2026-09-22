import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  CircleHelp,
  Crosshair,
  FlaskConical,
  ImageUp,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: Activity },
  { href: '/predict', label: 'Predict', icon: ImageUp },
  { href: '/methodology', label: 'Methodology', icon: BookOpen },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = navItems.find((item) => item.href === location)?.label ?? 'Workspace';

  return (
    <div className="paper-noise min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
        <aside className="sticky top-0 h-[100dvh] hidden w-[248px] shrink-0 flex-col justify-between bg-sidebar px-5 py-6 text-sidebar-foreground md:flex">
          <div>
            <Link href="/" data-testid="link-brand" className="mb-12 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[4px_4px_0_hsl(var(--secondary))]">
                <Crosshair size={21} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-display text-[17px] font-bold tracking-tight">Field Vision</p>
                <p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">CV studio / 01</p>
              </div>
            </Link>
            <div className="mb-4 px-3 font-mono-ui text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/40">Project console</div>
            <nav className="space-y-1.5" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`link-nav-${item.label.toLowerCase()}`}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    {active && <ChevronRight className="ml-auto" size={15} />}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-12 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <FlaskConical size={15} />
                <span className="font-mono-ui text-[10px] uppercase tracking-[.16em]">Research mode</span>
              </div>
              <p className="text-xs leading-relaxed text-sidebar-foreground/60">A small, inspectable workspace for learning what visual models notice.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 text-sidebar-foreground/45">
              <CircleHelp size={15} />
              <span className="text-xs">Need context? Read the method.</span>
            </div>
            <div className="flex items-center justify-between border-t border-sidebar-border pt-4 font-mono-ui text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/35">
              <span>v0.1 / student lab</span>
              <span className="size-2 rounded-full bg-primary" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md md:px-10">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileOpen((open) => !open)} data-testid="button-mobile-menu" className="grid size-9 place-items-center rounded-lg border border-border bg-card md:hidden">
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">
                <span className="hidden sm:inline">Sports image classifier / </span>{activeLabel}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">API connected</span>
              </div>
              <div className="grid size-9 place-items-center rounded-full bg-secondary font-display text-xs font-bold text-secondary-foreground">SV</div>
            </div>
          </header>

          {mobileOpen && (
            <div className="absolute inset-x-0 top-[72px] z-10 border-b border-border bg-sidebar p-4 text-sidebar-foreground shadow-lg md:hidden">
              <nav className="space-y-1" aria-label="Mobile navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${item.label.toLowerCase()}`} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold">
                      <Icon size={16} />{item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          <main className="page-grid min-h-[calc(100dvh-72px)]">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function SectionKicker({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-secondary"><span className="size-1.5 bg-secondary" />{children}</div>;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
}

export function formatRunDate(value: string | null | undefined) {
  if (!value) return 'No run recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
