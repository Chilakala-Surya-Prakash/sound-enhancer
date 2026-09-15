package com.audioalchemy.audio

import kotlin.math.abs
import com.audioalchemy.model.InstrumentType

/**
 * Maps FFT frequency data to instrument types using spectral fingerprinting.
 * Uses harmonic ratio analysis and spectral centroid detection.
 */
class InstrumentDetector {

    // Smoothing buffer for stability
    private val historySize = 5
    private val history = ArrayDeque<InstrumentType>(historySize)

    fun detectActiveInstruments(
        fftResult: FFTResult,
        sampleRate: Int = 48000,
        fftSize: Int = 1024
    ): Set<InstrumentType> {
        if (fftResult.rmsAmplitude < 0.01f) {
            return emptySet()
        }

        val magnitudes = fftResult.magnitudes
        val domFreq = fftResult.dominantFrequencyHz

        val subEnergy     = bandEnergy(magnitudes, 20f, 80f, sampleRate, fftSize)
        val bassEnergy    = bandEnergy(magnitudes, 80f, 300f, sampleRate, fftSize)
        val lowMidEnergy  = bandEnergy(magnitudes, 300f, 1000f, sampleRate, fftSize)
        val highMidEnergy = bandEnergy(magnitudes, 1000f, 4000f, sampleRate, fftSize)
        val highEnergy    = bandEnergy(magnitudes, 4000f, 8000f, sampleRate, fftSize)
        val airEnergy     = bandEnergy(magnitudes, 8000f, 20000f, sampleRate, fftSize)

        val totalEnergy = subEnergy + bassEnergy + lowMidEnergy + highMidEnergy + highEnergy + airEnergy
        if (totalEnergy < 0.03f) return emptySet()

        val centroid = spectralCentroid(magnitudes, sampleRate, fftSize)
        val scores = mutableMapOf<InstrumentType, Float>()

        scores[InstrumentType.BASS_GUITAR] = scoreInstrument(
            domFreq, subEnergy, bassEnergy, lowMidEnergy, highMidEnergy,
            centroidTarget = 150f, centroid = centroid,
            freqRangeLow = 40f, freqRangeHigh = 300f,
            lowBandWeight = 0.8f, highBandPenalty = 0.3f
        ) + (if (subEnergy / totalEnergy > 0.15f) 0.3f else 0f)

        scores[InstrumentType.ELECTRIC_GUITAR] = scoreInstrument(
            domFreq, lowMidEnergy, highMidEnergy, bassEnergy, highEnergy,
            centroidTarget = 600f, centroid = centroid,
            freqRangeLow = 80f, freqRangeHigh = 1200f,
            lowBandWeight = 0.6f, highBandPenalty = 0.1f
        ) + (if (lowMidEnergy / totalEnergy > 0.20f) 0.25f else 0f)

        scores[InstrumentType.PIANO] = scoreInstrument(
            domFreq, bassEnergy + lowMidEnergy, highMidEnergy, subEnergy, highEnergy,
            centroidTarget = 800f, centroid = centroid,
            freqRangeLow = 100f, freqRangeHigh = 3500f,
            lowBandWeight = 0.45f, highBandPenalty = 0.2f
        )

        scores[InstrumentType.VOCALS] = scoreInstrument(
            domFreq, lowMidEnergy, highMidEnergy + highEnergy, subEnergy, airEnergy,
            centroidTarget = 500f, centroid = centroid,
            freqRangeLow = 80f, freqRangeHigh = 1100f,
            lowBandWeight = 0.55f, highBandPenalty = 0.15f
        ) + (if (highMidEnergy / totalEnergy > 0.25f) 0.3f else 0f)

        scores[InstrumentType.DRUMS] = run {
            val transientScore = if (fftResult.rmsAmplitude > 0.25f) 0.35f else 0f
            val subScore = (subEnergy / totalEnergy) * 0.5f
            val airScore = (airEnergy / totalEnergy) * 0.3f
            transientScore + subScore + airScore + if (domFreq in 20f..200f) 0.25f else 0f
        }

        scores[InstrumentType.VIOLIN] = scoreInstrument(
            domFreq, highMidEnergy, highEnergy + airEnergy, bassEnergy, lowMidEnergy,
            centroidTarget = 1500f, centroid = centroid,
            freqRangeLow = 196f, freqRangeHigh = 3136f,
            lowBandWeight = 0.5f, highBandPenalty = 0.1f
        )

        scores[InstrumentType.TRUMPET] = scoreInstrument(
            domFreq, lowMidEnergy + highMidEnergy, highEnergy, bassEnergy, subEnergy,
            centroidTarget = 700f, centroid = centroid,
            freqRangeLow = 165f, freqRangeHigh = 988f,
            lowBandWeight = 0.6f, highBandPenalty = 0.2f
        )

        return scores.filter { it.value >= 0.20f && it.key != InstrumentType.UNKNOWN }.keys
    }

