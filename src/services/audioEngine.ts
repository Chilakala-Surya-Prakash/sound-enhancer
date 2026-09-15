import { AudioProfileConfig, AudioProfileId, InstrumentMetrics, AudioSourceType, EarphoneProfileConfig, EarphoneTypeId, EqPresetId, OutputDeviceMode } from '../types/audio';
import { AUDIO_PROFILES } from '../data/profiles';
import { EARPHONE_PROFILES } from '../data/earphoneProfiles';
import { EQ_9_PRESETS, EQ_FREQUENCIES } from '../data/eq9Presets';


class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private transitionGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // EQ Biquad Filter Nodes
  private subBassFilter: BiquadFilterNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highMidFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private transientSharpener: BiquadFilterNode | null = null;

  // Dynamics
  private compressor: DynamicsCompressorNode | null = null;

  // Earphone & AirPods Acoustic Compensation DSP Nodes
  private currentEarphoneProfile: EarphoneProfileConfig = EARPHONE_PROFILES.airpods_tws;
  private earphoneSealFilter: BiquadFilterNode | null = null;
  private earphoneMudFilter: BiquadFilterNode | null = null;
  private earphoneDeSibilanceFilter: BiquadFilterNode | null = null;
  private earphoneAirFilter: BiquadFilterNode | null = null;

  // Binaural Crossfeed Matrix Nodes (Bauer / Chu Model for Out-of-Head Soundstage)
  private crossfeedSplitter: ChannelSplitterNode | null = null;
  private crossfeedMerger: ChannelMergerNode | null = null;
  private crossfeedDelayL: DelayNode | null = null;
  private crossfeedDelayR: DelayNode | null = null;
  private crossfeedFilterL: BiquadFilterNode | null = null;
  private crossfeedFilterR: BiquadFilterNode | null = null;
  private crossfeedGainL: GainNode | null = null;
  private crossfeedGainR: GainNode | null = null;
  private directGainL: GainNode | null = null;
  private directGainR: GainNode | null = null;

  // Earphone Hearing Safety Brickwall Limiter
  private earphoneLimiter: DynamicsCompressorNode | null = null;

  // Audio Sources
  private audioElement: HTMLAudioElement | null = null;
  private audioFileUrl: string | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private systemStream: MediaStream | null = null;
  private systemSource: MediaStreamAudioSourceNode | null = null;

  // Source & Monitor State
  private activeSourceType: AudioSourceType = 'demo';
  private activeSourceName = 'Cinematic Trailer';
  private isMonitorEnabled = true;

  // Synthetic Music Engine
  private synthInterval: number | null = null;
  private synthStep = 0;
  private isPlayingSynth = false;
  private currentTrackId = 'cinematic_trailer';

  // State
  private currentProfile: AudioProfileConfig = AUDIO_PROFILES.balanced;
  private isTransitioning = false;
  private transitionProgress = 1.0;
  private transitionTimeout: number | null = null;
  private fadeDurationMs = 380; // Smooth transition fade window
  private isMuted = false;
  private volume = 0.85;

  // 9-Band Equalizer Nodes & State (63, 125, 250, 500, 1k, 2k, 4k, 8k, 16k)
  private eq9Filters: BiquadFilterNode[] = [];
  private eq9Values: number[] = [3, 4, 2, 5, 3, 2, 0, 6, 6];
  private currentEqPresetId: EqPresetId = 'custom';

  // Audio Enhancer Core Logic State (Android Speaker / Bluetooth Earphones)
  private isAudioEnhancerActive = true;
  private outputDeviceMode: OutputDeviceMode = 'earphones';

  // Stereo Input Upmixer Node (guarantees true 2-channel stereo for all inputs)
  private stereoInputNode: GainNode | null = null;
  private continuousSourceNode: AudioNode | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  // Speaker Anti-Telephony & Acoustic Tuning Nodes
  private speakerHighPassFilter: BiquadFilterNode | null = null;
  private speakerResonanceNotchFilter: BiquadFilterNode | null = null;
  private speakerPresenceFilter: BiquadFilterNode | null = null;

  // Listeners
  private onMetricsUpdate?: (metrics: InstrumentMetrics) => void;
  private onProfileTransition?: (profile: AudioProfileConfig, isTransitioning: boolean) => void;
  private onSourceChange?: (source: AudioSourceType, name: string) => void;
  private onMonitorChange?: (enabled: boolean) => void;
  private onPlaybackEnd?: () => void;
  private onEarphoneProfileChange?: (profile: EarphoneProfileConfig) => void;
  private onEq9Change?: (values: number[], preset: EqPresetId) => void;
  private onEnhancerChange?: (active: boolean, mode: OutputDeviceMode) => void;
  private animFrameId: number | null = null;
  private analysisBuffer: Uint8Array | null = null;


  public init() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtxClass({
      latencyHint: 'playback', // Enforce high-fidelity media profile on Android, NOT voice call SCO!
    });

    // Setup 9-Band EQ Filters (63Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz)
    this.eq9Filters = EQ_FREQUENCIES.map((freq, idx) => {
      const filter = this.ctx!.createBiquadFilter();
      if (idx === 0) {
        filter.type = 'lowshelf';
      } else if (idx === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.414;
      }
      filter.frequency.value = freq;
      filter.gain.value = this.eq9Values[idx] ?? 0;
      filter.channelCount = 2;
      filter.channelCountMode = 'explicit';
      filter.channelInterpretation = 'speakers';
      return filter;
    });

    // Chain the 9 EQ filters in series
    for (let i = 0; i < this.eq9Filters.length - 1; i++) {
      this.eq9Filters[i].connect(this.eq9Filters[i + 1]);
    }

    // Connect Stereo Input Node to the 9-band EQ
    this.stereoInputNode = this.ctx.createGain();
    this.stereoInputNode.gain.value = 1.0;
    this.stereoInputNode.channelCount = 2;
    this.stereoInputNode.channelCountMode = 'explicit';
    this.stereoInputNode.channelInterpretation = 'speakers';
    this.stereoInputNode.connect(this.eq9Filters[0]);

    // Speaker Anti-Telephony & Acoustic Tuning Nodes
    this.speakerHighPassFilter = this.ctx.createBiquadFilter();
    this.speakerHighPassFilter.type = 'highpass';
    this.speakerHighPassFilter.frequency.value = 20;

    this.speakerResonanceNotchFilter = this.ctx.createBiquadFilter();
    this.speakerResonanceNotchFilter.type = 'peaking';
    this.speakerResonanceNotchFilter.frequency.value = 480;
    this.speakerResonanceNotchFilter.Q.value = 2.0;
    this.speakerResonanceNotchFilter.gain.value = 0;

    this.speakerPresenceFilter = this.ctx.createBiquadFilter();
    this.speakerPresenceFilter.type = 'peaking';
    this.speakerPresenceFilter.frequency.value = 2800;
    this.speakerPresenceFilter.Q.value = 1.4;
    this.speakerPresenceFilter.gain.value = 0;

    // Connect 9-Band EQ output into Speaker anti-telephony nodes
    this.eq9Filters[this.eq9Filters.length - 1].connect(this.speakerHighPassFilter);
    this.speakerHighPassFilter.connect(this.speakerResonanceNotchFilter);
    this.speakerResonanceNotchFilter.connect(this.speakerPresenceFilter);

    // Setup Legacy/Adaptive EQ filters
    this.subBassFilter = this.ctx.createBiquadFilter();
    this.subBassFilter.type = 'lowshelf';
    this.subBassFilter.frequency.value = 80;

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'peaking';
    this.bassFilter.frequency.value = 240;
    this.bassFilter.Q.value = 1.1;

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1100;
    this.midFilter.Q.value = 1.2;

    this.highMidFilter = this.ctx.createBiquadFilter();
    this.highMidFilter.type = 'peaking';
    this.highMidFilter.frequency.value = 3400;
    this.highMidFilter.Q.value = 1.3;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 9500;

    this.transientSharpener = this.ctx.createBiquadFilter();
    this.transientSharpener.type = 'peaking';
    this.transientSharpener.frequency.value = 4200;
    this.transientSharpener.Q.value = 2.0;
    this.transientSharpener.gain.value = 0;

    // Connect speakerPresenceFilter to subBassFilter
    this.speakerPresenceFilter.connect(this.subBassFilter);

    // Dynamics Compressor (Transparent peak limiter, threshold -2.0dB, ratio 1.5, preserving full EQ dynamics)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -2.0;
    this.compressor.knee.value = 3;
    this.compressor.ratio.value = 1.5;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.1;

    // Gains & Analyser
    this.transitionGain = this.ctx.createGain();
    this.transitionGain.gain.value = 1.0;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.82;

    // Earphone & AirPods Acoustic Compensation Nodes
    this.earphoneSealFilter = this.ctx.createBiquadFilter();
    this.earphoneSealFilter.type = 'lowshelf';
    this.earphoneSealFilter.frequency.value = 55;

    this.earphoneMudFilter = this.ctx.createBiquadFilter();
    this.earphoneMudFilter.type = 'peaking';
    this.earphoneMudFilter.frequency.value = 280;
    this.earphoneMudFilter.Q.value = 1.2;

    this.earphoneDeSibilanceFilter = this.ctx.createBiquadFilter();
    this.earphoneDeSibilanceFilter.type = 'peaking';
    this.earphoneDeSibilanceFilter.frequency.value = 6800;
    this.earphoneDeSibilanceFilter.Q.value = 3.5;

    this.earphoneAirFilter = this.ctx.createBiquadFilter();
    this.earphoneAirFilter.type = 'highshelf';
    this.earphoneAirFilter.frequency.value = 11000;

    // Binaural Crossfeed Matrix (Natural Room / Out-of-Head Soundstage)
    this.crossfeedSplitter = this.ctx.createChannelSplitter(2);
    this.crossfeedMerger = this.ctx.createChannelMerger(2);

    this.directGainL = this.ctx.createGain();
    this.directGainR = this.ctx.createGain();
    this.directGainL.gain.value = 1.0;
    this.directGainR.gain.value = 1.0;

    this.crossfeedDelayL = this.ctx.createDelay(0.01);
    this.crossfeedDelayR = this.ctx.createDelay(0.01);
    this.crossfeedDelayL.delayTime.value = 0.0003; // ~300 microseconds ITD
    this.crossfeedDelayR.delayTime.value = 0.0003;

    this.crossfeedFilterL = this.ctx.createBiquadFilter();
    this.crossfeedFilterR = this.ctx.createBiquadFilter();
    this.crossfeedFilterL.type = 'lowpass';
    this.crossfeedFilterR.type = 'lowpass';
    this.crossfeedFilterL.frequency.value = 750;
    this.crossfeedFilterR.frequency.value = 750;
    this.crossfeedFilterL.Q.value = 0.707;
    this.crossfeedFilterR.Q.value = 0.707;

    this.crossfeedGainL = this.ctx.createGain();
    this.crossfeedGainR = this.ctx.createGain();
    this.crossfeedGainL.gain.value = 0;
    this.crossfeedGainR.gain.value = 0;

    // Direct connections
    this.crossfeedSplitter.connect(this.directGainL, 0);
    this.directGainL.connect(this.crossfeedMerger, 0, 0);

    this.crossfeedSplitter.connect(this.directGainR, 1);
    this.directGainR.connect(this.crossfeedMerger, 0, 1);

    // Cross connections (Left to Right ear, Right to Left ear)
    this.crossfeedSplitter.connect(this.crossfeedDelayL, 0);
    this.crossfeedDelayL.connect(this.crossfeedFilterL);
    this.crossfeedFilterL.connect(this.crossfeedGainL);
    this.crossfeedGainL.connect(this.crossfeedMerger, 0, 1);

    this.crossfeedSplitter.connect(this.crossfeedDelayR, 1);
    this.crossfeedDelayR.connect(this.crossfeedFilterR);
    this.crossfeedFilterR.connect(this.crossfeedGainR);
    this.crossfeedGainR.connect(this.crossfeedMerger, 0, 0);

    // Earphone Hearing Safety Brickwall Limiter (prevents clipping with ratio 4 at -0.5dB)
    this.earphoneLimiter = this.ctx.createDynamicsCompressor();
    this.earphoneLimiter.threshold.value = -0.5;
    this.earphoneLimiter.knee.value = 1.0;
    this.earphoneLimiter.ratio.value = 4.0;
    this.earphoneLimiter.attack.value = 0.001;
    this.earphoneLimiter.release.value = 0.05;

    // Chain nodes:
    this.subBassFilter.channelCount = 2;
    this.subBassFilter.channelCountMode = 'explicit';
    this.subBassFilter.channelInterpretation = 'speakers';

    this.masterGain.channelCount = 2;
    this.masterGain.channelCountMode = 'explicit';
    this.masterGain.channelInterpretation = 'speakers';

    this.earphoneAirFilter.channelCount = 2;
    this.earphoneAirFilter.channelCountMode = 'explicit';
    this.earphoneAirFilter.channelInterpretation = 'speakers';

    this.subBassFilter.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.highMidFilter);
    this.highMidFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.transientSharpener);
    this.transientSharpener.connect(this.compressor);
    this.compressor.connect(this.transitionGain);
    this.transitionGain.connect(this.analyser);
    this.analyser.connect(this.masterGain);

    // Connect masterGain to Earphone Acoustic Compensation & Crossfeed:
    this.masterGain.connect(this.earphoneSealFilter);
    this.earphoneSealFilter.connect(this.earphoneMudFilter);
    this.earphoneMudFilter.connect(this.earphoneDeSibilanceFilter);
    this.earphoneDeSibilanceFilter.connect(this.earphoneAirFilter);
    this.earphoneAirFilter.connect(this.crossfeedSplitter);

    this.crossfeedMerger.connect(this.earphoneLimiter);
    this.earphoneLimiter.connect(this.ctx.destination);

    // Apply baseline balanced profile
    this.applyProfileDirect(AUDIO_PROFILES.balanced);

    // Apply default audio enhancer parameters
    this.applyEnhancerParameters();

    // Start real-time analysis loop
    this.startAnalysisLoop();
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getInputNode(): AudioNode | null {
    if (!this.ctx) {
      this.init();
    }
    if (this.stereoInputNode) {
      return this.stereoInputNode;
    }
    if (this.eq9Filters && this.eq9Filters.length > 0) {
      return this.eq9Filters[0];
    }
    return this.subBassFilter;
  }


  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getCurrentProfile(): AudioProfileConfig {
    return this.currentProfile;
  }

  public setCallbacks(
    onMetrics: (metrics: InstrumentMetrics) => void,
    onProfile: (profile: AudioProfileConfig, isTransitioning: boolean) => void,
    onSourceChange?: (source: AudioSourceType, name: string) => void,
    onMonitorChange?: (enabled: boolean) => void,
    onPlaybackEnd?: () => void
  ) {
    this.onMetricsUpdate = onMetrics;
    this.onProfileTransition = onProfile;
    if (onSourceChange) {
      this.onSourceChange = onSourceChange;
    }
    if (onMonitorChange) {
      this.onMonitorChange = onMonitorChange;
    }
    if (onPlaybackEnd) {
      this.onPlaybackEnd = onPlaybackEnd;
    }
  }

  // --- 9-Band Equalizer Methods ---
  public setBandValue(index: number, gainDb: number) {
    if (index < 0 || index >= this.eq9Values.length) return;
    const clamped = Math.max(-10, Math.min(10, Math.round(gainDb)));
    this.eq9Values[index] = clamped;
    this.currentEqPresetId = 'custom';
    if (!this.ctx) this.init();
    if (this.ctx && this.eq9Filters[index]) {
      const now = this.ctx.currentTime;
      this.eq9Filters[index].gain.cancelScheduledValues(now);
      this.eq9Filters[index].gain.linearRampToValueAtTime(clamped, now + 0.03);
    }
    this.onEq9Change?.([...this.eq9Values], this.currentEqPresetId);
  }

  public set9BandValues(values: number[], presetId: EqPresetId = 'custom') {
    this.eq9Values = values.map((v) => Math.max(-10, Math.min(10, Math.round(v))));
    this.currentEqPresetId = presetId;
    if (!this.ctx) this.init();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.eq9Filters.forEach((filter, idx) => {
        if (filter) {
          filter.gain.cancelScheduledValues(now);
          filter.gain.linearRampToValueAtTime(this.eq9Values[idx] ?? 0, now + 0.03);
        }
      });
    }
    this.onEq9Change?.([...this.eq9Values], this.currentEqPresetId);
  }

  public setEqPreset(presetId: EqPresetId) {
    const preset = EQ_9_PRESETS[presetId];
    if (preset) {
      this.set9BandValues(preset.values, presetId);
    }
  }

  public get9BandValues(): number[] {
    return [...this.eq9Values];
  }

  public getCurrentEqPresetId(): EqPresetId {
    return this.currentEqPresetId;
  }

  public setOnEq9Change(cb: (values: number[], preset: EqPresetId) => void) {
    this.onEq9Change = cb;
  }

  // --- Audio Enhancer Core Logic Methods ---
  public setAudioEnhancerActive(active: boolean) {
    this.isAudioEnhancerActive = active;
    this.applyEnhancerParameters();
    this.onEnhancerChange?.(this.isAudioEnhancerActive, this.outputDeviceMode);
  }

  public isAudioEnhancerActiveState(): boolean {
    return this.isAudioEnhancerActive;
  }

  public setOutputDeviceMode(mode: OutputDeviceMode) {
    this.outputDeviceMode = mode;
    this.applyEnhancerParameters();
    this.onEnhancerChange?.(this.isAudioEnhancerActive, this.outputDeviceMode);
  }

  public getOutputDeviceMode(): OutputDeviceMode {
    return this.outputDeviceMode;
  }

  public setOnEnhancerChange(cb: (active: boolean, mode: OutputDeviceMode) => void) {
    this.onEnhancerChange = cb;
  }

  public applyEnhancerParameters() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (!this.isAudioEnhancerActive) {
      // Flat transparent bypass when Audio Enhancer is OFF
      if (this.crossfeedGainL && this.crossfeedGainR) {
        this.crossfeedGainL.gain.cancelScheduledValues(now);
        this.crossfeedGainL.gain.linearRampToValueAtTime(0, now + 0.04);
        this.crossfeedGainR.gain.cancelScheduledValues(now);
        this.crossfeedGainR.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.earphoneSealFilter) {
        this.earphoneSealFilter.gain.cancelScheduledValues(now);
        this.earphoneSealFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.earphoneMudFilter) {
        this.earphoneMudFilter.gain.cancelScheduledValues(now);
        this.earphoneMudFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.earphoneDeSibilanceFilter) {
        this.earphoneDeSibilanceFilter.gain.cancelScheduledValues(now);
        this.earphoneDeSibilanceFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.earphoneAirFilter) {
        this.earphoneAirFilter.gain.cancelScheduledValues(now);
        this.earphoneAirFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.speakerHighPassFilter) {
        this.speakerHighPassFilter.frequency.cancelScheduledValues(now);
        this.speakerHighPassFilter.frequency.linearRampToValueAtTime(20, now + 0.04);
      }
      if (this.speakerResonanceNotchFilter) {
        this.speakerResonanceNotchFilter.gain.cancelScheduledValues(now);
        this.speakerResonanceNotchFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.speakerPresenceFilter) {
        this.speakerPresenceFilter.gain.cancelScheduledValues(now);
        this.speakerPresenceFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      return;
    }

    // Audio Enhancer is ACTIVE:
    if (this.outputDeviceMode === 'earphones') {
      // Bluetooth Earphones Mode:
      // 1. Binaural room crossfeed (eliminates claustrophobic mono in-head voice message effect)
      if (this.crossfeedGainL && this.crossfeedGainR) {
        this.crossfeedGainL.gain.cancelScheduledValues(now);
        this.crossfeedGainL.gain.linearRampToValueAtTime(0.32, now + 0.04);
        this.crossfeedGainR.gain.cancelScheduledValues(now);
        this.crossfeedGainR.gain.linearRampToValueAtTime(0.32, now + 0.04);
      }
      // 2. Anti-sibilance for Bluetooth compression artifacts
      if (this.earphoneDeSibilanceFilter) {
        this.earphoneDeSibilanceFilter.frequency.setValueAtTime(6500, now);
        this.earphoneDeSibilanceFilter.gain.cancelScheduledValues(now);
        this.earphoneDeSibilanceFilter.gain.linearRampToValueAtTime(-2.5, now + 0.04);
      }
      // 3. Sub-bass & Low-end Acoustic Seal Compensation (+6.5 dB rich low-shelf at 105Hz)
      if (this.earphoneSealFilter) {
        this.earphoneSealFilter.frequency.setValueAtTime(105, now);
        this.earphoneSealFilter.gain.cancelScheduledValues(now);
        this.earphoneSealFilter.gain.linearRampToValueAtTime(6.5, now + 0.04);
      }
      // 4. Mud notch (gentle -1.0dB trim to clean boxiness without gutting bass body)
      if (this.earphoneMudFilter) {
        this.earphoneMudFilter.frequency.setValueAtTime(260, now);
        this.earphoneMudFilter.gain.cancelScheduledValues(now);
        this.earphoneMudFilter.gain.linearRampToValueAtTime(-1.0, now + 0.04);
      }
      // 5. Air sparkle (+2.5 dB shimmer at 11kHz)
      if (this.earphoneAirFilter) {
        this.earphoneAirFilter.frequency.setValueAtTime(11000, now);
        this.earphoneAirFilter.gain.cancelScheduledValues(now);
        this.earphoneAirFilter.gain.linearRampToValueAtTime(2.5, now + 0.04);
      }
      // Preserve full sub-bass down to 20Hz
      if (this.speakerHighPassFilter) {
        this.speakerHighPassFilter.frequency.cancelScheduledValues(now);
        this.speakerHighPassFilter.frequency.linearRampToValueAtTime(20, now + 0.04);
      }
      if (this.speakerResonanceNotchFilter) {
        this.speakerResonanceNotchFilter.gain.cancelScheduledValues(now);
        this.speakerResonanceNotchFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.speakerPresenceFilter) {
        this.speakerPresenceFilter.gain.cancelScheduledValues(now);
        this.speakerPresenceFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
    } else {
      // Phone Speaker Mode:
      // 1. Bypass crossfeed
      if (this.crossfeedGainL && this.crossfeedGainR) {
        this.crossfeedGainL.gain.cancelScheduledValues(now);
        this.crossfeedGainL.gain.linearRampToValueAtTime(0, now + 0.04);
        this.crossfeedGainR.gain.cancelScheduledValues(now);
        this.crossfeedGainR.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      // 2. High-pass filter at 35Hz: protects speaker drivers from sub-audible DC rumble while keeping ALL audible sub-bass & kick drums!
      if (this.speakerHighPassFilter) {
        this.speakerHighPassFilter.frequency.cancelScheduledValues(now);
        this.speakerHighPassFilter.frequency.linearRampToValueAtTime(35, now + 0.04);
      }
      // 3. Notch out 480Hz plastic phone chassis resonance (-2.0 dB)
      if (this.speakerResonanceNotchFilter) {
        this.speakerResonanceNotchFilter.frequency.setValueAtTime(480, now);
        this.speakerResonanceNotchFilter.gain.cancelScheduledValues(now);
        this.speakerResonanceNotchFilter.gain.linearRampToValueAtTime(-2.0, now + 0.04);
      }
      // 4. Vocal clarity & dialogue presence (+2.5 dB at 2800Hz)
      if (this.speakerPresenceFilter) {
        this.speakerPresenceFilter.frequency.setValueAtTime(2800, now);
        this.speakerPresenceFilter.gain.cancelScheduledValues(now);
        this.speakerPresenceFilter.gain.linearRampToValueAtTime(2.5, now + 0.04);
      }
      // 5. Punchy Sub-bass & Bass Boost (+6.5 dB low-shelf at 95Hz)
      if (this.earphoneSealFilter) {
        this.earphoneSealFilter.frequency.setValueAtTime(95, now);
        this.earphoneSealFilter.gain.cancelScheduledValues(now);
        this.earphoneSealFilter.gain.linearRampToValueAtTime(6.5, now + 0.04);
      }
      if (this.earphoneMudFilter) {
        this.earphoneMudFilter.gain.cancelScheduledValues(now);
        this.earphoneMudFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.earphoneDeSibilanceFilter) {
        this.earphoneDeSibilanceFilter.gain.cancelScheduledValues(now);
        this.earphoneDeSibilanceFilter.gain.linearRampToValueAtTime(0, now + 0.04);
      }
      if (this.earphoneAirFilter) {
        this.earphoneAirFilter.frequency.setValueAtTime(8000, now);
        this.earphoneAirFilter.gain.cancelScheduledValues(now);
        this.earphoneAirFilter.gain.linearRampToValueAtTime(1.5, now + 0.04);
      }
    }
  }


  // Smooth Crossfade between sound profiles
  public setProfile(profileId: AudioProfileId, userRequested = false): boolean {
    const targetProfile = AUDIO_PROFILES[profileId];
    if (!targetProfile) return false;
    if (this.currentProfile.id === profileId && !userRequested) return false;

    if (!this.ctx) {
      this.init();
    }
    this.resume();

    const now = this.ctx!.currentTime;
    const fadeDurationSec = this.fadeDurationMs / 1000;
    const halfFade = fadeDurationSec / 2;

    this.isTransitioning = true;
    if (this.onProfileTransition) {
      this.onProfileTransition(targetProfile, true);
    }

    // Smooth dip & rise crossfade to prevent pops or abrupt frequency cuts
    if (this.transitionGain) {
      this.transitionGain.gain.cancelScheduledValues(now);
      this.transitionGain.gain.setValueAtTime(this.transitionGain.gain.value, now);
      // Soft dip to 0.78 at midpoint, then smooth return to 1.0
      this.transitionGain.gain.linearRampToValueAtTime(0.82, now + halfFade);
      this.transitionGain.gain.linearRampToValueAtTime(1.0, now + fadeDurationSec);
    }

    // Smoothly interpolate EQ filter gains
    if (this.subBassFilter) {
      this.subBassFilter.gain.cancelScheduledValues(now);
      this.subBassFilter.gain.linearRampToValueAtTime(targetProfile.eq.subBass, now + fadeDurationSec);
    }
    if (this.bassFilter) {
      this.bassFilter.gain.cancelScheduledValues(now);
      this.bassFilter.gain.linearRampToValueAtTime(targetProfile.eq.bass, now + fadeDurationSec);
    }
    if (this.midFilter) {
      this.midFilter.gain.cancelScheduledValues(now);
      this.midFilter.gain.linearRampToValueAtTime(targetProfile.eq.mids, now + fadeDurationSec);
    }
    if (this.highMidFilter) {
      this.highMidFilter.gain.cancelScheduledValues(now);
      this.highMidFilter.gain.linearRampToValueAtTime(targetProfile.eq.highMids, now + fadeDurationSec);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.cancelScheduledValues(now);
      this.trebleFilter.gain.linearRampToValueAtTime(targetProfile.eq.treble, now + fadeDurationSec);
    }

    // Dynamic transient sharpener boost
    if (this.transientSharpener) {
      const sharpBoost = (targetProfile.sharpening / 100) * 5.5;
      this.transientSharpener.gain.cancelScheduledValues(now);
      this.transientSharpener.gain.linearRampToValueAtTime(sharpBoost, now + fadeDurationSec);
    }

    // Compressor envelope interpolation
    if (this.compressor) {
      this.compressor.threshold.cancelScheduledValues(now);
      this.compressor.threshold.linearRampToValueAtTime(targetProfile.compression.threshold, now + fadeDurationSec);

      this.compressor.ratio.cancelScheduledValues(now);
      this.compressor.ratio.linearRampToValueAtTime(targetProfile.compression.ratio, now + fadeDurationSec);

      this.compressor.attack.cancelScheduledValues(now);
      this.compressor.attack.linearRampToValueAtTime(targetProfile.compression.attack, now + fadeDurationSec);

      this.compressor.release.cancelScheduledValues(now);
      this.compressor.release.linearRampToValueAtTime(targetProfile.compression.release, now + fadeDurationSec);
    }

    this.currentProfile = targetProfile;

    // Clear any pending transition timeout to prevent race condition when quickly selecting presets
    if (this.transitionTimeout) {
      window.clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }

    // Finish transition state after duration
    this.transitionTimeout = window.setTimeout(() => {
      this.isTransitioning = false;
      this.transitionTimeout = null;
      if (this.onProfileTransition) {
        this.onProfileTransition(this.currentProfile, false);
      }
    }, this.fadeDurationMs);

    return true;
  }

  // Real-time custom EQ band tuning (for interactive curve dragging or sliders)
  public setCustomEqBand(band: keyof AudioProfileConfig['eq'], gain: number, freq?: number) {
    if (!this.ctx) {
      this.init();
    }
    this.resume();
    const clampedGain = Math.max(-12, Math.min(12, gain));
    const now = this.ctx!.currentTime;

    const newEq = { ...this.currentProfile.eq, [band]: clampedGain };

    if (band === 'subBass' && this.subBassFilter) {
      this.subBassFilter.gain.cancelScheduledValues(now);
      this.subBassFilter.gain.setValueAtTime(clampedGain, now);
      if (freq) this.subBassFilter.frequency.setValueAtTime(freq, now);
    } else if (band === 'bass' && this.bassFilter) {
      this.bassFilter.gain.cancelScheduledValues(now);
      this.bassFilter.gain.setValueAtTime(clampedGain, now);
      if (freq) this.bassFilter.frequency.setValueAtTime(freq, now);
    } else if (band === 'mids' && this.midFilter) {
      this.midFilter.gain.cancelScheduledValues(now);
      this.midFilter.gain.setValueAtTime(clampedGain, now);
      if (freq) this.midFilter.frequency.setValueAtTime(freq, now);
    } else if (band === 'highMids' && this.highMidFilter) {
      this.highMidFilter.gain.cancelScheduledValues(now);
      this.highMidFilter.gain.setValueAtTime(clampedGain, now);
      if (freq) this.highMidFilter.frequency.setValueAtTime(freq, now);
    } else if (band === 'treble' && this.trebleFilter) {
      this.trebleFilter.gain.cancelScheduledValues(now);
      this.trebleFilter.gain.setValueAtTime(clampedGain, now);
      if (freq) this.trebleFilter.frequency.setValueAtTime(freq, now);
    }

    const customProfile: AudioProfileConfig = {
      ...this.currentProfile,
      id: 'custom',
      name: 'Custom Curve',
      badge: 'USER PARAMETRIC TUNED',
      description: 'Custom tuned parametric frequency curve tailored via the interactive graph.',
      accentColor: '#ec4899',
      glowClass: 'shadow-[0_0_25px_rgba(236,72,153,0.35)] border-pink-500/60',
      eq: newEq,
    };

    this.currentProfile = customProfile;
    if (this.onProfileTransition) {
      this.onProfileTransition(customProfile, false);
    }
  }

  // Set all 5 EQ bands at once with smooth ramping
  public setCustomEq(eq: AudioProfileConfig['eq']) {
    if (!this.ctx) {
      this.init();
    }
    this.resume();
    const now = this.ctx!.currentTime;
    const rampTime = now + 0.08;

    if (this.subBassFilter) {
      this.subBassFilter.gain.cancelScheduledValues(now);
      this.subBassFilter.gain.linearRampToValueAtTime(eq.subBass, rampTime);
    }
    if (this.bassFilter) {
      this.bassFilter.gain.cancelScheduledValues(now);
      this.bassFilter.gain.linearRampToValueAtTime(eq.bass, rampTime);
    }
    if (this.midFilter) {
      this.midFilter.gain.cancelScheduledValues(now);
      this.midFilter.gain.linearRampToValueAtTime(eq.mids, rampTime);
    }
    if (this.highMidFilter) {
      this.highMidFilter.gain.cancelScheduledValues(now);
      this.highMidFilter.gain.linearRampToValueAtTime(eq.highMids, rampTime);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.cancelScheduledValues(now);
      this.trebleFilter.gain.linearRampToValueAtTime(eq.treble, rampTime);
    }

    const customProfile: AudioProfileConfig = {
      ...this.currentProfile,
      id: 'custom',
      name: 'Custom Curve',
      badge: 'USER PARAMETRIC TUNED',
      description: 'Custom tuned parametric frequency curve tailored via the interactive graph.',
      accentColor: '#ec4899',
      glowClass: 'shadow-[0_0_25px_rgba(236,72,153,0.35)] border-pink-500/60',
      eq: { ...eq },
    };

    this.currentProfile = customProfile;
    if (this.onProfileTransition) {
      this.onProfileTransition(customProfile, false);
    }
  }

  // Calculate actual combined frequency response curve in dB across given frequencies
  public getCombinedFrequencyResponse(frequencies: Float32Array): Float32Array {
    const len = frequencies.length;
    const totalDb = new Float32Array(len);

    if (
      !this.ctx ||
      !this.subBassFilter ||
      !this.bassFilter ||
      !this.midFilter ||
      !this.highMidFilter ||
      !this.trebleFilter
    ) {
      // Return simulated curve based on currentProfile if audio context not yet initialized
      const eq = this.currentProfile.eq;
      for (let i = 0; i < len; i++) {
        const f = frequencies[i];
        // Mathematical bell and shelf approximation
        const subContrib = eq.subBass / (1 + Math.pow(f / 80, 2));
        const bassContrib = eq.bass * Math.exp(-Math.pow(Math.log2(f / 240) * 1.5, 2));
        const midContrib = eq.mids * Math.exp(-Math.pow(Math.log2(f / 1100) * 1.4, 2));
        const highMidContrib = eq.highMids * Math.exp(-Math.pow(Math.log2(f / 3400) * 1.4, 2));
        const trebleContrib = eq.treble / (1 + Math.pow(9500 / f, 2));
        totalDb[i] = subContrib + bassContrib + midContrib + highMidContrib + trebleContrib;
      }
      return totalDb;
    }

    const mag1 = new Float32Array(len);
    const phase1 = new Float32Array(len);
    const mag2 = new Float32Array(len);
    const phase2 = new Float32Array(len);
    const mag3 = new Float32Array(len);
    const phase3 = new Float32Array(len);
    const mag4 = new Float32Array(len);
    const phase4 = new Float32Array(len);
    const mag5 = new Float32Array(len);
    const phase5 = new Float32Array(len);

    const freqArray = frequencies as unknown as Float32Array<ArrayBuffer>;
    this.subBassFilter.getFrequencyResponse(freqArray, mag1 as any, phase1 as any);
    this.bassFilter.getFrequencyResponse(freqArray, mag2 as any, phase2 as any);
    this.midFilter.getFrequencyResponse(freqArray, mag3 as any, phase3 as any);
    this.highMidFilter.getFrequencyResponse(freqArray, mag4 as any, phase4 as any);
    this.trebleFilter.getFrequencyResponse(freqArray, mag5 as any, phase5 as any);

    for (let i = 0; i < len; i++) {
      const combinedMag = mag1[i] * mag2[i] * mag3[i] * mag4[i] * mag5[i];
      totalDb[i] = 20 * Math.log10(Math.max(0.0001, combinedMag));
    }

    return totalDb;
  }

  public getFilterFrequencies(): { subBass: number; bass: number; mids: number; highMids: number; treble: number } {
    return {
      subBass: this.subBassFilter?.frequency.value ?? 80,
      bass: this.bassFilter?.frequency.value ?? 240,
      mids: this.midFilter?.frequency.value ?? 1100,
      highMids: this.highMidFilter?.frequency.value ?? 3400,
      treble: this.trebleFilter?.frequency.value ?? 9500,
    };
  }

  private applyProfileDirect(profile: AudioProfileConfig) {
    if (!this.ctx) return;
    if (this.subBassFilter) this.subBassFilter.gain.value = profile.eq.subBass;
    if (this.bassFilter) this.bassFilter.gain.value = profile.eq.bass;
    if (this.midFilter) this.midFilter.gain.value = profile.eq.mids;
    if (this.highMidFilter) this.highMidFilter.gain.value = profile.eq.highMids;
    if (this.trebleFilter) this.trebleFilter.gain.value = profile.eq.treble;
    if (this.transientSharpener) this.transientSharpener.gain.value = (profile.sharpening / 100) * 5.5;
    if (this.compressor) {
      this.compressor.threshold.value = profile.compression.threshold;
      this.compressor.ratio.value = profile.compression.ratio;
      this.compressor.attack.value = profile.compression.attack;
      this.compressor.release.value = profile.compression.release;
    }
  }

  // --- Earphone & AirPods Acoustic Compensation Engine ---
  public applyEarphoneProfileDirect(ep: EarphoneProfileConfig) {
    this.currentEarphoneProfile = { ...ep };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const ramp = 0.05;

    if (this.earphoneSealFilter) {
      this.earphoneSealFilter.gain.setTargetAtTime(ep.bassSealComp, t, ramp);
    }
    if (this.earphoneMudFilter) {
      this.earphoneMudFilter.gain.setTargetAtTime(ep.harmanMidTrim, t, ramp);
    }
    if (this.earphoneDeSibilanceFilter) {
      const g = ep.deSibilanceEnabled ? ep.deSibilanceGain : 0;
      this.earphoneDeSibilanceFilter.gain.setTargetAtTime(g, t, ramp);
    }
    if (this.earphoneAirFilter) {
      this.earphoneAirFilter.gain.setTargetAtTime(ep.trebleAirBoost, t, ramp);
    }
    const crossfeedGain = ep.crossfeedAmount * 0.35;
    if (this.crossfeedGainL && this.crossfeedGainR) {
      this.crossfeedGainL.gain.setTargetAtTime(crossfeedGain, t, ramp);
      this.crossfeedGainR.gain.setTargetAtTime(crossfeedGain, t, ramp);
    }
    if (this.earphoneLimiter) {
      this.earphoneLimiter.threshold.setTargetAtTime(
        ep.safetyLimiterEnabled ? ep.limiterCeilingDb : 0,
        t,
        ramp
      );
      this.earphoneLimiter.ratio.setTargetAtTime(
        ep.safetyLimiterEnabled ? 20 : 1,
        t,
        ramp
      );
    }

    if (this.onEarphoneProfileChange) {
      this.onEarphoneProfileChange(this.currentEarphoneProfile);
    }
  }

  public setEarphoneProfile(profileId: EarphoneTypeId) {
    const ep = EARPHONE_PROFILES[profileId] || EARPHONE_PROFILES.airpods_tws;
    this.applyEarphoneProfileDirect(ep);
  }

  public getEarphoneProfile(): EarphoneProfileConfig {
    return { ...this.currentEarphoneProfile };
  }

  public setCrossfeedAmount(amount: number) {
    const clamped = Math.max(0, Math.min(1.0, amount));
    this.currentEarphoneProfile.crossfeedAmount = clamped;
    if (this.ctx && this.crossfeedGainL && this.crossfeedGainR) {
      const g = clamped * 0.35;
      this.crossfeedGainL.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05);
      this.crossfeedGainR.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05);
    }
    if (this.onEarphoneProfileChange) {
      this.onEarphoneProfileChange(this.currentEarphoneProfile);
    }
  }

  public setDeSibilance(enabled: boolean) {
    this.currentEarphoneProfile.deSibilanceEnabled = enabled;
    if (this.ctx && this.earphoneDeSibilanceFilter) {
      const g = enabled ? this.currentEarphoneProfile.deSibilanceGain : 0;
      this.earphoneDeSibilanceFilter.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05);
    }
    if (this.onEarphoneProfileChange) {
      this.onEarphoneProfileChange(this.currentEarphoneProfile);
    }
  }

  public setBassSealComp(gainDb: number) {
    const clamped = Math.max(-6, Math.min(12, gainDb));
    this.currentEarphoneProfile.bassSealComp = clamped;
    if (this.ctx && this.earphoneSealFilter) {
      this.earphoneSealFilter.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
    if (this.onEarphoneProfileChange) {
      this.onEarphoneProfileChange(this.currentEarphoneProfile);
    }
  }

  public setEarphoneLimiter(enabled: boolean) {
    this.currentEarphoneProfile.safetyLimiterEnabled = enabled;
    if (this.ctx && this.earphoneLimiter) {
      this.earphoneLimiter.threshold.setTargetAtTime(
        enabled ? this.currentEarphoneProfile.limiterCeilingDb : 0,
        this.ctx.currentTime,
        0.05
      );
      this.earphoneLimiter.ratio.setTargetAtTime(
        enabled ? 20 : 1,
        this.ctx.currentTime,
        0.05
      );
    }
    if (this.onEarphoneProfileChange) {
      this.onEarphoneProfileChange(this.currentEarphoneProfile);
    }
  }

  public setOnEarphoneProfileChange(cb: (profile: EarphoneProfileConfig) => void) {
    this.onEarphoneProfileChange = cb;
  }

  // Binaural Spatial Acoustic Test Tone (Plays L -> Center -> R harmonic chime)
  public playSpatialTestChime() {
    this.init();
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Harmonic chime sequence: E5 (Left), B5 (Center with natural crossfeed depth), E6 (Right)
    const tones = [
      { time: now + 0.05, freq: 659.25, pan: -0.9, dur: 0.32 },
      { time: now + 0.45, freq: 987.77, pan: 0.0, dur: 0.42 },
      { time: now + 0.92, freq: 1318.5, pan: 0.9, dur: 0.38 }
    ];

    // If monitor is currently muted (e.g., during live mic mode), temporarily un-attenuate masterGain for the test chime
    if ((!this.isMonitorEnabled || this.isMuted) && this.masterGain) {
      const activeVol = this.volume > 0 ? this.volume : 0.85;
      this.masterGain.gain.setValueAtTime(activeVol, now);
      window.setTimeout(() => {
        if (!this.isMonitorEnabled || this.isMuted) {
          this.updateMasterGain();
        }
      }, 1500);
    }

    tones.forEach((t) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const panner = typeof this.ctx!.createStereoPanner === 'function' ? this.ctx!.createStereoPanner() : null;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, t.time);

      gain.gain.setValueAtTime(0, t.time);
      gain.gain.linearRampToValueAtTime(0.18, t.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t.time + t.dur);

      osc.connect(gain);
      if (panner) {
        panner.pan.setValueAtTime(t.pan, t.time);
        gain.connect(panner);
        panner.connect(this.getInputNode()!);
      } else {
        gain.connect(this.getInputNode()!);
      }

      osc.start(t.time);
      osc.stop(t.time + t.dur + 0.05);
    });
  }

  // Output Device Detection
  public async detectAudioOutputDevices(): Promise<{
    devices: MediaDeviceInfo[];
    suggestedProfile?: EarphoneTypeId;
    activeDeviceLabel?: string;
  }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return { devices: [] };
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const outputs = allDevices.filter((d) => d.kind === 'audiooutput');
      let suggested: EarphoneTypeId | undefined;
      let activeLabel = '';

      for (const dev of outputs) {
        const lbl = dev.label.toLowerCase();
        if (lbl.includes('airpod') || lbl.includes('buds') || lbl.includes('tws') || lbl.includes('bluetooth') || lbl.includes('wf-')) {
          suggested = 'airpods_tws';
          activeLabel = dev.label;
          break;
        } else if (lbl.includes('wh-') || lbl.includes('quietcomfort') || lbl.includes('headphone') || lbl.includes('over-ear')) {
          suggested = 'over_ear';
          activeLabel = dev.label;
          break;
        } else if (lbl.includes('iem') || lbl.includes('earphone') || lbl.includes('earpods') || lbl.includes('wired')) {
          suggested = 'iem_wired';
          activeLabel = dev.label;
          break;
        }
      }

      return {
        devices: outputs,
        suggestedProfile: suggested,
        activeDeviceLabel: activeLabel || outputs[0]?.label || 'System Default Audio Output'
      };
    } catch {
      return { devices: [] };
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.updateMasterGain();
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateMasterGain();
    return this.isMuted;
  }

  public setMonitorOutput(enabled: boolean) {
    this.isMonitorEnabled = enabled;
    this.updateMasterGain();
    if (this.onMonitorChange) {
      this.onMonitorChange(enabled);
    }
  }

  public setOnMonitorChange(cb: (enabled: boolean) => void) {
    this.onMonitorChange = cb;
  }

  public isMonitorOutput(): boolean {
    return this.isMonitorEnabled;
  }

  private updateMasterGain() {
    if (this.masterGain && this.ctx) {
      const targetGain = (this.isMuted || !this.isMonitorEnabled) ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  public setFadeDuration(ms: number) {
    this.fadeDurationMs = Math.max(100, Math.min(1500, ms));
  }

  public getFadeDuration(): number {
    return this.fadeDurationMs;
  }

  public getActiveSourceType(): AudioSourceType {
    return this.activeSourceType;
  }

  public getActiveSourceName(): string {
    return this.activeSourceName;
  }

  // Pink Noise Audio Buffer Generator (Equal energy across all 9 frequency octaves)
  private getPinkNoiseBuffer(): AudioBuffer {
    if (this.pinkNoiseBuffer && this.ctx) return this.pinkNoiseBuffer;
    const sampleRate = this.ctx ? this.ctx.sampleRate : 48000;
    const length = sampleRate * 5; // 5-second seamless loop
    const buffer = this.ctx!.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let ch = 0; ch < 2; ch++) {
      const data = ch === 0 ? left : right;
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.14;
        b6 = white * 0.115926;
      }
    }
    this.pinkNoiseBuffer = buffer;
    return buffer;
  }

  // --- Synthetic Multi-Stem Audio Player ---
  public playTrack(trackId: string) {
    this.init();
    this.resume();
    this.stopPlayback();

    this.currentTrackId = trackId;
    this.activeSourceType = 'demo';
    this.activeSourceName = trackId;
    this.isPlayingSynth = true;
    this.synthStep = 0;
    this.setMonitorOutput(true);

    if (this.onSourceChange) {
      this.onSourceChange('demo', trackId);
    }

    // 1. Pink Noise Calibration Tool (instant audible response for every single EQ band)
    if (trackId === 'pink_noise') {
      const buffer = this.getPinkNoiseBuffer();
      const source = this.ctx!.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.getInputNode()!);
      source.start();
      this.continuousSourceNode = source;
      return;
    }

    // 2. Harmonic Sweep Test Tone (30Hz to 16kHz repeating frequency sweep)
    if (trackId === 'frequency_sweep') {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      gain.gain.value = 0.32;
      osc.type = 'sawtooth';

      const runSweep = () => {
        if (!this.ctx || !this.isPlayingSynth) return;
        const now = this.ctx.currentTime;
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.setValueAtTime(32, now);
        osc.frequency.exponentialRampToValueAtTime(15500, now + 5.0);
      };
      runSweep();
      this.synthInterval = window.setInterval(runSweep, 5200);

      osc.connect(gain);
      gain.connect(this.getInputNode()!);
      osc.start();
      this.continuousSourceNode = osc;
      return;
    }

    // 3. Multi-instrument Procedural Tracks
    const intervalMs = trackId === 'cyberpunk_heavy' ? 130 :
                       trackId === 'future_bass_drop' ? 140 :
                       trackId === 'acoustic_vocal' ? 180 : 200;

    this.synthInterval = window.setInterval(() => {
      this.triggerSynthBeat();
      this.synthStep = (this.synthStep + 1) % 64;
    }, intervalMs);
  }

  public pauseTrack() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.continuousSourceNode) {
      try {
        (this.continuousSourceNode as any).stop?.();
        this.continuousSourceNode.disconnect();
      } catch {
        // ignore
      }
      this.continuousSourceNode = null;
    }
    this.isPlayingSynth = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public stopPlayback() {
    this.pauseTrack();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.disableSystemAudioCapture();
    this.disableLiveMicrophone();
    this.activeSourceType = 'demo';
    this.setMonitorOutput(true);
  }

  public isPlaying(): boolean {
    const isSystemPlaying = Boolean(
      this.systemStream &&
      this.systemStream.active &&
      this.systemStream.getAudioTracks().some((t) => t.readyState === 'live')
    );
    const isMicPlaying = Boolean(
      this.micStream &&
      this.micStream.active &&
      this.micStream.getAudioTracks().some((t) => t.readyState === 'live')
    );
    const isFilePlaying = Boolean(this.audioElement && !this.audioElement.paused);
    return this.isPlayingSynth || isFilePlaying || isSystemPlaying || isMicPlaying;
  }

  public hasLoadedAudioFile(): boolean {
    return Boolean(this.audioElement && this.audioElement.src && this.activeSourceType === 'file');
  }

  public resumeAudioFile(): void {
    if (this.audioElement) {
      this.resume();
      this.audioElement.play().catch((err) => console.warn('Audio resume error:', err));
    }
  }

  // Load custom audio or video file from user upload
  public loadUserAudioFile(file: File): Promise<string> {
    this.init();
    this.resume();
    this.stopPlayback();

    // Revoke previous blob URL to prevent memory leaks
    if (this.audioFileUrl) {
      try {
        URL.revokeObjectURL(this.audioFileUrl);
      } catch {
        // Ignore revoke errors
      }
      this.audioFileUrl = null;
    }

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.audioFileUrl = url;

      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.mediaElementSource = this.ctx!.createMediaElementSource(this.audioElement);
        this.mediaElementSource.connect(this.getInputNode()!);
      }

      this.audioElement.src = url;

      this.audioElement.onended = () => {
        if (this.onPlaybackEnd) {
          this.onPlaybackEnd();
        }
      };

      this.audioElement.oncanplay = () => {
        this.audioElement?.play().catch((err) => console.warn('Autoplay error:', err));
        this.activeSourceType = 'file';
        this.activeSourceName = file.name;
        this.setMonitorOutput(true);
        if (this.onSourceChange) {
          this.onSourceChange('file', file.name);
        }
        resolve(file.name);
      };
      this.audioElement.onerror = (e) => reject(e);
    });
  }

  // Capture System Audio or App Audio from Laptop (Tab / Window / Desktop)
  public async enableSystemAudioCapture(): Promise<{ success: boolean; hasAudio: boolean; error?: string; label?: string }> {
    try {
      this.init();
      this.resume();
      this.stopPlayback();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return {
          success: false,
          hasAudio: false,
          error: 'System / App Audio capture (getDisplayMedia) is not supported in this browser. On mobile devices, use the Live Speaker Listener instead.'
        };
      }

      // Request tab or screen stream with system audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 16,
          height: 16,
          frameRate: 1,
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as any,
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        return {
          success: false,
          hasAudio: false,
          error: 'No audio stream detected! In the sharing dialog, make sure to check "Also share tab audio" (Chrome Tab) or "Share system audio" (Entire Screen).'
        };
      }

      // Stop the video track immediately to conserve memory and battery
      stream.getVideoTracks().forEach((t) => t.stop());

      this.systemStream = stream;
      this.systemSource = this.ctx!.createMediaStreamSource(stream);
      this.systemSource.connect(this.getInputNode()!);
      this.activeSourceType = 'system';
      this.activeSourceName = audioTracks[0].label || 'Laptop / App Audio Stream';
      this.setMonitorOutput(true);

      audioTracks[0].onended = () => {
        this.disableSystemAudioCapture();
        if (this.onSourceChange) {
          this.onSourceChange('demo', 'Demo Audio');
        }
      };

      if (this.onSourceChange) {
        this.onSourceChange('system', this.activeSourceName);
      }

      return {
        success: true,
        hasAudio: true,
        label: this.activeSourceName
      };
    } catch (err: any) {
      console.warn('System audio capture error:', err);
      return {
        success: false,
        hasAudio: false,
        error: err?.name === 'NotAllowedError'
          ? 'Audio capture permission was cancelled or dismissed.'
          : (err?.message || 'Could not capture system audio.')
      };
    }
  }

  public disableSystemAudioCapture() {
    if (this.systemStream) {
      this.systemStream.getTracks().forEach((t) => t.stop());
      this.systemStream = null;
    }
    if (this.systemSource) {
      this.systemSource.disconnect();
      this.systemSource = null;
    }
    if (this.activeSourceType === 'system') {
      this.activeSourceType = 'demo';
      this.activeSourceName = 'Demo Audio';
    }
  }

  // Connect high-fidelity room / speaker listener for mobile phones or laptop speakers
  public async enableLiveMicrophone(muteMonitor = true): Promise<boolean> {
    try {
      this.init();
      this.resume();
      this.stopPlayback();

      this.disableLiveMicrophone();

      // Request studio-fidelity stream without speech degradation filters
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2,
        },
        video: false,
      });

      this.micSource = this.ctx!.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.getInputNode()!);
      this.activeSourceType = 'mic';
      this.activeSourceName = 'Live Speaker / Microphone';

      // Default mute monitor to prevent loud acoustic feedback loop through device speakers
      if (muteMonitor) {
        this.setMonitorOutput(false);
      }

      if (this.onSourceChange) {
        this.onSourceChange('mic', this.activeSourceName);
      }
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      return false;
    }
  }

  public disableLiveMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.activeSourceType === 'mic') {
      this.activeSourceType = 'demo';
      this.activeSourceName = 'Demo Audio';
      this.setMonitorOutput(true);
    }
  }

  // Multi-instrument procedural sound generator (stems: Drums, SubBass, Vocals, Acoustic Strings, Synths)
  private triggerSynthBeat() {
    if (!this.ctx || !this.isPlayingSynth) return;
    const step = this.synthStep;
    const track = this.currentTrackId;

    if (track === 'cinematic_trailer') {
      // 0-15: Tension drone & dialogue/vocal whispers
      // 16-31: Orchestral strings & rising tension
      // 32-63: Massive Heavy percussion slams, sub-bass drops & brass!
      if (step < 16) {
        // Dialogue vocal formant & tension pad
        this.playVocalFormantSynth(220 + (step % 4) * 25, 0.4);
        if (step % 8 === 0) this.playCinematicPad(110, 1.2);
      } else if (step < 32) {
        // Strings & acoustic elements
        this.playStringPluck(330 + (step % 5) * 40, 0.5);
        if (step % 4 === 0) this.playSubBassDrop(65, 0.6);
        if (step % 2 === 0) this.playHiHat(false);
      } else {
        // HEAVY / INTENSE CLIMAX
        this.playKickDrum(true); // Huge sub kick
        this.playSnareImpact(true);
        this.playSubBassDrop(45, 0.85);
        this.playBrassStab(130 + (step % 3) * 30, 0.5);
        this.playHiHat(true);
      }
    } else if (track === 'cyberpunk_heavy') {
      // Relentless heavy drums + aggressive bass + punchy kick
      const isKick = step % 4 === 0 || step % 16 === 10;
      const isSnare = step % 8 === 4;
      if (isKick) this.playKickDrum(true);
      if (isSnare) this.playSnareImpact(true);
      this.playHiHat(step % 2 === 0);
      this.playSynthBass(55 + ((step * 3) % 12) * 5, 0.2);

      // Occasional vocal chop shift around step 32-48
      if (step >= 32 && step <= 48 && step % 4 === 2) {
        this.playVocalFormantSynth(380, 0.35);
      }
    } else if (track === 'acoustic_vocal') {
      // Fingerpicked acoustic guitar + crystal treble harmonics -> vocal shift
      if (step < 24 || step > 48) {
        // Pure acoustic guitar arpeggios
        const freqs = [220, 261.6, 329.6, 392, 440, 523.2];
        const f = freqs[step % freqs.length];
        this.playAcousticGuitarNote(f, 0.6);
        if (step % 8 === 0) this.playSubBassDrop(82, 0.3);
      } else {
        // VOCAL SHIFT (Intimate vocal melody takes lead)
        const vocalNotes = [330, 370, 440, 493, 587, 440];
        const vf = vocalNotes[Math.floor(step / 4) % vocalNotes.length];
        this.playVocalFormantSynth(vf, 0.7);
        if (step % 4 === 0) this.playAcousticGuitarNote(vf / 2, 0.3);
      }
    } else {
      // future_bass_drop:
      if (step < 24) {
        // Treble shimmer chords
        this.playFutureChord([440, 554, 659], 0.4);
        if (step % 4 === 0) this.playHiHat(false);
      } else {
        // HEAVY / PUNCHY DROP!
        this.playKickDrum(true);
        if (step % 8 === 4) this.playSnareImpact(true);
        this.play808Sub(40, 0.75);
        this.playFutureChord([220, 277, 330, 440], 0.5);
      }
    }
  }

  // --- Real Acoustic / Instrument Synthesizer Nodes ---
  private playKickDrum(heavy = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(heavy ? 160 : 120, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 38 : 45, now + 0.08);

    gain.gain.setValueAtTime(heavy ? 1.0 : 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.35 : 0.22));

    osc.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + (heavy ? 0.35 : 0.22));
  }

  private playSnareImpact(sharp = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = sharp ? 1400 : 900;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(sharp ? 0.8 : 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.getInputNode()!);

    noise.start(now);
  }

  private playHiHat(open = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 8500;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (open ? 0.15 : 0.05));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + (open ? 0.16 : 0.06));
  }

  private playSubBassDrop(freq: number, duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 0.8, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + duration);
  }

  private play808Sub(freq: number, duration: number) {
    this.playSubBassDrop(freq, duration);
  }

  private playSynthBass(freq: number, duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.value = 3.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Vocal formant simulator (formant filters modeling human vowel timbre)
  private playVocalFormantSynth(freq: number, duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    // Vocal vowel formant filters (A/O vowel resonance around 800Hz & 2400Hz)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 850;
    f1.Q.value = 4.0;

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 2300;
    f2.Q.value = 5.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(gain);
    f2.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playAcousticGuitarNote(freq: number, duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playStringPluck(freq: number, duration: number) {
    this.playAcousticGuitarNote(freq, duration);
  }

  private playCinematicPad(freq: number, duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playBrassStab(freq: number, duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getInputNode()!);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playFutureChord(freqs: number[], duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getInputNode()!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // --- Real-Time Spectral Analysis & Instrument Detection Loop ---
  private startAnalysisLoop() {
    let lastTime = performance.now();

    const analyze = () => {
      const now = performance.now();
      if (this.analyser && (now - lastTime > 75)) { // update ~13 times per sec
        lastTime = now;
        const bufferLength = this.analyser.frequencyBinCount;
        if (!this.analysisBuffer || this.analysisBuffer.length !== bufferLength) {
          this.analysisBuffer = new Uint8Array(bufferLength);
        }
        const dataArray = this.analysisBuffer;
        this.analyser.getByteFrequencyData(dataArray as any);

        // Analyze frequency spectrum bands:
        // Band 1: Sub & Kick (0-150Hz)
        let subSum = 0;
        let subCount = 0;
        // Band 2: Bassline (150-400Hz)
        let bassSum = 0;
        let bassCount = 0;
        // Band 3: Vocal / Dialogue Core (600-2800Hz)
        let vocalSum = 0;
        let vocalCount = 0;
        // Band 4: Attack Transients & Percussion (2800-6000Hz)
        let transientSum = 0;
        let transientCount = 0;
        // Band 5: Shimmer / Air Strings (6000-14000Hz)
        let shimmerSum = 0;
        let shimmerCount = 0;

        const binWidth = (this.ctx?.sampleRate || 44100) / (bufferLength * 2);

        for (let i = 0; i < bufferLength; i++) {
          const freq = i * binWidth;
          const val = dataArray[i];

          if (freq >= 20 && freq < 150) {
            subSum += val;
            subCount++;
          } else if (freq >= 150 && freq < 450) {
            bassSum += val;
            bassCount++;
          } else if (freq >= 650 && freq < 2800) {
            vocalSum += val;
            vocalCount++;
          } else if (freq >= 2800 && freq < 6000) {
            transientSum += val;
            transientCount++;
          } else if (freq >= 6000 && freq < 14000) {
            shimmerSum += val;
            shimmerCount++;
          }
        }

        const subAvg = subCount ? subSum / subCount / 255 : 0;
        const bassAvg = bassCount ? bassSum / bassCount / 255 : 0;
        const vocalAvg = vocalCount ? vocalSum / vocalCount / 255 : 0;
        const transientAvg = transientCount ? transientSum / transientCount / 255 : 0;
        const shimmerAvg = shimmerCount ? shimmerSum / shimmerCount / 255 : 0;

        // Overall intensity
        const intensity = Math.min(1.0, subAvg * 0.35 + bassAvg * 0.25 + vocalAvg * 0.2 + transientAvg * 0.2);

        // Derive instruments & detection
        const drums = Math.min(1.0, subAvg * 0.7 + transientAvg * 0.5);
        const bass = Math.min(1.0, bassAvg * 0.8 + subAvg * 0.3);
        const vocals = Math.min(1.0, vocalAvg * 1.25);
        const leadGuitarSynths = Math.min(1.0, transientAvg * 0.6 + vocalAvg * 0.4);
        const stringsAcoustic = Math.min(1.0, shimmerAvg * 1.2 + vocalAvg * 0.2);

        const isHeavySection = (subAvg > 0.38 || intensity > 0.52) && drums > 0.45;
        const isVocalShift = vocals > 0.38 && vocals > (drums + 0.08);

        // Target profile recommendation:
        let recProfile: AudioProfileId = 'balanced';
        let explanation = 'Neutral spectral balance detected across musical arrangement.';

        if (isHeavySection) {
          recProfile = 'heavy';
          explanation = 'Heavy musical passage with dominant low-end kick and bass. Audio profile sharpened for punchy percussion attack & deep sub resonance.';
        } else if (isVocalShift) {
          recProfile = 'vocal';
          explanation = 'Vocal/dialogue emergence detected. Frequency carved to boost 1kHz–3.5kHz vocal intelligibility and roll off rumble.';
        } else if (drums > 0.42 && transientAvg > 0.32) {
          recProfile = 'punchy';
          explanation = 'Dynamic fast rhythm detected. Compressor threshold tightened and transients accentuated for punchy beat definition.';
        } else if (bass > 0.45 && shimmerAvg < 0.2) {
          recProfile = 'bass';
          explanation = 'Prominent low-frequency basslines active. Sub-bass enhanced for rich bottom-end immersion.';
        } else if (stringsAcoustic > 0.38 || shimmerAvg > 0.25) {
          recProfile = 'treble';
          explanation = 'Delicate acoustic strings, acoustic guitars, or cymbal shimmer detected. High-shelf air band elevated.';
        } else if (vocals < 0.2 && (leadGuitarSynths > 0.25 || stringsAcoustic > 0.2)) {
          recProfile = 'instrumental';
          explanation = 'Pure instrumental passage. Widened soundstage with transparent instrument separation.';
        }

        const metrics: InstrumentMetrics = {
          drums,
          bass,
          vocals,
          leadGuitarSynths,
          stringsAcoustic,
          intensity,
          isHeavySection,
          isVocalShift,
          recommendedProfile: recProfile,
          aiExplanation: explanation
        };

        if (this.onMetricsUpdate) {
          this.onMetricsUpdate(metrics);
        }
      }

      this.animFrameId = requestAnimationFrame(analyze);
    };

    this.animFrameId = requestAnimationFrame(analyze);
  }
}

export const audioEngine = new AudioEngine();
