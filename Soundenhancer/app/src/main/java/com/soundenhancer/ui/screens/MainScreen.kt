package com.audioalchemy.ui.screens

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
            Engine Status: ${if (state.isListening) "Listening (Active)" else "Idle"}
            Studio Enhancer: ${if (state.isEnhancerEnabled) "ON" else "OFF"}
            Preset Mode: ${state.activePresetMode.displayName}
            Dominant Frequency: ${state.dominantFrequencyHz.toInt()}Hz
            Peak Amplitude: ${"%.3f".format(state.amplitude)}
            Vocal Ratio: ${"%.1f".format(state.vocalRatio * 100)}%
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
        if (state.isListening) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .align(Alignment.TopCenter)
                    .graphicsLayer { alpha = 0.99f }
                    .background(
                        Brush.radialGradient(
                            listOf(
                                state.detectedInstrument.color.copy(alpha = 0.15f),
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
                .padding(horizontal = 18.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {

            // Top Header with Separate Audio Enhancer Button
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
                        Text(
                            "Music Enhanced",
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                            color = OnBackground
                        )
                        Text(
                            "Studio Audio Engine",
                            style = MaterialTheme.typography.bodySmall,
                            color = Muted
                        )
                    }

                    // Power Button
                    val pulseAnim = rememberInfiniteTransition(label = "pulse")
                    val pulseScale by pulseAnim.animateFloat(
                        initialValue = 1f, targetValue = 1.1f,
                        animationSpec = infiniteRepeatable(tween(1000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
                        label = "pulseScale"
                    )

                    Box(contentAlignment = Alignment.Center) {
                        if (state.isListening) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .scale(pulseScale)
                                    .clip(CircleShape)
                                    .background(Primary.copy(alpha = 0.25f))
                            )
                        }
                        FloatingActionButton(
                            onClick = { handlePowerToggle() },
                            modifier = Modifier.size(46.dp),
                            containerColor = if (state.isListening) Primary else SurfaceVar,
                            contentColor = if (state.isListening) Color.White else Muted,
                            shape = CircleShape,
                            elevation = FloatingActionButtonDefaults.elevation(
                                defaultElevation = if (state.isListening) 8.dp else 2.dp
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

                // Dedicated Top Audio Enhancer Master Switch
                Surface(
                    onClick = { vm.setEnhancerEnabled(!state.isEnhancerEnabled) },
                    shape = RoundedCornerShape(16.dp),
                    color = if (state.isEnhancerEnabled) Primary.copy(alpha = 0.18f) else SurfaceVar,
                    border = BorderStroke(
                        width = 1.5.dp,
                        color = if (state.isEnhancerEnabled) Primary else Color.White.copy(alpha = 0.08f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                Icons.Rounded.AutoAwesome,
                                contentDescription = "Audio Enhancer",
                                tint = if (state.isEnhancerEnabled) Primary else Muted,
                                modifier = Modifier.size(22.dp)
                            )
                            Column {
                                Text(
                                    "Audio Enhancer",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = if (state.isEnhancerEnabled) OnBackground else Muted
                                )
                                Text(
                                    if (state.isEnhancerEnabled) "Studio Dynamics • ISO 226 Active" else "Tap to enable studio clarity",
                                    fontSize = 11.sp,
                                    color = Muted
                                )
                            }
                        }

                        Switch(
                            checked = state.isEnhancerEnabled,
                            onCheckedChange = { vm.setEnhancerEnabled(it) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Primary,
                                checkedTrackColor = Primary.copy(alpha = 0.4f)
                            )
                        )
                    }
                }
            }

            // Spectrum Visualizer
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Surface)
                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(20.dp))
                    .padding(12.dp)
            ) {
                if (state.isListening && state.amplitude > 0.01f) {
                    SpectrumVisualizer(
                        bands = state.spectrumBands,
                        peakColor = state.detectedInstrument.color
                    )
                } else {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Rounded.GraphicEq, null, tint = Muted, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.height(6.dp))
                        Text(
                            if (state.isListening) "Play music in Amazon Music, Spotify, etc..." else "Engine Inactive",
                            color = Muted,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

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
                border = BorderStroke(1.dp, if (isDiagExpanded) Primary.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.08f)),
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
                                    .background(Primary.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Rounded.BugReport,
                                    contentDescription = null,
                                    tint = Primary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    "Audio Diagnostics & Telemetry",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = OnBackground
                                )
                                Text(
                                    if (state.isListening && state.amplitude > 0.01f) "Real-time DSP stream active"
                                    else if (state.isListening) "DSP listening • Awaiting audio"
                                    else "Engine Standby",
                                    fontSize = 11.sp,
                                    color = if (state.isListening && state.amplitude > 0.01f) SpecHighMid else Muted
                                )
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // Live Status Badge
                            val statusBg = if (state.isListening && state.amplitude > 0.01f) Color(0xFF10B981)
                                           else if (state.isListening) Color(0xFFF59E0B)
                                           else Color(0xFF6B7280)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(statusBg.copy(alpha = 0.2f))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = if (state.isListening && state.amplitude > 0.01f) "LIVE"
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
                            value = state.activePresetMode.displayName.take(6),
                            valueColor = Primary,
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
                                    .background(Color(0xFF0A0C10))
                                    .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(14.dp))
                                    .padding(14.dp)
                            ) {
                                Text(
                                    text = if (state.diagnosticLog.isNotEmpty()) state.diagnosticLog else "Awaiting live audio telemetry...\nPlay a track in Spotify, YouTube Music, Apple Music, or Poweramp to stream hardware DSP metrics.",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.5.sp,
                                    color = Color(0xFF34D399),
                                    lineHeight = 17.sp
                                )
                            }

                            Button(
                                onClick = { copyDiagnosticLog() },
                                colors = ButtonDefaults.buttonColors(containerColor = Primary),
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
