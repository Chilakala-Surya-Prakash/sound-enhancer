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
import com.audioalchemy.model.InstrumentType
import com.audioalchemy.ui.components.EQPanel
import com.audioalchemy.ui.components.InstrumentCard
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
    var isDiagExpanded by remember { mutableStateOf(false) }

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

    fun copyDiagnosticLog() {
        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("Music Enhanced Diagnostic", state.diagnosticLog)
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

            // Instrument Isolation Card
            InstrumentCard(
                instrument = state.detectedInstrument,
                selectedInstruments = state.selectedInstruments,
                confidence = state.confidence,
                dominantFreq = state.dominantFrequencyHz,
                modifier = Modifier.fillMaxWidth()
            )

            // Instrument Selection Chips (Support Click to Select / Click to Deselect)
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Instrument Audio Profiles",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = OnBackground
                    )
                    Text(
                        if (state.selectedInstruments.isNotEmpty()) "Composite Mode (${state.selectedInstruments.size})" else if (!state.isAutoMode) "Manual Mode" else "Auto Mode",
                        style = MaterialTheme.typography.labelSmall,
                        color = Primary
                    )
                }

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(InstrumentType.entries.filter { it != InstrumentType.UNKNOWN }) { inst ->
                        val isChipSelected = inst in state.selectedInstruments
                        FilterChip(
                            selected = isChipSelected,
                            onClick = { vm.toggleInstrument(inst) },
                            label = { Text("${inst.emoji} ${inst.displayName}") },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = inst.color.copy(alpha = 0.25f),
                                selectedLabelColor = inst.color
                            )
                        )
                    }
                }
            }

            // Collapsible Real-Time Audio Diagnostic Telemetry Card
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = SurfaceVar,
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Rounded.BugReport, null, tint = Secondary, modifier = Modifier.size(20.dp))
                            Text(
                                "Audio Diagnostics & Telemetry",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = OnBackground
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

                    AnimatedVisibility(visible = isDiagExpanded) {
                        Column(
                            modifier = Modifier.padding(top = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.Black.copy(alpha = 0.5f))
                                    .padding(12.dp)
                            ) {
                                Text(
                                    text = if (state.diagnosticLog.isNotEmpty()) state.diagnosticLog else "Awaiting live audio telemetry...",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    color = Primary,
                                    lineHeight = 16.sp
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
