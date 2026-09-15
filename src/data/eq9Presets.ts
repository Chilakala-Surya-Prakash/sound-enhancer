import { EqPresetId } from '../types/audio';

export const EQ_FREQUENCIES = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const EQ_LABELS = ['63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'] as const;

export interface EqPresetConfig {
  id: EqPresetId;
  label: string;
  subtitle: string;
  tag: string;
  accent: string;
  values: number[]; // 9 band dB values (-10 to +10)
}

export const EQ_9_PRESETS: Record<EqPresetId, EqPresetConfig> = {
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    subtitle: 'Studio Reference',
    tag: 'Flat Master',
    accent: '#10b981', // emerald
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  bass_boost: {
    id: 'bass_boost',
    label: 'Bass Boost',
    subtitle: 'Deep Sub Impact',
    tag: 'Low-End Slam',
    accent: '#06b6d4', // cyan
    values: [9, 8, 6, 2, 0, 0, 0, 0, 0],
  },
  smooth: {
    id: 'smooth',
    label: 'Smooth',
    subtitle: 'Warm Relaxed Roll-off',
    tag: 'Anti-Fatigue',
    accent: '#f59e0b', // amber
    values: [3, 4, 2, 0, -1, -3, -5, -7, -9],
  },
  dynamic: {
    id: 'dynamic',
    label: 'Dynamic',
    subtitle: 'V-Shape High Energy',
    tag: 'Punch & Sparkle',
    accent: '#8b5cf6', // violet
    values: [8, 6, 2, -2, -1, 3, 6, 8, 9],
  },
  clear: {
    id: 'clear',
    label: 'Clear',
    subtitle: 'Vocal & Acoustic Focus',
    tag: 'Presence Boost',
    accent: '#38bdf8', // sky
    values: [-5, -3, 0, 3, 7, 8, 6, 2, 0],
  },
  treble_boost: {
    id: 'treble_boost',
    label: 'Treble Boost',
    subtitle: 'Air & Micro-detail',
    tag: 'Crisp Sparkle',
    accent: '#ec4899', // pink
    values: [-5, -3, -1, 0, 2, 5, 8, 10, 10],
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    subtitle: 'User Sculpted Curve',
    tag: 'Interactive',
    accent: '#a855f7', // purple
    values: [4, 6, 2, 0, 3, 5, 2, 7, 5],
  },
};
