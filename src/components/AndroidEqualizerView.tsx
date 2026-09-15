import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Play,
  Pause,
  Upload,
  Headphones,
  Speaker,
  Sparkles,
  Info,
  Check,
  Volume2,
  VolumeX,
  Radio,
  X
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { EQ_9_PRESETS, EQ_LABELS, EQ_FREQUENCIES } from '../data/eq9Presets';
import { EqPresetId, OutputDeviceMode } from '../types/audio';
import { DEMO_TRACKS } from '../data/tracks';

export const AndroidEqualizerView: React.FC = () => {
  // 9 Band EQ Values (-10 to +10 dB)
  const [bandValues, setBandValues] = useState<number[]>(() => audioEngine.get9BandValues());
  const [activePreset, setActivePreset] = useState<EqPresetId>(() => audioEngine.getCurrentEqPresetId());

  // Audio-enhancer Core Logic State
  const [isEnhancerActive, setIsEnhancerActive] = useState<boolean>(() => audioEngine.isAudioEnhancerActiveState());
  const [outputDevice, setOutputDevice] = useState<OutputDeviceMode>(() => audioEngine.getOutputDeviceMode());

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [currentSongTitle, setCurrentSongTitle] = useState<string>('Interstellar Abyss');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggingBandRef = useRef<number | null>(null);

  // Initialize engine & hook callbacks on mount
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
      (_source, name) => setCurrentSongTitle(name),
      undefined,
      () => setIsPlaying(false)
    );
  }, []);

  const showToast = useCallback((msg: string) => {
    setFeedbackToast(msg);
    window.setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Handle preset selection
  const handleSelectPreset = (presetId: EqPresetId) => {
    audioEngine.setEqPreset(presetId);
    showToast(`Preset: ${EQ_9_PRESETS[presetId].label}`);
  };

  // Toggle Audio-enhancer Core Logic
  const handleToggleEnhancer = () => {
    const nextState = !isEnhancerActive;
    audioEngine.setAudioEnhancerActive(nextState);
    showToast(nextState ? 'Audio-enhancer: ACTIVE' : 'Audio-enhancer: BYPASSED');
  };

  // Switch between Bluetooth Earphones & Phone Speaker
  const handleSwitchDevice = (mode: OutputDeviceMode) => {
    audioEngine.setOutputDeviceMode(mode);
    showToast(mode === 'earphones' ? 'Tuned for Bluetooth Earphones' : 'Tuned for Phone Speaker');
  };

  // Drag handler for the 9-band sliders
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    draggingBandRef.current = index;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    updateBandFromPointer(e, index);
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (draggingBandRef.current === index) {
      updateBandFromPointer(e, index);
    }
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingBandRef.current = null;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const updateBandFromPointer = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientY = e.clientY;
    // Top is +10 dB, bottom is -10 dB
    const fraction = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const db = Math.round(fraction * 20 - 10);
    audioEngine.setBandValue(index, db);
  };

  const handleDoubleClickBand = (index: number) => {
    audioEngine.setBandValue(index, 0);
    showToast(`${EQ_LABELS[index]} reset to 0 dB`);
  };

  // Audio Playback
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
    setCurrentTrackIndex(nextIdx);
    const track = DEMO_TRACKS[nextIdx];
    setCurrentSongTitle(track.title);
    if (isPlaying) {
      audioEngine.playTrack(track.id);
    }
    showToast(`Playing: ${track.title}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      audioEngine.resume();
      await audioEngine.loadUserAudioFile(file);
      setCurrentSongTitle(file.name);
      setIsPlaying(true);
      showToast(`Loaded: ${file.name}`);
    } catch (err) {
      console.error('File load error:', err);
      showToast('Could not load audio file');
    }
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Muted' : 'Unmuted');
  };

  // Format dB values (+3, 0, -4)
  const formatDb = (val: number) => {
    if (val > 0) return `+${val}`;
    return `${val}`;
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col justify-between select-none max-w-md mx-auto relative px-4 py-4 sm:py-6">
      {/* Toast notification */}
      {feedbackToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1f2029] border border-neutral-700 text-neutral-100 text-xs px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Equalizer settings active')}
            className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2]" />
          </button>
          <h1 className="font-serif text-2xl sm:text-[26px] tracking-tight text-neutral-100 font-normal">
            Equalizer
          </h1>
        </div>

        <button
          onClick={() => setShowSyncModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b1b22] border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors"
          title="Android Audio & EQ Guide"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Android Sync</span>
        </button>
      </header>

      {/* Equalizer Main Card */}
      <div className="bg-[#18181d] rounded-3xl p-5 border border-white/[0.06] shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex flex-col mb-4 relative overflow-hidden">
        {/* Subtle grid lines background inside card */}
        <div className="absolute inset-x-5 top-[58px] bottom-[48px] pointer-events-none flex flex-col justify-between opacity-15">
          <div className="border-b border-neutral-300 w-full" />
          <div className="border-b border-dashed border-neutral-400 w-full" />
          <div className="border-b border-neutral-300 w-full" />
          <div className="border-b border-dashed border-neutral-400 w-full" />
          <div className="border-b border-neutral-300 w-full" />
        </div>

        {/* Values Row (+3 +4 +2 +5 +3 +2 0 +6 +6) */}
        <div className="grid grid-cols-9 gap-1 mb-3 text-center">
          {bandValues.map((val, idx) => (
            <div
              key={`val-${idx}`}
              className="text-xs text-neutral-300 font-medium tracking-tight h-5 flex items-center justify-center"
            >
              {formatDb(val)}
            </div>
          ))}
        </div>

        {/* 9 Vertical Sliders */}
        <div className="grid grid-cols-9 gap-1 h-56 sm:h-64 relative items-stretch py-1">
          {bandValues.map((val, idx) => {
            // Percent from bottom (0% = -10dB, 50% = 0dB, 100% = +10dB)
            const percent = ((val + 10) / 20) * 100;

            return (
              <div
                key={`track-col-${idx}`}
                className="flex flex-col items-center justify-center h-full relative cursor-pointer touch-none select-none group"
                onPointerDown={(e) => handleTrackPointerDown(e, idx)}
                onPointerMove={(e) => handleTrackPointerMove(e, idx)}
                onPointerUp={handleTrackPointerUp}
                onPointerCancel={handleTrackPointerUp}
                onDoubleClick={() => handleDoubleClickBand(idx)}
                title={`Double-click to reset ${EQ_LABELS[idx]} to 0dB`}
              >
                {/* Vertical track line */}
                <div className="w-[2px] h-full bg-[#353540] group-hover:bg-[#454552] rounded-full transition-colors pointer-events-none relative">
                  {/* Subtle active fill from center line */}
                  <div
                    className="absolute w-full bg-sky-500/40 rounded-full"
                    style={{
                      top: val >= 0 ? `${50 - (val / 10) * 50}%` : '50%',
                      bottom: val < 0 ? `${50 + (val / 10) * 50}%` : '50%',
                    }}
                  />
                </div>

                {/* Circular thumb (Matches eq.png circular ring style) */}
                <div
                  className="absolute w-5 h-5 rounded-full bg-[#1b1b22] border-2 border-[#949eaf] shadow-md flex items-center justify-center -translate-y-1/2 pointer-events-none transition-transform group-active:scale-110 group-active:border-sky-400"
                  style={{
                    bottom: `${percent}%`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#828c9b]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Frequency Labels Row (63 125 250 500 1k 2k 4k 8k 16k) */}
        <div className="grid grid-cols-9 gap-1 mt-3 text-center">
          {EQ_LABELS.map((label, idx) => (
            <div
              key={`label-${idx}`}
              className="text-xs text-neutral-400 font-medium tracking-tight"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Preset & Audio-enhancer Buttons Section */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
        {/* Row 1: Balanced & Bass boost */}
        <button
          onClick={() => handleSelectPreset('balanced')}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all text-center ${
            activePreset === 'balanced'
              ? 'bg-[#9ba5b5] text-neutral-900 font-semibold shadow-md'
              : 'bg-[#242429] text-neutral-200 hover:bg-[#2b2b32] active:scale-[0.98]'
          }`}
        >
          Balanced
        </button>

        <button
          onClick={() => handleSelectPreset('bass_boost')}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all text-center ${
            activePreset === 'bass_boost'
              ? 'bg-[#9ba5b5] text-neutral-900 font-semibold shadow-md'
              : 'bg-[#242429] text-neutral-200 hover:bg-[#2b2b32] active:scale-[0.98]'
          }`}
        >
          Bass boost
        </button>

        {/* Row 2: Smooth & Dynamic */}
        <button
          onClick={() => handleSelectPreset('smooth')}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all text-center ${
            activePreset === 'smooth'
              ? 'bg-[#9ba5b5] text-neutral-900 font-semibold shadow-md'
              : 'bg-[#242429] text-neutral-200 hover:bg-[#2b2b32] active:scale-[0.98]'
          }`}
        >
          Smooth
        </button>

        <button
          onClick={() => handleSelectPreset('dynamic')}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all text-center ${
            activePreset === 'dynamic'
              ? 'bg-[#9ba5b5] text-neutral-900 font-semibold shadow-md'
              : 'bg-[#242429] text-neutral-200 hover:bg-[#2b2b32] active:scale-[0.98]'
          }`}
        >
          Dynamic
        </button>

        {/* Row 3: Clear & Treble boost */}
        <button
          onClick={() => handleSelectPreset('clear')}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all text-center ${
            activePreset === 'clear'
              ? 'bg-[#9ba5b5] text-neutral-900 font-semibold shadow-md'
              : 'bg-[#242429] text-neutral-200 hover:bg-[#2b2b32] active:scale-[0.98]'
          }`}
        >
          Clear
        </button>

        <button
          onClick={() => handleSelectPreset('treble_boost')}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all text-center ${
            activePreset === 'treble_boost'
              ? 'bg-[#9ba5b5] text-neutral-900 font-semibold shadow-md'
              : 'bg-[#242429] text-neutral-200 hover:bg-[#2b2b32] active:scale-[0.98]'
          }`}
        >
          Treble boost
        </button>

        {/* Row 4: Custom & Audio-enhancer */}
        <button
          onClick={() => handleSelectPreset('custom')}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all text-center ${
            activePreset === 'custom'
              ? 'bg-[#9ba5b5] text-neutral-900 font-semibold shadow-md'
              : 'bg-[#242429] text-neutral-200 hover:bg-[#2b2b32] active:scale-[0.98]'
          }`}
        >
          Custom
        </button>

        {/* Audio-enhancer Button (Takes up core logic as requested) */}
        <button
          onClick={handleToggleEnhancer}
          className={`py-3.5 px-4 rounded-full font-serif text-[15px] transition-all flex items-center justify-center gap-2 ${
            isEnhancerActive
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/50'
              : 'bg-[#242429] text-neutral-300 hover:bg-[#2b2b32] border border-neutral-700/50'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isEnhancerActive ? 'text-white fill-white' : 'text-neutral-400'}`} />
          <span>Audio-enhancer</span>
          {isEnhancerActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      {/* Android Target Acoustic Device Mode Selector */}
      <div className="bg-[#141418] border border-neutral-800/80 rounded-2xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>Target Output (Android Only)</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            {outputDevice === 'earphones' ? 'Binaural Spatial DSP' : 'Anti-Telephony Notch'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSwitchDevice('earphones')}
            className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              outputDevice === 'earphones'
                ? 'bg-[#252530] text-sky-400 border border-sky-500/40 shadow-sm'
                : 'bg-[#1a1a20] text-neutral-400 hover:text-neutral-200 border border-transparent'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Bluetooth Earphones</span>
          </button>

          <button
            onClick={() => handleSwitchDevice('speaker')}
            className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              outputDevice === 'speaker'
                ? 'bg-[#252530] text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-[#1a1a20] text-neutral-400 hover:text-neutral-200 border border-transparent'
            }`}
          >
            <Speaker className="w-4 h-4" />
            <span>Phone Speaker</span>
          </button>
        </div>
      </div>

      {/* Minimal Playback Controller (No Telephony / No Microphone degradation) */}
      <div className="bg-[#18181d] border border-white/[0.06] rounded-2xl p-3.5 flex items-center justify-between gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={handleTogglePlay}
          className="w-11 h-11 rounded-full bg-neutral-200 hover:bg-white text-neutral-900 flex items-center justify-center shadow-lg active:scale-95 transition-all flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-neutral-900" />
          ) : (
            <Play className="w-5 h-5 fill-neutral-900 ml-0.5" />
          )}
        </button>

        {/* Song Info & Track Selector */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-neutral-200 truncate flex items-center gap-1.5">
            {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />}
            <span className="truncate">{currentSongTitle}</span>
          </div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
            <button
              onClick={handleNextTrack}
              className="text-sky-400 hover:underline"
            >
              Switch demo track
            </button>
            <span>•</span>
            <span className="text-neutral-500">48kHz High-Res Media</span>
          </div>
        </div>

        {/* Load Audio from Android Phone */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-[#242429] hover:bg-[#2e2e36] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            title="Play song from phone storage"
            aria-label="Upload audio"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleMute}
            className="w-9 h-9 rounded-full bg-[#242429] hover:bg-[#2e2e36] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label="Toggle mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Android EQ Sync & Telephony-Fix Guide Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181d] border border-neutral-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setShowSyncModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#25252c] text-neutral-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg text-neutral-100 font-semibold">
                Android Audio Enhancer
              </h3>
            </div>

            <div className="space-y-3 text-xs text-neutral-300">
              <div className="bg-[#1f1f26] p-3 rounded-xl border border-neutral-800">
                <div className="font-medium text-sky-400 mb-1">
                  Why audio doesn&apos;t sound like a call anymore:
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  When apps listen to the microphone, Android automatically forces Bluetooth & speaker hardware into <span className="text-neutral-200">Voice Call (SCO) mode</span>, turning sound into an 8kHz mono telephone voice message. We eliminated microphone capture so audio always streams in <span className="text-emerald-400 font-medium">pristine 48kHz stereo media quality</span>!
                </p>
              </div>

              <div className="bg-[#1f1f26] p-3 rounded-xl border border-neutral-800">
                <div className="font-medium text-emerald-400 mb-1">
                  Syncing with Spotify / System EQ:
                </div>
                <p className="text-neutral-400 leading-relaxed mb-2">
                  Match these exact 9 band values in Spotify &gt; Settings &gt; Equalizer or Android SoundAlive:
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                  {bandValues.map((v, i) => (
                    <div key={`modal-val-${i}`} className="bg-black/40 py-1 rounded border border-neutral-800">
                      <span className="text-neutral-400">{EQ_LABELS[i]}: </span>
                      <span className={v > 0 ? 'text-sky-300' : v < 0 ? 'text-amber-300' : 'text-neutral-200'}>
                        {formatDb(v)}dB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 pt-1">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Zero latency, high-res A2DP stereo, tuned for Android speaker & earphones.</span>
              </div>
            </div>

            <button
              onClick={() => setShowSyncModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-neutral-200 hover:bg-white text-neutral-900 font-medium text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
