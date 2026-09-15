import React from 'react';
import { InstrumentMetrics, AudioProfileConfig } from '../types/audio';
import { Sparkles, Mic, Drum, Guitar, Music, Flame, Zap, ArrowRightLeft } from 'lucide-react';

interface InstrumentDetectorProps {
  metrics: InstrumentMetrics;
  currentProfile: AudioProfileConfig;
  isTransitioning: boolean;
  fadeDurationMs: number;
}

export const InstrumentDetector: React.FC<InstrumentDetectorProps> = ({
  metrics,
  currentProfile,
  isTransitioning,
  fadeDurationMs,
}) => {
  const instruments = [
    {
      name: 'Drums & Percussion',
      icon: Drum,
      value: metrics.drums,
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      label: metrics.drums > 0.45 ? 'Heavy Kick/Snare' : 'Rhythmic Layer'
    },
    {
      name: 'Bass & Sub Harmonics',
      icon: Guitar,
      value: metrics.bass,
      color: 'bg-violet-500',
      textColor: 'text-violet-400',
      label: metrics.bass > 0.45 ? 'Deep Bassline' : 'Low End'
    },
    {
      name: 'Vocals & Dialogue',
      icon: Mic,
      value: metrics.vocals,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      label: metrics.vocals > 0.4 ? 'Prominent Vocals' : 'Background'
    },
    {
      name: 'Acoustic / Strings / Synths',
      icon: Music,
      value: metrics.stringsAcoustic,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      label: metrics.stringsAcoustic > 0.35 ? 'Sparkling Air' : 'Harmonics'
    },
    {
      name: 'Dynamic Intensity',
      icon: Flame,
      value: metrics.intensity,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      label: metrics.intensity > 0.5 ? 'Intense Climax' : 'Mellow Dynamic'
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Real-Time Instrument &amp; Vocal Analysis
            </h3>
            <p className="text-xs text-slate-400">
              On-device hardware DSP evaluates acoustic stems &amp; adjusts mixing profile
            </p>
          </div>
        </div>

        {/* Dynamic Transition Banner */}
        <div className="flex items-center gap-2">
          {metrics.isHeavySection && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-300">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              Heavy Section Active
            </span>
          )}

          {metrics.isVocalShift && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              Vocal Shift Detected
            </span>
          )}
        </div>
      </div>

      {/* Real-time Instrument Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {instruments.map((inst) => {
          const Icon = inst.icon;
          const pct = Math.round(inst.value * 100);
          return (
            <div
              key={inst.name}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{inst.name.split(' ')[0]}</span>
                </div>
                <span className={`text-xs font-mono font-bold ${inst.textColor}`}>
                  {pct}%
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden mb-1.5">
                <div
                  className={`h-full ${inst.color} rounded-full transition-all duration-150`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <span className="text-[10px] text-slate-500 font-mono truncate">
                {inst.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current AI Reasoning Box & Smooth Fade Indicator */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1 shrink-0 animate-pulse"
            style={{ backgroundColor: currentProfile.accentColor }}
          />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono font-medium text-slate-400">
                ACTIVE PROFILE:
              </span>
              <span
                className="text-xs font-bold tracking-wide uppercase px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${currentProfile.accentColor}20`,
                  color: currentProfile.accentColor,
                  border: `1px solid ${currentProfile.accentColor}40`,
                }}
              >
                {currentProfile.name}
              </span>
              {isTransitioning && (
                <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Smoothing Crossfade ({fadeDurationMs}ms)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {metrics.aiExplanation || currentProfile.description}
            </p>
          </div>
        </div>

        {/* Sharpening & Punch Indicator */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              Sharpened Attack
            </span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              {currentProfile.sharpening}%
            </span>
          </div>
          <div className="text-right border-l border-slate-800 pl-3">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              Percussion Boost
            </span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {currentProfile.percussionBoost}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
