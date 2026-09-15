package com.audioalchemy.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    displayLarge = TextStyle(fontWeight = FontWeight.Bold,   fontSize = 48.sp, letterSpacing = (-1).sp),
    headlineLarge= TextStyle(fontWeight = FontWeight.Bold,   fontSize = 32.sp),
    headlineMedium=TextStyle(fontWeight = FontWeight.SemiBold,fontSize = 24.sp),
    titleLarge   = TextStyle(fontWeight = FontWeight.SemiBold,fontSize = 20.sp),
    titleMedium  = TextStyle(fontWeight = FontWeight.Medium, fontSize = 16.sp),
    bodyLarge    = TextStyle(fontWeight = FontWeight.Normal, fontSize = 16.sp),
    bodyMedium   = TextStyle(fontWeight = FontWeight.Normal, fontSize = 14.sp),
    labelSmall   = TextStyle(fontWeight = FontWeight.Medium, fontSize = 11.sp, letterSpacing = 0.5.sp),
)
