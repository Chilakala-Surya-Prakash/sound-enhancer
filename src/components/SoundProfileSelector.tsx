import React from 'react';
import { AudioProfileConfig, AudioProfileId } from '../types/audio';
import { AUDIO_PROFILES } from '../data/profiles';
import { Flame, Zap, Waves, Sparkles, Mic, Music, SlidersHorizontal, Sun, Feather } from 'lucide-react';

interface SoundProfileSelectorProps {
  currentProfile: AudioProfileConfig;
  onSelectProfile: (id: AudioProfileId) => void;
  isAutoMix: boolean;
  onToggleAutoMix: () => void;
  isTransitioning: boolean;
}

export const SoundProfileSelector: React.FC<SoundProfileSelectorProps> = ({
  currentProfile,
  onSelectProfile,
  isAutoMix,
  onToggleAutoMix,
  isTransitioning,
}) => {
  const getIcon = (id: AudioProfileId) => {
    switch (id) {
      case 'heavy':
        return Flame;
      case 'punchy':
        return Zap;
      case 'bass':
        return Waves;
      case 'treble':
        return Sparkles;
      case 'vocal':
        return Mic;
      case 'instrumental':
        return Music;
      case 'clear':
        return Sun;
      case 'smooth':
        return Feather;
      default:
        return SlidersHorizontal;
    }
  };

  const profileList = Object.values(AUDIO_PROFILES);

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Header with Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Audio Profiles &amp; Modes
          </h3>
          <p className="text-xs text-slate-400">
            Dynamically shifts EQ, transient attack &amp; compression with smooth crossfade
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              if (!isAutoMix) onToggleAutoMix();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isAutoMix
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Auto-Mix
          </button>
          <button
            onClick={() => {
              if (isAutoMix) onToggleAutoMix();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              !isAutoMix
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Manual Mode
          </button>
        </div>
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {profileList.map((profile) => {
          const isActive = currentProfile.id === profile.id;
          const Icon = getIcon(profile.id);

          return (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? `${profile.glowClass} bg-slate-800/90 ring-1 ring-white/20`
                  : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              {/* Active gradient border accent */}
              {isActive && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: profile.accentColor }}
                />
              )}

              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${profile.accentColor}20`,
                    color: profile.accentColor,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex flex-col items-end">
                  {isActive && isTransitioning && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 animate-pulse">
                      CROSSFADING
                    </span>
                  )}
                  {isActive && !isTransitioning && (
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${profile.accentColor}30`,
                        color: profile.accentColor,
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-1">
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {profile.name}
                </h4>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  {profile.badge}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-3">
                {profile.description}
              </p>

              {/* Quick EQ preview pills */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/70">
                <span className="text-slate-500">EQ:</span>
                <span className={profile.eq.subBass > 0 ? 'text-rose-400' : 'text-slate-400'}>
                  {profile.eq.subBass > 0 ? `+${profile.eq.subBass}` : profile.eq.subBass}dB
                </span>
                <span className="text-slate-600">/</span>
                <span className={profile.eq.mids > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                  {profile.eq.mids > 0 ? `+${profile.eq.mids}` : profile.eq.mids}dB
                </span>
                <span className="text-slate-600">/</span>
                <span className={profile.eq.treble > 0 ? 'text-cyan-400' : 'text-slate-400'}>
                  {profile.eq.treble > 0 ? `+${profile.eq.treble}` : profile.eq.treble}dB
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
