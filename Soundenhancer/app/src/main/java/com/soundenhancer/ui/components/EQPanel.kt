package com.audioalchemy.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt
import com.audioalchemy.model.EQPreset
import com.audioalchemy.ui.theme.*

@Composable
fun EQPanel(
    preset: EQPreset,
    onBandGainChanged: ((bandIndex: Int, gainDb: Int) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val labels = listOf("63", "125", "250", "500", "1k", "2k", "4k", "8k", "16k")
    val gains  = preset.toIntArray()

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(SurfaceVar)
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(24.dp))
            .padding(vertical = 18.dp, horizontal = 8.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Equalizer",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = OnSurface
                )
                Text(
                    "9 Bands",
                    style = MaterialTheme.typography.labelSmall,
                    color = Muted
                )
            }

            Spacer(Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.Bottom
            ) {
                labels.forEachIndexed { idx, label ->
                    EQBandColumn(
                        index = idx,
                        label = label,
                        gainDb = gains[idx],
                        onGainChanged = { gain -> onBandGainChanged?.invoke(idx, gain) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun EQBandColumn(
    index: Int,
    label: String,
    gainDb: Int,
    onGainChanged: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val animatedGain by animateFloatAsState(
        targetValue = gainDb.toFloat(),
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "eq_gain_$index"
    )

    val color = when {
        gainDb > 3  -> Primary
        gainDb > 0  -> Secondary
        gainDb < -3 -> Color(0xFFEF4444)
        gainDb < 0  -> Color(0xFFF97316)
        else        -> Muted
    }

    var columnHeightPx by remember { mutableStateOf(1f) }
    val currentGainDb by rememberUpdatedState(gainDb)
    val currentOnGainChanged by rememberUpdatedState(onGainChanged)

    Column(
        modifier = modifier.padding(horizontal = 1.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = if (gainDb > 0) "+$gainDb" else "$gainDb",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = if (gainDb != 0) color else Muted,
            textAlign = TextAlign.Center
        )

        Spacer(Modifier.height(8.dp))

        Box(
            modifier = Modifier
                .width(28.dp)
                .height(160.dp)
                .onGloballyPositioned { columnHeightPx = it.size.height.toFloat() }
                .pointerInput(index) {
                    var accumulatedGain = currentGainDb.toFloat()
                    detectVerticalDragGestures(
                        onDragStart = {
                            accumulatedGain = currentGainDb.toFloat()
                        },
                        onVerticalDrag = { change, dragAmount ->
                            change.consume()
                            val stepPx = if (columnHeightPx > 0f) columnHeightPx / 24f else 6.6f
                            accumulatedGain += (-dragAmount / stepPx)
                            val newGain = accumulatedGain.roundToInt().coerceIn(-12, 12)
                            if (newGain != currentGainDb) {
                                currentOnGainChanged(newGain)
                            }
                        }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White.copy(alpha = 0.12f))
            )

            Box(
                modifier = Modifier
                    .width(16.dp)
                    .height(1.5.dp)
                    .align(Alignment.Center)
                    .background(Color.White.copy(alpha = 0.25f))
            )

            val normalizedFraction = ((animatedGain + 12f) / 24f).coerceIn(0f, 1f)

            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(),
                contentAlignment = Alignment.BottomCenter
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight(normalizedFraction)
                        .width(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(color, color.copy(alpha = 0.4f))
                            )
                        )
                )
            }

            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxHeight(normalizedFraction)
            ) {
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .align(Alignment.TopCenter)
                        .clip(CircleShape)
                        .background(Surface)
                        .border(2.dp, color, CircleShape)
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = Muted,
            textAlign = TextAlign.Center
        )
    }
}
