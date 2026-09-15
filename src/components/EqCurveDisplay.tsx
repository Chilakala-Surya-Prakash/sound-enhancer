import React, { useState, useRef, useMemo, useCallback } from 'react';
import { AudioProfileConfig, AudioProfileId, EqBandSettings } from '../types/audio';
import { audioEngine } from '../services/audioEngine';
import {
  Sliders,
  Volume2,
  Sparkles,
  Sun,
  Feather,
  Zap,
  Flame,
  RotateCcw,
  Waves,
  Plus,
  Minus,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface EqCurveDisplayProps {
  profile: AudioProfileConfig;
  isTransitioning: boolean;
  onSelectPreset?: (presetId: AudioProfileId) => void;
  onUpdateBand?: (band: keyof EqBandSettings, gain: number) => void;
  onResetFlat?: () => void;
}

interface BandInfo {
  key: keyof EqBandSettings;
  label: string;
  subLabel: string;
  defaultFreq: number;
  color: string;
  minFreq: number;
  maxFreq: number;
}

const BANDS: BandInfo[] = [
  {
    key: 'subBass',
    label: 'Sub Bass',
    subLabel: 'Rumble & Depth',
    defaultFreq: 80,
    color: '#f43f5e', // rose
    minFreq: 30,
    maxFreq: 120,
  },
  {
    key: 'bass',
    label: 'Bass',
    subLabel: 'Punch & Warmth',
    defaultFreq: 240,
    color: '#8b5cf6', // violet
    minFreq: 130,
    maxFreq: 400,
  },
  {
    key: 'mids',
    label: 'Mids',
    subLabel: 'Vocals & Body',
    defaultFreq: 1100,
    color: '#10b981', // emerald
    minFreq: 600,
    maxFreq: 2200,
  },
  {
    key: 'highMids',
    label: 'High Mids',
    subLabel: 'Clarity & Presence',
    defaultFreq: 3400,
    color: '#f59e0b', // amber
    minFreq: 2400,
    maxFreq: 5500,
  },
  {
    key: 'treble',
    label: 'Treble',
    subLabel: 'Air & Shimmer',
    defaultFreq: 9500,
    color: '#06b6d4', // cyan
    minFreq: 6000,
    maxFreq: 16000,
  },
];

// SVG Dimension Constants
const SVG_WIDTH = 820;
const SVG_HEIGHT = 280;
const PAD_LEFT = 52;
const PAD_RIGHT = 30;
const PAD_TOP = 24;
const PAD_BOTTOM = 36;
const PLOT_WIDTH = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;
const CENTER_Y = PAD_TOP + PLOT_HEIGHT / 2;

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const MIN_DB = -12;
const MAX_DB = 12;

export const EqCurveDisplay: React.FC<EqCurveDisplayProps> = ({
  profile,
  isTransitioning,
  onSelectPreset,
  onUpdateBand,
  onResetFlat,
}) => {
  const [activeDraggingBand, setActiveDraggingBand] = useState<keyof EqBandSettings | null>(null);
  const [hoveredBand, setHoveredBand] = useState<keyof EqBandSettings | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Conversion helpers: Frequency (log) <-> X pixel
  const freqToX = useCallback((freq: number): number => {
    const minLog = Math.log10(MIN_FREQ);
    const maxLog = Math.log10(MAX_FREQ);
    const fLog = Math.log10(Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq)));
    const ratio = (fLog - minLog) / (maxLog - minLog);
    return PAD_LEFT + ratio * PLOT_WIDTH;
  }, []);

  // Conversion helpers: dB (-12 to +12) <-> Y pixel
  const dbToY = useCallback((db: number): number => {
    const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
    const ratio = clamped / MAX_DB; // -1 to +1
    return CENTER_Y - ratio * (PLOT_HEIGHT / 2);
  }, []);

  const yToDb = useCallback((y: number): number => {
    const clampedY = Math.max(PAD_TOP, Math.min(PAD_TOP + PLOT_HEIGHT, y));
    const ratio = (CENTER_Y - clampedY) / (PLOT_HEIGHT / 2);
    const db = ratio * MAX_DB;
    return Math.round(Math.max(MIN_DB, Math.min(MAX_DB, db)) * 10) / 10;
  }, []);

  // Calculate real DSP curve across 120 logarithmic frequency points
  const { curvePath, fillPath } = useMemo(() => {
    const numPoints = 120;
    const freqs = new Float32Array(numPoints);
    const minLog = Math.log10(MIN_FREQ);
    const maxLog = Math.log10(MAX_FREQ);

    for (let i = 0; i < numPoints; i++) {
      const fLog = minLog + (i / (numPoints - 1)) * (maxLog - minLog);
      freqs[i] = Math.pow(10, fLog);
    }

    const dBs = audioEngine.getCombinedFrequencyResponse(freqs);

    let pathD = '';
    let fillD = `M ${freqToX(freqs[0])} ${CENTER_Y} `;

    for (let i = 0; i < numPoints; i++) {
      const x = freqToX(freqs[i]);
      const y = dbToY(dBs[i]);
      if (i === 0) {
        pathD = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        fillD += `L ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        fillD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }

    const lastX = freqToX(freqs[numPoints - 1]);
    fillD += ` L ${lastX.toFixed(1)} ${CENTER_Y} Z`;

    return { curvePath: pathD, fillPath: fillD };
  }, [profile.eq, freqToX, dbToY]);

  // Pointer dragging handlers for interactive control points on the graph
  const handlePointerDown = (bandKey: keyof EqBandSettings, e: React.PointerEvent) => {
    e.preventDefault();
    setActiveDraggingBand(bandKey);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDraggingBand || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Calculate relative svg Y coordinate taking viewBox scaling into account
    const scaleY = SVG_HEIGHT / rect.height;
    const svgY = (e.clientY - rect.top) * scaleY;
    const newDb = yToDb(svgY);

    if (onUpdateBand) {
      onUpdateBand(activeDraggingBand, newDb);
    } else {
      audioEngine.setCustomEqBand(activeDraggingBand, newDb);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDraggingBand) {
      setActiveDraggingBand(null);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Nudge +/- 0.5dB
  const nudgeGain = (bandKey: keyof EqBandSettings, delta: number) => {
    const current = profile.eq[bandKey];
    const updated = Math.round(Math.max(MIN_DB, Math.min(MAX_DB, current + delta)) * 10) / 10;
    if (onUpdateBand) {
      onUpdateBand(bandKey, updated);
    } else {
      audioEngine.setCustomEqBand(bandKey, updated);
    }
  };

  // Quick preset buttons config
  const PRESET_BUTTONS = [
    {
      id: 'bass' as AudioProfileId,
      label: 'Bass',
      description: 'Deep sub & punchy lows',
      icon: Waves,
      color: '#8b5cf6',
      activeClass: 'bg-violet-600/30 border-violet-500 text-violet-200 shadow-lg shadow-violet-500/20',
    },
    {
      id: 'clear' as AudioProfileId,
      label: 'Clear',
      description: 'Crystal fidelity & speech definition',
      icon: Sun,
      color: '#38bdf8',
      activeClass: 'bg-sky-600/30 border-sky-400 text-sky-200 shadow-lg shadow-sky-500/20',
    },
    {
      id: 'treble' as AudioProfileId,
      label: 'Treble',
      description: 'Air shimmer & string sparkle',
      icon: Sparkles,
      color: '#06b6d4',
      activeClass: 'bg-cyan-600/30 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20',
    },
    {
      id: 'smooth' as AudioProfileId,
      label: 'Smooth',
      description: 'Velvety analog rolloff & warm mids',
      icon: Feather,
      color: '#a855f7',
      activeClass: 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/20',
    },
    {
      id: 'punchy' as AudioProfileId,
      label: 'Punchy',
      description: 'Snappy transients & kicks',
      icon: Zap,
      color: '#f59e0b',
      activeClass: 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/20',
    },
    {
      id: 'heavy' as AudioProfileId,
      label: 'Heavy',
      description: 'Impactful sub & aggressive attack',
      icon: Flame,
      color: '#f43f5e',
      activeClass: 'bg-rose-600/30 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20',
    },
    {
      id: 'balanced' as AudioProfileId,
      label: 'Flat / Reset',
      description: '0 dB studio neutral reference',
      icon: RotateCcw,
      color: '#94a3b8',
      activeClass: 'bg-slate-700/60 border-slate-400 text-white shadow-md',
    },
  ];

  // Frequency grid ticks for X axis
  const FREQ_TICKS = [
    { freq: 30, label: '30Hz' },
    { freq: 60, label: '60Hz' },
    { freq: 125, label: '125Hz' },
    { freq: 250, label: '250Hz' },
    { freq: 500, label: '500Hz' },
    { freq: 1000, label: '1kHz' },
    { freq: 2000, label: '2kHz' },
    { freq: 4000, label: '4kHz' },
    { freq: 8000, label: '8kHz' },
    { freq: 16000, label: '16kHz' },
  ];

  // dB grid lines for Y axis
  const DB_LINES = [
    { db: 12, label: '+12' },
    { db: 6, label: '+6' },
    { db: 0, label: '0 dB' },
    { db: -6, label: '-6' },
    { db: -12, label: '-12' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header and Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-rose-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Interactive Frequency Curve &amp; Parametric EQ
              </h3>
              {profile.id === 'custom' ? (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold animate-pulse">
                  Custom User Curve
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {profile.name} Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Drag points directly on the graph or choose a preset curve with smooth anti-pop crossfading
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTransitioning && (
            <div className="text-[11px] font-mono text-amber-400 animate-pulse bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
              Interpolating EQ Filter Transfer Curves…
            </div>
          )}
          <button
            onClick={() => {
              if (onResetFlat) onResetFlat();
              else audioEngine.setProfile('balanced', true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all active:scale-95"
            title="Reset to 0dB Flat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 0dB</span>
          </button>
        </div>
      </div>

      {/* Quick Sound Profile & Frequency Buttons: Bass, Clear, Treble, Smooth, Punchy, Heavy, Flat */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            Quick Frequency Profiles:
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any button to morph the frequency curve instantly
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PRESET_BUTTONS.map((preset) => {
            const Icon = preset.icon;
            const isCurrent = profile.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  if (onSelectPreset) {
                    onSelectPreset(preset.id);
                  } else {
                    audioEngine.setProfile(preset.id, true);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                  isCurrent
                    ? `${preset.activeClass} ring-1 ring-white/20`
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${preset.color}25`,
                      color: preset.color,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold truncate text-white group-hover:text-cyan-300 transition-colors">
                    {preset.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive SVG Frequency Response Graph */}
      <div className="relative bg-slate-950 border border-slate-800/90 rounded-xl p-2 sm:p-4 mb-5 select-none shadow-inner overflow-hidden">
        {/* Helper Drag Tooltip Banner */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-300 font-semibold">Real-Time DSP Response Curve:</span>
            <span className="text-slate-500 hidden sm:inline">
              Click &amp; drag any glowing circle to customize frequency gain (-12dB to +12dB)
            </span>
          </div>
          {activeDraggingBand && (
            <div className="text-pink-400 font-bold animate-pulse">
              Dragging {BANDS.find((b) => b.key === activeDraggingBand)?.label}:{' '}
              {profile.eq[activeDraggingBand] > 0
                ? `+${profile.eq[activeDraggingBand]}`
                : profile.eq[activeDraggingBand]}{' '}
              dB
            </div>
          )}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto max-h-[340px] cursor-crosshair touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Smooth glowing fill gradient under curve */}
            <linearGradient id="eqFillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
            </linearGradient>

            {/* Neon line glow filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background gridlines & dB levels */}
          {DB_LINES.map(({ db, label }) => {
            const y = dbToY(db);
            const isCenter = db === 0;
            return (
              <g key={db}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke={isCenter ? '#475569' : '#1e293b'}
                  strokeWidth={isCenter ? 1.5 : 1}
                  strokeDasharray={isCenter ? 'none' : '3 3'}
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill={isCenter ? '#94a3b8' : '#64748b'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={isCenter ? 'bold' : 'normal'}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Frequency vertical grid lines */}
          {FREQ_TICKS.map(({ freq, label }) => {
            const x = freqToX(freq);
            return (
              <g key={freq}>
                <line
                  x1={x}
                  y1={PAD_TOP}
                  x2={x}
                  y2={PAD_TOP + PLOT_HEIGHT}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={SVG_HEIGHT - PAD_BOTTOM + 18}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Shaded Area Fill Under Curve */}
          <path d={fillPath} fill="url(#eqFillGradient)" />

          {/* Live EQ Response Curve Line */}
          <path
            d={curvePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
            className="transition-all duration-75"
          />

          {/* Interactive Control Points for the 5 Bands */}
          {BANDS.map((band) => {
            const gain = profile.eq[band.key];
            const x = freqToX(band.defaultFreq);
            const y = dbToY(gain);
            const isDragging = activeDraggingBand === band.key;
            const isHovered = hoveredBand === band.key;

            return (
              <g
                key={band.key}
                className="cursor-pointer"
                onPointerDown={(e) => handlePointerDown(band.key, e)}
                onPointerEnter={() => setHoveredBand(band.key)}
                onPointerLeave={() => setHoveredBand(null)}
              >
                {/* Vertical guideline for active point */}
                {(isDragging || isHovered) && (
                  <line
                    x1={x}
                    y1={PAD_TOP}
                    x2={x}
                    y2={PAD_TOP + PLOT_HEIGHT}
                    stroke={band.color}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                )}

                {/* Outer halo ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isDragging ? 18 : isHovered ? 14 : 10}
                  fill={band.color}
                  fillOpacity={isDragging ? 0.35 : isHovered ? 0.25 : 0.15}
                  stroke={band.color}
                  strokeWidth={isDragging ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Core interactive drag point */}
                <circle
                  cx={x}
                  cy={y}
                  r={isDragging ? 7 : 5.5}
                  fill="#ffffff"
                  stroke={band.color}
                  strokeWidth="2.5"
                  className="shadow-lg transition-transform"
                />

                {/* Floating DB & Frequency Tooltip above/below point */}
                {(isDragging || isHovered) && (
                  <g>
                    <rect
                      x={x - 45}
                      y={y > CENTER_Y ? y - 38 : y + 14}
                      width="90"
                      height="24"
                      rx="6"
                      fill="#0f172a"
                      stroke={band.color}
                      strokeWidth="1.2"
                      className="shadow-xl"
                    />
                    <text
                      x={x}
                      y={y > CENTER_Y ? y - 22 : y + 30}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)} dB
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 5-Band Precision Sliders & Fine Steppers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300">
            Band Precision Fine-Tuning:
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Use sliders or +/- buttons for 0.5dB incremental stepping
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {BANDS.map((band) => {
            const gain = profile.eq[band.key];
            const isBoost = gain > 0;
            const isCut = gain < 0;

            return (
              <div
                key={band.key}
                className={`p-3 rounded-xl border transition-all ${
                  activeDraggingBand === band.key
                    ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: band.color }}
                    />
                    {band.label}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      isBoost
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isCut
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isBoost ? `+${gain.toFixed(1)}` : gain.toFixed(1)} dB
                  </span>
                </div>

                <span className="text-[10px] font-mono text-slate-400 block mb-2">
                  {band.subLabel} (~{band.defaultFreq} Hz)
                </span>

                {/* Range Slider */}
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={gain}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (onUpdateBand) {
                      onUpdateBand(band.key, v);
                    } else {
                      audioEngine.setCustomEqBand(band.key, v);
                    }
                  }}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg mb-3"
                />

                {/* Stepper buttons */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/70">
                  <button
                    onClick={() => nudgeGain(band.key, -0.5)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Cut 0.5dB"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => {
                      if (onUpdateBand) onUpdateBand(band.key, 0);
                      else audioEngine.setCustomEqBand(band.key, 0);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Zero out band"
                  >
                    0 dB
                  </button>

                  <button
                    onClick={() => nudgeGain(band.key, 0.5)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Boost 0.5dB"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamics specs bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-800/80">
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Comp Threshold</span>
          <span className="text-xs font-mono font-bold text-white">
            {profile.compression.threshold} dB
          </span>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Comp Ratio</span>
          <span className="text-xs font-mono font-bold text-amber-400">
            {profile.compression.ratio}:1
          </span>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Fast Attack</span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {(profile.compression.attack * 1000).toFixed(1)} ms
          </span>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Release Time</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {(profile.compression.release * 1000).toFixed(0)} ms
          </span>
        </div>
      </div>
    </div>
  );
};
