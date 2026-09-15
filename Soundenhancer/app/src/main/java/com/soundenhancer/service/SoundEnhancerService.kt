package com.audioalchemy.service

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.media.audiofx.AudioEffect
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import android.media.audiofx.Virtualizer
import android.media.audiofx.Visualizer
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.audioalchemy.MainActivity
import com.audioalchemy.audio.FFTResult
import com.audioalchemy.audio.InstrumentDetector
import com.audioalchemy.model.AudioState
import com.audioalchemy.model.EQPreset
import com.audioalchemy.model.InstrumentType
import com.audioalchemy.model.PresetMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class AudioAlchemyService : Service() {

    private val tag = "AudioAlchemyService"
    private val diagTag = "MusicEnhancedDiagnostic"
    private val channelId = "musicenhanced_channel"
    private val notifId = 1

    // Hardware DSP effect collections per session ID (Session 0 + active media player sessions)
    private val equalizers = mutableMapOf<Int, Equalizer>()
    private val virtualizers = mutableMapOf<Int, Virtualizer>()
    private val bassBoosts = mutableMapOf<Int, BassBoost>()
    private val loudnessEnhancers = mutableMapOf<Int, LoudnessEnhancer>()
    private val activeSessions = mutableSetOf<Int>()

    private var visualizer: Visualizer? = null
    private val instrumentDetector = InstrumentDetector()

    private val _audioState = MutableStateFlow(AudioState())
    val audioState: StateFlow<AudioState> = _audioState

    private var lastDiagnosticTimeMs = 0L
    private var isReceiverRegistered = false

    // Intercept media session broadcasts from Spotify, YouTube Music, Apple Music, Poweramp, etc.
    private val mediaSessionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action = intent?.action ?: return
            val sessionId = intent.getIntExtra(AudioEffect.EXTRA_AUDIO_SESSION, 0)
            val pkg = intent.getStringExtra(AudioEffect.EXTRA_PACKAGE_NAME) ?: "Unknown"

            if (sessionId != 0) {
                when (action) {
                    AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION -> {
                        Log.i(tag, "Media session opened by $pkg (Session ID: $sessionId). Attaching Studio DSP...")
                        attachSessionEffects(sessionId)
                        _audioState.value = _audioState.value.copy(activeSessionId = sessionId)
                    }
                    AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION -> {
                        Log.i(tag, "Media session closed by $pkg (Session ID: $sessionId). Releasing session effects...")
                        detachSessionEffects(sessionId)
                        if (_audioState.value.activeSessionId == sessionId) {
                            _audioState.value = _audioState.value.copy(activeSessionId = 0)
                        }
                    }
                }
            }
        }
    }

    inner class LocalBinder : Binder() {
        fun getService(): AudioAlchemyService = this@AudioAlchemyService
    }
    private val binder = LocalBinder()
    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        registerSessionReceiver()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) {
            // Service was recreated by Android OS after memory pressure: immediately ensure foreground status
            startListening()
            return START_STICKY
        }
        when (intent.action) {
            ACTION_START -> startListening()
            ACTION_STOP  -> stopListening()
            else -> startListening()
        }
        return START_STICKY
    }

    fun startListening() {
        val notif = buildNotification("Music Enhanced: Studio DSP Active")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceCompat.startForeground(
                this,
                notifId,
                notif,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(notifId, notif)
        }
        attachSessionEffects(0)
        _audioState.value = _audioState.value.copy(isListening = true)
        Log.d(tag, "Studio audio session attached (Session 0)")
    }

    fun stopListening() {
        releaseAllEffects()
        _audioState.value = AudioState(isListening = false, isEnhancerEnabled = _audioState.value.isEnhancerEnabled)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    fun setEnhancerEnabled(enabled: Boolean) {
        _audioState.value = _audioState.value.copy(isEnhancerEnabled = enabled)
        applyStudioEnhancements()
        applyGlobalEQ(_audioState.value.currentEQ)
    }

    private fun registerSessionReceiver() {
        if (isReceiverRegistered) return
        try {
            val filter = IntentFilter().apply {
                addAction(AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION)
                addAction(AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(mediaSessionReceiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                registerReceiver(mediaSessionReceiver, filter)
            }
            isReceiverRegistered = true
            Log.d(tag, "Media session broadcast receiver registered")
        } catch (e: Exception) {
            Log.w(tag, "Could not register media session receiver: ${e.message}")
        }
    }

    private fun unregisterSessionReceiver() {
        if (isReceiverRegistered) {
            try {
                unregisterReceiver(mediaSessionReceiver)
            } catch (e: Exception) {
                // Ignore
            }
            isReceiverRegistered = false
        }
    }

    private fun attachSessionEffects(sessionId: Int) {
        activeSessions.add(sessionId)

        // 1. Equalizer (Hardware 9-band mapping)
        if (!equalizers.containsKey(sessionId)) {
            try {
                val eq = Equalizer(0, sessionId).apply { enabled = true }
                equalizers[sessionId] = eq
                Log.d(tag, "Equalizer attached to session $sessionId. Bands: ${eq.numberOfBands}")
            } catch (e: Exception) {
                Log.w(tag, "Equalizer init failed for session $sessionId: ${e.message}")
            }
        }

        // 2. Virtualizer (Binaural 3D Spatializer: moves sound out of the head for an intimate room soundstage)
        if (!virtualizers.containsKey(sessionId)) {
            try {
                val virt = Virtualizer(0, sessionId).apply {
                    if (strengthSupported) {
                        setStrength(if (_audioState.value.isEnhancerEnabled) 850.toShort() else 0.toShort())
                    }
                    enabled = _audioState.value.isEnhancerEnabled
                }
                virtualizers[sessionId] = virt
                Log.d(tag, "3D Virtualizer attached to session $sessionId")
            } catch (e: Exception) {
                Log.w(tag, "Virtualizer init failed for session $sessionId: ${e.message}")
            }
        }

        // 3. BassBoost (Tight sub-harmonic punch without the boomy 250Hz resonance)
        if (!bassBoosts.containsKey(sessionId)) {
            try {
                val bb = BassBoost(0, sessionId).apply {
                    if (strengthSupported) {
                        setStrength(if (_audioState.value.isEnhancerEnabled) 900.toShort() else 0.toShort())
                    }
                    enabled = _audioState.value.isEnhancerEnabled
                }
                bassBoosts[sessionId] = bb
                Log.d(tag, "BassBoost attached to session $sessionId")
            } catch (e: Exception) {
                Log.w(tag, "BassBoost init failed for session $sessionId: ${e.message}")
            }
        }

        // 4. LoudnessEnhancer (Studio dynamics and presence on API 19+)
        if (!loudnessEnhancers.containsKey(sessionId)) {
            try {
                val le = LoudnessEnhancer(sessionId).apply {
                    setTargetGain(if (_audioState.value.isEnhancerEnabled) 200 else 0) // +2.0dB transparent studio gain
                    enabled = _audioState.value.isEnhancerEnabled
                }
                loudnessEnhancers[sessionId] = le
                Log.d(tag, "LoudnessEnhancer attached to session $sessionId")
            } catch (e: Exception) {
                Log.w(tag, "LoudnessEnhancer init failed for session $sessionId: ${e.message}")
            }
        }

        // 5. Visualizer (Spectrum and FFT analysis)
        if (visualizer == null) {
            try {
                val v = Visualizer(sessionId).apply {
                    captureSize = Visualizer.getCaptureSizeRange()[1]
                    scalingMode = Visualizer.SCALING_MODE_NORMALIZED
                    measurementMode = Visualizer.MEASUREMENT_MODE_NONE
                    setDataCaptureListener(
                        object : Visualizer.OnDataCaptureListener {
                            override fun onWaveFormDataCapture(v: Visualizer, wf: ByteArray, sr: Int) {}
                            override fun onFftDataCapture(v: Visualizer, fft: ByteArray, sr: Int) {
                                processFft(fft, sr)
                            }
                        },
                        Visualizer.getMaxCaptureRate() / 2,
                        false, true
                    )
                    enabled = true
                }
                visualizer = v
                Log.d(tag, "Visualizer attached to session $sessionId")
            } catch (e: Exception) {
                Log.w(tag, "Visualizer init for session $sessionId failed: ${e.message}")
            }
        }

        // Immediately apply current EQ across all active sessions
        applyGlobalEQ(_audioState.value.currentEQ)
    }

    private fun detachSessionEffects(sessionId: Int) {
        activeSessions.remove(sessionId)
        try { equalizers.remove(sessionId)?.apply { enabled = false; release() } } catch (e: Exception) {}
        try { virtualizers.remove(sessionId)?.apply { enabled = false; release() } } catch (e: Exception) {}
        try { bassBoosts.remove(sessionId)?.apply { enabled = false; release() } } catch (e: Exception) {}
        try { loudnessEnhancers.remove(sessionId)?.apply { enabled = false; release() } } catch (e: Exception) {}
    }

    private fun applyStudioEnhancements() {
        val isEnhancer = _audioState.value.isEnhancerEnabled
        virtualizers.values.forEach { virt ->
            try {
                if (virt.strengthSupported) virt.setStrength(if (isEnhancer) 850.toShort() else 0.toShort())
                virt.enabled = isEnhancer
            } catch (e: Exception) {}
        }
        bassBoosts.values.forEach { bb ->
            try {
                if (bb.strengthSupported) bb.setStrength(if (isEnhancer) 1000.toShort() else 0.toShort())
                bb.enabled = isEnhancer
            } catch (e: Exception) {}
        }
        loudnessEnhancers.values.forEach { le ->
            try {
                le.setTargetGain(if (isEnhancer) 250 else 0)
                le.enabled = isEnhancer
            } catch (e: Exception) {}
        }
    }

    private fun processFft(fft: ByteArray?, samplingRate: Int) {
        if (fft == null || fft.size < 4) return
        val srHz = if (samplingRate > 100000) samplingRate / 1000 else samplingRate
        if (srHz <= 0) return

        val n = fft.size / 2
        val mags = FloatArray(n)
        var maxM = 0f
        var totalEnergy = 0f
        var vocalEnergy = 0f

        val fftSize = fft.size
        val binResolution = srHz.toFloat() / fftSize

        for (i in 1 until n) {
            val re = fft[2 * i].toFloat()
            val im = fft[2 * i + 1].toFloat()
            val mag = kotlin.math.sqrt(re * re + im * im)
            mags[i] = mag
            totalEnergy += mag
            if (mag > maxM) maxM = mag

            val freq = i * binResolution
            if (freq in 450f..2800f) {
                vocalEnergy += mag
            }
        }
        if (maxM > 0f) for (i in mags.indices) mags[i] /= maxM

        val vocalRatio = if (totalEnergy > 0f) (vocalEnergy / totalEnergy).coerceIn(0f, 1f) else 0f

        var peakIdx = 0
        for (i in 1 until n) if (mags[i] > mags[peakIdx]) peakIdx = i
        val domFreq = peakIdx.toFloat() * srHz / (fft.size)

        val fftResult = FFTResult(mags, domFreq, maxM, maxM)
        val spectrumBands = computeLogBands(mags, srHz, fft.size)

        val state = _audioState.value
        val activeInstruments = instrumentDetector.detectActiveInstruments(fftResult, srHz, fft.size)
        val (instrument, confidence) = if (state.isAutoMode && state.soloInstrument == null) {
            instrumentDetector.detect(fftResult, srHz, fft.size)
        } else {
            Pair(state.detectedInstrument, state.confidence)
        }

        var targetEQ = state.currentEQ
        if (state.soloInstrument != null) {
            targetEQ = state.soloInstrument.soloEqBands
            applyGlobalEQ(targetEQ)
        } else if (state.isAutoMode && instrument != InstrumentType.UNKNOWN) {
            targetEQ = instrument.eqBands
            applyGlobalEQ(targetEQ)
        }

        _audioState.value = state.copy(
            spectrumBands = spectrumBands,
            detectedInstrument = instrument,
            activeDetectedInstruments = activeInstruments,
            confidence = confidence,
            dominantFrequencyHz = domFreq,
            amplitude = maxM,
            vocalRatio = vocalRatio,
            currentEQ = targetEQ
        )
    }

    fun toggleSoloInstrument(inst: InstrumentType) {
        val current = _audioState.value
        if (current.soloInstrument == inst) {
            // Un-solo
            _audioState.value = current.copy(
                soloInstrument = null,
                selectedInstruments = emptySet(),
                isAutoMode = true,
                activePresetMode = PresetMode.AUTO,
                currentEQ = EQPreset.BALANCED
            )
            applyGlobalEQ(EQPreset.BALANCED)
        } else {
            // Solo selected instrument: boost instrument band (+12dB), mute everything else (-12dB)
            val soloEQ = inst.soloEqBands
            _audioState.value = current.copy(
                soloInstrument = inst,
                selectedInstruments = setOf(inst),
                isAutoMode = false,
                activePresetMode = PresetMode.CUSTOM,
                currentEQ = soloEQ
            )
            applyGlobalEQ(soloEQ)
        }
    }

    fun setPresetMode(mode: PresetMode) {
        val current = _audioState.value
        if (mode == PresetMode.AUTO) {
            _audioState.value = current.copy(
                isAutoMode = true,
                selectedInstruments = emptySet(),
                activePresetMode = PresetMode.AUTO
            )
        } else {
            val eq = EQPreset.fromMode(mode)
            applyGlobalEQ(eq)
            _audioState.value = current.copy(
                isAutoMode = false,
                selectedInstruments = emptySet(),
                activePresetMode = mode,
                currentEQ = eq
            )
        }
    }

    fun setCustomEQBand(index: Int, gainDb: Int) {
        val currentEQ = _audioState.value.currentEQ
        val arr = currentEQ.toIntArray()
        if (index in arr.indices) {
            arr[index] = gainDb.coerceIn(-12, 12)
            val updatedEQ = EQPreset(
                b63Hz = arr[0], b125Hz = arr[1], b250Hz = arr[2], b500Hz = arr[3],
                b1kHz = arr[4], b2kHz = arr[5], b4kHz = arr[6], b8kHz = arr[7], b16kHz = arr[8]
            )
            applyGlobalEQ(updatedEQ)
            _audioState.value = _audioState.value.copy(
                isAutoMode = false,
                activePresetMode = PresetMode.CUSTOM,
                currentEQ = updatedEQ
            )
        }
    }

    fun setSelectedInstruments(instruments: Set<InstrumentType>) {
        if (instruments.isEmpty()) {
            val currentEQ = EQPreset.BALANCED
            applyGlobalEQ(currentEQ)
            _audioState.value = _audioState.value.copy(
                isAutoMode = false,
                selectedInstruments = emptySet(),
                detectedInstrument = InstrumentType.UNKNOWN,
                activePresetMode = PresetMode.BALANCED,
                currentEQ = currentEQ
            )
        } else {
            val compositeBands = IntArray(9)
            for (i in 0 until 9) {
                compositeBands[i] = instruments.maxOf { inst -> inst.eqBands.toIntArray()[i] }
            }
            val compositeEQ = EQPreset(
                compositeBands[0], compositeBands[1], compositeBands[2], compositeBands[3],
                compositeBands[4], compositeBands[5], compositeBands[6], compositeBands[7], compositeBands[8]
            )
            applyGlobalEQ(compositeEQ)
            _audioState.value = _audioState.value.copy(
                isAutoMode = false,
                selectedInstruments = instruments,
                detectedInstrument = instruments.first(),
                activePresetMode = PresetMode.CUSTOM,
                currentEQ = compositeEQ
            )
        }
    }

    fun setManualInstrument(instrument: InstrumentType) {
        setSelectedInstruments(setOf(instrument))
    }

    private fun applyGlobalEQ(preset: EQPreset) {
        val isEnhancer = _audioState.value.isEnhancerEnabled
        val targetFreqs = floatArrayOf(63f, 125f, 250f, 500f, 1000f, 2000f, 4000f, 8000f, 16000f)
        val gains = preset.toIntArray()
        val isoLoudnessBoost = if (isEnhancer) intArrayOf(10, 8, 4, 3, 4, 5, 5, 6, 6) else intArrayOf(0, 0, 0, 0, 0, 0, 0, 0, 0)

        equalizers.values.forEach { eq ->
            try {
                val n = eq.numberOfBands.toInt()
                if (n <= 0) return@forEach
                val range = eq.bandLevelRange

                for (band in 0 until n) {
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
                    val totalGainDb = gains[closestIdx] + isoLoudnessBoost[closestIdx]
                    val rawMilliBels = totalGainDb * 100
                    val milliBels = rawMilliBels.coerceIn(range[0].toInt(), range[1].toInt()).toShort()
                    eq.setBandLevel(band.toShort(), milliBels)
                }
            } catch (e: Exception) {
                Log.e(tag, "EQ apply failed: ${e.message}")
            }
        }
    }

    private fun getHardwareBandLevelsSummary(): String {
        if (equalizers.isEmpty()) return "None"
        val primaryEq = equalizers.values.firstOrNull() ?: return "Unavailable"
        return try {
            val numBands = primaryEq.numberOfBands.toInt()
            if (numBands <= 0) return "None"
            (0 until numBands).joinToString(", ") { b ->
                val freqHz = primaryEq.getCenterFreq(b.toShort()) / 1000
                val levelMb = primaryEq.getBandLevel(b.toShort())
                "${freqHz}Hz: ${levelMb}mB"
            }
        } catch (e: Exception) {
            "Error"
        }
    }

    private fun releaseAllEffects() {
        unregisterSessionReceiver()
        try { visualizer?.enabled = false; visualizer?.release() } catch (e: Exception) {}
        visualizer = null

        equalizers.values.forEach { try { it.enabled = false; it.release() } catch (e: Exception) {} }
        virtualizers.values.forEach { try { it.enabled = false; it.release() } catch (e: Exception) {} }
        bassBoosts.values.forEach { try { it.enabled = false; it.release() } catch (e: Exception) {} }
        loudnessEnhancers.values.forEach { try { it.enabled = false; it.release() } catch (e: Exception) {} }

        equalizers.clear()
        virtualizers.clear()
        bassBoosts.clear()
        loudnessEnhancers.clear()
        activeSessions.clear()
    }

    private fun computeLogBands(mags: FloatArray, sr: Int, fftSize: Int): FloatArray {
        val bands = FloatArray(64)
        if (sr <= 0 || mags.isEmpty()) return bands
        val logMin = Math.log10(20.0); val logMax = Math.log10(20000.0)
        for (b in 0 until 64) {
            val lo = Math.pow(10.0, logMin + b * (logMax - logMin) / 64)
            val hi = Math.pow(10.0, logMin + (b + 1) * (logMax - logMin) / 64)
            val binLo = (lo * fftSize / sr).toInt().coerceIn(0, mags.size - 1)
            val binHi = (hi * fftSize / sr).toInt().coerceIn(0, mags.size - 1)
            var sum = 0f; val count = maxOf(1, binHi - binLo + 1)
            for (i in binLo..binHi) sum += mags[i]
            bands[b] = sum / count
        }
        return bands
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, "Music Enhanced",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Music Enhanced Studio Equalizer Service" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Music Enhanced Studio Engine")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseAllEffects()
    }

    companion object {
        const val ACTION_START = "com.audioalchemy.START"
        const val ACTION_STOP  = "com.audioalchemy.STOP"
    }
}
