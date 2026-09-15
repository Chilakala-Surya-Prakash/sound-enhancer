import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Headphones,
  Speaker,
  Play,
  Pause,
  SkipForward,
  Upload,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Activity,
  Check,
  X,
  Copy,
  Info,
  ShieldCheck,
  Radio,
  Share2,
  Music
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { EQ_9_PRESETS, EQ_LABELS, EQ_FREQUENCIES, EqPresetConfig } from '../data/eq9Presets';
import { EqPresetId, OutputDeviceMode } from '../types/audio';
import { DEMO_TRACKS } from '../data/tracks';

// Spline interpolation helper for smooth curve rendering
function getNaturalSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

export const AuraSonicEqualizer: React.FC = () => {
  // Equalizer State
  const [bandValues, setBandValues] = useState<number[]>(() => audioEngine.get9BandValues());
  const [activePreset, setActivePreset] = useState<EqPresetId>(() => audioEngine.getCurrentEqPresetId());
  const [viewMode, setViewMode] = useState<'curve' | 'faders'>('curve');

  // Audio Enhancer Core State
  const [isEnhancerActive, setIsEnhancerActive] = useState<boolean>(() => audioEngine.isAudioEnhancerActiveState());
  const [outputDevice, setOutputDevice] = useState<OutputDeviceMode>(() => audioEngine.getOutputDeviceMode());

  // A/B Comparison State (Bypass whole EQ & Enhancer temporarily to compare)
  const [isBypassCompared, setIsBypassCompared] = useState<boolean>(false);
  const preBypassStateRef = useRef<{ enhancer: boolean; values: number[] } | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [currentSongTitle, setCurrentSongTitle] = useState<string>('Interstellar Abyss');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => audioEngine.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  // Modals & Feedback
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isTrackPickerOpen, setIsTrackPickerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Active interaction drag state
  const [activeDraggingIndex, setActiveDraggingIndex] = useState<number | null>(null);
  const curveSvgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time spectrum analysis buffer for visualizer
  const [spectrumBars, setSpectrumBars] = useState<number[]>(() => new Array(18).fill(0));
  const animFrameRef = useRef<number | null>(null);

  // Initialize engine and listeners
  useEffect(() => {
    audioEngine.init();

    audioEngine.setOnEq9Change((values, preset) => {
      setBandValues([...values]);
      setActivePreset(preset);
    });

    audioEngine.setOnEnhancerChange((active, mode) => {
      setIsEnhancerActive(active);
      setOutputDevice(mode);
    });

    audioEngine.setCallbacks(
      () => {},
      () => {},
      (_src, name) => setCurrentSongTitle(name),
      undefined,
      () => setIsPlaying(false)
    );

    // Spectrum render loop for reactive ambient aura
    const analyser = audioEngine.getAnalyser();
    const dataArray = new Uint8Array(32);

    const updateSpectrum = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        // sample 18 bins
        const bins: number[] = [];
        for (let i = 1; i <= 18; i++) {
          const raw = dataArray[i] || 0;
          bins.push(raw / 255);
        }
        setSpectrumBars(bins);
      }
      animFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    animFrameRef.current = requestAnimationFrame(updateSpectrum);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Presets Handlers
  const handleSelectPreset = (presetId: EqPresetId) => {
    if (isBypassCompared) {
      setIsBypassCompared(false);
    }
    audioEngine.setEqPreset(presetId);
    const p = EQ_9_PRESETS[presetId];
    triggerToast(`Profile: ${p.label} (${p.subtitle})`);
  };

  const handleResetFlat = () => {
    audioEngine.set9BandValues([0, 0, 0, 0, 0, 0, 0, 0, 0], 'balanced');
    triggerToast('EQ Reset: All bands set to flat 0 dB');
  };

  // Audio Enhancer Toggle
  const handleToggleEnhancer = () => {
    const nextState = !isEnhancerActive;
    audioEngine.setAudioEnhancerActive(nextState);
    triggerToast(nextState ? 'Audio Enhancer: DSP Online' : 'Audio Enhancer: Bypassed');
  };

  // Output Device Switch (Earphones vs Speaker)
  const handleSwitchDevice = (mode: OutputDeviceMode) => {
    audioEngine.setOutputDeviceMode(mode);
    triggerToast(
      mode === 'earphones'
        ? 'Acoustic Mode: Bluetooth Earphones (Binaural Crossfeed)'
        : 'Acoustic Mode: Phone Speaker (Anti-Resonance Guard)'
    );
  };

  // A/B Bypass Quick Toggle
  const handleToggleABCompare = () => {
    if (!isBypassCompared) {
      // Switch to flat bypass
      preBypassStateRef.current = {
        enhancer: isEnhancerActive,
        values: [...bandValues],
      };
      audioEngine.setAudioEnhancerActive(false);
      audioEngine.set9BandValues([0, 0, 0, 0, 0, 0, 0, 0, 0], 'balanced');
      setIsBypassCompared(true);
      triggerToast('A/B Testing: BYPASSED (Raw Audio)');
    } else {
      // Restore previous state
      if (preBypassStateRef.current) {
        audioEngine.setAudioEnhancerActive(preBypassStateRef.current.enhancer);
        audioEngine.set9BandValues(preBypassStateRef.current.values, 'custom');
      }
      setIsBypassCompared(false);
      triggerToast('A/B Testing: ENHANCED (Custom Profile)');
    }
  };

  // Dragging curve nodes on SVG
  const handleCurvePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    setActiveDraggingIndex(index);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleCurvePointerMove = (index: number, e: React.PointerEvent) => {
    if (activeDraggingIndex !== index || !curveSvgRef.current) return;
    const rect = curveSvgRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const fraction = 1 - Math.max(0, Math.min(1, relativeY / rect.height));
    const db = Math.round(fraction * 20 - 10);
    audioEngine.setBandValue(index, db);
  };

  const handleCurvePointerUp = (e: React.PointerEvent) => {
    setActiveDraggingIndex(null);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Vertical Slider Track Interaction
  const handleFaderPointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    setActiveDraggingIndex(index);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    updateFaderFromPointer(index, e);
  };

  const handleFaderPointerMove = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDraggingIndex === index) {
      updateFaderFromPointer(index, e);
    }
  };

  const handleFaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setActiveDraggingIndex(null);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const updateFaderFromPointer = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const db = Math.round(fraction * 20 - 10);
    audioEngine.setBandValue(index, db);
  };

  const handleResetBand = (index: number) => {
    audioEngine.setBandValue(index, 0);
    triggerToast(`${EQ_LABELS[index]}Hz reset to 0 dB`);
  };

  // Playback Handlers
  const handleTogglePlay = () => {
    audioEngine.resume();
    if (isPlaying) {
      audioEngine.pauseTrack();
      setIsPlaying(false);
    } else {
      const track = DEMO_TRACKS[currentTrackIndex];
      if (track) {
        audioEngine.playTrack(track.id);
        setCurrentSongTitle(track.title);
        setIsPlaying(true);
      }
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % DEMO_TRACKS.length;
    handleSelectTrack(nextIdx);
  };

  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    const track = DEMO_TRACKS[index];
    if (track) {
      setCurrentSongTitle(track.title);
      audioEngine.playTrack(track.id);
      setIsPlaying(true);
      triggerToast(`Playing: ${track.title}`);
    }
    setIsTrackPickerOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      audioEngine.resume();
      await audioEngine.loadUserAudioFile(file);
      setCurrentSongTitle(file.name);
      setIsPlaying(true);
      triggerToast(`Loaded: ${file.name}`);
    } catch (err) {
      console.error(err);
      triggerToast('Could not load audio file');
    }
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
  };

  const handleCopySettings = () => {
    const text = EQ_LABELS.map((lbl, i) => `${lbl}Hz: ${bandValues[i] > 0 ? '+' : ''}${bandValues[i]}dB`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2200);
    triggerToast('EQ settings copied to clipboard!');
  };

  // SVG Coordinates calculation for Spline Curve
  const svgWidth = 360;
  const svgHeight = 180;
  const marginX = 24;
  const availableWidth = svgWidth - marginX * 2;
  const stepX = availableWidth / (EQ_FREQUENCIES.length - 1);

  const curvePoints = useMemo(() => {
    return bandValues.map((db, idx) => {
      const x = marginX + idx * stepX;
      // map db from +10 (top) to -10 (bottom)
      // +10 -> 24px, -10 -> 156px, 0 -> 90px
      const y = 90 - (db / 10) * 66;
      return { x, y, db };
    });
  }, [bandValues, stepX, marginX]);

  const splinePath = useMemo(() => getNaturalSplinePath(curvePoints), [curvePoints]);
  const areaPath = useMemo(() => {
    if (curvePoints.length === 0) return '';
    return `${splinePath} L ${curvePoints[curvePoints.length - 1].x} 170 L ${curvePoints[0].x} 170 Z`;
  }, [splinePath, curvePoints]);

  const currentActivePresetConfig: EqPresetConfig = EQ_9_PRESETS[activePreset] || EQ_9_PRESETS.custom;

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-between max-w-lg mx-auto relative px-3 sm:px-5 py-4 pb-28 font-sans select-none overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl transition-opacity duration-1000 ${
            isEnhancerActive ? 'bg-emerald-500/10' : 'bg-slate-700/5'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-3xl transition-opacity duration-1000 ${
            isEnhancerActive
              ? outputDevice === 'earphones'
                ? 'bg-cyan-500/10'
                : 'bg-indigo-500/10'
              : 'bg-slate-700/5'
          }`}
        />
      </div>

      {/* Floating Toast notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#141721]/90 border border-slate-700/60 text-slate-100 text-xs px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl animate-fade-in flex items-center gap-2 max-w-[90vw] truncate">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Brand Identity */}
      <header className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white font-sans">
                AuraSonic
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                DSP Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Android 48kHz Stereo Master
            </p>
          </div>
        </div>

        {/* Action Pills: A/B Bypass Test & Guide */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleABCompare}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
              isBypassCompared
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                : 'bg-[#121520] text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
            title="A/B Compare: Toggle between bypass and active EQ in real time"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isBypassCompared ? 'Bypassed' : 'A/B Test'}</span>
          </button>

          <button
            onClick={() => setShowGuideModal(true)}
            className="w-8 h-8 rounded-lg bg-[#121520] border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Android EQ Sync & Anti-Telephony Guide"
          >
            <Info className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Hero: Audio-Enhancer Master Command Center */}
      <section className="relative z-10 mb-4">
        <div
          className={`rounded-2xl p-4 transition-all duration-300 border backdrop-blur-xl ${
            isEnhancerActive
              ? 'bg-gradient-to-b from-[#111624] to-[#0d101a] border-cyan-500/30 shadow-[0_10px_30px_-10px_rgba(6,182,212,0.15)]'
              : 'bg-[#0f121a] border-slate-800/80 opacity-90'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* Left: Enhancer Title & Status */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleEnhancer}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative group ${
                  isEnhancerActive
                    ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                }`}
                title="Toggle Audio Enhancer DSP pipeline"
              >
                <Sparkles className="w-6 h-6 stroke-[2.2]" />
                {isEnhancerActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d101a] animate-pulse" />
                )}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-white">
                    Audio Enhancer
                  </h2>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                      isEnhancerActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isEnhancerActive ? 'DSP ACTIVE' : 'BYPASS'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEnhancerActive
                    ? outputDevice === 'earphones'
                      ? 'Binaural crossfeed & de-sibilance active'
                      : 'Anti-resonance 480Hz cut & cone guard active'
                    : 'DSP bypass: flat transparent pass-through'}
                </p>
              </div>
            </div>

            {/* Right: Master Toggle Switch */}
            <button
              onClick={handleToggleEnhancer}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                isEnhancerActive ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
              aria-label="Toggle Audio Enhancer"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                  isEnhancerActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Acoustic Target Mode Switcher (Android Specific) */}
          <div className="bg-[#090b10]/70 rounded-xl p-1.5 border border-slate-800/70 grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSwitchDevice('earphones')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                outputDevice === 'earphones'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Bluetooth Earphones</span>
            </button>

            <button
              onClick={() => handleSwitchDevice('speaker')}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                outputDevice === 'speaker'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Speaker className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Phone Speaker</span>
            </button>
          </div>

          {/* Real-time DSP Stage Badges */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono overflow-x-auto gap-2">
            <div className="flex items-center gap-1 text-slate-300 flex-shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>48kHz Clean Stereo Pipe</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{outputDevice === 'earphones' ? 'Crossfeed 35%' : '65Hz High-Pass'}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>{outputDevice === 'earphones' ? 'De-Sibilance' : '480Hz Notch'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Equalizer Module */}
      <section className="relative z-10 bg-[#0d1017] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl mb-4 backdrop-blur-xl">
        {/* EQ Header & View Toggle (Curve vs Faders) */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>9-Band Graphic EQ</span>
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
              ±10 dB
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetFlat}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
              title="Reset all bands to 0 dB"
            >
              Zero All
            </button>

            {/* View Switch: Curve vs Faders */}
            <div className="bg-[#141722] rounded-lg p-0.5 border border-slate-800 flex items-center">
              <button
                onClick={() => setViewMode('curve')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  viewMode === 'curve'
                    ? 'bg-slate-700/90 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Harmonic Spline Curve View"
              >
                Curve
              </button>
              <button
                onClick={() => setViewMode('faders')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  viewMode === 'faders'
                    ? 'bg-slate-700/90 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Studio Channel Faders View"
              >
                Faders
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Interactive Harmonic Spline Curve */}
        {viewMode === 'curve' && (
          <div className="relative pt-1 pb-2">
            {/* Live Audio Spectrum Bars in background of curve */}
            <div className="absolute inset-x-2 bottom-6 top-8 pointer-events-none flex items-end justify-between gap-1 opacity-20 z-0">
              {spectrumBars.map((val, idx) => (
                <div
                  key={`spec-bar-${idx}`}
                  className="w-full bg-gradient-to-t from-cyan-500 via-emerald-400 to-transparent rounded-t transition-all duration-75"
                  style={{
                    height: `${Math.max(4, val * 100)}%`,
                  }}
                />
              ))}
            </div>

            {/* SVG Curve Container */}
            <div className="relative w-full aspect-[2/1] max-h-52 select-none touch-none">
              <svg
                ref={curveSvgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  {/* Glowing gradient for curve line */}
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="35%" stopColor="#10b981" />
                    <stop offset="70%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>

                  {/* Gradient fill under the curve */}
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#08090d" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Glow filter */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid Guidelines */}
                <line x1={marginX} y1="24" x2={svgWidth - marginX} y2="24" stroke="#222736" strokeDasharray="2 3" />
                <line x1={marginX} y1="57" x2={svgWidth - marginX} y2="57" stroke="#1f2430" strokeDasharray="2 3" />
                <line x1={marginX} y1="90" x2={svgWidth - marginX} y2="90" stroke="#333b4f" strokeWidth="1.2" />
                <line x1={marginX} y1="123" x2={svgWidth - marginX} y2="123" stroke="#1f2430" strokeDasharray="2 3" />
                <line x1={marginX} y1="156" x2={svgWidth - marginX} y2="156" stroke="#222736" strokeDasharray="2 3" />

                {/* Y-Axis dB Labels */}
                <text x={marginX - 6} y="27" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">+10</text>
                <text x={marginX - 6} y="93" textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="monospace">0</text>
                <text x={marginX - 6} y="159" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">-10</text>

                {/* Vertical guide lines at each frequency point */}
                {curvePoints.map((pt, i) => (
                  <line
                    key={`guide-${i}`}
                    x1={pt.x}
                    y1="24"
                    x2={pt.x}
                    y2="156"
                    stroke="#181e2b"
                    strokeDasharray="1 3"
                  />
                ))}

                {/* Area Fill */}
                <path d={areaPath} fill="url(#areaGradient)" />

                {/* Spline Curve Stroke */}
                <path
                  d={splinePath}
                  fill="none"
                  stroke="url(#curveGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />

                {/* Draggable Control Nodes */}
                {curvePoints.map((pt, i) => {
                  const isDragging = activeDraggingIndex === i;
                  return (
                    <g
                      key={`node-${i}`}
                      onPointerDown={(e) => handleCurvePointerDown(i, e)}
                      onPointerMove={(e) => handleCurvePointerMove(i, e)}
                      onPointerUp={handleCurvePointerUp}
                      onDoubleClick={() => handleResetBand(i)}
                      className="cursor-pointer"
                    >
                      {/* Touch target circle */}
                      <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />

                      {/* Outer pulse when active */}
                      {isDragging && (
                        <circle cx={pt.x} cy={pt.y} r="12" fill="#06b6d4" opacity="0.25" />
                      )}

                      {/* Control Point */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isDragging ? 6.5 : 5}
                        fill="#0d1017"
                        stroke={isDragging ? '#38bdf8' : '#e2e8f0'}
                        strokeWidth="2.5"
                        className="transition-transform duration-75"
                      />

                      {/* Active dB Callout Tooltip */}
                      {isDragging && (
                        <g>
                          <rect
                            x={pt.x - 16}
                            y={Math.max(6, pt.y - 28)}
                            width="32"
                            height="16"
                            rx="4"
                            fill="#1e293b"
                            stroke="#38bdf8"
                            strokeWidth="1"
                          />
                          <text
                            x={pt.x}
                            y={Math.max(6, pt.y - 28) + 11}
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {pt.db > 0 ? `+${pt.db}` : pt.db}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Frequency Labels & Value readouts row */}
            <div className="grid grid-cols-9 gap-1 text-center mt-2 px-3 font-mono text-[11px]">
              {bandValues.map((val, idx) => (
                <div
                  key={`val-col-${idx}`}
                  onClick={() => handleResetBand(idx)}
                  className="cursor-pointer group flex flex-col items-center"
                  title="Click to reset band to 0 dB"
                >
                  <span
                    className={`font-semibold transition-colors ${
                      val > 0
                        ? 'text-cyan-400'
                        : val < 0
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
                    {EQ_LABELS[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode 2: Studio Tactile Faders */}
        {viewMode === 'faders' && (
          <div className="pt-2 pb-1">
            {/* 9 Vertical Channel Strips */}
            <div className="grid grid-cols-9 gap-1 h-52 sm:h-56 relative items-stretch">
              {bandValues.map((val, idx) => {
                const percent = ((val + 10) / 20) * 100;
                const isDragging = activeDraggingIndex === idx;

                return (
                  <div
                    key={`fader-strip-${idx}`}
                    className="flex flex-col items-center justify-between h-full group select-none touch-none"
                  >
                    {/* Top dB readout */}
                    <div
                      className={`text-[10px] font-mono font-medium ${
                        val > 0 ? 'text-cyan-400' : val < 0 ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </div>

                    {/* Fader Track */}
                    <div
                      className="relative w-7 flex-1 my-1 cursor-pointer flex items-center justify-center"
                      onPointerDown={(e) => handleFaderPointerDown(idx, e)}
                      onPointerMove={(e) => handleFaderPointerMove(idx, e)}
                      onPointerUp={handleFaderPointerUp}
                      onPointerCancel={handleFaderPointerUp}
                      onDoubleClick={() => handleResetBand(idx)}
                      title={`Double-click to reset ${EQ_LABELS[idx]} to 0dB`}
                    >
                      {/* Track slot */}
                      <div className="w-1.5 h-full bg-[#161a26] border border-slate-800 rounded-full relative overflow-hidden">
                        {/* 0dB center line notch */}
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-600 -translate-y-1/2 z-10" />

                        {/* Active fill */}
                        <div
                          className={`absolute w-full rounded-full transition-all duration-75 ${
                            val >= 0 ? 'bg-cyan-500/70' : 'bg-amber-500/70'
                          }`}
                          style={{
                            top: val >= 0 ? `${50 - (val / 10) * 50}%` : '50%',
                            bottom: val < 0 ? `${50 + (val / 10) * 50}%` : '50%',
                          }}
                        />
                      </div>

                      {/* Tactile Fader Cap */}
                      <div
                        className={`absolute w-6 h-4 rounded bg-gradient-to-b from-slate-200 to-slate-400 text-slate-950 shadow-md border border-white/40 flex items-center justify-center transition-transform pointer-events-none -translate-y-1/2 ${
                          isDragging ? 'scale-110 shadow-cyan-500/30 ring-2 ring-cyan-400' : ''
                        }`}
                        style={{
                          bottom: `${percent}%`,
                        }}
                      >
                        <div className="w-3 h-[2px] bg-slate-900 rounded-full" />
                      </div>
                    </div>

                    {/* Frequency Label */}
                    <div className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200">
                      {EQ_LABELS[idx]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Sonic Signatures / Presets Carousel */}
      <section className="relative z-10 mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Acoustic Profiles
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Active: <span className="text-cyan-400">{currentActivePresetConfig.label}</span>
          </span>
        </div>

        {/* Scrollable preset cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(EQ_9_PRESETS) as EqPresetId[]).map((presetKey) => {
            const config = EQ_9_PRESETS[presetKey];
            const isSelected = activePreset === presetKey && !isBypassCompared;

            return (
              <button
                key={presetKey}
                onClick={() => handleSelectPreset(presetKey)}
                className={`p-2.5 rounded-xl text-left transition-all duration-200 border relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#172033] to-[#111624] border-cyan-500/60 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                    : 'bg-[#0f121a] border-slate-800/80 hover:bg-[#151924] hover:border-slate-700/80'
                }`}
              >
                {/* Active indicator dot */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full shadow-sm"
                    style={{ backgroundColor: config.accent }}
                  />
                )}

                <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-1">
                  <span>{config.label}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {config.subtitle}
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
                  {config.tag}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Floating Studio Player & Output Pipeline Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-[#0c0e15]/95 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 flex-shrink-0 ${
              isPlaying
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current stroke-none" />
            ) : (
              <Play className="w-5 h-5 fill-current stroke-none ml-0.5" />
            )}
          </button>

          {/* Track Info & Switcher */}
          <div className="flex-1 min-w-0">
            <div
              onClick={() => setIsTrackPickerOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer group"
              title="Click to select track or calibration tool"
            >
              {isPlaying && (
                <div className="flex items-center gap-0.5 h-3 flex-shrink-0">
                  <span className="w-0.5 h-full bg-emerald-400 animate-pulse" />
                  <span className="w-0.5 h-2/3 bg-emerald-400 animate-pulse delay-75" />
                  <span className="w-0.5 h-4/5 bg-emerald-400 animate-pulse delay-150" />
                </div>
              )}
              <div className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                {currentSongTitle}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
              <button
                onClick={() => setIsTrackPickerOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                title="Select calibration track or music"
              >
                <span>Select Track</span>
                <Music className="w-3 h-3" />
              </button>
              <span>•</span>
              <button
                onClick={handleNextTrack}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-0.5"
                title="Next track"
              >
                <span>Next</span>
                <SkipForward className="w-2.5 h-2.5" />
              </button>
              <span>•</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {outputDevice === 'earphones' ? 'Earphones' : 'Speaker'}
              </span>
            </div>
          </div>

          {/* Controls: Volume, File Picker */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* File Upload to play any song from phone */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl bg-[#161a26] hover:bg-[#1e2333] text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-800"
              title="Play personal audio file from Android device"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Mute & Volume */}
            <div className="relative">
              <button
                onClick={handleToggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-[#161a26] hover:bg-[#1e2333] text-slate-300 hover:text-white border-slate-800'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Volume Slider Popover */}
              {showVolumeSlider && (
                <div
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="absolute bottom-12 right-0 bg-[#161a26] border border-slate-700 p-2.5 rounded-xl shadow-2xl flex flex-col items-center gap-1.5 w-8"
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1.5 accent-cyan-400 -rotate-90 my-10 cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-slate-400">
                    {Math.round(volume * 100)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Android System Equalizer & Technical Guide Dialog */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#11141e] border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative animate-fade-in text-slate-200">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  AuraSonic DSP Guide
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Android Audio Architecture
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0b0e17] p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Fixed: Why Audio Sounded Like A Phone Call</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  On Android, when apps open microphone listeners, Android switches Bluetooth & speakers into <strong className="text-slate-200">SCO Voice Call mode</strong> (8kHz mono telephony sound). AuraSonic enforces dedicated <strong className="text-emerald-300">48kHz high-fidelity media routing</strong> with zero microphone capture, guaranteeing clean stereo sound!
                </p>
              </div>

              <div className="bg-[#0b0e17] p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold text-cyan-400">
                    Sync to Spotify / Samsung EQ:
                  </div>
                  <button
                    onClick={handleCopySettings}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30"
                  >
                    {copiedSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSuccess ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] pt-1">
                  {bandValues.map((v, i) => (
                    <div key={`sync-val-${i}`} className="bg-slate-900/90 py-1 rounded border border-slate-800">
                      <span className="text-slate-400">{EQ_LABELS[i]}: </span>
                      <span className={v > 0 ? 'text-cyan-300 font-semibold' : v < 0 ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                        {v > 0 ? `+${v}` : v}dB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Audio Track & Calibration Tool Picker Modal */}
      {isTrackPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#11141e] border border-slate-700/80 rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-fade-in text-slate-200">
            <button
              onClick={() => setIsTrackPickerOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Audio & Calibration Tracks
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select a test signal or track to hear real-time EQ & Enhancer changes
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {DEMO_TRACKS.map((track, idx) => {
                const isCurrent = currentTrackIndex === idx && isPlaying;
                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-[#0e111a] border-slate-800/80 hover:border-slate-700 hover:bg-[#141824]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCurrent ? 'text-cyan-300' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </span>
                        {track.id === 'pink_noise' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold tracking-wider uppercase">
                            Best for EQ
                          </span>
                        )}
                        {track.id === 'frequency_sweep' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold tracking-wider uppercase">
                            Acoustic Test
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {track.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {track.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
                        isCurrent
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {isCurrent ? (
                        <Pause className="w-4 h-4 fill-current stroke-none" />
                      ) : (
                        <Play className="w-4 h-4 fill-current stroke-none ml-0.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                Tip: Pink noise has equal energy per band for immediate audible proof.
              </span>
              <button
                onClick={() => setIsTrackPickerOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuraSonicEqualizer;
