import { DemoTrack } from '../types/audio';

export const DEMO_TRACKS: DemoTrack[] = [
  {
    id: 'cyberpunk_heavy',
    title: 'Neon Overdrive (Full Synth Band)',
    genre: 'Synthwave / Full Band',
    type: 'music',
    bpm: 128,
    description: 'Continuous driving 808 sub-bass, punchy kick, snappy snare, full polyphonic chords, and bright metallic hi-hats across all 9 bands.',
    tags: ['Full Spectrum', 'Punchy Sub', 'Crisp Highs', 'Wide Synth']
  },
  {
    id: 'pink_noise',
    title: 'Pink Noise (EQ Calibration Tool)',
    genre: 'Acoustic Reference Noise',
    type: 'music',
    bpm: 120,
    description: 'Gold-standard full-spectrum test signal with equal energy per octave. Every single EQ slider from 63Hz to 16kHz produces an immediate audible shift.',
    tags: ['Gold Standard', 'All 9 Bands', 'Equal Energy', 'Instant Test']
  },
  {
    id: 'future_bass_drop',
    title: 'Solaris Surge (Bass & Drums)',
    genre: 'Future Bass / EDM',
    type: 'music',
    bpm: 130,
    description: 'Massive punchy kick-snare groove with heavy sub-bass drop and shimmering supersaw synth chords.',
    tags: ['Heavy Drop', 'Punchy Transients', 'Treble Shimmer', 'Deep Sub']
  },
  {
    id: 'acoustic_vocal',
    title: 'Midnight Reverie (Guitar & Vocal)',
    genre: 'Indie Folk / Vocal',
    type: 'music',
    bpm: 90,
    description: 'Resonant acoustic guitar chords, warm midrange vocals, fingerstyle plucks, and ambient background room air.',
    tags: ['Vocal Focus', 'Acoustic Midrange', 'Natural Air', 'Warm Tone']
  },
  {
    id: 'frequency_sweep',
    title: 'Harmonic Sweep (30Hz - 16kHz)',
    genre: 'Acoustic Test Sweep',
    type: 'music',
    bpm: 60,
    description: 'Smooth repeating sine sweep traveling from deep sub-bass through midrange up to ultra-high air to test each frequency band.',
    tags: ['Sweep Test', 'Sub to Air', 'Resonance Check', 'Dynamic']
  }
];
