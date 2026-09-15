package com.audioalchemy

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.audioalchemy.ui.screens.MainScreen
import com.audioalchemy.ui.theme.AudioAlchemyTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AudioAlchemyTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { padding ->
                    MainScreen(modifier = Modifier.padding(padding))
                }
            }
        }
    }
}
