package com.audioalchemy.ui.screens

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.audioalchemy.audio.TestTrackMode
import com.audioalchemy.ui.components.DSPControlPanel
import com.audioalchemy.ui.components.EQPanel
import com.audioalchemy.ui.components.PresetGrid
import com.audioalchemy.ui.components.SpectrumVisualizer
import com.audioalchemy.ui.theme.*
import com.audioalchemy.viewmodel.AudioViewModel

@Composable
fun MainScreen(
    modifier: Modifier = Modifier,
    vm: AudioViewModel = viewModel()
) {
    val context = LocalContext.current
    val state by vm.audioState.collectAsStateWithLifecycle()

    val permissions = remember {
        buildList {
            add(Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
                add(Manifest.permission.POST_NOTIFICATIONS)
        }.toTypedArray()
    }

    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        vm.startService()
    }

    // Audio file picker launcher for local playback
    val filePickerLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val fileName = queryFileName(context, uri) ?: "Selected Track"
            vm.playUserAudio(uri, fileName)
            Toast.makeText(context, "Loaded: $fileName", Toast.LENGTH_SHORT).show()
        }
    }

    fun handlePowerToggle() {
        if (state.isListening) {
            vm.stopService()
        } else {
            val recordAudioGranted = ContextCompat.checkSelfPermission(
                context, Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
            val notifGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(
                    context, Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            } else true

            if (recordAudioGranted && notifGranted) {
                vm.startService()
            } else {
                permLauncher.launch(permissions)
            }
        }
    }

    var isDiagExpanded by remember { mutableStateOf(false) }

    fun copyDiagnosticLog() {
        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val report = if (state.diagnosticLog.isNotEmpty()) {
            state.diagnosticLog
        } else {
            """
            [SOUND ENHANCER STUDIO DIAGNOSTIC REPORT]
            Engine Status: ${if (state.isListening) "Active" else "Standby"}
            Hardware DSP Attachment: ${if (state.hasDirectDspAttachment) "Guaranteed Direct Session #${state.activeSessionId}" else "Global Session #0"}
            Studio Enhancer: ${if (state.isEnhancerEnabled) "ONLINE" else "BYPASS"}
            DSP Levels: Sub-Bass ${state.bassBoostStrength / 10}% | Virtualizer ${state.virtualizerStrength / 10}% (${state.spatialMode.displayName}) | Loudness +${"%.1f".format(state.loudnessGainMb / 100.0)}dB
            Target Preset: ${state.activePresetMode.displayName}
            Peak Amplitude: ${"%.3f".format(state.amplitude)}
            Dominant Frequency: ${state.dominantFrequencyHz.toInt()}Hz
            EQ Band Levels: ${state.currentEQ.toIntArray().joinToString(", ") { "${it}dB" }}
            """.trimIndent()
        }
        val clip = ClipData.newPlainText("Sound Enhancer Diagnostic", report)
        cm.setPrimaryClip(clip)
        Toast.makeText(context, "Diagnostic Report copied to Clipboard!", Toast.LENGTH_SHORT).show()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Subtle ambient emerald radial glow when engine is running
        if (state.isListening) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .align(Alignment.TopCenter)
                    .graphicsLayer { alpha = 0.99f }
                    .background(
                        Brush.radialGradient(
                            listOf(
                                EmeraldPrimary.copy(alpha = 0.12f),
                                Color.Transparent
                            )
                        )
                    )
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 22.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {

            // Header Section
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "Sound Enhancer",
                                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                                color = CreamWhite
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(EmeraldDeep.copy(alpha = 0.6f))
                                    .border(1.dp, EmeraldBright.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    "DSP V2",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldLight
                                )
                            }
                        }
                        Text(
                            "Studio Acoustic Hardware Engine",
                            style = MaterialTheme.typography.bodySmall,
                            color = CreamMuted
                        )
                    }

                    // Power Button
                    val pulseAnim = rememberInfiniteTransition(label = "pulse")
                    val pulseScale by pulseAnim.animateFloat(
                        initialValue = 1f, targetValue = 1.08f,
                        animationSpec = infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
                        label = "pulseScale"
                    )

                    Box(contentAlignment = Alignment.Center) {
                        if (state.isListening) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .scale(pulseScale)
                                    .clip(CircleShape)
                                    .background(EmeraldBright.copy(alpha = 0.22f))
                            )
                        }
                        FloatingActionButton(
                            onClick = { handlePowerToggle() },
                            modifier = Modifier.size(46.dp),
                            containerColor = if (state.isListening) EmeraldBright else SurfaceVar,
                            contentColor = if (state.isListening) Color(0xFF063323) else Muted,
                            shape = CircleShape,
                            elevation = FloatingActionButtonDefaults.elevation(
                                defaultElevation = if (state.isListening) 6.dp else 2.dp
                            )
                        ) {
                            Icon(
                                Icons.Rounded.PowerSettingsNew,
                                contentDescription = if (state.isListening) "Stop" else "Start",
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }

                // Master Audio Enhancer Switch
                Surface(
                    onClick = { vm.setEnhancerEnabled(!state.isEnhancerEnabled) },
                    shape = RoundedCornerShape(18.dp),
                    color = if (state.isEnhancerEnabled) SurfaceVar else Surface,
                    border = BorderStroke(
                        width = 1.5.dp,
                        color = if (state.isEnhancerEnabled) EmeraldBright else WoodGold.copy(alpha = 0.15f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(if (state.isEnhancerEnabled) EmeraldBright.copy(alpha = 0.2f) else SurfaceLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Rounded.AutoAwesome,
                                    contentDescription = "Audio Enhancer",
                                    tint = if (state.isEnhancerEnabled) EmeraldBright else Muted,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    "Audio Enhancer",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = if (state.isEnhancerEnabled) CreamWhite else Muted
                                )
                                Text(
                                    if (state.isEnhancerEnabled) "Hardware DSP Online • Headroom Guard Active" else "Tap to engage 3D stage and sub-bass",
                                    fontSize = 11.5.sp,
                                    color = if (state.isEnhancerEnabled) EmeraldLight else Muted
                                )
                            }
                        }

                        Switch(
                            checked = state.isEnhancerEnabled,
                            onCheckedChange = { vm.setEnhancerEnabled(it) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = EmeraldBright,
                                checkedTrackColor = EmeraldDeep.copy(alpha = 0.8f),
                                uncheckedThumbColor = Muted,
                                uncheckedTrackColor = SurfaceLight
                            )
                        )
                    }
                }
            }

            // In-App Audio Engine & Calibration Deck
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = SurfaceVar,
                border = BorderStroke(1.dp, WoodGold.copy(alpha = 0.22f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(WoodGold.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Rounded.GraphicEq,
                                    contentDescription = "Calibration Engine",
                                    tint = WoodGold,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column {
                                Text(
                                    "Built-in Audio & Calibration Deck",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = CreamWhite
                                )
                                Text(
                                    "Direct Session DSP • Immediate Audible Proof",
                                    fontSize = 11.sp,
                                    color = CreamMuted
                                )
                            }
                        }

                        // Play/Pause button for local track
                        if (state.localTrackMode != TestTrackMode.NONE) {
                            FilledIconButton(
                                onClick = { vm.toggleLocalPlayPause() },
                                colors = IconButtonDefaults.filledIconButtonColors(
                                    containerColor = if (state.isLocalPlaying) EmeraldBright else WoodGold
                                ),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    if (state.isLocalPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                                    contentDescription = "Play/Pause",
                                    tint = Color(0xFF063323),
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }

                    // Current track readout
                    if (state.localTrackMode != TestTrackMode.NONE) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Surface)
                                .border(1.dp, EmeraldBright.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(if (state.isLocalPlaying) EmeraldBright else Muted)
                                    )
                                    Text(
                                        text = state.localTrackTitle,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = CreamWhite,
                                        maxLines = 1
                                    )
                                }
                                Text(
                                    text = "DSP Active",
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldBright
                                )
                            }
                        }
                    }

                    // Test track source selection chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Pink Noise Chip
                        val isPinkSelected = (state.localTrackMode == TestTrackMode.PINK_NOISE)
                        FilterChip(
                            selected = isPinkSelected,
                            onClick = { vm.playPinkNoise() },
                            label = { Text("Pink Noise", fontSize = 11.sp, fontWeight = if (isPinkSelected) FontWeight.Bold else FontWeight.Medium) },
                            leadingIcon = {
                                Icon(
                                    Icons.Rounded.Grain,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = if (isPinkSelected) EmeraldBright else WoodGold
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldDeep.copy(alpha = 0.6f),
                                selectedLabelColor = EmeraldLight
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isPinkSelected,
                                borderColor = if (isPinkSelected) EmeraldBright else WoodGold.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.weight(1f)
                        )

                        // Sine Sweep Chip
                        val isSweepSelected = (state.localTrackMode == TestTrackMode.SINE_SWEEP)
                        FilterChip(
                            selected = isSweepSelected,
                            onClick = { vm.playSineSweep() },
                            label = { Text("Sine Sweep", fontSize = 11.sp, fontWeight = if (isSweepSelected) FontWeight.Bold else FontWeight.Medium) },
                            leadingIcon = {
                                Icon(
                                    Icons.Rounded.Waves,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = if (isSweepSelected) EmeraldBright else WoodGold
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldDeep.copy(alpha = 0.6f),
                                selectedLabelColor = EmeraldLight
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSweepSelected,
                                borderColor = if (isSweepSelected) EmeraldBright else WoodGold.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.weight(1f)
                        )

                        // Open User Audio File Chip
                        val isUserFileSelected = (state.localTrackMode == TestTrackMode.USER_FILE)
                        FilterChip(
                            selected = isUserFileSelected,
                            onClick = { filePickerLauncher.launch("audio/*") },
                            label = { Text("Load File", fontSize = 11.sp, fontWeight = if (isUserFileSelected) FontWeight.Bold else FontWeight.Medium) },
                            leadingIcon = {
                                Icon(
                                    Icons.Rounded.FolderOpen,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = if (isUserFileSelected) EmeraldBright else WoodGold
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldDeep.copy(alpha = 0.6f),
                                selectedLabelColor = EmeraldLight
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isUserFileSelected,
                                borderColor = if (isUserFileSelected) EmeraldBright else WoodGold.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Real-Time Spectrum Visualizer
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Surface)
                    .border(1.dp, WoodGold.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
                    .padding(12.dp)
            ) {
                if (state.isListening && state.amplitude > 0.005f) {
                    SpectrumVisualizer(
                        bands = state.spectrumBands,
                        peakColor = EmeraldBright
                    )
                } else {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Rounded.GraphicEq, null, tint = WoodGold.copy(alpha = 0.4f), modifier = Modifier.size(36.dp))
                        Spacer(Modifier.height(6.dp))
                        Text(
                            if (state.isListening) "Tap Pink Noise, Sine Sweep, or play music..." else "DSP Engine Standby",
                            color = CreamMuted,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

            // Hardware DSP Master Tuning (BassBoost, Virtualizer, LoudnessEnhancer)
            DSPControlPanel(
                isEnhancerEnabled = state.isEnhancerEnabled,
                bassBoostStrength = state.bassBoostStrength,
                virtualizerStrength = state.virtualizerStrength,
                loudnessGainMb = state.loudnessGainMb,
                spatialMode = state.spatialMode,
                onBassBoostChanged = { strength -> vm.setBassBoostStrength(strength) },
                onVirtualizerChanged = { strength -> vm.setVirtualizerStrength(strength) },
                onSpatialModeSelected = { mode -> vm.setSpatialMode(mode) },
                onLoudnessGainChanged = { gainMb -> vm.setLoudnessGain(gainMb) },
                modifier = Modifier.fillMaxWidth()
            )

            // 9-Band Interactive Graphic Equalizer Panel
            EQPanel(
                preset = state.currentEQ,
                onBandGainChanged = { bandIdx, gainDb ->
                    vm.setCustomBandLevel(bandIdx, gainDb)
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Preset Grid
            PresetGrid(
                selectedMode = state.activePresetMode,
                onModeSelected = { mode ->
                    vm.setPresetMode(mode)
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Real-Time Audio Diagnostics & Telemetry Card
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = SurfaceVar,
                border = BorderStroke(1.dp, if (isDiagExpanded) EmeraldBright.copy(alpha = 0.5f) else WoodGold.copy(alpha = 0.15f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Header Bar (Clickable to Expand/Collapse)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isDiagExpanded = !isDiagExpanded },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(EmeraldDeep.copy(alpha = 0.5f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Rounded.BugReport,
                                    contentDescription = null,
                                    tint = EmeraldBright,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    "Audio Diagnostics & Telemetry",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = CreamWhite
                                )
                                Text(
                                    if (state.hasDirectDspAttachment) "Direct DSP active • Session #${state.activeSessionId}"
                                    else if (state.isListening && state.amplitude > 0.01f) "Real-time DSP stream active"
                                    else if (state.isListening) "DSP listening • Awaiting audio"
                                    else "Engine Standby",
                                    fontSize = 11.sp,
                                    color = if (state.isListening) EmeraldLight else Muted
                                )
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            val statusBg = if (state.hasDirectDspAttachment || (state.isListening && state.amplitude > 0.01f)) EmeraldBright
                                           else if (state.isListening) WoodGold
                                           else Color(0xFF6B7280)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(statusBg.copy(alpha = 0.2f))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = if (state.hasDirectDspAttachment || (state.isListening && state.amplitude > 0.01f)) "ACTIVE"
                                           else if (state.isListening) "WAITING"
                                           else "IDLE",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = statusBg
                                )
                            }

                            IconButton(
                                onClick = { isDiagExpanded = !isDiagExpanded },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    if (isDiagExpanded) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore,
                                    contentDescription = "Toggle Diagnostics",
                                    tint = Muted
                                )
                            }
                        }
                    }

                    // Quick Telemetry Metric Chips
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val sessionText = if (state.activeSessionId != 0) "Sess #${state.activeSessionId}" else "Global #0"
                        TelemetryChip(
                            title = "SESSION",
                            value = sessionText,
                            valueColor = if (state.activeSessionId != 0) EmeraldBright else CreamWhite,
                            modifier = Modifier.weight(1f)
                        )

                        TelemetryChip(
                            title = "PEAK AMP",
                            value = "${(state.amplitude * 100).toInt()}%",
                            modifier = Modifier.weight(1f)
                        )

                        TelemetryChip(
                            title = "DOM FREQ",
                            value = if (state.dominantFrequencyHz > 0) "${state.dominantFrequencyHz.toInt()}Hz" else "--",
                            modifier = Modifier.weight(1f)
                        )

                        TelemetryChip(
                            title = "PRESET",
                            value = state.activePresetMode.displayName.take(7),
                            valueColor = EmeraldBright,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        TelemetryChip(
                            title = "SUB-BASS",
                            value = "${(state.bassBoostStrength / 10)}%",
                            valueColor = EmeraldBright,
                            modifier = Modifier.weight(1f)
                        )

                        TelemetryChip(
                            title = "3D STAGE",
                            value = "${(state.virtualizerStrength / 10)}%",
                            valueColor = WoodGold,
                            modifier = Modifier.weight(1f)
                        )

                        TelemetryChip(
                            title = "LOUD GAIN",
                            value = "+${"%.1f".format(state.loudnessGainMb / 100.0)}dB",
                            valueColor = Accent,
                            modifier = Modifier.weight(1f)
                        )

                        TelemetryChip(
                            title = "DSP ENGINE",
                            value = if (state.isEnhancerEnabled) "ONLINE" else "BYPASS",
                            valueColor = if (state.isEnhancerEnabled) EmeraldBright else Muted,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Expanded Telemetry Terminal Console & Copy Action
                    AnimatedVisibility(
                        visible = isDiagExpanded,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        Column(
                            modifier = Modifier.padding(top = 14.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color(0xFF0F0B09))
                                    .border(1.dp, WoodGold.copy(alpha = 0.2f), RoundedCornerShape(14.dp))
                                    .padding(14.dp)
                            ) {
                                Text(
                                    text = if (state.diagnosticLog.isNotEmpty()) state.diagnosticLog else "Awaiting live audio telemetry...\nTap Pink Noise, Sine Sweep, or play in Spotify/YouTube Music to stream hardware DSP metrics.",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.5.sp,
                                    color = EmeraldLight,
                                    lineHeight = 17.sp
                                )
                            }

                            Button(
                                onClick = { copyDiagnosticLog() },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldBright, contentColor = Color(0xFF063323)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Rounded.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Copy Diagnostic Report", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun queryFileName(context: Context, uri: Uri): String? {
    var name: String? = null
    try {
        val cursor = context.contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            if (it.moveToFirst()) {
                val index = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index != -1) {
                    name = it.getString(index)
                }
            }
        }
    } catch (e: Exception) {
        // Fallback to URI path
    }
    return name ?: uri.lastPathSegment
}

@Composable
private fun TelemetryChip(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: Color = OnSurface
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color.White.copy(alpha = 0.04f))
            .padding(horizontal = 6.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = title,
                fontSize = 9.sp,
                fontWeight = FontWeight.SemiBold,
                color = Muted
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = value,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = valueColor,
                maxLines = 1
            )
        }
    }
}
