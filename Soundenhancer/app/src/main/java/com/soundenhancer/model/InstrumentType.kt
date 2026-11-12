package com.audioalchemy.model

import androidx.compose.ui.graphics.Color
import com.audioalchemy.ui.theme.*

enum class SpatialMode(val displayName: String, val defaultStrength: Int) {
    STUDIO_NEARFIELD("Studio Nearfield", 400),
    HEADPHONES_3D("3D Spatial Stage", 750),
    CONCERT_HALL("Concert Hall", 1000)
}

enum class PresetMode(val displayName: String) {
    BALANCED("Studio Balanced"),
    BASS_BOOST("Studio Sub-Bass"),
    HARMAN("Harman Reference"),
    CLUB("Club & Electronic"),
    SMOOTH("Acoustic Warmth"),
    DYNAMIC("Master Dynamic"),
    CLEAR("Vocal & Air"),
    TREBLE_BOOST("Harmonic Sparkle"),
    CUSTOM("Custom Studio"),
    AUTO("Acoustic Reference")
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
        // Mathematically calibrated targets:
        val BALANCED = EQPreset(0, 0, 0, 0, 0, 0, 0, 0, 0)
        val BASS_BOOST = EQPreset(8, 7, 3, 0, 0, 1, 2, 3, 4)
        val HARMAN = EQPreset(6, 4, 1, 0, 2, 4, 6, 7, 7)
        val CLUB = EQPreset(9, 7, 2, -1, 0, 2, 4, 6, 7)
        val SMOOTH = EQPreset(3, 3, 2, 1, 0, -1, -2, -3, -4)
        val DYNAMIC = EQPreset(6, 4, 0, -1, 1, 3, 5, 7, 8)
        val CLEAR = EQPreset(-2, -1, -2, 1, 4, 6, 6, 5, 4)
        val TREBLE_BOOST = EQPreset(-2, -1, 0, 1, 3, 5, 8, 9, 10)

        fun fromMode(mode: PresetMode): EQPreset = when (mode) {
            PresetMode.BALANCED -> BALANCED
            PresetMode.BASS_BOOST -> BASS_BOOST
            PresetMode.HARMAN -> HARMAN
            PresetMode.CLUB -> CLUB
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
    val eqBands: EQPreset,
    val soloEqBands: EQPreset
) {
    BASS_GUITAR(
        displayName = "Bass Guitar",
        emoji = "🎸",
        primaryFreqHz = 120f,
        color = EmeraldDeep,
        eqBands = EQPreset(8, 6, 2, 0, 0, 1, 2, 3, 3),
        soloEqBands = EQPreset(8, 6, 2, 0, 0, 1, 2, 3, 3)
    ),
    ELECTRIC_GUITAR(
        displayName = "Electric Guitar",
        emoji = "🎸",
        primaryFreqHz = 400f,
        color = WoodGold,
        eqBands = EQPreset(2, 2, 1, 4, 5, 4, 3, 2, 2),
        soloEqBands = EQPreset(2, 2, 1, 4, 5, 4, 3, 2, 2)
    ),
    PIANO(
        displayName = "Piano",
        emoji = "🎹",
        primaryFreqHz = 264f,
        color = CreamWhite,
        eqBands = EQPreset(2, 2, 2, 3, 4, 4, 3, 3, 3),
        soloEqBands = EQPreset(2, 2, 2, 3, 4, 4, 3, 3, 3)
    ),
    VOCALS(
        displayName = "Vocals",
        emoji = "🎤",
        primaryFreqHz = 300f,
        color = EmeraldLight,
        eqBands = EQPreset(-1, -1, -2, 2, 5, 6, 5, 4, 3),
        soloEqBands = EQPreset(-1, -1, -2, 2, 5, 6, 5, 4, 3)
    ),
    DRUMS(
        displayName = "Drums",
        emoji = "🥁",
        primaryFreqHz = 80f,
        color = EmeraldBright,
        eqBands = EQPreset(8, 6, 1, 0, 1, 3, 5, 6, 6),
        soloEqBands = EQPreset(8, 6, 1, 0, 1, 3, 5, 6, 6)
    ),
    VIOLIN(
        displayName = "Violin",
        emoji = "🎻",
        primaryFreqHz = 660f,
        color = WoodGold,
        eqBands = EQPreset(1, 1, 1, 2, 4, 5, 6, 6, 5),
        soloEqBands = EQPreset(1, 1, 1, 2, 4, 5, 6, 6, 5)
    ),
    TRUMPET(
        displayName = "Trumpet",
        emoji = "🎺",
        primaryFreqHz = 500f,
        color = WoodGold,
        eqBands = EQPreset(1, 1, 1, 3, 5, 5, 4, 3, 2),
        soloEqBands = EQPreset(1, 1, 1, 3, 5, 5, 4, 3, 2)
    ),
    UNKNOWN(
        displayName = "Studio Reference",
        emoji = "🎵",
        primaryFreqHz = 0f,
        color = EmeraldPrimary,
        eqBands = EQPreset(0, 0, 0, 0, 0, 0, 0, 0, 0),
        soloEqBands = EQPreset(0, 0, 0, 0, 0, 0, 0, 0, 0)
    )
}
