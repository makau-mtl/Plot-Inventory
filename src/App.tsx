import { Building2, MapPin, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, Project } from '@/lib/supabase';
import { useHashRoute, navigate } from '@/lib/router';
import { PublicProjectPage } from '@/pages/PublicProjectPage';
import { AdminPage } from '@/pages/AdminPage';

function App() {
  const route = useHashRoute();

  // /project/:id
  const projectMatch = route.match(/^\/project\/(.+)$/);
  if (projectMatch) {
    return <PublicProjectPage projectId={decodeURIComponent(projectMatch[1])} />;
  }

  // /admin/:id — admin project management view
  const adminProjectMatch = route.match(/^\/admin\/(.+)$/);
  if (adminProjectMatch) {
    return <AdminPage projectId={decodeURIComponent(adminProjectMatch[1])} />;
  }

  if (route.startsWith('/admin')) {
    return <AdminPage />;
  }

  return <Home />;
}

function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (!error) setProjects((data as Project[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-stone-50">
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-lg">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="flex items-center gap-2 text-emerald-100 text-sm font-medium mb-2">
            <Building2 className="h-4 w-4" />
            <span>Miribo Plot Manager</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Find Your Plot</h1>
          <p className="mt-2 text-emerald-100">
            Browse available land plots and enquire instantly on WhatsApp.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Available Projects</h2>

        {loading ? (
          <div className="animate-pulse text-stone-400 text-center py-12">Loading projects…</div>
        ) : projects.length === 0 ? (
          <p className="text-center text-stone-400 py-12">No projects available.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/project/${encodeURIComponent(p.id)}`)}
                className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-400 hover:shadow-lg active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-stone-900 text-lg">{p.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="pt-4 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-sm font-medium text-stone-400 hover:text-stone-600 underline underline-offset-2"
          >
            Admin
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
