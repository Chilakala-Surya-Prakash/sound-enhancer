package com.audioalchemy.model

import com.audioalchemy.audio.TestTrackMode

data class AudioState(
    val isListening: Boolean = false,
    val isEnhancerEnabled: Boolean = true,
    val isAutoMode: Boolean = false,
    val activePresetMode: PresetMode = PresetMode.BALANCED,
    val detectedInstrument: InstrumentType = InstrumentType.UNKNOWN,
    val activeDetectedInstruments: Set<InstrumentType> = emptySet(),
    val selectedInstruments: Set<InstrumentType> = emptySet(),
    val soloInstrument: InstrumentType? = null,
    val confidence: Float = 0f,
    val spectrumBands: FloatArray = FloatArray(64),
    val currentEQ: EQPreset = EQPreset.BALANCED,
    val dominantFrequencyHz: Float = 0f,
    val amplitude: Float = 0f,
    val vocalRatio: Float = 0f,
    val activeSessionId: Int = 0,
    val diagnosticLog: String = "",
    val bassBoostStrength: Int = 750,
    val virtualizerStrength: Int = 600,
    val loudnessGainMb: Int = 200,
    val spatialMode: SpatialMode = SpatialMode.HEADPHONES_3D,
    val localTrackMode: TestTrackMode = TestTrackMode.NONE,
    val isLocalPlaying: Boolean = false,
    val localTrackTitle: String = "",
    val hasDirectDspAttachment: Boolean = false
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as AudioState
        return isListening == other.isListening &&
            isEnhancerEnabled == other.isEnhancerEnabled &&
            isAutoMode == other.isAutoMode &&
            activePresetMode == other.activePresetMode &&
            detectedInstrument == other.detectedInstrument &&
            activeDetectedInstruments == other.activeDetectedInstruments &&
            selectedInstruments == other.selectedInstruments &&
            soloInstrument == other.soloInstrument &&
            confidence == other.confidence &&
            currentEQ == other.currentEQ &&
            dominantFrequencyHz == other.dominantFrequencyHz &&
            amplitude == other.amplitude &&
            vocalRatio == other.vocalRatio &&
            activeSessionId == other.activeSessionId &&
            diagnosticLog == other.diagnosticLog &&
            bassBoostStrength == other.bassBoostStrength &&
            virtualizerStrength == other.virtualizerStrength &&
            loudnessGainMb == other.loudnessGainMb &&
            spatialMode == other.spatialMode &&
            localTrackMode == other.localTrackMode &&
            isLocalPlaying == other.isLocalPlaying &&
            localTrackTitle == other.localTrackTitle &&
            hasDirectDspAttachment == other.hasDirectDspAttachment &&
            spectrumBands.contentEquals(other.spectrumBands)
    }

    override fun hashCode(): Int {
        var r = isListening.hashCode()
        r = 31 * r + isEnhancerEnabled.hashCode()
        r = 31 * r + isAutoMode.hashCode()
        r = 31 * r + activePresetMode.hashCode()
        r = 31 * r + detectedInstrument.hashCode()
        r = 31 * r + activeDetectedInstruments.hashCode()
        r = 31 * r + selectedInstruments.hashCode()
        r = 31 * r + soloInstrument.hashCode()
        r = 31 * r + confidence.hashCode()
        r = 31 * r + currentEQ.hashCode()
        r = 31 * r + dominantFrequencyHz.hashCode()
        r = 31 * r + amplitude.hashCode()
        r = 31 * r + vocalRatio.hashCode()
        r = 31 * r + activeSessionId.hashCode()
        r = 31 * r + diagnosticLog.hashCode()
        r = 31 * r + bassBoostStrength.hashCode()
        r = 31 * r + virtualizerStrength.hashCode()
        r = 31 * r + loudnessGainMb.hashCode()
        r = 31 * r + spatialMode.hashCode()
        r = 31 * r + localTrackMode.hashCode()
        r = 31 * r + isLocalPlaying.hashCode()
        r = 31 * r + localTrackTitle.hashCode()
        r = 31 * r + hasDirectDspAttachment.hashCode()
        r = 31 * r + spectrumBands.contentHashCode()
        return r
    }
}
