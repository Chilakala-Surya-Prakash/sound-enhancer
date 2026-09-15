import React from 'react';
import { Sliders, Sparkles, Info, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenInfo: () => void;
  isAutoMix: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenInfo, isAutoMix }) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-rose-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Dynamic Audio Mixer
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              On-Device Hardware • No API Key
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Real-time instrument detection, vocal shifting &amp; smooth crossfade EQ
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">Mode:</span>
          <span className="font-semibold text-slate-200">
            {isAutoMix ? 'AI Auto-Adaptive' : 'Manual Lock'}
          </span>
        </div>

        <button
          onClick={onOpenInfo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
          title="Concept Explanation"
        >
          <Info className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">Concept Overview</span>
        </button>
      </div>
    </header>
  );
};
