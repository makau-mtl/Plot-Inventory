import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type PlotStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface Project {
  id: string;
  name: string;
  location: string;
  created_at?: string;
}

export interface Plot {
  id: string;
  project_id: string;
  plot_number: number;
  status: PlotStatus;
  price: number;
  ha_label: string;
  size_label: string;
  is_corner: boolean;
  buyer_name?: string | null;
  sold_at?: string | null;
  beacon_photo_url?: string | null;
  proof_image_url?: string | null;
  created_at?: string;
}

export interface Lead {
  id: string;
  project_id: string;
  plot_number: number;
  name: string;
  phone: string;
  stage: LeadStage;
  location?: string | null;
  created_at?: string;
}

export type LeadStage = 'NEW' | 'CONTACTED' | 'RESERVED' | 'SOLD';

export const LEAD_STAGES: LeadStage[] = ['NEW', 'CONTACTED', 'RESERVED', 'SOLD'];

export const STATUS_COLORS: Record<PlotStatus, { bg: string; border: string; text: string; label: string }> = {
  AVAILABLE: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    text: 'text-white',
    label: 'Available',
  },
  RESERVED: {
    bg: 'bg-amber-400',
    border: 'border-amber-500',
    text: 'text-amber-950',
    label: 'Reserved',
  },
  SOLD: {
    bg: 'bg-gray-400',
    border: 'border-gray-500',
    text: 'text-white',
    label: 'Sold',
  },
};

export const NEXT_STATUS: Record<PlotStatus, PlotStatus> = {
  AVAILABLE: 'RESERVED',
  RESERVED: 'SOLD',
  SOLD: 'AVAILABLE',
};
