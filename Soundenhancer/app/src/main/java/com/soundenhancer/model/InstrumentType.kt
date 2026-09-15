package com.audioalchemy.model

import androidx.compose.ui.graphics.Color

enum class PresetMode(val displayName: String) {
    BALANCED("Studio Balanced"),
    BASS_BOOST("Studio Sub-Bass"),
    SMOOTH("Acoustic Warmth"),
    DYNAMIC("Master Dynamic"),
    CLEAR("Vocal & Air"),
    TREBLE_BOOST("Harmonic Sparkle"),
    CUSTOM("Custom Studio"),
    AUTO("AI Auto-Detect")
}

data class EQPreset(
    val b63Hz: Int = 0,
    val b125Hz: Int = 0,
    val b250Hz: Int = 0,
    val b500Hz: Int = 0,
    val b1kHz: Int = 0,
    val b2kHz: Int = 0,
    val b4kHz: Int = 0,
    val b8kHz: Int = 0,
    val b16kHz: Int = 0
) {
    fun toIntArray(): IntArray = intArrayOf(b63Hz, b125Hz, b250Hz, b500Hz, b1kHz, b2kHz, b4kHz, b8kHz, b16kHz)

    companion object {
        // Harman & Studio Reference Mastering: Tight sub-punch, clean 250Hz mud-cut, forward 1-2kHz intimacy, 8-16kHz silky air
        val BALANCED = EQPreset(4, 3, 0, 1, 3, 4, 5, 6, 7)
        val BASS_BOOST = EQPreset(8, 7, 2, 0, 2, 3, 4, 5, 6)
        val SMOOTH = EQPreset(4, 3, 1, 2, 3, 3, 3, 4, 5)
        val DYNAMIC = EQPreset(7, 5, 0, 1, 3, 5, 6, 7, 8)
        val CLEAR = EQPreset(2, 1, -1, 2, 5, 7, 7, 8, 8)
        val TREBLE_BOOST = EQPreset(2, 1, 0, 1, 3, 6, 8, 9, 10)

        fun fromMode(mode: PresetMode): EQPreset = when (mode) {
            PresetMode.BALANCED -> BALANCED
            PresetMode.BASS_BOOST -> BASS_BOOST
            PresetMode.SMOOTH -> SMOOTH
            PresetMode.DYNAMIC -> DYNAMIC
            PresetMode.CLEAR -> CLEAR
            PresetMode.TREBLE_BOOST -> TREBLE_BOOST
            else -> BALANCED
        }
    }
}

enum class InstrumentType(
    val displayName: String,
    val emoji: String,
    val primaryFreqHz: Float,
    val color: Color,
    val eqBands: EQPreset
) {
    BASS_GUITAR(
        displayName = "Bass Guitar",
        emoji = "🎸",
        primaryFreqHz = 120f,
        color = Color(0xFFEF4444),
        eqBands = EQPreset(8, 7, 3, 1, 2, 3, 4, 5, 5)
    ),
    ELECTRIC_GUITAR(
        displayName = "Electric Guitar",
        emoji = "🎸",
        primaryFreqHz = 400f,
        color = Color(0xFFF97316),
        eqBands = EQPreset(3, 2, 2, 5, 7, 7, 6, 6, 6)
    ),
    PIANO(
        displayName = "Piano",
        emoji = "🎹",
        primaryFreqHz = 264f,
        color = Color(0xFFA78BFA),
        eqBands = EQPreset(3, 3, 2, 4, 5, 6, 6, 7, 7)
    ),
    VOCALS(
        displayName = "Vocals",
        emoji = "🎤",
        primaryFreqHz = 300f,
        color = Color(0xFFEC4899),
        eqBands = EQPreset(1, 1, -1, 3, 7, 8, 7, 7, 7)
    ),
    DRUMS(
        displayName = "Drums",
        emoji = "🥁",
        primaryFreqHz = 80f,
        color = Color(0xFF10B981),
        eqBands = EQPreset(8, 6, 1, 2, 3, 5, 7, 8, 8)
    ),
    VIOLIN(
        displayName = "Violin",
        emoji = "🎻",
        primaryFreqHz = 660f,
        color = Color(0xFF06B6D4),
        eqBands = EQPreset(2, 1, 1, 3, 5, 7, 8, 8, 7)
    ),
    TRUMPET(
        displayName = "Trumpet",
        emoji = "🎺",
        primaryFreqHz = 500f,
        color = Color(0xFFF59E0B),
        eqBands = EQPreset(2, 1, 2, 4, 7, 7, 6, 6, 5)
    ),
    UNKNOWN(
        displayName = "Studio Auto",
        emoji = "🎵",
        primaryFreqHz = 0f,
        color = Color(0xFF6B7280),
        eqBands = EQPreset(4, 3, 0, 1, 3, 4, 5, 6, 7)
    )
}
