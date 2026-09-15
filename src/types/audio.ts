export type EqPresetId =
  | 'balanced'
  | 'bass_boost'
  | 'smooth'
  | 'dynamic'
  | 'clear'
  | 'treble_boost'
  | 'custom';

export type OutputDeviceMode = 'earphones' | 'speaker';

export type AudioProfileId =
  | 'heavy'
  | 'bass'
  | 'treble'
  | 'punchy'
  | 'vocal'
  | 'instrumental'
  | 'balanced'
  | 'clear'
  | 'smooth'
  | 'custom';


export interface EqBandSettings {
  subBass: number;   // ~60Hz
  bass: number;      // ~250Hz
  mids: number;      // ~1000Hz
  highMids: number;  // ~3500Hz
  treble: number;    // ~10000Hz
}

export interface AudioProfileConfig {
  id: AudioProfileId;
  name: string;
  badge: string;
  description: string;
  triggerReason: string;
  accentColor: string;
  glowClass: string;
  eq: EqBandSettings;
  compression: {
    threshold: number; // dB (-40 to 0)
    ratio: number;     // 1 to 20
    attack: number;    // sec (0.001 to 0.1)
    release: number;   // sec (0.05 to 0.5)
  };
  sharpening: number;  // 0 to 100%
  percussionBoost: number; // 0 to 100%
}

export interface InstrumentMetrics {
  drums: number;          // 0.0 - 1.0
  bass: number;           // 0.0 - 1.0
  vocals: number;         // 0.0 - 1.0
  leadGuitarSynths: number;// 0.0 - 1.0
  stringsAcoustic: number;// 0.0 - 1.0
  intensity: number;      // 0.0 - 1.0
  isVocalShift: boolean;  // True when vocal/dialogue emerges over instrumental
  isHeavySection: boolean;// True when heavy drums/bass activate
  recommendedProfile: AudioProfileId;
  aiExplanation: string;
}

export type AudioSourceType = 'demo' | 'system' | 'mic' | 'file';

export interface DemoTrack {
  id: string;
  title: string;
  genre: string;
  type: 'movie' | 'music';
  description: string;
  bpm: number;
  tags: string[];
}

export type EarphoneTypeId =
  | 'airpods_tws'    // AirPods Pro/3/2, Galaxy Buds, Sony WF, TWS Bluetooth
  | 'iem_wired'      // Wired In-Ear Monitors, Apple EarPods, Moondrop, KZ, 3.5mm/USB-C
  | 'over_ear'       // Over-Ear Studio & Wireless Cans (Sony WH, Bose, AirPods Max)
  | 'open_ear'       // Open-Ear / Bone Conduction / Unsealed Pods (Shokz, LinkBuds)
  | 'reference';     // Direct Studio Reference / Flat Monitor

export interface EarphoneProfileConfig {
  id: EarphoneTypeId;
  name: string;
  category: 'wireless' | 'wired' | 'hybrid';
  iconName: 'airpods' | 'iem' | 'over_ear' | 'open_ear' | 'reference';
  subtitle: string;
  description: string;
  targetAcousticCurve: string;
  recommendedFor: string[];
  // DSP parameters
  crossfeedAmount: number;     // 0.0 to 1.0 (Bauer crossfeed matrix strength)
  deSibilanceEnabled: boolean; // Tame harsh 6.8kHz Bluetooth sibilance
  deSibilanceGain: number;     // dB cut (e.g. -2.8 dB)
  bassSealComp: number;        // dB boost for seal leakage compensation (e.g. +3.0 dB)
  trebleAirBoost: number;      // dB boost for high sparkle (e.g. +1.5 dB)
  harmanMidTrim: number;       // dB trim at 280Hz to remove boxy mud (e.g. -1.8 dB)
  safetyLimiterEnabled: boolean;
  limiterCeilingDb: number;    // Safety limiter threshold (-1.0 dB)
  bluetoothLatencyCompMs: number; // 0 for wired, 35 for wireless
}

