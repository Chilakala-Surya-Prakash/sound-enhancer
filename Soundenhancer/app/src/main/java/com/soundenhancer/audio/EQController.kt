package com.audioalchemy.audio

import android.media.audiofx.Equalizer
import android.util.Log
import com.audioalchemy.model.EQPreset

/**
 * Controls Android's system Equalizer AudioEffect.
 * Maps our 9-band EQPreset to the device's available EQ bands.
 */
class EQController {

    private var equalizer: Equalizer? = null
    private val tag = "EQController"

    fun initialize(audioSessionId: Int = 0) {
        try {
            equalizer?.release()
            equalizer = Equalizer(0, audioSessionId).apply {
                enabled = true
            }
            Log.d(tag, "Equalizer initialized. Bands: ${equalizer?.numberOfBands}")
        } catch (e: Exception) {
            Log.e(tag, "Failed to initialize equalizer: ${e.message}")
        }
    }

    fun applyPreset(preset: EQPreset) {
        val eq = equalizer ?: return
        try {
            val numBands = eq.numberOfBands.toInt()
            val targetFreqs = floatArrayOf(63f, 125f, 250f, 500f, 1000f, 2000f, 4000f, 8000f, 16000f)
            val gains = preset.toIntArray()
            val range = eq.bandLevelRange

            for (band in 0 until numBands) {
                val centerHz = eq.getCenterFreq(band.toShort()) / 1000f
                var closestIdx = 0
                var minDiff = Float.MAX_VALUE
                for (i in targetFreqs.indices) {
                    val diff = kotlin.math.abs(targetFreqs[i] - centerHz)
                    if (diff < minDiff) {
                        minDiff = diff
                        closestIdx = i
                    }
                }
                val gainDb = gains[closestIdx]
                val milliBels = (gainDb * 100).coerceIn(range[0].toInt(), range[1].toInt()).toShort()
                eq.setBandLevel(band.toShort(), milliBels)
            }
        } catch (e: Exception) {
            Log.e(tag, "Failed to apply EQ preset: ${e.message}")
        }
    }

    fun getCurrentBands(): List<Pair<Int, Int>> {
        val eq = equalizer ?: return emptyList()
        return try {
            (0 until eq.numberOfBands).map { band ->
                val freq = eq.getCenterFreq(band.toShort()) / 1000  // Hz
                val level = eq.getBandLevel(band.toShort()).toInt()  // milliBels
                Pair(freq, level)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun reset() {
        applyPreset(EQPreset.BALANCED)
    }

    fun release() {
        try {
            equalizer?.release()
            equalizer = null
        } catch (e: Exception) {
            Log.e(tag, "Error releasing equalizer: ${e.message}")
        }
    }
}
