package com.audioalchemy.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary          = Primary,
    secondary        = Secondary,
    tertiary         = Accent,
    background       = Background,
    surface          = Surface,
    surfaceVariant   = SurfaceVar,
    onPrimary        = OnBackground,
    onBackground     = OnBackground,
    onSurface        = OnSurface,
)

@Composable
fun AudioAlchemyTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography  = Typography,
        content     = content
    )
}
