package com.audioalchemy.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.audioalchemy.model.PresetMode
import com.audioalchemy.ui.theme.Primary
import com.audioalchemy.ui.theme.SurfaceVar

@Composable
fun PresetGrid(
    selectedMode: PresetMode,
    onModeSelected: (PresetMode) -> Unit,
    modifier: Modifier = Modifier
) {
    val presets = listOf(
        PresetItem(PresetMode.BALANCED, "Balanced", Icons.Rounded.Equalizer),
        PresetItem(PresetMode.BASS_BOOST, "Bass boost", Icons.Rounded.Speaker),
        PresetItem(PresetMode.SMOOTH, "Smooth", Icons.Rounded.Waves),
        PresetItem(PresetMode.DYNAMIC, "Dynamic", Icons.Rounded.ElectricBolt),
        PresetItem(PresetMode.CLEAR, "Clear", Icons.Rounded.CleanHands),
        PresetItem(PresetMode.TREBLE_BOOST, "Treble boost", Icons.Rounded.GraphicEq),
        PresetItem(PresetMode.CUSTOM, "Custom", Icons.Rounded.Tune)
    )

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(
            "Equalizer Presets",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onBackground
        )

        val chunked = presets.chunked(2)
        chunked.forEach { pair ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                pair.forEach { item ->
                    PresetCard(
                        item = item,
                        isSelected = (selectedMode == item.mode),
                        onClick = { onModeSelected(item.mode) },
                        modifier = Modifier.weight(1f)
                    )
                }
                if (pair.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

private data class PresetItem(val mode: PresetMode, val title: String, val icon: ImageVector)

@Composable
private fun PresetCard(
    item: PresetItem,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val bgAnim by animateColorAsState(
        targetValue = if (isSelected) Primary.copy(alpha = 0.22f) else SurfaceVar,
        animationSpec = tween(250),
        label = "preset_bg"
    )
    val borderAnim by animateColorAsState(
        targetValue = if (isSelected) Primary else Color.White.copy(alpha = 0.08f),
        animationSpec = tween(250),
        label = "preset_border"
    )
    val contentColor by animateColorAsState(
        targetValue = if (isSelected) Primary else MaterialTheme.colorScheme.onSurface,
        animationSpec = tween(250),
        label = "preset_content"
    )

    Box(
        modifier = modifier
            .height(52.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(bgAnim)
            .border(
                width = if (isSelected) 1.5.dp else 1.dp,
                color = borderAnim,
                shape = RoundedCornerShape(16.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 14.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = item.title,
                tint = contentColor,
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = item.title,
                fontSize = 14.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = contentColor
            )
        }
    }
}
