import { useEffect, useState, useCallback } from 'react';
import {
  MapPin, Phone, ArrowLeft, Building2, BadgeCheck, FileText, Map as MapIcon,
  Navigation, Droplets, Star, Play, Eye, ChevronRight,
} from 'lucide-react';
import { supabase, Project, Plot, Lead } from '@/lib/supabase';
import { PlotMap, Legend } from '@/components/PlotMap';
import { PlotDetailModal } from '@/components/PlotDetailModal';
import { Lightbox } from '@/components/Lightbox';
import { SocialProofToast } from '@/components/SocialProofToast';
import { navigate } from '@/lib/router';

interface Props {
  projectId: string;
}

const WHATSAPP_NUMBER = '254700000000';

const HERO_IMAGE = 'https://images.pexels.com/photos/30255135/pexels-photo-30255135.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const BEACON_IMAGE = 'https://images.pexels.com/photos/8292784/pexels-photo-8292784.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const DOC_IMAGE = 'https://images.pexels.com/photos/12955837/pexels-photo-12955837.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const SURVEY_IMAGE = 'https://images.pexels.com/photos/7841841/pexels-photo-7841841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const TESTIMONIALS = [
  {
    name: 'James M.',
    plot: 1,
    photo: 'https://images.pexels.com/photos/14950779/pexels-photo-14950779.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quote: 'I visited, saw beacons, paid in 2 weeks. Everything was exactly as shown.',
  },
  {
    name: 'Wanjiku K.',
    plot: 2,
    photo: 'https://images.pexels.com/photos/16934847/pexels-photo-16934847.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quote: 'The title was ready before I even finished paying. No stories, just facts.',
  },
  {
    name: 'Otieno P.',
    plot: 5,
    photo: 'https://images.pexels.com/photos/35681211/pexels-photo-35681211.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    quote: 'Corner plot with clean beacons. The site visit van picked me up from TRM.',
  },
];

const TRUST_ITEMS = [
  { icon: FileText, label: 'Title Deed Ready', image: DOC_IMAGE, caption: 'Title deed sample — Verified Aug 2025' },
  { icon: MapIcon, label: 'Mutation Done', image: SURVEY_IMAGE, caption: 'Mutation map — Surveyor Kimani, Lic. No KLS/4471' },
  { icon: Navigation, label: 'Beacons Installed', image: BEACON_IMAGE, caption: 'Beacon photo — all 12 plots beaconed Aug 2025' },
  { icon: Droplets, label: 'Water & Access Road', image: HERO_IMAGE, caption: 'Access road and water connection on site' },
];

const DOCS = [
  { label: 'Title Sample', image: DOC_IMAGE, blurred: true },
  { label: 'Mutation Map', image: SURVEY_IMAGE, blurred: false },
  { label: 'Beacon Photo', image: BEACON_IMAGE, blurred: false },
  { label: 'Google Pin', image: HERO_IMAGE, blurred: false },
];

