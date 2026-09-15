import { AudioProfileId, InstrumentMetrics } from '../types/audio';

export interface AiMixingAdvice {
  profile: AudioProfileId;
  confidence: number;
  reasoning: string;
  recommendedEqAdjustments?: {
    subBass: number;
    bass: number;
    mids: number;
    highMids: number;
    treble: number;
  };
  sharpeningLevel: number;
}

/**
 * 100% Local On-Device Audio Intelligence
 * Runs strictly on device hardware DSP and spectral FFT analysis.
 * Zero API keys, zero network requests, zero cloud latency.
 */
export class LocalAudioIntelligenceService {
  public hasApiKey(): boolean {
    // Zero API keys required
    return false;
  }

  public setApiKey(_key: string) {
    // No-op: completely offline on-device hardware
  }

  public async analyzeSceneAndRecommendProfile(
    _sceneDescription: string,
    currentMetrics: InstrumentMetrics
  ): Promise<AiMixingAdvice> {
    return this.generateAlgorithmicAdvice(currentMetrics);
  }

  public generateAlgorithmicAdvice(metrics: InstrumentMetrics): AiMixingAdvice {
    return {
      profile: metrics.recommendedProfile,
      confidence: 0.94,
      reasoning: metrics.aiExplanation,
      sharpeningLevel: metrics.isHeavySection ? 85 : 45,
    };
  }
}

// Export singleton instance and alias for backward compatibility
export const localAudioIntelligence = new LocalAudioIntelligenceService();
export const geminiAudioService = localAudioIntelligence;
export const GeminiAudioService = LocalAudioIntelligenceService;
