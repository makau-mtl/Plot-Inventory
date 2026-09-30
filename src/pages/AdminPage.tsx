import { useEffect, useState, useCallback, type FormEvent } from 'react';
import {
  Lock, ArrowLeft, MapPin, Building2, Users, Phone, LogOut, ChevronRight,
  ImagePlus, CheckCircle2, Table as TableIcon, Plus, Pencil, Trash2, X, Loader2,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase, Project, Plot, Lead, PlotStatus, LeadStage, LEAD_STAGES, STATUS_COLORS } from '@/lib/supabase';
import { PlotMap } from '@/components/PlotMap';
import { navigate } from '@/lib/router';

const STORAGE_BUCKET = 'plot-images';
const ADMIN_ROLE = 'admin';

type PlotValues = Pick<Plot,
  'plot_number' | 'status' | 'price' | 'ha_label' | 'size_label' | 'is_corner' |
  'buyer_name' | 'sold_at' | 'beacon_photo_url' | 'proof_image_url'
>;

interface AdminPageProps {
  projectId?: string;
}

export function AdminPage({ projectId }: AdminPageProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const setSessionRole = (session: Session | null) => {
      setIsAdmin(session?.user.app_metadata?.role === ADMIN_ROLE);
    };
    supabase.auth.getSession().then(({ data }) => setSessionRole(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionRole(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="h-5 w-5 animate-spin text-stone-400" /></div>;
  }

  if (!isAdmin) {
    return <Login />;
  }

  if (projectId) {
    return (
      <ProjectAdminLoader
        projectId={projectId}
        onBack={() => { window.location.hash = '/admin'; }}
        onLogout={() => { void supabase.auth.signOut(); }}
      />
    );
  }

  return <AdminDashboard onLogout={() => { void supabase.auth.signOut(); }} />;
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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
    } else if (data.user.app_metadata?.role !== ADMIN_ROLE) {
      await supabase.auth.signOut();
      setError('This account is not authorized as an administrator.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-900 to-stone-800 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-stone-800 text-white">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Miribo Admin</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to manage plots</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500" htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="admin@example.com"
            className="mb-3 w-full rounded-xl border-2 border-stone-200 px-4 py-3 outline-none transition focus:border-emerald-600"
          />
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Password"
            className={`w-full rounded-xl border-2 px-4 py-3.5 outline-none transition ${error ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-emerald-600'}`}
          />
          {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-stone-800 py-3.5 text-white font-semibold transition hover:bg-stone-700 active:scale-95 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Log in'}
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
  const [editingPlot, setEditingPlot] = useState<Plot | null | 'new'>(null);

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

  const savePlot = async (values: PlotValues) => {
    const result = editingPlot === 'new'
      ? await supabase.from('plots').insert({ ...values, project_id: project.id })
      : await supabase.from('plots').update(values).eq('id', (editingPlot as Plot).id);
    if (result.error) throw new Error(result.error.message);
    await fetchAll();
    setEditingPlot(null);
  };

  const deletePlot = async (plot: Plot) => {
    if (!window.confirm(`Delete Plot ${plot.plot_number}? This cannot be undone.`)) return;
    const { error } = await supabase.from('plots').delete().eq('id', plot.id);
    if (error) {
      window.alert(`Could not delete plot: ${error.message}`);
      return;
    }
    setPlots((prev) => prev.filter((item) => item.id !== plot.id));
    const imagePaths = [plot.beacon_photo_url, plot.proof_image_url]
      .map(storageObjectPath)
      .filter((path): path is string => path !== null);
    if (imagePaths.length) await supabase.storage.from(STORAGE_BUCKET).remove(imagePaths);
  };

  const uploadPlotImage = async (plot: Plot, field: 'beacon_photo_url' | 'proof_image_url', file: File) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!acceptedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      throw new Error('Choose a JPEG, PNG, WebP, or AVIF image no larger than 10 MB.');
    }
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const objectPath = `${project.id}/${plot.id}/${field}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw new Error(uploadError.message);

    const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath).data.publicUrl;
    const { error: updateError } = await supabase.from('plots').update({ [field]: publicUrl }).eq('id', plot.id);
    if (updateError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([objectPath]);
      throw new Error(updateError.message);
    }
    setPlots((prev) => prev.map((item) => item.id === plot.id ? { ...item, [field]: publicUrl } : item));
    const previousPath = storageObjectPath(plot[field]);
    if (previousPath) await supabase.storage.from(STORAGE_BUCKET).remove([previousPath]);
  };

  const removePlotImage = async (plot: Plot, field: 'beacon_photo_url' | 'proof_image_url') => {
    const { error } = await supabase.from('plots').update({ [field]: null }).eq('id', plot.id);
    if (error) throw new Error(error.message);
    setPlots((prev) => prev.map((item) => item.id === plot.id ? { ...item, [field]: null } : item));
    const path = storageObjectPath(plot[field]);
    if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
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
            <button
              onClick={() => setEditingPlot('new')}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" /> Add plot
            </button>
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
                  <th className="py-2 pr-3">Beacon Image</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Actions</th>
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
                      <span className="text-stone-600">{plot.buyer_name || '—'}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <PlotImageUpload
                        url={plot.proof_image_url}
                        onUpload={(file) => uploadPlotImage(plot, 'proof_image_url', file)}
                        onRemove={() => removePlotImage(plot, 'proof_image_url')}
                      />
                    </td>
                    <td className="py-2.5 pr-3">
                      <PlotImageUpload
                        url={plot.beacon_photo_url}
                        onUpload={(file) => uploadPlotImage(plot, 'beacon_photo_url', file)}
                        onRemove={() => removePlotImage(plot, 'beacon_photo_url')}
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-stone-600 tabular-nums">
                      KSh {Math.round(plot.price).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingPlot(plot)} title="Edit plot" className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => void deletePlot(plot)} title="Delete plot" className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
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
                    <p className="text-sm text-stone-600">{plot.buyer_name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-stone-400">Proof Image</label>
                    <PlotImageUpload
                      url={plot.proof_image_url}
                      onUpload={(file) => uploadPlotImage(plot, 'proof_image_url', file)}
                      onRemove={() => removePlotImage(plot, 'proof_image_url')}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-stone-400">Beacon image</label>
                    <PlotImageUpload
                      url={plot.beacon_photo_url}
                      onUpload={(file) => uploadPlotImage(plot, 'beacon_photo_url', file)}
                      onRemove={() => removePlotImage(plot, 'beacon_photo_url')}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingPlot(plot)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700"><Pencil className="h-4 w-4" />Edit</button>
                    <button onClick={() => void deletePlot(plot)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"><Trash2 className="h-4 w-4" />Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingPlot !== null && (
          <PlotEditor
            key={editingPlot === 'new' ? 'new' : editingPlot.id}
            plot={editingPlot === 'new' ? null : editingPlot}
            saving={savingPlot === 'editor'}
            onCancel={() => setEditingPlot(null)}
            onSave={async (values) => {
              setSavingPlot('editor');
              try {
                await savePlot(values);
              } finally {
                setSavingPlot(null);
              }
            }}
          />
        )}

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

function PlotEditor({ plot, saving, onCancel, onSave }: {
  plot: Plot | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: PlotValues) => Promise<void>;
}) {
  const [plotNumber, setPlotNumber] = useState(plot ? String(plot.plot_number) : '');
  const [status, setStatus] = useState<PlotStatus>(plot?.status ?? 'AVAILABLE');
  const [price, setPrice] = useState(plot ? String(plot.price) : '');
  const [haLabel, setHaLabel] = useState(plot?.ha_label ?? '');
  const [sizeLabel, setSizeLabel] = useState(plot?.size_label ?? '');
  const [isCorner, setIsCorner] = useState(plot?.is_corner ?? false);
  const [buyerName, setBuyerName] = useState(plot?.buyer_name ?? '');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await onSave({
        plot_number: Number(plotNumber),
        status,
        price: Number(price),
        ha_label: haLabel.trim(),
        size_label: sizeLabel.trim(),
        is_corner: isCorner,
        buyer_name: buyerName.trim() || null,
        sold_at: status === 'SOLD' ? plot?.sold_at ?? new Date().toISOString() : null,
        beacon_photo_url: plot?.beacon_photo_url ?? null,
        proof_image_url: plot?.proof_image_url ?? null,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the plot.');
    }
  };

  const fieldClass = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600';
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onMouseDown={onCancel}>
      <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{plot ? `Edit Plot ${plot.plot_number}` : 'Add plot'}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded p-1 text-stone-500 hover:bg-stone-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-semibold text-stone-600">Plot number
            <input className={fieldClass} type="number" min="1" step="1" required value={plotNumber} onChange={(event) => setPlotNumber(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-stone-600">Price (KSh)
            <input className={fieldClass} type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-stone-600">Status
            <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value as PlotStatus)}>
              <option value="AVAILABLE">Available</option><option value="RESERVED">Reserved</option><option value="SOLD">Sold</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-stone-600">Size label
            <input className={fieldClass} value={sizeLabel} onChange={(event) => setSizeLabel(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-stone-600">Hectare label
            <input className={fieldClass} value={haLabel} onChange={(event) => setHaLabel(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-stone-600">Buyer name
            <input className={fieldClass} value={buyerName} onChange={(event) => setBuyerName(event.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
          <input type="checkbox" checked={isCorner} onChange={(event) => setIsCorner(event.target.checked)} className="h-4 w-4 accent-emerald-700" />
          Corner plot
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : 'Save plot'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PlotImageUpload({ url, onUpload, onRemove }: {
  url?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onUpload(file);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError('');
    try {
      await onRemove();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-w-[125px] flex-col gap-1">
      <div className="flex items-center gap-2">
        {url && <img src={url} alt="Plot image" className="h-9 w-9 rounded border border-stone-200 object-cover" />}
        <label className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-200 px-2 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          {url ? 'Change' : 'Upload'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} className="sr-only" onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
        </label>
        {url && <button type="button" disabled={busy} onClick={() => void handleRemove()} title="Remove image" className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>}
      </div>
      {error && <span className="max-w-[160px] text-[10px] text-red-600">{error}</span>}
    </div>
  );
}

function storageObjectPath(url?: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}