export function PublicProjectPage({ projectId }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption?: string } | null>(null);

  const fetchProject = useCallback(async () => {
    const [{ data: proj }, { data: plotData }, { data: leadData }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
      supabase.from('plots').select('*').eq('project_id', projectId).order('plot_number'),
      supabase.from('leads').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    ]);
    setProject(proj as Project | null);
    setPlots((plotData as Plot[]) ?? []);
    setLeads((leadData as Lead[]) ?? []);
    if (!proj) setError('Project not found');
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchProject().finally(() => setLoading(false));

    const channel = supabase
      .channel(`plots-public-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plots', filter: `project_id=eq.${projectId}` },
        () => fetchProject(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `project_id=eq.${projectId}` },
        () => fetchProject(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProject, projectId]);

  const handleReserved = () => {
    fetchProject();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400">Loading project…</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
        <p className="text-stone-600">{error ?? 'Project not found'}</p>
        <button onClick={() => navigate('/')} className="text-emerald-700 font-semibold">
          Go home
        </button>
      </div>
    );
  }

  const availableCount = plots.filter((p) => p.status === 'AVAILABLE').length;
  const soldCount = plots.filter((p) => p.status === 'SOLD').length;
  const reservedCount = plots.filter((p) => p.status === 'RESERVED').length;
  const minPrice = plots.length > 0 ? Math.min(...plots.map((p) => p.price)) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* === HERO === */}
      <section className="relative overflow-hidden">
        <img src={HERO_IMAGE} alt="Aerial view of the land" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900/80" />

        <div className="relative mx-auto max-w-3xl px-4 py-10 sm:py-16">
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-3">
            <Building2 className="h-4 w-4" />
            <span>Miribo Plot Manager</span>
          </div>

          {/* Trust badge */}
          <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full bg-emerald-600/90 px-4 py-2 text-white text-xs font-semibold backdrop-blur-sm mb-4">
            <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Title Verified</span>
            <span className="text-emerald-200">|</span>
            <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Beacons Done</span>
            <span className="text-emerald-200">|</span>
            <span>{availableCount} Plots Left</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {project.name}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-stone-200 max-w-xl">
            Donyo Sabuk — 50x100 plots from 250k. Daily site visit van at TRM 9am.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <a
              href="#map"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-white font-bold shadow-lg transition hover:bg-emerald-500 active:scale-95"
            >
              <MapPin className="h-5 w-5" />
              View Live Map & Availability
            </a>
            <a
              href="#documents"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3.5 text-white font-bold backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
            >
              <FileText className="h-5 w-5" />
              See Title & Documents
            </a>
          </div>
        </div>
      </section>

      {/* === TRUST BAR === */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-stone-100">
            {TRUST_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => setLightbox({ src: item.image, alt: item.label, caption: item.caption })}
                className="flex flex-col items-center gap-1.5 py-4 px-2 transition hover:bg-stone-50"
              >
                <item.icon className="h-5 w-5 text-emerald-600" />
                <span className="text-[11px] sm:text-xs font-semibold text-stone-700 text-center leading-tight">
                  {item.label}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-500">
                  <Eye className="h-3 w-3" /> View proof
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* === STATS === */}
      <section className="mx-auto max-w-3xl px-4 pt-6">
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Available" value={availableCount} accent="text-emerald-600" />
          <StatCard label="Reserved" value={reservedCount} accent="text-amber-500" />
          <StatCard label="Sold" value={soldCount} accent="text-stone-500" />
          <StatCard label="From KSh" value={Math.round(minPrice).toLocaleString()} accent="text-stone-700" small />
        </div>
      </section>

      {/* === MAP SECTION === */}
      <section id="map" className="mx-auto max-w-3xl px-4 py-6 space-y-4 scroll-mt-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-1 text-center text-lg font-bold text-stone-800">
            Live Availability Map
          </h2>
          <p className="mb-4 text-center text-xs text-stone-500">
            Grey = SOLD &middot; Green = Available &middot; Yellow = Reserved
          </p>
          <PlotMap
            plots={plots}
            projectName={project.name}
            onPlotClick={(plot) => setSelectedPlot(plot)}
            showHint
          />
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <Legend />
        </div>
      </section>

      {/* === TESTIMONIALS === */}
      <section className="bg-stone-100 py-8">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-1 text-center text-2xl font-bold text-stone-800">
            Why 8 Families Bought Here
          </h2>
          <p className="mb-6 text-center text-sm text-stone-500">
            Real buyers, real plots, real beacons.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <img src={t.photo} alt={t.name} className="h-12 w-12 rounded-full object-cover border-2 border-emerald-100" />
                  <div>
                    <div className="font-bold text-stone-800">{t.name}</div>
                    <div className="text-xs text-stone-400">Bought Plot {t.plot}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-stone-600 italic">"{t.quote}"</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <a
              href="https://wa.me/254700000000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              <Play className="h-4 w-4" />
              Watch 30 sec site visit video
            </a>
          </div>
        </div>
      </section>

      {/* === VERIFIED DOCUMENTS === */}
      <section id="documents" className="mx-auto max-w-3xl px-4 py-8 scroll-mt-4">
        <h2 className="mb-1 text-center text-2xl font-bold text-stone-800">
          Verified Documents — No Stories
        </h2>
        <p className="mb-6 text-center text-sm text-stone-500">
          Click any document to view the full proof.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DOCS.map((doc) => (
            <button
              key={doc.label}
              onClick={() => setLightbox({ src: doc.image, alt: doc.label, caption: 'Verified Aug 2025 — Surveyor Kimani, License No KLS/4471' })}
              className="group rounded-xl border border-stone-200 bg-white p-2 shadow-sm transition hover:shadow-md"
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={doc.image}
                  alt={doc.label}
                  className={`h-28 w-full object-cover transition ${doc.blurred ? 'blur-[6px] group-hover:blur-0' : ''}`}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-stone-900/0 group-hover:bg-stone-900/20 transition">
                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-bold text-stone-700">{doc.label}</div>
                <div className="text-[10px] text-stone-400">Verified Aug 2025</div>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-stone-400">
          Verified Aug 2025 — Surveyor Kimani, License No KLS/4471
        </p>
      </section>

      {/* === BACK LINK === */}
      <div className="mx-auto max-w-3xl px-4 pb-24 text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </button>
      </div>

      {/* === STICKY WHATSAPP BAR === */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I'm interested in ${project.name}`)}`}
          target="_blank"
          rel="noreferrer"
          className="mx-auto flex max-w-3xl items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-white font-bold shadow-lg transition hover:bg-green-600 active:scale-[0.98]"
        >
          <Phone className="h-5 w-5" />
          Ask About This Plot on WhatsApp
        </a>
      </div>

      {/* === SOCIAL PROOF TOAST === */}
      <SocialProofToast leads={leads} />

      {/* === MODALS === */}
      {selectedPlot && (
        <PlotDetailModal
          plot={selectedPlot}
          projectName={project.name}
          projectId={project.id}
          beaconPhotoUrl={selectedPlot.beacon_photo_url}
          onClose={() => setSelectedPlot(null)}
          onReserved={handleReserved}
        />
      )}

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, accent, small }: { label: string; value: number | string; accent: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-2 py-3 text-center shadow-sm">
      <div className={`font-bold tabular-nums ${accent} ${small ? 'text-xs' : 'text-xl'}`}>{value}</div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-400">{label}</div>
    </div>
  );
}
