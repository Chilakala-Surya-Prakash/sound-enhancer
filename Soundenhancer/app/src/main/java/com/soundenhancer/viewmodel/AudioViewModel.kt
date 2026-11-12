package com.audioalchemy.viewmodel

import android.app.Application
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.net.Uri
import android.os.IBinder
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.audioalchemy.audio.TestTrackMode
import com.audioalchemy.model.AudioState
import com.audioalchemy.model.EQPreset
import com.audioalchemy.model.PresetMode
import com.audioalchemy.model.SpatialMode
import com.audioalchemy.service.AudioAlchemyService
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*

@OptIn(ExperimentalCoroutinesApi::class)
class AudioViewModel(application: Application) : AndroidViewModel(application) {

    private var service: AudioAlchemyService? = null
    private var bound = false

    private val _localAudioState = MutableStateFlow(AudioState())
    private val _serviceFlow = MutableStateFlow<StateFlow<AudioState>?>(null)

    val audioState: StateFlow<AudioState> = _serviceFlow
        .flatMapLatest { flow -> flow ?: _localAudioState }
        .stateIn(viewModelScope, SharingStarted.Eagerly, AudioState())

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            val s = (binder as AudioAlchemyService.LocalBinder).getService()
            service = s
            bound = true
            _serviceFlow.value = s.audioState
        }
        override fun onServiceDisconnected(name: ComponentName?) {
            bound = false
            service = null
            _serviceFlow.value = null
            _localAudioState.value = AudioState(isListening = false)
        }
    }

    fun startService() {
        val ctx = getApplication<Application>()
        val intent = Intent(ctx, AudioAlchemyService::class.java).apply {
            action = AudioAlchemyService.ACTION_START
        }
        ctx.startForegroundService(intent)
        ctx.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        _localAudioState.value = _localAudioState.value.copy(isListening = true)
    }

    fun stopService() {
        val ctx = getApplication<Application>()
        if (bound) {
            try { ctx.unbindService(connection) } catch (e: Exception) {}
            bound = false
        }
        val intent = Intent(ctx, AudioAlchemyService::class.java).apply {
            action = AudioAlchemyService.ACTION_STOP
        }
        ctx.startService(intent)
        _serviceFlow.value = null
        _localAudioState.value = AudioState(isListening = false)
    }

    // --- In-App Audio Engine / Test Calibration Methods ---
    fun playPinkNoise() {
        if (!audioState.value.isListening) startService()
        service?.playPinkNoise() ?: run {
            _localAudioState.value = _localAudioState.value.copy(
                isLocalPlaying = true,
                localTrackMode = TestTrackMode.PINK_NOISE,
                localTrackTitle = "Pink Noise (EQ Calibration Tool)"
            )
        }
    }

    fun playSineSweep() {
        if (!audioState.value.isListening) startService()
        service?.playSineSweep() ?: run {
            _localAudioState.value = _localAudioState.value.copy(
                isLocalPlaying = true,
                localTrackMode = TestTrackMode.SINE_SWEEP,
                localTrackTitle = "Harmonic Sweep (20Hz - 20kHz)"
            )
        }
    }

    fun playUserAudio(uri: Uri, fileName: String) {
        if (!audioState.value.isListening) startService()
        service?.playUserAudio(uri, fileName) ?: run {
            _localAudioState.value = _localAudioState.value.copy(
                isLocalPlaying = true,
                localTrackMode = TestTrackMode.USER_FILE,
                localTrackTitle = fileName
            )
        }
    }

    fun toggleLocalPlayPause() {
        service?.toggleLocalPlayPause() ?: run {
            _localAudioState.value = _localAudioState.value.copy(
                isLocalPlaying = !_localAudioState.value.isLocalPlaying
            )
        }
    }

    fun stopLocalPlayback() {
        service?.stopLocal() ?: run {
            _localAudioState.value = _localAudioState.value.copy(
                isLocalPlaying = false,
                localTrackMode = TestTrackMode.NONE,
                localTrackTitle = ""
            )
        }
    }

    // --- DSP Control Methods ---
    fun setEnhancerEnabled(enabled: Boolean) {
        service?.setEnhancerEnabled(enabled) ?: run {
            _localAudioState.value = _localAudioState.value.copy(isEnhancerEnabled = enabled)
        }
    }

    fun setBassBoostStrength(strength: Int) {
        service?.setBassBoostStrength(strength) ?: run {
            _localAudioState.value = _localAudioState.value.copy(bassBoostStrength = strength.coerceIn(0, 1000))
        }
    }

    fun setVirtualizerStrength(strength: Int) {
        service?.setVirtualizerStrength(strength) ?: run {
            _localAudioState.value = _localAudioState.value.copy(virtualizerStrength = strength.coerceIn(0, 1000))
        }
    }

    fun setSpatialMode(mode: SpatialMode) {
        service?.setSpatialMode(mode) ?: run {
            _localAudioState.value = _localAudioState.value.copy(
                spatialMode = mode,
                virtualizerStrength = mode.defaultStrength
            )
        }
    }

    fun setLoudnessGain(gainMb: Int) {
        service?.setLoudnessGain(gainMb) ?: run {
            _localAudioState.value = _localAudioState.value.copy(loudnessGainMb = gainMb.coerceIn(0, 1000))
        }
    }

    fun setPresetMode(mode: PresetMode) {
        service?.setPresetMode(mode) ?: run {
            val eq = EQPreset.fromMode(mode)
            _localAudioState.value = _localAudioState.value.copy(
                isAutoMode = false,
                activePresetMode = mode,
                currentEQ = eq
            )
        }
    }

    fun setCustomBandLevel(index: Int, gainDb: Int) {
        service?.setCustomEQBand(index, gainDb) ?: run {
            val arr = _localAudioState.value.currentEQ.toIntArray()
            if (index in arr.indices) {
                arr[index] = gainDb.coerceIn(-12, 12)
                val eq = EQPreset(
                    b63Hz = arr[0], b125Hz = arr[1], b250Hz = arr[2], b500Hz = arr[3],
                    b1kHz = arr[4], b2kHz = arr[5], b4kHz = arr[6], b8kHz = arr[7], b16kHz = arr[8]
                )
                _localAudioState.value = _localAudioState.value.copy(
                    isAutoMode = false,
                    activePresetMode = PresetMode.CUSTOM,
                    currentEQ = eq
                )
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        if (bound) {
            try { getApplication<Application>().unbindService(connection) } catch (e: Exception) {}
            bound = false
        }
    }
}
