import { EarphoneProfileConfig, EarphoneTypeId } from '../types/audio';

export const EARPHONE_PROFILES: Record<EarphoneTypeId, EarphoneProfileConfig> = {
  airpods_tws: {
    id: 'airpods_tws',
    name: 'AirPods & Wireless Earbuds',
    category: 'wireless',
    iconName: 'airpods',
    subtitle: 'AirPods Pro/3/2, Galaxy Buds, Sony WF, Pixel Buds, TWS',
    description:
      'Compensates for Bluetooth AAC/SBC compression, cuts piercing 6.8kHz sibilance, and restores sub-bass punch lost to imperfect silicone ear tip seals.',
    targetAcousticCurve: 'TWS Anti-Sibilance + Sub-Bass Seal Recovery',
    recommendedFor: [
      'Apple AirPods & AirPods Pro',
      'Samsung Galaxy Buds',
      'Sony WF-1000XM4 / XM5',
      'Anker Soundcore / Jabra TWS',
      'All Bluetooth in-ear buds'
    ],
    crossfeedAmount: 0.45,       // Natural Bauer binaural crossfeed to eliminate in-head fatigue
    deSibilanceEnabled: true,
    deSibilanceGain: -2.8,       // -2.8 dB cut at 6.8 kHz to smooth harsh sibilance
    bassSealComp: 3.2,           // +3.2 dB low-shelf boost at 55 Hz for ear-tip seal recovery
    trebleAirBoost: 1.0,         // +1.0 dB high-shelf at 11 kHz for airy extension
    harmanMidTrim: -1.0,         // -1.0 dB dip at 280 Hz for cleaner separation
    safetyLimiterEnabled: true,
    limiterCeilingDb: -0.8,
    bluetoothLatencyCompMs: 35
  },

  iem_wired: {
    id: 'iem_wired',
    name: 'Wired In-Ear Monitors (IEMs)',
    category: 'wired',
    iconName: 'iem',
    subtitle: 'Apple EarPods (3.5mm/Lightning/USB-C), Moondrop, KZ, Shure, Sennheiser IE',
    description:
      'Calibrated to the Harman In-Ear Target with pristine 0ms latency. Scoops out boxy 280Hz mid mud and safeguards sensitive balanced-armature drivers from background hiss.',
    targetAcousticCurve: 'Harman In-Ear IE-Target (Audiophile Clarity)',
    recommendedFor: [
      'Apple EarPods (Wired Lightning/USB-C/3.5mm)',
      'Moondrop Chu / Aria / Blessing',
      'KZ / Tangzu / 7Hz IEMs',
      'Shure SE215 / SE535',
      'High-sensitivity in-ear monitors'
    ],
    crossfeedAmount: 0.40,
    deSibilanceEnabled: false,
    deSibilanceGain: 0.0,
    bassSealComp: 0.8,           // IEMs already have deep seal, minimal low boost needed
    trebleAirBoost: 1.8,         // High-end sparkle
    harmanMidTrim: -1.8,         // -1.8 dB scoop to eliminate in-ear boxiness
    safetyLimiterEnabled: true,
    limiterCeilingDb: -1.2,      // Sensitive driver protection
    bluetoothLatencyCompMs: 0
  },

  over_ear: {
    id: 'over_ear',
    name: 'Over-Ear Studio & Wireless Cans',
    category: 'hybrid',
    iconName: 'over_ear',
    subtitle: 'Sony WH-1000XM, Bose QuietComfort, AirPods Max, Sennheiser HD, Audio-Technica',
    description:
      'Maximizes the acoustic soundstage for large 40-50mm diaphragms with deep 35Hz cinema sub-bass air and expansive crossfeed that feels like high-end desktop studio monitors.',
    targetAcousticCurve: 'Diffuse Field Soundstage + Deep Sub-Rumble',
    recommendedFor: [
      'Sony WH-1000XM4 / XM5',
      'Bose QuietComfort 45 / Ultra',
      'Apple AirPods Max',
      'Sennheiser HD 560S / 600 / Momentum',
      'Audio-Technica ATH-M50x'
    ],
    crossfeedAmount: 0.60,       // Wide binaural crossfeed for huge out-of-head 3D stage
    deSibilanceEnabled: false,
    deSibilanceGain: -1.2,
    bassSealComp: 2.2,           // Deep sub-bass extension
    trebleAirBoost: 2.2,         // Open airy acoustic extension
    harmanMidTrim: -0.5,
    safetyLimiterEnabled: true,
    limiterCeilingDb: -0.5,
    bluetoothLatencyCompMs: 25
  },

  open_ear: {
    id: 'open_ear',
    name: 'Open-Ear & Sport Buds',
    category: 'wireless',
    iconName: 'open_ear',
    subtitle: 'Bone Conduction, Shokz OpenRun, Sony LinkBuds, Standard Unsealed AirPods',
    description:
      'Employs psychoacoustic low-frequency harmonic reinforcement to solve acoustic bass leakage caused by lack of an ear-canal seal, plus dialogue clarity for noisy environments.',
    targetAcousticCurve: 'Acoustic Leakage Compensation + Dialogue Lift',
    recommendedFor: [
      'Shokz OpenRun / OpenFit',
      'Sony LinkBuds (Open Ring)',
      'Unsealed AirPods 2 / 3 (Non-Pro)',
      'Running / Cycling bone conduction headsets'
    ],
    crossfeedAmount: 0.20,
    deSibilanceEnabled: false,
    deSibilanceGain: 0.0,
    bassSealComp: 5.8,           // Heavy +5.8 dB compensation for unsealed leakage
    trebleAirBoost: 0.5,
    harmanMidTrim: 1.5,          // Speech presence lift to cut through wind and ambient sounds
    safetyLimiterEnabled: true,
    limiterCeilingDb: -0.5,
    bluetoothLatencyCompMs: 30
  },

  reference: {
    id: 'reference',
    name: 'Direct Reference (Flat Monitor)',
    category: 'wired',
    iconName: 'reference',
    subtitle: 'Bit-Transparent Uncolored Output',
    description:
      'Neutral pass-through without earphone-specific acoustic corrections or crossfeed. Ideal for checking uncolored raw mixes or high-end planar magnetic headphones.',
    targetAcousticCurve: 'Flat Reference Target (100% Unaltered)',
    recommendedFor: [
      'Sound engineers and audio producers',
      'Reference studio monitors',
      'Planar magnetic headphones (Audeze, Hifiman)',
      'A/B comparison testing'
    ],
    crossfeedAmount: 0.0,
    deSibilanceEnabled: false,
    deSibilanceGain: 0.0,
    bassSealComp: 0.0,
    trebleAirBoost: 0.0,
    harmanMidTrim: 0.0,
    safetyLimiterEnabled: false,
    limiterCeilingDb: 0.0,
    bluetoothLatencyCompMs: 0
  }
};

export const DEFAULT_EARPHONE_PROFILE_ID: EarphoneTypeId = 'airpods_tws';
