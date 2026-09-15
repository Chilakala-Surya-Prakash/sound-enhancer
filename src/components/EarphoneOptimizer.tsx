import { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Volume2,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';
import { EarphoneProfileConfig, EarphoneTypeId } from '../types/audio';
import { EARPHONE_PROFILES } from '../data/earphoneProfiles';
import { audioEngine } from '../services/audioEngine';

interface EarphoneOptimizerProps {
  isPlaying: boolean;
}

export const EarphoneOptimizer = ({}: EarphoneOptimizerProps) => {
  const [currentProfile, setCurrentProfile] = useState<EarphoneProfileConfig>(() =>
    audioEngine.getEarphoneProfile()
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [detectedOutputLabel, setDetectedOutputLabel] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [testToneActive, setTestToneActive] = useState(false);
  const userSelectedManualRef = useRef(false);

  const detectDevices = async () => {
    setIsDetecting(true);
    try {
      const res = await audioEngine.detectAudioOutputDevices();
      if (res.activeDeviceLabel) {
        setDetectedOutputLabel(res.activeDeviceLabel);
      }
      const activeId = audioEngine.getEarphoneProfile().id;
      if (res.suggestedProfile && res.suggestedProfile !== activeId && !userSelectedManualRef.current) {
        // Auto-select if a clear match was found and user hasn't explicitly chosen a manual preset
        audioEngine.setEarphoneProfile(res.suggestedProfile);
      }
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    // Listen for changes from audio engine
    audioEngine.setOnEarphoneProfileChange((newProfile) => {
      setCurrentProfile({ ...newProfile });
    });

    // Detect devices on mount
    detectDevices();

    // Listen for device plug/unplug or Bluetooth connect
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      const handleDeviceChange = () => {
        detectDevices();
      };
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, []);

  const handleSelectProfile = (id: EarphoneTypeId) => {
    userSelectedManualRef.current = true;
    audioEngine.setEarphoneProfile(id);
    setCurrentProfile(audioEngine.getEarphoneProfile());
  };

  const handleCrossfeedChange = (val: number) => {
    audioEngine.setCrossfeedAmount(val);
  };

  const handleToggleDeSibilance = () => {
    const next = !currentProfile.deSibilanceEnabled;
    audioEngine.setDeSibilance(next);
  };

  const handleBassSealChange = (db: number) => {
    audioEngine.setBassSealComp(db);
  };

  const handleToggleLimiter = () => {
    const next = !currentProfile.safetyLimiterEnabled;
    audioEngine.setEarphoneLimiter(next);
  };

  const handlePlaySpatialTest = () => {
    setTestToneActive(true);
    audioEngine.playSpatialTestChime();
    setTimeout(() => {
      setTestToneActive(false);
    }, 1500);
  };

  const profileList = Object.values(EARPHONE_PROFILES);

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 text-indigo-400 shadow-inner">
            <Headphones className="w-5 h-5 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Earphone &amp; AirPods Acoustic Engine
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Binaural DSP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Calibrated acoustic target curves, binaural room crossfeed &amp; Bluetooth anti-harshness for wireless &amp; wired earphones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Spatial Test Button */}
          <button
            onClick={handlePlaySpatialTest}
            disabled={testToneActive}
            title="Play 3D Spatial Test Tone (Left • Center • Right)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover:border-indigo-500/50 active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-indigo-400 ${testToneActive ? 'animate-spin' : ''}`} />
            <span>{testToneActive ? 'Playing 3D Tone...' : 'Test 3D Stage'}</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Output Hardware Detection Banner */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-semibold text-white">Audio Destination:</span>
          <span className="font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md">
            {detectedOutputLabel || 'Earphones / AirPods / Connected Output'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={detectDevices}
            disabled={isDetecting}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting...' : 'Re-scan Output'}</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Earphone Profiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {profileList.map((ep) => {
              const isSelected = ep.id === currentProfile.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectProfile(ep.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden active:scale-[0.98] ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">
                        {ep.id === 'airpods_tws' && '🍏'}
                        {ep.id === 'iem_wired' && '🔌'}
                        {ep.id === 'over_ear' && '🎧'}
                        {ep.id === 'open_ear' && '🏃'}
                        {ep.id === 'reference' && '🎚️'}
                      </span>
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-indigo-200' : 'text-white'
                        }`}
                      >
                        {ep.name}
                      </h4>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight mb-2">
                      {ep.description}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-800/60 w-full text-[9px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Crossfeed:</span>
                      <span className="text-cyan-300 font-bold">
                        {ep.crossfeedAmount > 0 ? `${Math.round(ep.crossfeedAmount * 100)}%` : 'Bypass'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Seal Comp:</span>
                      <span className="text-amber-300 font-bold">
                        {ep.bassSealComp > 0 ? `+${ep.bassSealComp} dB` : '0 dB'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Profile Calibration Details & Interactive Sliders */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Earphone Calibration: <span className="text-indigo-300">{currentProfile.name}</span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Target: {currentProfile.targetAcousticCurve}
                </span>
              </div>
            </div>

            {/* Interactive DSP Tuning Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Slider 1: Binaural Crossfeed Matrix */}
              <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-slate-200">Binaural Crossfeed</span>
                  </div>
                  <span className="font-mono text-cyan-300 font-bold">
                    {Math.round(currentProfile.crossfeedAmount * 100)}%
                    <span className="text-[10px] text-slate-400 ml-1 font-normal">
                      ({currentProfile.crossfeedAmount === 0 ? 'Stereo' : currentProfile.crossfeedAmount < 0.4 ? 'Subtle' : currentProfile.crossfeedAmount < 0.7 ? 'Room' : 'Wide'})
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentProfile.crossfeedAmount}
                  onChange={(e) => handleCrossfeedChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                  Simulates natural acoustic head diffraction (0.3ms ITD &amp; 750Hz shadow), eliminating in-head earphone fatigue.
                </p>
              </div>

              {/* Slider 2: Ear-Tip Bass Seal Compensation */}
              <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-slate-200">Bass Seal Compensation</span>
                  </div>
                  <span className="font-mono text-amber-300 font-bold">
                    {currentProfile.bassSealComp >= 0 ? `+${currentProfile.bassSealComp.toFixed(1)}` : currentProfile.bassSealComp.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.2"
                  value={currentProfile.bassSealComp}
                  onChange={(e) => handleBassSealChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                  Low-shelf 55Hz acoustic boost to recover sub-bass lost when silicone tips lose their airtight canal seal.
                </p>
              </div>

              {/* Toggle Switches: Anti-Sibilance & Safety Limiter */}
              <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                {/* De-Sibilance toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Anti-Sibilance De-Esser
                    </span>
                    <span className="text-[10px] text-slate-400">
                      -2.8 dB cut at 6.8 kHz (AAC harshness)
                    </span>
                  </div>
                  <button
                    onClick={handleToggleDeSibilance}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                      currentProfile.deSibilanceEnabled ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        currentProfile.deSibilanceEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Hearing Safety Limiter toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Hearing Safety Limiter
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Brickwall -1.0 dB ceiling for in-ear safety
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleLimiter}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                      currentProfile.safetyLimiterEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        currentProfile.safetyLimiterEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Recommended Hardware Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <Info className="w-3 h-3 text-indigo-400" />
                Optimized gear:
              </span>
              {currentProfile.recommendedFor.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
