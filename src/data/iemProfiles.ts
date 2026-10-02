// IEM (In-Ear Monitor) Frequency Response Correction Profiles
// Based on measured raw frequency response deviations from the Harman In-Ear Target (2019)
// Corrections are 9-band EQ adjustments (63, 125, 250, 500, 1k, 2k, 4k, 8k, 16k) in dB
// Positive = boost, Negative = cut

export type IEMModelId =
  | 'apple_earpods'
  | 'kz_zsn_pro'
  | 'kz_zex_pro'
  | 'moondrop_chu'
  | 'moondrop_aria'
  | 'moondrop_blessing3'
  | 'truthear_hexa'
  | 'truthear_hola'
  | 'letshuoer_s12'
  | 'shure_se215'
  | 'sennheiser_ie300'
  | 'final_e3000'
  | 'harman_target'  // flat reference — 0 correction
  | 'ief_neutral';   // IEF Neutral Target — diffuse-field correction

export interface IEMCorrectionProfile {
  id: IEMModelId;
  brand: string;
  model: string;
  fullName: string;
  type: 'dynamic' | 'balanced_armature' | 'hybrid' | 'planar';
  price: string;       // rough price tier for display
  sensitivity: number; // dBSPL/mW at 1kHz
  impedance: number;   // Ohms nominal
  sourceImpedanceWarning: boolean; // true = BA sensitive to source impedance
  targetCurve: 'harman_2019' | 'ief_neutral' | 'diffuse_field';
  // Deviation from the Harman IE target at 9 bands — these corrections are applied to compensate
  // Correction = Harman Target - Raw Measured Response
  correction: number[]; // 9 values: 63, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz, clamped ±10 dB
  rawCurve: number[];   // Approximate raw FR shape relative to 1kHz (for visualization)
  color: string;        // accent color for UI
  tags: string[];
  description: string;
  harmanScore: number;  // 0-100 Harman preference score approximation
}

