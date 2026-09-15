package com.audioalchemy.model

data class AudioState(
    val isListening: Boolean = false,
    val isEnhancerEnabled: Boolean = true,
    val isAutoMode: Boolean = true,
    val activePresetMode: PresetMode = PresetMode.AUTO,
    val detectedInstrument: InstrumentType = InstrumentType.UNKNOWN,
    val selectedInstruments: Set<InstrumentType> = emptySet(),
    val confidence: Float = 0f,
    val spectrumBands: FloatArray = FloatArray(64),
    val currentEQ: EQPreset = EQPreset.BALANCED,
    val dominantFrequencyHz: Float = 0f,
    val amplitude: Float = 0f,
    val vocalRatio: Float = 0f,
    val activeSessionId: Int = 0,
    val diagnosticLog: String = ""
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
            selectedInstruments == other.selectedInstruments &&
            confidence == other.confidence &&
            currentEQ == other.currentEQ &&
            dominantFrequencyHz == other.dominantFrequencyHz &&
            amplitude == other.amplitude &&
            vocalRatio == other.vocalRatio &&
            activeSessionId == other.activeSessionId &&
            diagnosticLog == other.diagnosticLog &&
            spectrumBands.contentEquals(other.spectrumBands)
    }

    override fun hashCode(): Int {
        var r = isListening.hashCode()
        r = 31 * r + isEnhancerEnabled.hashCode()
        r = 31 * r + isAutoMode.hashCode()
        r = 31 * r + activePresetMode.hashCode()
        r = 31 * r + detectedInstrument.hashCode()
        r = 31 * r + selectedInstruments.hashCode()
        r = 31 * r + confidence.hashCode()
        r = 31 * r + currentEQ.hashCode()
        r = 31 * r + dominantFrequencyHz.hashCode()
        r = 31 * r + amplitude.hashCode()
        r = 31 * r + vocalRatio.hashCode()
        r = 31 * r + activeSessionId.hashCode()
        r = 31 * r + diagnosticLog.hashCode()
        r = 31 * r + spectrumBands.contentHashCode()
        return r
    }
}
