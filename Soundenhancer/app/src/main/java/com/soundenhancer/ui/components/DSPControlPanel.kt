package com.audioalchemy.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.audioalchemy.model.SpatialMode
import com.audioalchemy.ui.theme.*
import kotlin.math.roundToInt

@Composable
fun DSPControlPanel(
    isEnhancerEnabled: Boolean,
    bassBoostStrength: Int,
    virtualizerStrength: Int,
    loudnessGainMb: Int,
    spatialMode: SpatialMode,
    onBassBoostChanged: (Int) -> Unit,
    onVirtualizerChanged: (Int) -> Unit,
    onSpatialModeSelected: (SpatialMode) -> Unit,
    onLoudnessGainChanged: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = SurfaceVar,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
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
                            .clip(CircleShape)
                            .background(Primary.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Rounded.Tune,
                            contentDescription = "DSP Tuning",
                            tint = Primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            "Hardware DSP Tuning",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = OnBackground
                        )
                        Text(
                            "Direct DSP Coprocessor Control",
                            style = MaterialTheme.typography.bodySmall,
                            color = Muted
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (isEnhancerEnabled) Primary.copy(alpha = 0.2f) else Surface,
                    border = BorderStroke(1.dp, if (isEnhancerEnabled) Primary.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.05f))
                ) {
                    Text(
                        if (isEnhancerEnabled) "DSP ACTIVE" else "DSP STANDBY",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (isEnhancerEnabled) Primary else Muted
                    )
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

            // 1. Bass Boost Controller
            DSPSection(
                icon = Icons.Rounded.Speaker,
                iconTint = Color(0xFFEF4444),
                title = "Sub-Bass Punch",
                badge = "${(bassBoostStrength / 10)}%",
                badgeColor = Color(0xFFEF4444)
            ) {
                Slider(
                    value = bassBoostStrength.toFloat(),
                    onValueChange = { onBassBoostChanged(it.roundToInt()) },
                    valueRange = 0f..1000f,
                    steps = 19,
                    colors = SliderDefaults.colors(
                        thumbColor = Color(0xFFEF4444),
                        activeTrackColor = Color(0xFFEF4444),
                        inactiveTrackColor = Color(0xFFEF4444).copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(
                        "Off" to 0,
                        "Subtle 40%" to 400,
                        "Punch 75%" to 750,
                        "Max 100%" to 1000
                    ).forEach { (label, strength) ->
                        val isSelected = (bassBoostStrength == strength)
                        FilterChip(
                            selected = isSelected,
                            onClick = { onBassBoostChanged(strength) },
                            label = { Text(label, fontSize = 11.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFFEF4444).copy(alpha = 0.25f),
                                selectedLabelColor = Color(0xFFEF4444)
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = if (isSelected) Color(0xFFEF4444) else Color.White.copy(alpha = 0.08f)
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

            // 2. 3D Spatial Virtualizer Controller
            DSPSection(
                icon = Icons.Rounded.Headphones,
                iconTint = Secondary,
                title = "3D Spatial Virtualizer",
                badge = "${(virtualizerStrength / 10)}%",
                badgeColor = Secondary
            ) {
                Slider(
                    value = virtualizerStrength.toFloat(),
                    onValueChange = { onVirtualizerChanged(it.roundToInt()) },
                    valueRange = 0f..1000f,
                    steps = 19,
                    colors = SliderDefaults.colors(
                        thumbColor = Secondary,
                        activeTrackColor = Secondary,
                        inactiveTrackColor = Secondary.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SpatialMode.entries.forEach { mode ->
                        val isSelected = (spatialMode == mode)
                        FilterChip(
                            selected = isSelected,
                            onClick = { onSpatialModeSelected(mode) },
                            label = {
                                Text(
                                    mode.displayName,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Secondary.copy(alpha = 0.25f),
                                selectedLabelColor = Secondary
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = if (isSelected) Secondary else Color.White.copy(alpha = 0.08f)
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.06f))

            // 3. Dynamic Loudness & Studio Gain Controller
            DSPSection(
                icon = Icons.Rounded.VolumeUp,
                iconTint = Accent,
                title = "Loudness Enhancer",
                badge = "+${"%.1f".format(loudnessGainMb / 100.0)} dB",
                badgeColor = Accent
            ) {
                Slider(
                    value = loudnessGainMb.toFloat(),
                    onValueChange = { onLoudnessGainChanged(it.roundToInt()) },
                    valueRange = 0f..600f,
                    steps = 11,
                    colors = SliderDefaults.colors(
                        thumbColor = Accent,
                        activeTrackColor = Accent,
                        inactiveTrackColor = Accent.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(
                        "0.0 dB" to 0,
                        "+2.0 dB" to 200,
                        "+3.5 dB" to 350,
                        "+5.0 dB" to 500
                    ).forEach { (label, gainMb) ->
                        val isSelected = (loudnessGainMb == gainMb)
                        FilterChip(
                            selected = isSelected,
                            onClick = { onLoudnessGainChanged(gainMb) },
                            label = { Text(label, fontSize = 11.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Accent.copy(alpha = 0.25f),
                                selectedLabelColor = Accent
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = if (isSelected) Accent else Color.White.copy(alpha = 0.08f)
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DSPSection(
    icon: ImageVector,
    iconTint: Color,
    title: String,
    badge: String,
    badgeColor: Color,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    color = OnSurface
                )
            }

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = badgeColor.copy(alpha = 0.15f),
                border = BorderStroke(1.dp, badgeColor.copy(alpha = 0.35f))
            ) {
                Text(
                    badge,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = badgeColor
                )
            }
        }

        content()
    }
}
