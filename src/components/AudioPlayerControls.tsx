import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Upload,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sliders,
  Laptop,
  Smartphone,
  HelpCircle,
  Headphones,
  CheckCircle2,
  Radio,
  FileAudio
} from 'lucide-react';
import { DEMO_TRACKS } from '../data/tracks';
import { DemoTrack, AudioSourceType } from '../types/audio';
import { audioEngine } from '../services/audioEngine';
import { CaptureGuideModal } from './CaptureGuideModal';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  onPlay: (trackId: string) => void;
  onPause: () => void;
  onStop: () => void;
  selectedTrack: DemoTrack;
  onSelectTrack: (track: DemoTrack) => void;
  fadeDuration: number;
  onChangeFadeDuration: (ms: number) => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  isSystemAudioActive: boolean;
  onToggleSystemAudio: () => void;
  activeSourceType: AudioSourceType;
  activeSourceName: string;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  selectedTrack,
  onSelectTrack,
  fadeDuration,
  onChangeFadeDuration,
  isMicActive,
  onToggleMic,
  isSystemAudioActive,
  onToggleSystemAudio,
  activeSourceType,
  activeSourceName,
}) => {
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isMonitor, setIsMonitor] = useState(() => audioEngine.isMonitorOutput());
  const [showGuideModal, setShowGuideModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep monitor button state synced with audio engine (e.g. when mic auto-mutes monitor)
  useEffect(() => {
    setIsMonitor(audioEngine.isMonitorOutput());
    audioEngine.setOnMonitorChange((enabled) => {
      setIsMonitor(enabled);
    });
  }, []);

  const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolumeState(v);
    audioEngine.setVolume(v);
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMonitor = () => {
    const next = !isMonitor;
    setIsMonitor(next);
    audioEngine.setMonitorOutput(next);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await audioEngine.loadUserAudioFile(file);
    } catch (err) {
      console.error('File load error', err);
      alert('Could not load audio file. Please try a standard MP3, WAV, AAC, or MP4 file.');
    } finally {
      // Clear file input value so re-selecting the same file triggers onChange
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* ANY APP AUDIO CAPTURE HERO BANNER */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-purple-950/70 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        {/* On-Device Hardware Guarantee Chip */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-300">
              100% On-Device Sound Hardware (DSP + Mic)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-300 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="text-emerald-400 font-bold">✓</span> No Gemini API Key Needed • Completely Offline
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              Act on Audio from Any App
              <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {isMobileDevice ? 'Mobile Sound Mode' : 'Universal Input'}
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              {isMobileDevice
                ? 'Play any song or video on Spotify, YouTube, TikTok, or Reels — your phone’s microphone and sound hardware process it locally!'
                : 'Play any song or video on YouTube, Spotify, Netflix, VLC, TikTok, or games — hardware DSP shapes the sound in real time!'}
            </p>
          </div>

          {/* How it works modal button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover:border-cyan-500/50 active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>How to Route Audio</span>
          </button>
        </div>

        {/* 3 Main Action Cards (Mobile-first ordered) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card: Mobile / Speaker High-Fi Listener (First on mobile) */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isMobileDevice ? 'order-1 md:order-2 border-purple-500/60 ring-1 ring-purple-500/40' : 'order-2'
            } ${
              isMicActive
                ? 'bg-purple-950/70 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-purple-500'
                : 'bg-slate-950/70 border-slate-800 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2.5 rounded-lg ${
                    isMicActive ? 'bg-purple-500 text-white' : 'bg-slate-800 text-purple-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white">Mobile Sound Hardware</h4>
                    {isMobileDevice && (
                      <span className="text-[9px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-1.5 py-0.2 rounded font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {isMicActive ? '● HARDWARE MIC ACTIVE' : '48kHz Speaker Listener'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-tight">
              Listens to songs/videos playing on phone speakers (Spotify, YouTube, TikTok, Reels) with zero feedback.
            </p>
            <button
              onClick={onToggleMic}
              className={`w-full py-3 px-3 min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isMicActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25'
              }`}
            >
              {isMicActive ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Mobile Listener
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Listen to Mobile Sound
                </>
              )}
            </button>
          </div>

          {/* Card: Laptop App Capture */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isMobileDevice ? 'order-2 md:order-1 opacity-90' : 'order-1'
            } ${
              isSystemAudioActive
                ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2.5 rounded-lg ${
                    isSystemAudioActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Laptop / PC Apps</h4>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {isSystemAudioActive ? '● STREAMING LIVE' : 'Direct Digital Loop'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-tight">
              Captures Chrome Tabs (YouTube, Spotify Web, Netflix) or Desktop Apps (VLC, games).
            </p>
            <button
              onClick={onToggleSystemAudio}
              className={`w-full py-3 px-3 min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isSystemAudioActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
              }`}
            >
              {isSystemAudioActive ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  Stop Laptop Capture
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  Capture Laptop Audio
                </>
              )}
            </button>
          </div>

          {/* Card: Custom Media File Upload */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all flex flex-col justify-between order-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2.5 rounded-lg bg-slate-800 text-amber-400">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Phone / Device Storage</h4>
                  <span className="text-[10px] text-amber-400 font-mono">Local Media File</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-tight">
                Play any downloaded song, video clip, or voice recording directly from mobile storage.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-3 min-h-[48px] rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Open Mobile Audio File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* DEMO SCENARIO PRESETS (FOR RAPID TESTING) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Or Test Multi-Stem Demo Scenes:
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              (Simulates sudden instrument &amp; dialogue shifts)
            </span>
          </div>

          {/* Fade duration selector */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800 text-xs">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Crossfade Window:</span>
            <select
              value={fadeDuration}
              onChange={(e) => onChangeFadeDuration(Number(e.target.value))}
              className="bg-slate-800 text-white font-mono rounded px-2 py-0.5 border border-slate-700 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value={200}>200ms (Fast)</option>
              <option value={380}>380ms (Recommended)</option>
              <option value={600}>600ms (Smooth)</option>
              <option value={1000}>1000ms (Cinematic)</option>
            </select>
          </div>
        </div>

        {/* Demo Tracks Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DEMO_TRACKS.map((track) => {
            const isSelected =
              activeSourceType === 'demo' && selectedTrack.id === track.id && isPlaying;
            return (
              <button
                key={track.id}
                onClick={() => {
                  onSelectTrack(track);
                  onPlay(track.id);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                    {track.type === 'movie' ? '🎬 MOVIE' : '🎵 MUSIC'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{track.bpm} BPM</span>
                </div>
                <h4 className="text-xs font-bold truncate mb-0.5">{track.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {track.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TRANSPORT & MONITOR CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 bg-slate-950/60 -mx-5 -mb-5 p-4 rounded-b-2xl">
        {/* Play/Pause/Stop & Live Status */}
        <div className="flex items-center gap-3">
          {!isPlaying ? (
            <button
              onClick={() => onPlay(selectedTrack.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Audio Engine
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              Pause
            </button>
          )}

          <button
            onClick={onStop}
            disabled={!isPlaying}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            title="Stop Playback"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Dynamic Active Source Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                activeSourceType === 'system'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : activeSourceType === 'mic'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : activeSourceType === 'file'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="truncate max-w-[200px] sm:max-w-xs font-mono">
                {activeSourceType === 'system'
                  ? '💻 Laptop App Audio'
                  : activeSourceType === 'mic'
                  ? '📱 Mobile / Speaker Listening'
                  : activeSourceType === 'file'
                  ? `📁 ${activeSourceName}`
                  : `🎵 Demo: ${selectedTrack.title}`}
              </span>
            </span>
          </div>
        </div>

        {/* Output Monitor & Volume Control */}
        <div className="flex items-center gap-4">
          {/* Output Monitor Toggle (Vital for loopback vs hearing EQ) */}
          <button
            onClick={handleToggleMonitor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isMonitor
                ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title="Toggle output to headphones/speakers. Turn OFF if capturing entire system audio to avoid echo."
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Hear EQ Monitor:</span>
            <span className={`font-bold ${isMonitor ? 'text-cyan-400' : 'text-slate-500'}`}>
              {isMonitor ? 'ON' : 'MUTED'}
            </span>
          </button>

          {/* Master Volume */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-24 accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              title={`Master Volume: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>
      </div>

      {/* Route Audio Guide Modal */}
      <CaptureGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onStartSystemCapture={onToggleSystemAudio}
        onStartMicCapture={onToggleMic}
      />
    </div>
  );
};

