import React, { useState, useMemo, useCallback } from 'react';
import {
  Headphones,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  AlertTriangle,
  BarChart2,
  Sliders,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { IEM_PROFILES, IEM_BY_BRAND, IEMModelId, IEMCorrectionProfile } from '../data/iemProfiles';
import { EQ_FREQUENCIES, EQ_LABELS } from '../data/eq9Presets';

// ─── Spline interpolation for smooth curve rendering ───────────────────────────
function buildSplinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// Map dB value (-14 to +14) to SVG Y coordinate
const SVG_W = 380;
const SVG_H = 140;
const PAD_X = 28;
const PAD_Y = 12;
const INNER_W = SVG_W - PAD_X * 2;
const INNER_H = SVG_H - PAD_Y * 2;
const DB_RANGE = 14; // ±14 dB shown

function dbToY(db: number): number {
  return PAD_Y + ((DB_RANGE - db) / (DB_RANGE * 2)) * INNER_H;
}
function idxToX(idx: number): number {
  return PAD_X + (idx / (EQ_FREQUENCIES.length - 1)) * INNER_W;
}

// ─── Harman deviation bar ───────────────────────────────────────────────────────
function DeviationBar({ label, rawValue, correction, color }: {
  label: string;
  rawValue: number;
  correction: number;
  color: string;
}) {
  const maxDb = 10;
  const rawPercent = Math.abs(rawValue) / maxDb * 50;
  const corrPercent = Math.abs(correction) / maxDb * 50;
  const rawIsPos = rawValue >= 0;
  const corrIsPos = correction >= 0;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[9px] font-mono text-slate-400">{label}</div>
      {/* Raw FR deviation bar */}
      <div className="w-full h-1.5 bg-[#1a2035] rounded-full relative overflow-hidden">
        <div
          className="absolute h-full rounded-full"
          style={{
            backgroundColor: rawIsPos ? '#f97316' : '#818cf8',
            width: `${rawPercent}%`,
            left: rawIsPos ? '50%' : `${50 - rawPercent}%`,
          }}
        />
        <div className="absolute top-0 left-1/2 w-px h-full bg-slate-600" />
      </div>
      {/* Correction bar */}
      <div className="w-full h-1.5 bg-[#1a2035] rounded-full relative overflow-hidden">
        <div
          className="absolute h-full rounded-full"
          style={{
            backgroundColor: corrIsPos ? color : `${color}80`,
            width: `${corrPercent}%`,
            left: corrIsPos ? '50%' : `${50 - corrPercent}%`,
          }}
        />
        <div className="absolute top-0 left-1/2 w-px h-full bg-slate-600" />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export const WiredEarphoneOptimizer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<IEMModelId>('moondrop_chu');
  const [isExpanded, setIsExpanded] = useState(true);
  const [appliedId, setAppliedId] = useState<IEMModelId | null>(null);
  const [showDeviation, setShowDeviation] = useState(false);
  const [sourceImpComp, setSourceImpComp] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);

  const profile: IEMCorrectionProfile = IEM_PROFILES[selectedId];
  const isApplied = appliedId === selectedId;

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(prev => prev === msg ? null : prev), 2500);
  }, []);

  // Effective correction (add source impedance boost if needed)
  const effectiveCorrection = useMemo(() => {
    if (sourceImpComp && profile.sourceImpedanceWarning) {
      // High source impedance (e.g., cheap USB-C dongle ~3Ω) shifts BA response:
      // boosts ~50-300Hz (+2dB) and notches 1-4kHz (-1dB) for BA-sensitive IEMs
      return profile.correction.map((v, i) => {
        const adj = [1.5, 2.0, 2.0, 1.0, -1.0, -1.0, -0.5, 0, 0][i] ?? 0;
        return Math.max(-10, Math.min(10, Math.round(v + adj)));
      });
    }
    return profile.correction;
  }, [profile, sourceImpComp]);

  // SVG paths
  const rawPoints = useMemo(() =>
    profile.rawCurve.map((db, i) => ({ x: idxToX(i), y: dbToY(db) })),
    [profile]
  );
  const correctionPoints = useMemo(() =>
    effectiveCorrection.map((db, i) => ({ x: idxToX(i), y: dbToY(db) })),
    [effectiveCorrection]
  );
  // Simulated "after correction" = raw + correction (approximately flat/near-harman)
  const correctedPoints = useMemo(() =>
    profile.rawCurve.map((raw, i) => ({
      x: idxToX(i),
      y: dbToY(Math.max(-12, Math.min(12, raw + effectiveCorrection[i])))
    })),
    [profile, effectiveCorrection]
  );

  const rawPath = useMemo(() => buildSplinePath(rawPoints), [rawPoints]);
  const correctionPath = useMemo(() => buildSplinePath(correctionPoints), [correctionPoints]);
  const correctedPath = useMemo(() => buildSplinePath(correctedPoints), [correctedPoints]);

  // Area fill under the corrected curve
  const correctedAreaPath = useMemo(() => {
    if (correctedPoints.length === 0) return '';
    const zero = dbToY(0);
    return `${correctedPath} L ${correctedPoints[correctedPoints.length - 1].x} ${zero} L ${correctedPoints[0].x} ${zero} Z`;
  }, [correctedPath, correctedPoints]);

  const handleApply = useCallback(() => {
    audioEngine.set9BandValues(effectiveCorrection, 'custom');
    setAppliedId(selectedId);
    toast(`✓ Applied ${profile.fullName} correction to 9-Band EQ`);
  }, [effectiveCorrection, selectedId, profile.fullName, toast]);

  const handleReset = useCallback(() => {
    audioEngine.set9BandValues([0, 0, 0, 0, 0, 0, 0, 0, 0], 'balanced');
    setAppliedId(null);
    toast('EQ reset — IEM correction cleared');
  }, [toast]);

  // Score bar color
  const scoreColor = profile.harmanScore >= 85 ? '#10b981' : profile.harmanScore >= 70 ? '#f59e0b' : '#f87171';

  return (
    <section className="relative z-10 mb-4">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#141721]/95 border border-slate-700/60 text-slate-100 text-xs px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-2 max-w-[92vw] truncate animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          <span className="font-medium tracking-wide">{toastMsg}</span>
        </div>
      )}

      <div className="bg-[#0d1017] border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-4.5 h-4.5 text-violet-300 w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">IEM Frequency Correction</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold uppercase">
                  Harman Target
                </span>
                {isApplied && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Per-model measured FR correction → apply to 9-Band EQ
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(v => !v)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 pt-3 space-y-4">

            {/* ── IEM Model Picker ── */}
            <div>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Select Your IEM Model
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {Object.keys(IEM_BY_BRAND).length} brands · {Object.keys(IEM_PROFILES).length} models
                </span>
              </div>

              {/* Brand grouped grid */}
              <div className="space-y-2">
                {Object.entries(IEM_BY_BRAND).map(([brand, ids]) => (
                  <div key={brand}>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-1 px-0.5">{brand}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ids.map((id) => {
                        const p = IEM_PROFILES[id];
                        const isSel = id === selectedId;
                        const isApp = id === appliedId;
                        return (
                          <button
                            key={id}
                            onClick={() => setSelectedId(id)}
                            className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden group active:scale-[0.97] ${
                              isSel
                                ? 'bg-gradient-to-b from-violet-950/70 to-[#0d1017] border-violet-500/60 shadow-sm shadow-violet-500/10 ring-1 ring-violet-400/30'
                                : 'bg-[#0f1220] border-slate-800/70 hover:border-slate-700 hover:bg-[#141929]'
                            }`}
                          >
                            {isApp && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                            )}
                            <div className={`text-[11px] font-bold truncate ${isSel ? 'text-violet-200' : 'text-slate-200'}`}>
                              {p.model}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="text-[8px] px-1 py-0.5 rounded font-mono font-bold uppercase"
                                style={{ backgroundColor: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}
                              >
                                {p.type === 'balanced_armature' ? 'BA' : p.type === 'hybrid' ? 'HYB' : p.type === 'planar' ? 'PLN' : 'DD'}
                              </span>
                              <span className="text-[9px] text-slate-500 truncate">{p.price.split('/')[0].trim()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Selected IEM Details ── */}
            <div className="bg-[#090c14] border border-slate-800/60 rounded-xl p-3 space-y-3">
              {/* Profile header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-white truncate">{profile.fullName}</h3>
                    {profile.sourceImpedanceWarning && (
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-semibold flex-shrink-0">
                        <AlertTriangle className="w-2.5 h-2.5" /> BA Imp. Sensitive
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{profile.description}</p>
                </div>

                {/* Harman score badge */}
                <div className="flex-shrink-0 text-center min-w-[52px]">
                  <div
                    className="text-2xl font-black font-mono leading-none"
                    style={{ color: scoreColor }}
                  >
                    {profile.harmanScore}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">/ 100</div>
                  <div className="text-[8px] text-slate-600 uppercase tracking-wider">Harman</div>
                </div>
              </div>

              {/* Harman score bar */}
              <div className="space-y-1">
                <div className="h-1.5 bg-[#1a2035] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${profile.harmanScore}%`, backgroundColor: scoreColor }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-600">
                  <span>Poor match</span>
                  <span className="text-slate-400">Harman Preference Score</span>
                  <span>Perfect</span>
                </div>
              </div>

              {/* Tech specs row */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <div className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60 text-center">
                  <div className="text-slate-400">Impedance</div>
                  <div className="text-white font-bold mt-0.5">
                    {profile.impedance > 0 ? `${profile.impedance}Ω` : 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60 text-center">
                  <div className="text-slate-400">Sensitivity</div>
                  <div className="text-white font-bold mt-0.5">
                    {profile.sensitivity > 0 ? `${profile.sensitivity} dB` : 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60 text-center">
                  <div className="text-slate-400">Driver</div>
                  <div className="font-bold mt-0.5 capitalize" style={{ color: profile.color }}>
                    {profile.type === 'balanced_armature' ? 'BA' :
                     profile.type === 'hybrid' ? 'Hybrid' :
                     profile.type === 'planar' ? 'Planar' : 'Dynamic'}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {profile.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Frequency Response Correction Graph ── */}
            <div className="bg-[#090c14] border border-slate-800/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-slate-200">Frequency Response Correction Graph</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeviation(v => !v)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors border ${
                      showDeviation
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {showDeviation ? 'Hide' : 'Show'} Raw FR
                  </button>
                </div>
              </div>

              {/* SVG Graph */}
              <div className="relative w-full select-none touch-none">
                <svg
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  className="w-full"
                  style={{ height: '140px' }}
                >
                  <defs>
                    <linearGradient id="iemCorrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={profile.color} />
                      <stop offset="100%" stopColor={profile.color} stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="iemCorrAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={profile.color} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={profile.color} stopOpacity="0.02" />
                    </linearGradient>
                    <filter id="iemGlow">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  {/* Grid lines at ±6, ±3, 0 dB */}
                  {[-6, -3, 0, 3, 6].map(db => (
                    <g key={`grid-${db}`}>
                      <line
                        x1={PAD_X} y1={dbToY(db)}
                        x2={SVG_W - PAD_X} y2={dbToY(db)}
                        stroke={db === 0 ? '#2d3748' : '#1e2535'}
                        strokeWidth={db === 0 ? 1.2 : 0.8}
                        strokeDasharray={db === 0 ? '' : '2 4'}
                      />
                      <text x={PAD_X - 4} y={dbToY(db) + 3} textAnchor="end" fill="#475569" fontSize="7" fontFamily="monospace">
                        {db > 0 ? `+${db}` : db}
                      </text>
                    </g>
                  ))}

                  {/* Vertical freq lines */}
                  {EQ_FREQUENCIES.map((f, i) => (
                    <line
                      key={`vline-${f}`}
                      x1={idxToX(i)} y1={PAD_Y}
                      x2={idxToX(i)} y2={SVG_H - PAD_Y}
                      stroke="#141c2e"
                      strokeDasharray="1 4"
                    />
                  ))}

                  {/* Harman target baseline (0 dB reference line emphasized) */}
                  <line
                    x1={PAD_X} y1={dbToY(0)}
                    x2={SVG_W - PAD_X} y2={dbToY(0)}
                    stroke="#10b98140"
                    strokeWidth="1"
                  />

                  {/* Raw IEM FR curve (shown when toggled) */}
                  {showDeviation && rawPath && (
                    <path
                      d={rawPath}
                      fill="none"
                      stroke="#f9731660"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Corrected / resulting curve (area fill) */}
                  {correctedAreaPath && (
                    <path d={correctedAreaPath} fill="url(#iemCorrAreaGrad)" />
                  )}
                  {correctedPath && (
                    <path
                      d={correctedPath}
                      fill="none"
                      stroke={profile.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      filter="url(#iemGlow)"
                      opacity="0.9"
                    />
                  )}

                  {/* Correction delta curve */}
                  {correctionPath && (
                    <path
                      d={correctionPath}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                      opacity="0.7"
                    />
                  )}

                  {/* Hover band highlight dots */}
                  {correctedPoints.map((pt, i) => {
                    const isHovered = hoveredBand === i;
                    return (
                      <g key={`dot-${i}`}>
                        <circle
                          cx={pt.x} cy={pt.y} r="12"
                          fill="transparent"
                          onMouseEnter={() => setHoveredBand(i)}
                          onMouseLeave={() => setHoveredBand(null)}
                          className="cursor-crosshair"
                        />
                        {isHovered && (
                          <>
                            <circle cx={pt.x} cy={pt.y} r="5" fill={profile.color} opacity="0.3" />
                            <circle cx={pt.x} cy={pt.y} r="3" fill="#0d1017" stroke={profile.color} strokeWidth="2" />
                            <rect x={pt.x - 18} y={Math.max(PAD_Y, pt.y - 24)} width="36" height="15" rx="4" fill="#1e293b" stroke={profile.color} strokeWidth="0.8" />
                            <text x={pt.x} y={Math.max(PAD_Y, pt.y - 24) + 10} textAnchor="middle" fill={profile.color} fontSize="8" fontFamily="monospace" fontWeight="bold">
                              {effectiveCorrection[i] > 0 ? '+' : ''}{effectiveCorrection[i]}dB
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Freq labels below graph */}
                <div className="grid grid-cols-9 mt-1 px-6 text-center">
                  {EQ_LABELS.map((lbl, i) => (
                    <div
                      key={lbl}
                      className={`text-[9px] font-mono transition-colors ${hoveredBand === i ? 'text-violet-300' : 'text-slate-600'}`}
                    >
                      {lbl}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: profile.color }} />
                    <span>After correction</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 rounded bg-violet-500 opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8b5cf6 0px, #8b5cf6 3px, transparent 3px, transparent 5px)' }} />
                    <span>Correction curve</span>
                  </div>
                  {showDeviation && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 rounded bg-orange-500 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f97316 0px, #f97316 4px, transparent 4px, transparent 7px)' }} />
                      <span>Raw IEM FR</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Band-by-band Deviation Bars ── */}
              <div className="mt-3 pt-3 border-t border-slate-800/50">
                <div className="text-[10px] text-slate-500 font-mono mb-2 flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-violet-400" />
                  <span>Per-band deviation from Harman target (top: raw FR · bottom: correction applied)</span>
                </div>
                <div className="grid grid-cols-9 gap-1">
                  {EQ_LABELS.map((lbl, i) => (
                    <DeviationBar
                      key={lbl}
                      label={lbl}
                      rawValue={profile.rawCurve[i]}
                      correction={effectiveCorrection[i]}
                      color={profile.color}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[8px] font-mono text-slate-700 mt-1 px-0.5">
                  <span>← Cut</span>
                  <span>Boost →</span>
                </div>
              </div>
            </div>

            {/* ── EQ Correction Values ── */}
            <div className="bg-[#090c14] border border-slate-800/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-slate-200">9-Band Correction Values</span>
                </div>
              </div>
              <div className="grid grid-cols-9 gap-1 text-center font-mono text-[11px]">
                {effectiveCorrection.map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span
                      className={`font-bold transition-colors ${
                        val > 0 ? 'text-violet-300' : val < 0 ? 'text-orange-400' : 'text-slate-500'
                      }`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </span>
                    <span className="text-[9px] text-slate-600">{EQ_LABELS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Source Impedance Compensation ── */}
            {profile.sourceImpedanceWarning && (
              <div className="bg-amber-950/20 border border-amber-500/25 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-amber-200">Source Impedance Compensation</div>
                      <p className="text-[11px] text-amber-300/70 mt-0.5 leading-relaxed">
                        This IEM uses Balanced Armature or Hybrid drivers which are highly sensitive to source output impedance. If using a cheap USB-C dongle (~3–5Ω), enable this to compensate for the tonal shift it causes.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSourceImpComp(v => !v)}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 flex-shrink-0 mt-0.5 ${
                      sourceImpComp ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                    aria-label="Toggle source impedance compensation"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${sourceImpComp ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleApply}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                  isApplied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
                    : 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white shadow-violet-500/20'
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Correction Applied to EQ</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Apply Correction to EQ</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                  </>
                )}
              </button>

              {appliedId && (
                <button
                  onClick={handleReset}
                  className="px-3 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  title="Clear IEM correction from EQ"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Tip ── */}
            <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-900/40 border border-slate-800/40 rounded-xl p-3">
              <Info className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="text-slate-400">Tip:</strong> Apply the IEM correction first, then fine-tune individual 9-Band EQ bands for personal taste. Use A/B Test in the header to toggle the correction on/off during music playback.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default WiredEarphoneOptimizer;
