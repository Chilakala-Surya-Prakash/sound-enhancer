import React from 'react';
import { X, Laptop, Smartphone, HelpCircle, CheckCircle, Volume2, ShieldCheck, ArrowRight } from 'lucide-react';

interface CaptureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSystemCapture: () => void;
  onStartMicCapture: () => void;
}

export const CaptureGuideModal: React.FC<CaptureGuideModalProps> = ({
  isOpen,
  onClose,
  onStartSystemCapture,
  onStartMicCapture,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                How to Act on Any Song or Video Playing from Any App
              </h2>
              <p className="text-xs text-slate-400">
                Route audio from Spotify, YouTube, Netflix, VLC, TikTok, or games
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Method 1: Laptop / PC */}
          <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 border-b border-l border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase font-bold rounded-bl-xl">
              Laptop / Desktop (Best Quality)
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400 shrink-0">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-bold text-white text-base">
                  1. Capture Live App or System Audio
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Route digital audio directly from any browser tab or desktop application into the AI mixing engine:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">For YouTube / Spotify Web / Netflix:</strong> Click <em>"Capture Laptop / App Audio"</em>, choose <strong>Chrome Tab</strong>, and make sure <strong>"Also share tab audio"</strong> is checked.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">For Desktop Apps (Spotify desktop, VLC, Games, Zoom):</strong> Select <strong>Entire Screen</strong> and check <strong>"Share system audio"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Output Monitor Toggle:</strong> Use the <em>"Hear EQ"</em> switch to hear the real-time equalized sound, or mute monitor to let the AI analyze and visualize without double-echo.
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onStartSystemCapture();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Start Laptop App Audio Capture
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Method 2: Mobile / Phone */}
          <div className="bg-slate-950/70 border border-purple-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500/20 border-b border-l border-purple-500/30 text-purple-400 font-mono text-[10px] uppercase font-bold rounded-bl-xl">
              Mobile Phone / Tablet (100% On-Device)
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-950 border border-purple-800/80 text-purple-400 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-bold text-white text-base">
                  2. Mobile Sound Hardware (Microphone &amp; Speaker)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No Gemini API key or internet connection required! The app operates <strong>solely on your mobile device’s physical sound hardware</strong> (48kHz audio digitizer and Web Audio hardware DSP):
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      Tap <strong className="text-white">"Listen to Mobile Sound"</strong> on your phone.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      Play any song or video in <strong className="text-white">Spotify, YouTube, Instagram Reels, TikTok, or your device music player</strong> out loud.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Acoustic Feedback Shield:</strong> The engine automatically silences its local speaker monitor during listening to prevent feedback loops, while all instrument gauges, parametric EQ curves, and visualizers run live on your mobile CPU.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Zero API Keys:</strong> Everything runs locally on device hardware. No cloud tokens, no external API calls, and zero latency.
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onStartMicCapture();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Start Mobile Sound Hardware Listener
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Method 3: Upload any song or video */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span>📁</span> Offline Song or Video Files
            </h4>
            <p className="text-slate-400">
              You can also click <strong>"Upload Audio/Video"</strong> to load any downloaded MP3, MP4, MKV, WAV, or AAC file from your phone or laptop storage. The engine extracts the soundtrack and applies full real-time AI mixing and equalization.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Web Audio API • Real-Time DSP • High-Fi 48kHz
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
