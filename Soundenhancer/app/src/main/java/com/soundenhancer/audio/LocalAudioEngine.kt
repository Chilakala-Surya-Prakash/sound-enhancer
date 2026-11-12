package com.audioalchemy.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.MediaPlayer
import android.net.Uri
import android.util.Log
import java.util.Random
import kotlin.math.ln
import kotlin.math.sin

enum class TestTrackMode(val displayName: String) {
    NONE("No Local Audio"),
    PINK_NOISE("Pink Noise (EQ Calibration Tool)"),
    SINE_SWEEP("Harmonic Sweep (20Hz - 20kHz)"),
    USER_FILE("Local Media Track")
}

/**
 * High-fidelity, deterministic in-app audio engine.
 * Generates reference test signals and plays local audio files with guaranteed,
 * non-zero Android AudioSession IDs so hardware DSP effects are 100% active.
 */
class LocalAudioEngine(
    private val onSessionActive: (sessionId: Int) -> Unit,
    private val onStateChanged: (isPlaying: Boolean, mode: TestTrackMode, trackName: String) -> Unit
) {
    private val tag = "LocalAudioEngine"
    private val sampleRate = 48000

    private var activeMode = TestTrackMode.NONE
    private var isPlaying = false
    private var currentTrackName = ""

    private var pinkNoiseTrack: AudioTrack? = null
    private var sweepTrack: AudioTrack? = null
    private var mediaPlayer: MediaPlayer? = null

    val currentMode: TestTrackMode get() = activeMode
    val isCurrentlyPlaying: Boolean get() = isPlaying
    val trackTitle: String get() = currentTrackName

    fun playPinkNoise() {
        stopAll()
        try {
            if (pinkNoiseTrack == null) {
                pinkNoiseTrack = generatePinkNoiseTrack()
            }
            val track = pinkNoiseTrack ?: return
            track.reloadStaticData()
            track.setLoopPoints(0, sampleRate * 2, -1) // Loop infinitely
            track.play()

            activeMode = TestTrackMode.PINK_NOISE
            isPlaying = true
            currentTrackName = "Pink Noise (EQ Reference Calibration)"

            val sessionId = track.audioSessionId
            Log.i(tag, "Pink noise started on session $sessionId")
            onSessionActive(sessionId)
            onStateChanged(true, activeMode, currentTrackName)
        } catch (e: Exception) {
            Log.e(tag, "Failed to play pink noise: ${e.message}", e)
        }
    }

    fun playSineSweep() {
        stopAll()
        try {
            if (sweepTrack == null) {
                sweepTrack = generateSweepTrack()
            }
            val track = sweepTrack ?: return
            track.reloadStaticData()
            track.setLoopPoints(0, sampleRate * 4, -1) // 4-second sweep loop
            track.play()

            activeMode = TestTrackMode.SINE_SWEEP
            isPlaying = true
            currentTrackName = "Harmonic Sine Sweep (20Hz - 20kHz)"

            val sessionId = track.audioSessionId
            Log.i(tag, "Harmonic sweep started on session $sessionId")
            onSessionActive(sessionId)
            onStateChanged(true, activeMode, currentTrackName)
        } catch (e: Exception) {
            Log.e(tag, "Failed to play sweep: ${e.message}", e)
        }
    }

    fun playUserAudio(context: Context, uri: Uri, fileName: String) {
        stopAll()
        try {
            val mp = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                setDataSource(context, uri)
                isLooping = true
                prepare()
                start()
            }
            mediaPlayer = mp
            activeMode = TestTrackMode.USER_FILE
            isPlaying = true
            currentTrackName = fileName

            val sessionId = mp.audioSessionId
            Log.i(tag, "User track '$fileName' playing on session $sessionId")
            onSessionActive(sessionId)
            onStateChanged(true, activeMode, currentTrackName)
        } catch (e: Exception) {
            Log.e(tag, "Failed to play user audio file: ${e.message}", e)
        }
    }

    fun togglePlayPause() {
        if (!isPlaying) {
            when (activeMode) {
                TestTrackMode.PINK_NOISE -> pinkNoiseTrack?.let {
                    it.play()
                    isPlaying = true
                    onStateChanged(true, activeMode, currentTrackName)
                }
                TestTrackMode.SINE_SWEEP -> sweepTrack?.let {
                    it.play()
                    isPlaying = true
                    onStateChanged(true, activeMode, currentTrackName)
                }
                TestTrackMode.USER_FILE -> mediaPlayer?.let {
                    it.start()
                    isPlaying = true
                    onStateChanged(true, activeMode, currentTrackName)
                }
                TestTrackMode.NONE -> playPinkNoise()
            }
        } else {
            pause()
        }
    }

    fun pause() {
        pinkNoiseTrack?.pause()
        sweepTrack?.pause()
        mediaPlayer?.pause()
        isPlaying = false
        onStateChanged(false, activeMode, currentTrackName)
    }

    fun stopAll() {
        try {
            pinkNoiseTrack?.let { if (it.playState == AudioTrack.PLAYSTATE_PLAYING) it.pause() }
            sweepTrack?.let { if (it.playState == AudioTrack.PLAYSTATE_PLAYING) it.pause() }
            mediaPlayer?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
            mediaPlayer = null
        } catch (e: Exception) {
            Log.w(tag, "Error stopping audio: ${e.message}")
        }
        isPlaying = false
    }

    fun release() {
        stopAll()
        try { pinkNoiseTrack?.release() } catch (e: Exception) {}
        try { sweepTrack?.release() } catch (e: Exception) {}
        pinkNoiseTrack = null
        sweepTrack = null
        mediaPlayer = null
    }

    /**
     * Generates a seamless 2-second stereo pink noise buffer using Paul Kellet's filter method.
     * Normalized to -6dBFS (amplitude 0.5) to give safe acoustic headroom.
     */
    private fun generatePinkNoiseTrack(): AudioTrack {
        val durationSeconds = 2
        val numFrames = sampleRate * durationSeconds
        val numSamples = numFrames * 2 // Stereo L + R
        val pcmData = ShortArray(numSamples)

        val rng = Random(1337)
        var b0 = 0.0; var b1 = 0.0; var b2 = 0.0
        var b3 = 0.0; var b4 = 0.0; var b5 = 0.0; var b6 = 0.0

        for (i in 0 until numFrames) {
            val white = rng.nextDouble() * 2.0 - 1.0
            b0 = 0.99886 * b0 + white * 0.0555179
            b1 = 0.99332 * b1 + white * 0.0750759
            b2 = 0.96900 * b2 + white * 0.1538520
            b3 = 0.86650 * b3 + white * 0.3104856
            b4 = 0.55000 * b4 + white * 0.5329522
            b5 = -0.7616 * b5 - white * 0.0168980
            val pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11 // Scale to ~0.5 peak
            b6 = white * 0.115926

            val sampleVal = (pink.coerceIn(-1.0, 1.0) * 32767.0 * 0.55).toInt().toShort()
            pcmData[i * 2] = sampleVal     // Left
            pcmData[i * 2 + 1] = sampleVal // Right
        }

        val bufferSizeInBytes = numSamples * 2
        val track = AudioTrack(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build(),
            AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(sampleRate)
                .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                .build(),
            bufferSizeInBytes,
            AudioTrack.MODE_STATIC,
            AudioManager.AUDIO_SESSION_ID_GENERATE
        )
        track.write(pcmData, 0, numSamples)
        return track
    }

    /**
     * Generates a smooth 4-second logarithmic sine sweep from 20Hz to 20,000Hz.
     */
    private fun generateSweepTrack(): AudioTrack {
        val durationSeconds = 4
        val numFrames = sampleRate * durationSeconds
        val numSamples = numFrames * 2
        val pcmData = ShortArray(numSamples)

        val fStart = 20.0
        val fEnd = 20000.0
        val lnRatio = ln(fEnd / fStart)

        for (i in 0 until numFrames) {
            val t = i.toDouble() / sampleRate
            val progress = t / durationSeconds
            val currentFreq = fStart * Math.exp(progress * lnRatio)
            // Integrated phase for logarithmic sweep: phi(t) = 2*pi*f0 * (exp(t*k) - 1) / k
            val k = lnRatio / durationSeconds
            val phase = 2.0 * Math.PI * fStart * (Math.exp(t * k) - 1.0) / k
            val sineVal = sin(phase) * 0.5 // -6dBFS amplitude

            val sampleVal = (sineVal * 32767.0).toInt().toShort()
            pcmData[i * 2] = sampleVal
            pcmData[i * 2 + 1] = sampleVal
        }

        val bufferSizeInBytes = numSamples * 2
        val track = AudioTrack(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build(),
            AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(sampleRate)
                .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                .build(),
            bufferSizeInBytes,
            AudioTrack.MODE_STATIC,
            AudioManager.AUDIO_SESSION_ID_GENERATE
        )
        track.write(pcmData, 0, numSamples)
        return track
    }
}
