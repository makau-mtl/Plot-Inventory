import { useRef, useState } from 'react';
import { CornerDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Plot, STATUS_COLORS, PlotStatus } from '@/lib/supabase';

interface PlotMapProps {
  plots: Plot[];
  projectName: string;
  /** If provided, clicking a plot calls this instead of default behavior. */
  onPlotClick?: (plot: Plot) => void;
  /** Whether to show the hint text below the map. */
  showHint?: boolean;
}

export function PlotMap({ plots, projectName, onPlotClick, showHint }: PlotMapProps) {
  const plotMap = new Map<number, Plot>();
  for (const p of plots) plotMap.set(p.plot_number, p);

  const topRow = [1, 2, 3, 4, 5, 6];
  const bottomRow = [7, 8, 9, 10, 11, 12];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  const renderPlot = (num: number) => {
    const plot = plotMap.get(num);
    if (!plot) return <div key={num} className="aspect-[3/4] min-w-[90px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50" />;

    const colors = STATUS_COLORS[plot.status];
    const clickable = onPlotClick ? true : plot.status === 'AVAILABLE';

    return (
      <button
        key={num}
        disabled={!clickable}
        onClick={() => onPlotClick?.(plot)}
        className={`
          relative aspect-[3/4] min-w-[90px] rounded-lg border-2 ${colors.bg} ${colors.border}
          ${colors.text} flex flex-col items-center justify-center gap-0.5
          transition-all duration-200 select-none
          ${clickable ? 'cursor-pointer hover:scale-[1.04] hover:shadow-lg hover:z-10 active:scale-95' : 'cursor-not-allowed opacity-90'}
        `}
      >
        {plot.is_corner && (
          <span className="absolute top-0.5 right-0.5">
            <CornerDownRight className="h-3 w-3 opacity-70" />
          </span>
        )}
        <span className="text-xl font-bold tabular-nums leading-none sm:text-2xl">{num}</span>
        <span className="text-[9px] font-medium uppercase tracking-wide opacity-90">
          {plot.status}
        </span>
        <span className="text-[9px] font-semibold opacity-80 hidden sm:block">
          {plot.size_label}
        </span>
        <span className="text-[10px] font-bold opacity-95">
          {Math.round(plot.price / 1000)}k
        </span>
      </button>
    );
  };

  const renderRow = (nums: number[], label: string) => (
    <div className="relative">
      <span className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full text-[9px] font-bold uppercase tracking-widest text-gray-400 hidden sm:block">
        {label}
      </span>
      <div className="flex gap-1.5 sm:gap-2">
        {nums.map(renderPlot)}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* North indicator */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="flex items-center gap-1 text-gray-500">
          <span className="text-xs font-semibold uppercase tracking-widest">N</span>
          <span className="text-lg leading-none">&#8593;</span>
        </div>
      </div>

      {/* Survey frame */}
      <div className="relative rounded-2xl border-[3px] border-stone-600 bg-stone-100 p-3 sm:p-4 shadow-xl">
        {/* Title bar */}
        <div className="mb-3 flex items-center justify-between rounded-md bg-stone-700 px-3 py-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
            {projectName}
          </span>
          <span className="text-[10px] font-medium text-stone-300 shrink-0 ml-2">12 Plots</span>
        </div>

        {/* Scrollable map area for mobile */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin"
          >
            <div className="min-w-[560px]">
              {/* Top row */}
              {renderRow(topRow, 'Row A')}

              {/* Road divider */}
              <div className="my-2 sm:my-3 relative">
                <div className="relative h-9 sm:h-12 rounded-md bg-stone-500 overflow-hidden border-2 border-stone-600">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-0.5 w-4 sm:w-6 bg-yellow-300"
                        style={{ opacity: i % 2 === 0 ? 1 : 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest text-yellow-200">
                    Road
                  </span>
                </div>
              </div>

              {/* Bottom row */}
              {renderRow(bottomRow, 'Row B')}
            </div>
          </div>

          {/* Scroll arrows — mobile only */}
          {canScrollLeft && (
            <button
              onClick={() => scrollBy(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-700/80 text-white shadow-lg sm:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollBy(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-700/80 text-white shadow-lg sm:hidden"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Survey corners */}
        <span className="pointer-events-none absolute -top-1 -left-1 h-4 w-4 border-l-[3px] border-t-[3px] border-stone-800" />
        <span className="pointer-events-none absolute -top-1 -right-1 h-4 w-4 border-r-[3px] border-t-[3px] border-stone-800" />
        <span className="pointer-events-none absolute -bottom-1 -left-1 h-4 w-4 border-l-[3px] border-b-[3px] border-stone-800" />
        <span className="pointer-events-none absolute -bottom-1 -right-1 h-4 w-4 border-r-[3px] border-b-[3px] border-stone-800" />
      </div>

      {showHint && (
        <p className="mt-3 text-center text-xs text-gray-500">
          Tap a <span className="font-semibold text-emerald-600">green</span> plot to see details & reserve
        </p>
      )}
    </div>
  );
}

export function Legend() {
  const items: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {items.map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <span className={`h-4 w-4 rounded ${STATUS_COLORS[s].bg}`} />
          <span className="text-sm font-medium text-gray-600">{STATUS_COLORS[s].label}</span>
        </div>
      ))}
    </div>
  );
}