    fun detect(
        fftResult: FFTResult,
        sampleRate: Int = 48000,
        fftSize: Int = 1024
    ): Pair<InstrumentType, Float> {
        val active = detectActiveInstruments(fftResult, sampleRate, fftSize)
        if (active.isEmpty()) {
            return Pair(InstrumentType.UNKNOWN, 0f)
        }

        val magnitudes = fftResult.magnitudes
        val domFreq = fftResult.dominantFrequencyHz

        val subEnergy    = bandEnergy(magnitudes, 20f, 80f, sampleRate, fftSize)
        val bassEnergy   = bandEnergy(magnitudes, 80f, 300f, sampleRate, fftSize)
        val lowMidEnergy = bandEnergy(magnitudes, 300f, 1000f, sampleRate, fftSize)
        val highMidEnergy= bandEnergy(magnitudes, 1000f, 4000f, sampleRate, fftSize)
        val highEnergy   = bandEnergy(magnitudes, 4000f, 8000f, sampleRate, fftSize)
        val airEnergy    = bandEnergy(magnitudes, 8000f, 20000f, sampleRate, fftSize)
        val totalEnergy  = subEnergy + bassEnergy + lowMidEnergy + highMidEnergy + highEnergy + airEnergy
        val centroid     = spectralCentroid(magnitudes, sampleRate, fftSize)

        val scores = mutableMapOf<InstrumentType, Float>()
        scores[InstrumentType.BASS_GUITAR] = scoreInstrument(domFreq, subEnergy, bassEnergy, lowMidEnergy, highMidEnergy, 150f, centroid, 40f, 300f, 0.8f, 0.3f)
        scores[InstrumentType.ELECTRIC_GUITAR] = scoreInstrument(domFreq, lowMidEnergy, highMidEnergy, bassEnergy, highEnergy, 600f, centroid, 80f, 1200f, 0.6f, 0.1f)
        scores[InstrumentType.PIANO] = scoreInstrument(domFreq, bassEnergy + lowMidEnergy, highMidEnergy, subEnergy, highEnergy, 800f, centroid, 100f, 3500f, 0.45f, 0.2f)
        scores[InstrumentType.VOCALS] = scoreInstrument(domFreq, lowMidEnergy, highMidEnergy + highEnergy, subEnergy, airEnergy, 500f, centroid, 80f, 1100f, 0.55f, 0.15f)
        scores[InstrumentType.DRUMS] = (if (fftResult.rmsAmplitude > 0.3f) 0.4f else 0f) + (subEnergy / maxOf(0.01f, totalEnergy)) * 0.6f + if (domFreq in 20f..200f) 0.3f else 0f
        scores[InstrumentType.VIOLIN] = scoreInstrument(domFreq, highMidEnergy, highEnergy + airEnergy, bassEnergy, lowMidEnergy, 1500f, centroid, 196f, 3136f, 0.5f, 0.1f)
        scores[InstrumentType.TRUMPET] = scoreInstrument(domFreq, lowMidEnergy + highMidEnergy, highEnergy, bassEnergy, subEnergy, 700f, centroid, 165f, 988f, 0.6f, 0.2f)

        val best = scores.maxByOrNull { it.value } ?: return Pair(InstrumentType.UNKNOWN, 0f)
        val confidence = minOf(best.value, 1f)
        if (confidence < 0.25f) return Pair(InstrumentType.UNKNOWN, 0f)

        history.addLast(best.key)
        if (history.size > historySize) history.removeFirst()

        val smoothed = history.groupBy { it }.maxByOrNull { it.value.size }?.key ?: InstrumentType.UNKNOWN
        return Pair(smoothed, confidence)
    }

    private fun scoreInstrument(
        domFreq: Float,
        primaryBandEnergy: Float,
        secondaryBandEnergy: Float,
        noiseBandEnergy: Float,
        highBandEnergy: Float,
        centroidTarget: Float,
        centroid: Float,
        freqRangeLow: Float,
        freqRangeHigh: Float,
        lowBandWeight: Float,
        highBandPenalty: Float
    ): Float {
        var score = 0f
        // Frequency range match
        if (domFreq in freqRangeLow..freqRangeHigh) score += 0.4f
        // Primary band energy
        score += primaryBandEnergy * lowBandWeight
        // Secondary band support
        score += secondaryBandEnergy * 0.2f
        // Centroid proximity
        val centroidDist = abs(centroid - centroidTarget) / centroidTarget
        score += (1f - minOf(centroidDist, 1f)) * 0.2f
        // Noise penalty
        score -= noiseBandEnergy * highBandPenalty
        return maxOf(0f, score)
    }

    private fun bandEnergy(magnitudes: FloatArray, lowHz: Float, highHz: Float, sampleRate: Int, fftSize: Int): Float {
        val binLow = ((lowHz * fftSize) / sampleRate).toInt().coerceIn(0, magnitudes.size - 1)
        val binHigh = ((highHz * fftSize) / sampleRate).toInt().coerceIn(0, magnitudes.size - 1)
        if (binLow >= binHigh) return 0f
        var sum = 0f
        for (i in binLow..binHigh) sum += magnitudes[i] * magnitudes[i]
        return sum / (binHigh - binLow + 1)
    }

    private fun spectralCentroid(magnitudes: FloatArray, sampleRate: Int, fftSize: Int): Float {
        var weightedSum = 0f
        var totalMag = 0f
        for (i in magnitudes.indices) {
            val freq = i.toFloat() * sampleRate / fftSize
            weightedSum += freq * magnitudes[i]
            totalMag += magnitudes[i]
        }
        return if (totalMag > 0) weightedSum / totalMag else 0f
    }
}
