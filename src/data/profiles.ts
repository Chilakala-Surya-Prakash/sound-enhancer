import { AudioProfileConfig, AudioProfileId } from '../types/audio';

export const AUDIO_PROFILES: Record<AudioProfileId, AudioProfileConfig> = {
  heavy: {
    id: 'heavy',
    name: 'Heavy / Intense',
    badge: 'SHARPENED BASS & PERCUSSION',
    description: 'Sharpens audio attack and slams low-end sub-bass with transient impact when intense percussive layers kick in.',
    triggerReason: 'Detected high musical intensity with heavy drums and amplified basslines.',
    accentColor: '#f43f5e', // rose-500
    glowClass: 'shadow-[0_0_25px_rgba(244,63,94,0.35)] border-rose-500/60',
    eq: {
      subBass: 7.0,
      bass: 5.5,
      mids: -1.5,
      highMids: 4.5,
      treble: 3.5,
    },
    compression: {
      threshold: -26,
      ratio: 6.5,
      attack: 0.004,
      release: 0.12,
    },
    sharpening: 90,
    percussionBoost: 85,
  },

  punchy: {
    id: 'punchy',
    name: 'Punchy Rhythm',
    badge: 'SNAPPY TRANSIENTS & KICK',
    description: 'Tightens dynamic transients for punchy snares, kicks, and driving rhythmic grooves without muddying the mix.',
    triggerReason: 'Detected rhythmic percussive energy with fast tempo and dynamic kick patterns.',
    accentColor: '#f59e0b', // amber-500
    glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.35)] border-amber-500/60',
    eq: {
      subBass: 3.0,
      bass: 6.0,
      mids: 1.0,
      highMids: 4.0,
      treble: 2.0,
    },
    compression: {
      threshold: -22,
      ratio: 4.5,
      attack: 0.008,
      release: 0.18,
    },
    sharpening: 75,
    percussionBoost: 70,
  },

  bass: {
    id: 'bass',
    name: 'Deep Bass',
    badge: 'LOW-END SUB EMBEDDED',
    description: 'Boosts 40Hz–120Hz sub-frequencies for rumbling synth-bass, cinematic explosions, and 808 sub drops.',
    triggerReason: 'Detected deep basslines and low-frequency synths with relaxed high frequencies.',
    accentColor: '#8b5cf6', // violet-500
    glowClass: 'shadow-[0_0_25px_rgba(139,92,246,0.35)] border-violet-500/60',
    eq: {
      subBass: 8.5,
      bass: 6.0,
      mids: -2.0,
      highMids: 0.0,
      treble: -1.5,
    },
    compression: {
      threshold: -20,
      ratio: 3.5,
      attack: 0.02,
      release: 0.25,
    },
    sharpening: 40,
    percussionBoost: 55,
  },

  treble: {
    id: 'treble',
    name: 'Crisp Treble',
    badge: 'AIR & SPARKLE',
    description: 'Expands the upper air band (6kHz–14kHz) for shimmering acoustic guitars, violins, brass, and cymbal tails.',
    triggerReason: 'Detected acoustic string instruments, delicate cymbals, or airy acoustic harmonics.',
    accentColor: '#06b6d4', // cyan-500
    glowClass: 'shadow-[0_0_25px_rgba(6,182,212,0.35)] border-cyan-500/60',
    eq: {
      subBass: -2.0,
      bass: 0.5,
      mids: 1.0,
      highMids: 5.0,
      treble: 7.5,
    },
    compression: {
      threshold: -18,
      ratio: 2.5,
      attack: 0.015,
      release: 0.2,
    },
    sharpening: 60,
    percussionBoost: 35,
  },

  vocal: {
    id: 'vocal',
    name: 'Vocal Clarity',
    badge: 'VOICE & DIALOGUE FORWARD',
    description: 'Carves vocal presence around 1kHz–3.5kHz while cleanly rolling off low resonance for intelligible singing and dialogue.',
    triggerReason: 'Shifted from instrumental to prominent vocal singing or movie dialogue.',
    accentColor: '#10b981', // emerald-500
    glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.35)] border-emerald-500/60',
    eq: {
      subBass: -4.0,
      bass: -1.5,
      mids: 5.0,
      highMids: 4.5,
      treble: 2.5,
    },
    compression: {
      threshold: -24,
      ratio: 3.8,
      attack: 0.01,
      release: 0.15,
    },
    sharpening: 50,
    percussionBoost: 20,
  },

  instrumental: {
    id: 'instrumental',
    name: 'Acoustic / Instrumental',
    badge: 'WIDE SOUNDSTAGE & TEXTURE',
    description: 'Balances frequency separation across orchestral strings, piano, and synths when vocals recede.',
    triggerReason: 'Shifted from vocal sections back into rich instrumental arrangement.',
    accentColor: '#3b82f6', // blue-500
    glowClass: 'shadow-[0_0_25px_rgba(59,130,246,0.35)] border-blue-500/60',
    eq: {
      subBass: 2.0,
      bass: 2.5,
      mids: 1.5,
      highMids: 3.0,
      treble: 3.5,
    },
    compression: {
      threshold: -18,
      ratio: 2.2,
      attack: 0.025,
      release: 0.3,
    },
    sharpening: 45,
    percussionBoost: 40,
  },

  balanced: {
    id: 'balanced',
    name: 'Neutral Studio',
    badge: 'FLAT REFERENCE',
    description: 'Flat, transparent response curve with natural timbre and zero artificial coloration.',
    triggerReason: 'Standard reference playback mode.',
    accentColor: '#94a3b8', // slate-400
    glowClass: 'shadow-[0_0_20px_rgba(148,163,184,0.2)] border-slate-600',
    eq: {
      subBass: 0.0,
      bass: 0.0,
      mids: 0.0,
      highMids: 0.0,
      treble: 0.0,
    },
    compression: {
      threshold: -14,
      ratio: 1.5,
      attack: 0.03,
      release: 0.25,
    },
    sharpening: 20,
    percussionBoost: 20,
  },

  clear: {
    id: 'clear',
    name: 'Crystal Clear',
    badge: 'PRISTINE HIGH-FIDELITY',
    description: 'Elevates acoustic transparency, speech intelligibility, and crisp instrument definition with clean bottom-end separation.',
    triggerReason: 'Selected for pure fidelity and crisp clarity across acoustic frequencies.',
    accentColor: '#38bdf8', // sky-400
    glowClass: 'shadow-[0_0_25px_rgba(56,189,248,0.35)] border-sky-400/60',
    eq: {
      subBass: -1.0,
      bass: 0.5,
      mids: 2.5,
      highMids: 5.5,
      treble: 6.0,
    },
    compression: {
      threshold: -20,
      ratio: 2.8,
      attack: 0.012,
      release: 0.18,
    },
    sharpening: 70,
    percussionBoost: 35,
  },

  smooth: {
    id: 'smooth',
    name: 'Warm & Smooth',
    badge: 'VELVET ANALOG ROLLOFF',
    description: 'Tames harsh sibilance and brittle high frequencies, providing a warm, lush, fatigue-free listening experience.',
    triggerReason: 'Selected for relaxed listening with velvety warmth and gentle high-end rolloff.',
    accentColor: '#a855f7', // purple-500
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.35)] border-purple-500/60',
    eq: {
      subBass: 3.5,
      bass: 4.0,
      mids: 2.0,
      highMids: -2.0,
      treble: -4.5,
    },
    compression: {
      threshold: -16,
      ratio: 2.0,
      attack: 0.03,
      release: 0.35,
    },
    sharpening: 15,
    percussionBoost: 25,
  },

  custom: {
    id: 'custom',
    name: 'Custom Curve',
    badge: 'USER PARAMETRIC TUNED',
    description: 'Custom tuned parametric frequency curve tailored via the interactive graph.',
    triggerReason: 'Custom user frequency curve adjustments active.',
    accentColor: '#ec4899', // pink-500
    glowClass: 'shadow-[0_0_25px_rgba(236,72,153,0.35)] border-pink-500/60',
    eq: {
      subBass: 0.0,
      bass: 0.0,
      mids: 0.0,
      highMids: 0.0,
      treble: 0.0,
    },
    compression: {
      threshold: -18,
      ratio: 3.0,
      attack: 0.015,
      release: 0.2,
    },
    sharpening: 40,
    percussionBoost: 30,
  },
};
