import { useState } from 'react';
import { MapPin, Ruler, BadgeCheck, ImageOff, Phone, X, Loader2, CheckCircle2, User } from 'lucide-react';
import { Plot, STATUS_COLORS, supabase } from '@/lib/supabase';

interface PlotDetailModalProps {
  plot: Plot;
  projectName: string;
  projectId: string;
  beaconPhotoUrl?: string | null;
  onClose: () => void;
  onReserved: () => void;
}

const WHATSAPP_NUMBER = '254700000000';
const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function PlotDetailModal({ plot, projectName, projectId, beaconPhotoUrl, onClose, onReserved }: PlotDetailModalProps) {
  const colors = STATUS_COLORS[plot.status];
  const isAvailable = plot.status === 'AVAILABLE';
  const isSold = plot.status === 'SOLD';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [phoneError, setPhoneError] = useState('');

  const soldAgo = plot.sold_at
    ? timeAgo(new Date(plot.sold_at))
    : null;

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!cleaned.startsWith('2547') && !cleaned.startsWith('2541')) {
      setPhoneError('Phone must start with 2547... or 2541...');
      return false;
    }
    if (cleaned.length < 12) {
      setPhoneError('Phone number is too short');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleReserve = async () => {
    if (!name.trim()) return;
    if (!validatePhone(phone)) return;

    const phoneCleaned = phone.replace(/\D/g, '');
    const payload = {
      name: name.trim(),
      phone: phoneCleaned,
      plot_number: plot.plot_number,
      plot_price: plot.price,
      project_id: projectId,
      project_name: projectName,
    };

    setSubmitState('submitting');

    try {
      // 1. Insert lead into Supabase
      await supabase.from('leads').insert({
        project_id: projectId,
        plot_number: plot.plot_number,
        name: name.trim(),
        phone: phoneCleaned,
        stage: 'NEW',
      });

      // 2. Fire webhook to n8n (best-effort, don't block on failure)
      if (WEBHOOK_URL && !WEBHOOK_URL.includes('YOUR-N8N-URL')) {
        try {
          await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          // Webhook failed but lead is saved — not fatal
        }
      }

      setSubmitState('success');
      onReserved();

      // 3. Also open WhatsApp after a short delay
      setTimeout(() => {
        const text = `Hi, I want to RESERVE Plot ${plot.plot_number} in ${projectName}. My name is ${name.trim()}.`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
      }, 1200);
    } catch {
      setSubmitState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header strip */}
        <div className={`${colors.bg} ${colors.text} px-5 py-4 flex items-center justify-between rounded-t-3xl`}>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide opacity-80">Plot No.</div>
            <div className="text-2xl font-bold">{plot.plot_number}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wide opacity-80">Status</div>
            <div className="text-lg font-bold">{colors.label}</div>
          </div>
          <button onClick={onClose} className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Price + Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400">
                <MapPin className="h-3.5 w-3.5" /> Price
              </div>
              <div className="mt-1 text-xl font-bold text-stone-900">
                KSh {Math.round(plot.price).toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400">
                <Ruler className="h-3.5 w-3.5" /> Size
              </div>
              <div className="mt-1 text-lg font-bold text-stone-900">{plot.size_label}</div>
              <div className="text-xs text-stone-400">{plot.ha_label}</div>
            </div>
          </div>

          {/* Corner badge */}
          {plot.is_corner && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <BadgeCheck className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Corner Plot — Premium Location</span>
            </div>
          )}

          {/* Beacon photo */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Beacon Photo</div>
            {beaconPhotoUrl ? (
              <img src={beaconPhotoUrl} alt={`Beacon for plot ${plot.plot_number}`} className="w-full rounded-xl border border-stone-200 object-cover h-40" />
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400">
                <ImageOff className="h-6 w-6 mb-1" />
                <span className="text-xs">Beacon photo coming soon</span>
              </div>
            )}
          </div>

          {/* Sold info */}
          {isSold && plot.buyer_name && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <div className="text-xs font-medium text-stone-400">Sold to</div>
              <div className="text-sm font-bold text-stone-900">{plot.buyer_name}</div>
              {soldAgo && <div className="text-xs text-stone-500">SOLD {soldAgo}</div>}
            </div>
          )}

          {/* Reserve form / success / unavailable */}
          {isAvailable ? (
            submitState === 'success' ? (
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  <p className="text-center font-bold text-emerald-800">Lead Submitted!</p>
                  <p className="text-center text-sm text-emerald-600">
                    We've received your interest for Plot {plot.plot_number}. Opening WhatsApp to continue the conversation…
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border-2 border-stone-200 py-3 font-semibold text-stone-600 transition hover:bg-stone-50"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {submitState === 'error' && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    Something went wrong. Please try again or message us directly on WhatsApp.
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5">
                    <User className="h-3.5 w-3.5" /> Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-base outline-none transition focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                    placeholder="254712345678"
                    className={`w-full rounded-xl border-2 px-4 py-3 text-base outline-none transition ${
                      phoneError ? 'border-red-400 bg-red-50' : 'border-stone-200 focus:border-emerald-500'
                    }`}
                  />
                  {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
                  <p className="mt-1 text-[11px] text-stone-400">Must start with 2547... or 2541...</p>
                </div>
                <button
                  onClick={handleReserve}
                  disabled={submitState === 'submitting' || !name.trim() || !phone.trim()}
                  className="w-full rounded-xl bg-green-500 py-4 text-white font-bold shadow-lg transition hover:bg-green-600 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitState === 'submitting' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5" />
                      Reserve This Plot on WhatsApp
                    </>
                  )}
                </button>
              </div>
            )
          ) : (
            <div className="w-full rounded-xl bg-stone-100 py-4 text-center font-semibold text-stone-400">
              {isSold ? 'This plot has been sold' : 'This plot is currently reserved'}
            </div>
          )}
        </div>
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
