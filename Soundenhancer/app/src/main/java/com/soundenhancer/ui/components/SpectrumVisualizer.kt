package com.audioalchemy.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import com.audioalchemy.ui.theme.*

@Composable
fun SpectrumVisualizer(
    bands: FloatArray,
    modifier: Modifier = Modifier,
    peakColor: Color = Primary
) {
    // Smoothly interpolate band heights
    val smoothedBands = remember(bands.size) { FloatArray(bands.size) }
    var frameTick by remember { mutableLongStateOf(0L) }
    val alpha = 0.45f

    LaunchedEffect(bands) {
        val n = minOf(bands.size, smoothedBands.size)
        for (i in 0 until n) {
            smoothedBands[i] = smoothedBands[i] * (1f - alpha) + bands[i] * alpha
        }
        frameTick++
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val tick = frameTick // Observe tick to trigger redraw
        val w = size.width
        val h = size.height
        val n = minOf(bands.size, smoothedBands.size)
        if (n == 0) return@Canvas
        val barWidth = w / n * 0.75f
        val gap = w / n * 0.25f

        for (i in 0 until n) {
            val bandH = (smoothedBands[i].coerceIn(0f, 1f) * h * 0.92f)
            val x = i * (barWidth + gap)
            val t = i.toFloat() / n

            // Color gradient: bass=red, mids=green/cyan, highs=violet
            val barColor = when {
                t < 0.2f -> lerp(SpecBass,    SpecLowMid,  t / 0.2f)
                t < 0.4f -> lerp(SpecLowMid,  SpecMid,    (t - 0.2f) / 0.2f)
                t < 0.6f -> lerp(SpecMid,     SpecHighMid,(t - 0.4f) / 0.2f)
                t < 0.8f -> lerp(SpecHighMid, SpecHigh,   (t - 0.6f) / 0.2f)
                else     -> lerp(SpecHigh,    SpecAir,    (t - 0.8f) / 0.2f)
            }

            // Glow effect (wider, semi-transparent behind)
            drawRoundRect(
                color = barColor.copy(alpha = 0.18f),
                topLeft = Offset(x - 2f, h - bandH - 4f),
                size = Size(barWidth + 4f, bandH + 4f),
                cornerRadius = CornerRadius(4f)
            )
            // Main bar
            drawRoundRect(
                brush = Brush.verticalGradient(
                    colors = listOf(barColor, barColor.copy(alpha = 0.5f)),
                    startY = h - bandH,
                    endY = h
                ),
                topLeft = Offset(x, h - bandH),
                size = Size(barWidth, bandH),
                cornerRadius = CornerRadius(3f)
            )

            // Peak dot
            if (bandH > 8f) {
                drawCircle(
                    color = Color.White.copy(alpha = 0.8f),
                    radius = 2f,
                    center = Offset(x + barWidth / 2, h - bandH - 4f)
                )
            }
        }

        // Baseline
        drawLine(
            color = Color.White.copy(alpha = 0.08f),
            start = Offset(0f, h),
            end = Offset(w, h),
            strokeWidth = 1f
        )
    }
}
