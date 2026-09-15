import React from 'react';
import { X, Flame, Mic, Waves, Sparkles, Zap, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface ConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConceptModal: React.FC<ConceptModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Dynamic AI Audio Mixing Concept</h2>
            <p className="text-xs text-slate-400">How your sound profile transition engine works</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              1. Heavy / Intense Music Adaptation
            </h3>
            <p className="text-xs text-slate-400">
              When the music experiences high dynamic intensity, heavy drum impacts, or climax drops, the engine sharpens the high-mid attack transients (3.4kHz–4.5kHz) and slams the sub-bass shelf (+7dB). Fast compressor attack (4ms) prevents flabbiness and delivers visceral punch.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              2. Instrumental vs. Vocal Transitions
            </h3>
            <p className="text-xs text-slate-400">
              When a movie scene or song shifts from pure instrumental to vocal or dialogue:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-400 mt-1 space-y-1">
              <li><strong>Vocal Focus:</strong> Boosts speech resonance (1.1kHz–3.5kHz) and cuts overlapping low-end rumble (-4dB sub-bass) so every word cuts through cleanly.</li>
              <li><strong>Instrumental Mode:</strong> When vocals recede, soundstage separation widens and harmonic balance across strings, guitars, and synthesizers is restored.</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              3. Dynamic Modes: Bass, Clear, Treble, Smooth &amp; Punchy
            </h3>
            <p className="text-xs text-slate-400">
              <strong>Deep Bass:</strong> Accentuates sub-frequencies (40Hz–120Hz) for rumbling bottom-end.<br />
              <strong>Crystal Clear:</strong> Elevates acoustic transparency and speech clarity (1.1kHz–6kHz) with clean low-end separation.<br />
              <strong>Crisp Treble:</strong> Highlights delicate acoustic guitar picking, violins, and cymbal shimmer (8kHz–14kHz).<br />
              <strong>Warm &amp; Smooth:</strong> Tames harsh sibilance with a velvety analog rolloff for fatigue-free listening.<br />
              <strong>Punchy Rhythm:</strong> Tightens transients for snappy drum kicks and rhythmic drive.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              4. Interactive Frequency Curve Customizer
            </h3>
            <p className="text-xs text-slate-400">
              You can drag any of the 5 parametric nodes directly on the interactive logarithmic frequency graph to customize frequency response in real time (-12dB to +12dB). The Web Audio DSP immediately updates the biquad filter transfer functions, while slider steppers allow 0.5dB precision adjustments.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              5. Smooth Crossfade Engine (Zero Pops or Clicks)
            </h3>
            <p className="text-xs text-slate-400">
              Before switching profiles, the Web Audio DSP performs a smooth gain crossfade (default 380ms) and linear parameter ramping across all 5 BiquadFilterNodes and the dynamics compressor. This eliminates jarring acoustic steps, clicks, or phase artifacts.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-cyan-500/30">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <Waves className="w-4 h-4 text-cyan-400" />
              6. Universal App Audio Input (Laptop &amp; Mobile)
            </h3>
            <p className="text-xs text-slate-400">
              On <strong>Laptops / PCs</strong>, you can capture internal digital audio directly from any Chrome Tab (YouTube, Spotify Web, Netflix) or desktop app (Spotify, VLC, games) via display media loopback. On <strong>Mobile devices</strong>, the high-fidelity Speaker Listener captures room audio with acoustic feedback protection, allowing the engine to dynamically detect instruments, dialogue, and beats from whatever app is playing!
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-emerald-500/30">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              7. 100% On-Device Sound Hardware — Zero API Key Needed
            </h3>
            <p className="text-xs text-slate-400">
              The entire mixing pipeline, multi-band FFT spectral decomposition, transient detection, and parametric dynamic EQ run locally on your device’s sound hardware and CPU via the native Web Audio API. No Gemini API key or external cloud server is ever required, ensuring 0ms network latency and complete offline privacy.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-500/30">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              8. Universal Earphone &amp; AirPods Acoustic Engine (Wired &amp; Wireless)
            </h3>
            <p className="text-xs text-slate-400">
              Earphones channel sound directly into the ear canal without room acoustics, causing in-head fatigue and harshness. Our engine incorporates:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-300 list-disc list-inside">
              <li><strong>Binaural Crossfeed Matrix:</strong> Blends subtle delayed opposite-ear acoustics (0.3ms ITD &amp; 750Hz shadow) for an expansive out-of-head 3D soundstage.</li>
              <li><strong>Anti-Sibilance De-Esser:</strong> Removes piercing 6.8kHz Bluetooth AAC/SBC compression sizzle on AirPods &amp; wireless earbuds.</li>
              <li><strong>Bass Seal Recovery:</strong> Compensates for acoustic low-frequency leakage when in-ear silicone tips shift.</li>
              <li><strong>Harman In-Ear Target:</strong> Provides 0ms audiophile curve alignment for wired IEMs and EarPods with high-sensitivity ear protection.</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Got It, Back to Mixer
          </button>
        </div>
      </div>
    </div>
  );
};
