import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { AudioProfileConfig } from '../types/audio';

interface AudioVisualizerProps {
  currentProfile: AudioProfileConfig;
  isTransitioning: boolean;
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  currentProfile,
  isTransitioning,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 256;
    const freqDataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const currentAnalyser = audioEngine.getAnalyser();
      if (!currentAnalyser || !isPlaying) {
        // Subtle idle wave
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sliceWidth = width / 64;
        let x = 0;
        const time = performance.now() * 0.002;
        for (let i = 0; i < 64; i++) {
          const y = height / 2 + Math.sin(i * 0.2 + time) * 6;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();

        animId = requestAnimationFrame(render);
        return;
      }

      currentAnalyser.getByteFrequencyData(freqDataArray as any);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.6)');
      bgGrad.addColorStop(1, 'rgba(11, 15, 25, 0.9)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw frequency bars
      const barCount = 48;
      const barWidth = (width / barCount) - 2;
      let x = 1;

      // Color from current profile
      const accent = currentProfile.accentColor || '#06b6d4';

      for (let i = 0; i < barCount; i++) {
        // Logarithmic frequency distribution
        const index = Math.floor(Math.pow(i / barCount, 1.6) * (bufferLength / 3));
        const val = freqDataArray[index] || 0;
        const percent = val / 255;
        const barHeight = Math.max(4, percent * (height - 24));

        const barGrad = ctx.createLinearGradient(0, height, 0, height - barHeight);
        barGrad.addColorStop(0, `${accent}33`);
        barGrad.addColorStop(0.6, `${accent}aa`);
        barGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, height - barHeight - 8, barWidth, barHeight, [3, 3, 0, 0]);
        } else {
          ctx.rect(x, height - barHeight - 8, barWidth, barHeight);
        }
        ctx.fill();

        // Little peak cap
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, height - barHeight - 11, barWidth, 2);

        x += barWidth + 2;
      }

      // Draw Oscilloscope overlay
      currentAnalyser.getByteTimeDomainData(timeDataArray as any);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isTransitioning ? '#fbbf24' : accent;
      ctx.shadowBlur = isTransitioning ? 15 : 10;
      ctx.shadowColor = isTransitioning ? '#fbbf24' : accent;

      ctx.beginPath();
      const sliceWidth = width / 128;
      let waveX = 0;
      for (let i = 0; i < 128; i++) {
        const step = Math.floor(i * (bufferLength / 128));
        const v = timeDataArray[step] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) ctx.moveTo(waveX, y);
        else ctx.lineTo(waveX, y);

        waveX += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentProfile, isTransitioning, isPlaying]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
      {/* Visualizer header & status */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Live Spectrum &amp; Oscilloscope
            </span>
          </div>
          {isTransitioning && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Smooth Crossfade Active…</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Profile: <strong className="text-white" style={{ color: currentProfile.accentColor }}>{currentProfile.name}</strong></span>
          <span>Attack: <strong className="text-slate-200">{(currentProfile.compression.attack * 1000).toFixed(0)}ms</strong></span>
          <span>Sharpen: <strong className="text-slate-200">{currentProfile.sharpening}%</strong></span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={900}
        height={220}
        className="w-full h-44 sm:h-52 block"
      />

      {/* Frequency spectrum scale labels */}
      <div className="flex justify-between px-6 py-1.5 bg-slate-950/70 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
        <span>20 Hz (Sub)</span>
        <span>80 Hz</span>
        <span>250 Hz (Bass)</span>
        <span>1 kHz (Vocals)</span>
        <span>3.5 kHz (Presence)</span>
        <span>8 kHz (Percussion)</span>
        <span>16 kHz (Air)</span>
      </div>
    </div>
  );
};
