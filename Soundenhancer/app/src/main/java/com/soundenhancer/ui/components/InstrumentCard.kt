package com.audioalchemy.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.audioalchemy.model.InstrumentType
import com.audioalchemy.ui.theme.*

@Composable
fun InstrumentCard(
    instrument: InstrumentType,
    selectedInstruments: Set<InstrumentType> = emptySet(),
    confidence: Float,
    dominantFreq: Float,
    modifier: Modifier = Modifier
) {
    val emojis = when {
        selectedInstruments.size > 1 -> selectedInstruments.joinToString(" ") { it.emoji }
        selectedInstruments.size == 1 -> selectedInstruments.first().emoji
        instrument != InstrumentType.UNKNOWN -> instrument.emoji
        else -> "🎵"
    }

    val title = when {
        selectedInstruments.size > 1 -> selectedInstruments.joinToString(" + ") { it.displayName }
        selectedInstruments.size == 1 -> selectedInstruments.first().displayName
        instrument != InstrumentType.UNKNOWN -> instrument.displayName
        else -> "Neutral / Flat Output"
    }

    val subtitle = when {
        selectedInstruments.size > 1 -> "Multi-Instrument Composite Profile Active"
        selectedInstruments.size == 1 -> "Studio Profile Active"
        instrument != InstrumentType.UNKNOWN -> "AI Dynamic Auto-Detection Active"
        else -> "No Instrument Profile Applied"
    }

    val cardColor = when {
        selectedInstruments.isNotEmpty() -> selectedInstruments.first().color
        instrument != InstrumentType.UNKNOWN -> instrument.color
        else -> Muted
    }

    val pulse = rememberInfiniteTransition(label = "pulse")
    val scale by pulse.animateFloat(
        initialValue = 1f, targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "scale"
    )

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.linearGradient(
                    listOf(cardColor.copy(alpha = 0.18f), Surface)
                )
            )
            .border(1.dp, cardColor.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
            .padding(18.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = emojis,
                fontSize = if (selectedInstruments.size > 2) 26.sp else 40.sp,
                modifier = Modifier.scale(if (title != "Neutral / Flat Output") scale else 1f)
            )
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                AnimatedContent(
                    targetState = title,
                    transitionSpec = { fadeIn() togetherWith fadeOut() },
                    label = "name"
                ) { name ->
                    Text(
                        text = name,
                        style = MaterialTheme.typography.titleMedium,
                        color = OnBackground,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = cardColor
                )
            }
        }
    }
}
