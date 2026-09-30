import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { Lead } from '@/lib/supabase';

interface SocialProofToastProps {
  leads: Lead[];
}

export function SocialProofToast({ leads }: SocialProofToastProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || leads.length === 0) return;

    const showTimer = setInterval(() => {
      setVisible(true);
      setCurrent((prev) => (prev + 1) % leads.length);

      setTimeout(() => setVisible(false), 5000);
    }, 15000);

    // Initial delayed popup
    const initial = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 3000);

    return () => {
      clearInterval(showTimer);
      clearTimeout(initial);
    };
  }, [dismissed, leads]);

  if (dismissed || leads.length === 0) return null;

  const lead = leads[current];
  if (!lead) return null;

  const ago = lead.created_at ? timeAgo(new Date(lead.created_at)) : 'recently';

  return (
    <div
      className={`fixed bottom-20 left-3 z-40 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 shadow-xl max-w-[300px]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm font-bold">
          {lead.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 truncate">
            <span className="font-bold">{lead.name}</span> from{' '}
            <span className="text-gray-600">{lead.location || 'Nairobi'}</span>
          </p>
          <p className="text-xs text-gray-500 truncate">
            reserved Plot {lead.plot_number} — {ago}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-gray-300 hover:text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
  const days = Math.floor(seconds / 86400);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}
