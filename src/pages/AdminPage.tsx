import { useEffect, useState, useCallback } from 'react';
import {
  Lock, ArrowLeft, MapPin, Building2, Users, Phone, LogOut, ChevronRight,
  ImagePlus, CheckCircle2, Table as TableIcon,
} from 'lucide-react';
import { supabase, Project, Plot, Lead, PlotStatus, LeadStage, LEAD_STAGES, STATUS_COLORS } from '@/lib/supabase';
import { PlotMap } from '@/components/PlotMap';
import { navigate } from '@/lib/router';

const ADMIN_PASSWORD = '1234';
const STORAGE_KEY = 'miribo_admin_authed';
const WHATSAPP_NUMBER = '254700000000';

interface AdminPageProps {
  projectId?: string;
}

export function AdminPage({ projectId }: AdminPageProps) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  if (projectId) {
    return (
      <ProjectAdminLoader
        projectId={projectId}
        onBack={() => { window.location.hash = '/admin'; }}
        onLogout={() => {
          sessionStorage.removeItem(STORAGE_KEY);
          setAuthed(false);
        }}
      />
    );
  }

  return <AdminDashboard onLogout={() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
  }} />;
}

function ProjectAdminLoader({ projectId, onBack, onLogout }: { projectId: string; onBack: () => void; onLogout: () => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle()
      .then(({ data }) => {
        setProject(data as Project | null);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400">Loading…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
        <p className="text-stone-600">Project not found</p>
        <button onClick={onBack} className="text-emerald-700 font-semibold">Back to projects</button>
      </div>
    );
  }

  return <ProjectAdmin project={project} onBack={onBack} onLogout={onLogout} />;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-900 to-stone-800 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-stone-800 text-white">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Miribo Admin</h1>
          <p className="mt-1 text-sm text-stone-500">Enter password to manage plots</p>
        </div>

        <div>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className={`w-full rounded-xl border-2 px-4 py-3.5 text-center text-lg font-medium tracking-widest outline-none transition ${
              error ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-emerald-600'
            }`}
          />
          {error && <p className="mt-2 text-center text-sm text-red-500">Incorrect password</p>}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-stone-800 py-3.5 text-white font-semibold transition hover:bg-stone-700 active:scale-95"
        >
          Log in
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setProjects((data as Project[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-stone-800 text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <span className="font-bold">Miribo Admin</span>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-stone-300 hover:text-white">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-lg font-bold text-stone-900">Projects</h1>
        <div className="space-y-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { navigate(`/admin/${encodeURIComponent(p.id)}`); }}
              className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-400 hover:shadow-md active:scale-[0.98]"
            >
              <div>
                <div className="font-semibold text-stone-900">{p.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-sm text-stone-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {p.location}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-stone-400" />
            </button>
          ))}
          {projects.length === 0 && (
            <p className="text-center text-stone-400 py-8">No projects yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

interface ProjectAdminProps {
  project: Project;
  onBack: () => void;
  onLogout: () => void;
}

function ProjectAdmin({ project, onBack, onLogout }: ProjectAdminProps) {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlot, setSavingPlot] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [{ data: plotData }, { data: leadData }] = await Promise.all([
      supabase.from('plots').select('*').eq('project_id', project.id).order('plot_number'),
      supabase.from('leads').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
    ]);
    setPlots((plotData as Plot[]) ?? []);
    setLeads((leadData as Lead[]) ?? []);
  }, [project.id]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));

    const channel = supabase
      .channel(`plots-admin-${project.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plots', filter: `project_id=eq.${project.id}` },
        () => fetchAll(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `project_id=eq.${project.id}` },
        () => fetchAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, project.id]);

  const updatePlotStatus = async (plot: Plot, status: PlotStatus) => {
    setSavingPlot(plot.id);
    setPlots((prev) => prev.map((p) =>
      p.id === plot.id
        ? { ...p, status, sold_at: status === 'SOLD' ? new Date().toISOString() : null }
        : p
    ));
    try {
      await supabase
        .from('plots')
        .update({ status, sold_at: status === 'SOLD' ? new Date().toISOString() : null })
        .eq('id', plot.id);
    } catch {
      fetchAll();
    } finally {
      setSavingPlot(null);
    }
  };

  const updatePlotBuyer = async (plot: Plot, buyerName: string) => {
    setPlots((prev) => prev.map((p) => p.id === plot.id ? { ...p, buyer_name: buyerName } : p));
    await supabase.from('plots').update({ buyer_name: buyerName }).eq('id', plot.id);
  };

  const updatePlotProofImage = async (plot: Plot, proofImageUrl: string) => {
    setPlots((prev) => prev.map((p) => p.id === plot.id ? { ...p, proof_image_url: proofImageUrl } : p));
    await supabase.from('plots').update({ proof_image_url: proofImageUrl }).eq('id', plot.id);
  };

  const updateLeadStage = async (lead: Lead, stage: LeadStage) => {
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, stage } : l));
    await supabase.from('leads').update({ stage }).eq('id', lead.id);
  };

  const markLeadSold = async (lead: Lead) => {
    await updateLeadStage(lead, 'SOLD');
    const plot = plots.find((p) => p.plot_number === lead.plot_number);
    if (plot) {
      await updatePlotStatus(plot, 'SOLD');
      await updatePlotBuyer(plot, lead.name);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-stone-800 text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Projects
          </button>
          <span className="font-bold text-sm truncate max-w-[180px]">{project.name}</span>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-stone-300 hover:text-white">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Visual map */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">Visual Map</h2>
          <PlotMap plots={plots} projectName={project.name} onPlotClick={(p) => updatePlotStatus(p, nextStatus(p.status))} />
        </div>

        {/* Plot management table */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-stone-600" />
            <h2 className="text-lg font-bold text-stone-900">Plot Management</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-3">Plot</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Buyer Name</th>
                  <th className="py-2 pr-3">Proof Image</th>
                  <th className="py-2 pr-3">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {plots.map((plot) => (
                  <tr key={plot.id} className="hover:bg-stone-50">
                    <td className="py-2.5 pr-3 font-bold tabular-nums text-stone-800">#{plot.plot_number}</td>
                    <td className="py-2.5 pr-3">
                      <StatusSelect
                        value={plot.status}
                        onChange={(s) => updatePlotStatus(plot, s)}
                        disabled={savingPlot === plot.id}
                      />
                    </td>
                    <td className="py-2.5 pr-3">
                      <input
                        type="text"
                        value={plot.buyer_name ?? ''}
                        onChange={(e) => updatePlotBuyer(plot, e.target.value)}
                        placeholder="—"
                        className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="py-2.5 pr-3">
                      <ProofUpload
                        url={plot.proof_image_url}
                        onChange={(url) => updatePlotProofImage(plot, url)}
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-stone-600 tabular-nums">
                      KSh {Math.round(plot.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {plots.map((plot) => (
              <div key={plot.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-800">Plot #{plot.plot_number}</span>
                  <span className="text-xs text-stone-400">KSh {Math.round(plot.price).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-stone-400">Status</label>
                    <StatusSelect
                      value={plot.status}
                      onChange={(s) => updatePlotStatus(plot, s)}
                      disabled={savingPlot === plot.id}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-stone-400">Buyer Name</label>
                    <input
                      type="text"
                      value={plot.buyer_name ?? ''}
                      onChange={(e) => updatePlotBuyer(plot, e.target.value)}
                      placeholder="—"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-stone-400">Proof Image</label>
                    <ProofUpload
                      url={plot.proof_image_url}
                      onChange={(url) => updatePlotProofImage(plot, url)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads table */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-stone-600" />
            <h2 className="text-lg font-bold text-stone-900">Leads</h2>
            <span className="ml-auto rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
              {leads.length}
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs font-semibold uppercase tracking-wide text-stone-400">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Plot</th>
                  <th className="py-2 pr-3">Stage</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-stone-50">
                    <td className="py-2.5 pr-3 font-medium text-stone-800">{lead.name || 'Unknown'}</td>
                    <td className="py-2.5 pr-3">
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-green-600 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="py-2.5 pr-3 text-stone-600">#{lead.plot_number}</td>
                    <td className="py-2.5 pr-3">
                      <StageSelect value={lead.stage} onChange={(s) => updateLeadStage(lead, s)} />
                    </td>
                    <td className="py-2.5 pr-3">
                      {lead.stage !== 'SOLD' && (
                        <button
                          onClick={() => markLeadSold(lead)}
                          className="inline-flex items-center gap-1 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark SOLD
                        </button>
                      )}
                      {lead.stage === 'SOLD' && (
                        <span className="text-xs font-semibold text-stone-400">Sold</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-stone-800">{lead.name || 'Unknown'}</span>
                  <span className="text-xs text-stone-400">Plot #{lead.plot_number}</span>
                </div>
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {lead.phone}
                  </a>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-stone-400">Stage</label>
                    <StageSelect value={lead.stage} onChange={(s) => updateLeadStage(lead, s)} />
                  </div>
                  {lead.stage !== 'SOLD' && (
                    <button
                      onClick={() => markLeadSold(lead)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as SOLD
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {leads.length === 0 && (
            <p className="py-8 text-center text-sm text-stone-400">No leads yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function nextStatus(s: PlotStatus): PlotStatus {
  if (s === 'AVAILABLE') return 'RESERVED';
  if (s === 'RESERVED') return 'SOLD';
  return 'AVAILABLE';
}

function StatusSelect({ value, onChange, disabled }: { value: PlotStatus; onChange: (s: PlotStatus) => void; disabled?: boolean }) {
  const colors = STATUS_COLORS[value];
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as PlotStatus)}
      className={`rounded-lg border-2 ${colors.border} ${colors.bg} ${colors.text} px-3 py-1.5 text-sm font-semibold outline-none cursor-pointer disabled:opacity-50`}
    >
      <option value="AVAILABLE" className="bg-white text-stone-800">Available</option>
      <option value="RESERVED" className="bg-white text-stone-800">Reserved</option>
      <option value="SOLD" className="bg-white text-stone-800">Sold</option>
    </select>
  );
}

function StageSelect({ value, onChange }: { value: LeadStage; onChange: (s: LeadStage) => void }) {
  const colors: Record<LeadStage, string> = {
    NEW: 'border-stone-200 bg-stone-50 text-stone-700',
    CONTACTED: 'border-blue-200 bg-blue-50 text-blue-700',
    RESERVED: 'border-amber-200 bg-amber-50 text-amber-700',
    SOLD: 'border-stone-300 bg-stone-100 text-stone-500',
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LeadStage)}
      className={`rounded-lg border-2 ${colors[value]} px-3 py-1.5 text-sm font-semibold outline-none cursor-pointer`}
    >
      {LEAD_STAGES.map((s) => (
        <option key={s} value={s} className="bg-white text-stone-800">{s.charAt(0) + s.slice(1).toLowerCase()}</option>
      ))}
    </select>
  );
}

function ProofUpload({ url, onChange }: { url?: string | null; onChange: (url: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(url ?? '');

  if (url && !editing) {
    return (
      <div className="flex items-center gap-2">
        <img src={url} alt="Proof" className="h-8 w-8 rounded object-cover border border-stone-200" />
        <button onClick={() => { setInput(url); setEditing(true); }} className="text-xs text-emerald-600 hover:underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="url"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste image URL"
        className="w-full min-w-[120px] rounded-lg border border-stone-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
      />
      <button
        onClick={() => { onChange(input); setEditing(false); }}
        className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white"
      >
        <ImagePlus className="h-3.5 w-3.5" />
      </button>
      {url && (
        <button onClick={() => setEditing(false)} className="shrink-0 text-xs text-stone-400">
          Cancel
        </button>
      )}
    </div>
  );
}