export const IEM_PROFILES: Record<IEMModelId, IEMCorrectionProfile> = {
  harman_target: {
    id: 'harman_target',
    brand: 'Reference',
    model: 'Harman IE Target 2019',
    fullName: 'Harman In-Ear Target 2019',
    type: 'dynamic',
    price: 'Reference',
    sensitivity: 100,
    impedance: 0,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    correction: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    rawCurve: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    color: '#10b981',
    tags: ['Reference', 'Neutral'],
    description: 'Zero correction — assumes earphone already matches the Harman In-Ear Target. Use as a flat baseline for A/B comparisons.',
    harmanScore: 100,
  },

  apple_earpods: {
    id: 'apple_earpods',
    brand: 'Apple',
    model: 'EarPods',
    fullName: 'Apple EarPods (USB-C / Lightning / 3.5mm)',
    type: 'dynamic',
    price: '~₹1,900 / $29',
    sensitivity: 108,
    impedance: 23,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    // EarPods measure: big bass hump up to 200Hz, recessed 1-2kHz mids, sharp 4-6kHz presence peak, rolled treble
    correction: [-4, -5, -3, 2, 4, 2, -3, 0, 2],
    rawCurve: [5, 6, 4, -1, -3, -2, 3, 1, -2],
    color: '#64748b',
    tags: ['Wired', 'Open-back', 'Portable', 'Apple'],
    description: 'Corrects EarPods\' elevated bass shelf, recessed midrange, and forward 4kHz sibilance. Brings vocals forward with a more balanced presentation.',
    harmanScore: 58,
  },

  kz_zsn_pro: {
    id: 'kz_zsn_pro',
    brand: 'KZ',
    model: 'ZSN Pro X',
    fullName: 'KZ ZSN Pro X (1DD+1BA Hybrid)',
    type: 'hybrid',
    price: '~₹1,200 / $15',
    sensitivity: 112,
    impedance: 25,
    sourceImpedanceWarning: true,
    targetCurve: 'harman_2019',
    // KZ ZSN Pro: boosted bass, V-shape, very forward 6-8kHz BA peak (fatiguing)
    correction: [-5, -5, -3, 2, 3, 0, -6, -5, -3],
    rawCurve: [6, 6, 4, -2, -2, 1, 7, 6, 4],
    color: '#f59e0b',
    tags: ['Hybrid', 'V-Shape', 'Budget', 'KZ'],
    description: 'Reins in the aggressive BA treble peak at 6-8kHz on the ZSN Pro X, adds upper-mid presence, and tightens the bloated bass for a much more controlled listen.',
    harmanScore: 52,
  },

  kz_zex_pro: {
    id: 'kz_zex_pro',
    brand: 'KZ',
    model: 'ZEX Pro',
    fullName: 'KZ ZEX Pro (EST+BA+DD Tribrid)',
    type: 'hybrid',
    price: '~₹3,000 / $36',
    sensitivity: 108,
    impedance: 18,
    sourceImpedanceWarning: true,
    targetCurve: 'harman_2019',
    // ZEX Pro: elevated sub-bass, massive 5-10kHz treble splash from EST, hollowed mids
    correction: [-4, -4, -2, 3, 4, -1, -7, -8, -5],
    rawCurve: [5, 5, 3, -2, -3, 2, 8, 9, 6],
    color: '#f59e0b',
    tags: ['Tribrid', 'EST', 'Treble-forward', 'KZ'],
    description: 'Corrects the ZEX Pro\'s intense electrostatic treble splash from 5kHz to 10kHz, lifts the hollowed midrange, and reduces bass bloat for natural clarity.',
    harmanScore: 49,
  },

  moondrop_chu: {
    id: 'moondrop_chu',
    brand: 'Moondrop',
    model: 'Chu',
    fullName: 'Moondrop Chu (Single DD)',
    type: 'dynamic',
    price: '~₹1,500 / $18',
    sensitivity: 120,
    impedance: 28,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    // Chu: close to Harman, slightly warm bass, small 1kHz dip, mild 8kHz peak
    correction: [-2, -1, -1, 2, 2, 1, 0, -2, -1],
    rawCurve: [3, 2, 2, -1, -1, 0, 1, 3, 2],
    color: '#38bdf8',
    tags: ['Dynamic', 'Neutral', 'Budget King', 'Moondrop'],
    description: 'Minor fine-tuning on an already near-neutral IEM. Lifts upper mids slightly for better vocal presence and tames the mild 8kHz brightness for longer sessions.',
    harmanScore: 88,
  },

  moondrop_aria: {
    id: 'moondrop_aria',
    brand: 'Moondrop',
    model: 'Aria',
    fullName: 'Moondrop Aria (Single DD)',
    type: 'dynamic',
    price: '~₹5,000 / $60',
    sensitivity: 122,
    impedance: 32,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    // Aria: slightly warm mid-bass, laid-back upper mids, smoother treble than Chu
    correction: [-2, -2, -1, 1, 3, 2, 1, -1, 0],
    rawCurve: [3, 3, 2, 0, -2, -1, 0, 2, 1],
    color: '#38bdf8',
    tags: ['Dynamic', 'Warm-Neutral', 'Musical', 'Moondrop'],
    description: 'Opens up the Aria\'s recessed upper midrange for natural vocal projection, trims excess warmth in the 100-250Hz region, and adds subtle treble extension.',
    harmanScore: 82,
  },

  moondrop_blessing3: {
    id: 'moondrop_blessing3',
    brand: 'Moondrop',
    model: 'Blessing 3',
    fullName: 'Moondrop Blessing 3 (2BA+1DD)',
    type: 'hybrid',
    price: '~₹20,000 / $240',
    sensitivity: 117,
    impedance: 22,
    sourceImpedanceWarning: true,
    targetCurve: 'harman_2019',
    // Blessing 3: very linear, slight low-bass roll, elevated 3-5kHz presence, mild 8kHz peak
    correction: [2, 1, 0, 0, -1, -2, -1, -2, 0],
    rawCurve: [-1, 0, 1, 1, 2, 3, 2, 3, 1],
    color: '#8b5cf6',
    tags: ['Hybrid', 'Reference-Tuned', 'Premium', 'Moondrop'],
    description: 'Subtle taming of the elevated 2-4kHz presence and 8kHz air to prevent listener fatigue on a nearly reference-grade driver. Adds slight sub-bass body.',
    harmanScore: 90,
  },

  truthear_hexa: {
    id: 'truthear_hexa',
    brand: 'Truthear',
    model: 'Hexa',
    fullName: 'Truthear Hexa (3BA+1DD)',
    type: 'hybrid',
    price: '~₹6,000 / $72',
    sensitivity: 118,
    impedance: 9,
    sourceImpedanceWarning: true, // Very low impedance, BA sensitive to source
    targetCurve: 'harman_2019',
    // Hexa: one of the most accurate Harman matches available, tiny 3kHz dip
    correction: [0, 0, 0, 1, 1, 1, 0, -1, 0],
    rawCurve: [1, 0, 0, -1, 0, -1, 1, 2, 1],
    color: '#ec4899',
    tags: ['Hybrid', 'Harman-Tuned', 'Technical', 'Truthear'],
    description: 'One of the closest Harman matches in production. Minimal correction: a tiny boost to recover a slight 1kHz dip and soften the 8kHz peak for a perfect response.',
    harmanScore: 95,
  },

  truthear_hola: {
    id: 'truthear_hola',
    brand: 'Truthear',
    model: 'Hola',
    fullName: 'Truthear Hola (Single DD)',
    type: 'dynamic',
    price: '~₹1,800 / $20',
    sensitivity: 124,
    impedance: 30,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    // Hola: near-neutral, very slight bass warmth, mild 6kHz notch
    correction: [-1, -1, 0, 1, 2, 1, 2, 0, 0],
    rawCurve: [2, 2, 1, 0, -1, 0, -1, 1, 0],
    color: '#ec4899',
    tags: ['Dynamic', 'Near-Neutral', 'Budget', 'Truthear'],
    description: 'Smooths the Hola\'s mild bass warmth, fills a small 6kHz presence dip for better vocal articulation. Already an excellent budget all-rounder.',
    harmanScore: 87,
  },

  letshuoer_s12: {
    id: 'letshuoer_s12',
    brand: 'Letshuoer',
    model: 'S12',
    fullName: 'Letshuoer S12 (Planar Magnetic)',
    type: 'planar',
    price: '~₹10,000 / $120',
    sensitivity: 104,
    impedance: 16,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    // S12: planar typical — fast tight bass that lacks sub-extension, elevated 6-12kHz crunch
    correction: [4, 3, 2, 1, 0, -1, -4, -6, -4],
    rawCurve: [-3, -2, -1, 0, 1, 2, 5, 7, 5],
    color: '#a78bfa',
    tags: ['Planar', 'Technicality', 'Speed', 'Letshuoer'],
    description: 'Adds missing sub-bass weight to the planar driver, and significantly reduces the aggressive 6-12kHz treble crunch common to all S12 planar diaphragms.',
    harmanScore: 71,
  },

  shure_se215: {
    id: 'shure_se215',
    brand: 'Shure',
    model: 'SE215',
    fullName: 'Shure SE215 (Single BA)',
    type: 'balanced_armature',
    price: '~₹9,000 / $100',
    sensitivity: 107,
    impedance: 17,
    sourceImpedanceWarning: true,
    targetCurve: 'harman_2019',
    // SE215: warm, very bassy, soft treble rolloff typical of single-BA, midrange recession
    correction: [-6, -7, -4, 2, 5, 4, 3, 2, 3],
    rawCurve: [7, 8, 5, -1, -4, -3, -2, -1, -2],
    color: '#06b6d4',
    tags: ['BA', 'Warm', 'Stage Monitor', 'Shure'],
    description: 'Dramatically corrects the SE215\'s warm, dark single-BA signature. Pulls back the intense bass hump, lifts recessed mids and vocals, and restores treble clarity.',
    harmanScore: 55,
  },

  sennheiser_ie300: {
    id: 'sennheiser_ie300',
    brand: 'Sennheiser',
    model: 'IE 300',
    fullName: 'Sennheiser IE 300 (Single DD XWB)',
    type: 'dynamic',
    price: '~₹20,000 / $235',
    sensitivity: 118,
    impedance: 16,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    // IE 300: sub-bass elevated, significant 3-8kHz treble peak (Sennheiser house sound), but excellent mids
    correction: [-3, -2, -1, 0, -1, -3, -4, -3, -1],
    rawCurve: [4, 3, 2, 1, 2, 4, 5, 4, 2],
    color: '#34d399',
    tags: ['Dynamic', 'Sennheiser', 'XWB Driver', 'Premium'],
    description: 'Softens Sennheiser\'s energetic 3-8kHz house peak to remove fatigue while retaining their excellent dynamic bass extension and natural midrange texture.',
    harmanScore: 78,
  },

  final_e3000: {
    id: 'final_e3000',
    brand: 'Final',
    model: 'E3000',
    fullName: 'Final E3000 (Single DD)',
    type: 'dynamic',
    price: '~₹4,500 / $55',
    sensitivity: 100,
    impedance: 16,
    sourceImpedanceWarning: false,
    targetCurve: 'harman_2019',
    // Final E3000: warm, rolled treble, mid-forward, lacks air and sub-bass extension
    correction: [3, 2, 0, 1, 1, 2, 4, 5, 4],
    rawCurve: [-2, -1, 1, 0, 0, -1, -3, -4, -3],
    color: '#fb923c',
    tags: ['Dynamic', 'Warm', 'Smooth', 'Final'],
    description: 'Extends the Final E3000\'s gentle treble rolloff, adds sub-bass weight, and restores high-frequency air for a more open and revealing sound character.',
    harmanScore: 74,
  },

  ief_neutral: {
    id: 'ief_neutral',
    brand: 'Reference',
    model: 'IEF Neutral Target',
    fullName: 'IEF Neutral Target (Community Standard)',
    type: 'dynamic',
    price: 'Reference',
    sensitivity: 100,
    impedance: 0,
    sourceImpedanceWarning: false,
    targetCurve: 'ief_neutral',
    // IEF Neutral: similar to Harman but less bass shelf, more diffuse-field treble
    correction: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    rawCurve: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    color: '#94a3b8',
    tags: ['Reference', 'IEF', 'Diffuse-Field'],
    description: 'Community IEF Neutral Target — a less bass-boosted alternative to the Harman target. Preferred by audiophiles who find Harman overly warm.',
    harmanScore: 100,
  },
};

export const IEM_MODEL_IDS = Object.keys(IEM_PROFILES) as IEMModelId[];

// Group by brand for display
export const IEM_BY_BRAND: Record<string, IEMModelId[]> = IEM_MODEL_IDS.reduce<Record<string, IEMModelId[]>>((acc, id) => {
  const profile = IEM_PROFILES[id];
  const brand = profile.brand;
  if (!acc[brand]) acc[brand] = [];
  acc[brand].push(id);
  return acc;
}, {});
