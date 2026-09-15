package com.audioalchemy.audio

import kotlin.math.*

class FFTAnalyzer(private val size: Int = 2048) {
    private val cosTable = FloatArray(size / 2)
    private val sinTable = FloatArray(size / 2)

    init {
        for (i in 0 until size / 2) {
            val a = -2.0 * PI * i / size
            cosTable[i] = cos(a).toFloat()
            sinTable[i] = sin(a).toFloat()
        }
    }

    fun analyze(samples: ShortArray, sampleRate: Int = 44100): FFTResult {
        val n = minOf(size, samples.size)
        val real = FloatArray(size)
        val imag = FloatArray(size)
        val window = FloatArray(n) { i -> (0.54 - 0.46 * cos(2.0 * PI * i / (n - 1))).toFloat() }
        for (i in 0 until n) real[i] = (samples[i] / 32768f) * window[i]

        fft(real, imag)

        val mags = FloatArray(size / 2)
        var maxM = 0f
        for (i in 0 until size / 2) {
            mags[i] = sqrt(real[i] * real[i] + imag[i] * imag[i])
            if (mags[i] > maxM) maxM = mags[i]
        }
        if (maxM > 0f) for (i in mags.indices) mags[i] /= maxM

        var peakIdx = 0; var peakMag = 0f
        for (i in 1 until size / 2) if (mags[i] > peakMag) { peakMag = mags[i]; peakIdx = i }
        val domFreq = peakIdx.toFloat() * sampleRate / size

        var rms = 0f
        for (s in samples) rms += (s / 32768f).pow(2)
        rms = sqrt(rms / samples.size)

        return FFTResult(mags, domFreq, peakMag, rms)
    }

    private fun fft(real: FloatArray, imag: FloatArray) {
        val n = real.size
        var j = 0
        for (i in 1 until n) {
            var bit = n shr 1
            while (j and bit != 0) { j = j xor bit; bit = bit shr 1 }
            j = j xor bit
            if (i < j) {
                var t = real[i]; real[i] = real[j]; real[j] = t
                t = imag[i]; imag[i] = imag[j]; imag[j] = t
            }
        }
        var len = 2
        while (len <= n) {
            val half = len / 2; val step = n / len
            var i = 0
            while (i < n) {
                for (k in 0 until half) {
                    val ti = k * step
                    val tr = real[i+k+half]*cosTable[ti] - imag[i+k+half]*sinTable[ti]
                    val ti2= real[i+k+half]*sinTable[ti] + imag[i+k+half]*cosTable[ti]
                    real[i+k+half] = real[i+k] - tr; imag[i+k+half] = imag[i+k] - ti2
                    real[i+k] += tr; imag[i+k] += ti2
                }
                i += len
            }
            len = len shl 1
        }
    }
}

data class FFTResult(
    val magnitudes: FloatArray,
    val dominantFrequencyHz: Float,
    val peakMagnitude: Float,
    val rmsAmplitude: Float
)
