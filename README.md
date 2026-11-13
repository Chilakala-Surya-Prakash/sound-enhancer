# Sound Enhancer 🎵⚡

[![GitHub Release](https://img.shields.io/github/v/release/Chilakala-Surya-Prakash/sound-enhancer?color=059669&style=for-the-badge)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/latest)
[![Download APK](https://img.shields.io/badge/Download-Android%20APK-059669?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.3.0/Soundenhancer-Studio.apk)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Sound Enhancer** (*Soundenhancer Studio*) is a high-performance, 100% logic-driven audio enhancement application for Android. Built with Kotlin and Jetpack Compose, it interfaces directly with Android's Hardware DSP (Digital Signal Processor) coprocessors to deliver interactive sub-bass tuning, 3D spatial virtualizer stage expansion, dynamic studio loudness makeup gain, Harman reference target EQ presets, and real-time audio telemetry for both local media playback and system-wide audio streams.

---

## 📱 Download APK

Download the latest pre-compiled Android APK file:

[📥 **Download Soundenhancer-Studio.apk (v1.3.0)**](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.3.0/Soundenhancer-Studio.apk)  
*(or download from [Latest Release Direct Link](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/latest/download/Soundenhancer-Studio.apk))*

### How to Install on Android:
1. Tap the download link above on your Android device.
2. Open your downloaded files and tap `Soundenhancer-Studio.apk`.
3. If prompted by your browser, tap **Settings** and enable **"Allow from this source"**.
4. Tap **Install** and open **Sound Enhancer**.
5. Grant audio session permissions so the app can detect active media streams (Spotify, YouTube Music, Apple Music, Poweramp, etc.) or play directly via the built-in calibration deck.

---

## ✨ Features

- **🪵 Cream Wood & Emerald Audiophile UI**: Tactile analog console design with roasted walnut/cedar surfaces, antique cream ivory typography, and luminous gemstone emerald jewel meters.
- **🔊 Built-in Audio & Calibration Deck (`LocalAudioEngine`)**:
  - **48kHz Stereo Pink Noise**: High-precision Paul Kellet 1/f reference noise with equal energy per octave for instantaneous, audible verification across all 9 EQ bands.
  - **Harmonic Sine Sweep (20Hz - 20,000Hz)**: Continuous logarithmic frequency sweep to test sub-bass through ultra-high air.
  - **Local Audio File Playback**: Select any MP3, FLAC, or WAV file from device storage with guaranteed direct `AudioSessionId` binding.
- **🎛️ Interactive Hardware DSP Master Tuning**:
  - **Sub-Bass Punch Booster (`BassBoost`)**: Continuous 0–100% hardware slider with instant quick-strength presets (`Off`, `Subtle 40%`, `Punch 75%`, `Max Sub-Bass 100%`).
  - **3D Spatial Virtualizer (`Virtualizer`)**: Out-of-head stereo expansion slider (0–100%) with 3 acoustic stage modes: *Studio Nearfield* (40%), *3D Spatial Stage* (75%), and *Concert Hall* (100%).
  - **Dynamic Loudness Enhancer (`LoudnessEnhancer`)**: Transparent studio makeup gain slider (+0.0 dB to +6.0 dB) with dynamic headroom protection.
- **🛡️ 100% Deterministic DSP & Headroom Protection**: Debounced hardware binder IPC transactions (25ms) and automatic digital headroom anti-clipping guard prevent audio stutter, dropouts, and digital distortion.
- **🎯 Audiophile & Studio EQ Presets**: Mathematically calibrated presets including *Harman Reference Target*, *Club & Electronic*, *Studio Balanced (0dB Flat)*, *Studio Sub-Bass*, *Acoustic Warmth*, *Master Dynamic*, *Vocal & Air*, and *Harmonic Sparkle*.
- **📊 Real-Time Audio Diagnostics & Telemetry**: Monospaced diagnostic terminal displaying live streaming hardware DSP metrics, active audio session detection, dominant frequencies, peak amplitude, and one-tap report copying.
- **🔒 100% Private & Zero Cloud Dependencies**: Operates completely on-device without cloud servers, external API keys, telemetry trackers, or network calls.

---

## 🛠️ Project Structure

```
sound-enhancer/
├── Soundenhancer/              # Native Android App Source Code
│   ├── app/src/main/java/      # Kotlin source code (AudioFX Service, Local Audio Engine, UI)
│   ├── app/src/main/res/       # App icons, drawables, strings, and theme definitions
│   └── build.gradle.kts        # Android build setup (v1.3.0)
├── Soundenhancer-Studio.apk    # Pre-built APK binary
└── README.md                   # Project documentation
```

---

## 💻 How to Build from Source

### Prerequisites:
- JDK 17+ (e.g. OpenJDK 17)
- Android SDK 34+

### Build Steps:
```bash
# Clone repository
git clone https://github.com/Chilakala-Surya-Prakash/sound-enhancer.git
cd sound-enhancer/Soundenhancer

# Build APK using Gradle Wrapper
JAVA_HOME=/path/to/jdk17 ./gradlew assembleDebug
```
The output APK file will be generated at `Soundenhancer/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🏗️ Technical Architecture

- **Language & Framework**: Developed in **Kotlin** using **Jetpack Compose** and **Material 3**.
- **Audio Processing Engine**: Interfaces directly with Android's `android.media.audiofx` native API (`Equalizer`, `BassBoost`, `Virtualizer`, `LoudnessEnhancer`, `Visualizer`) running inside a background `ForegroundService`.
- **Local Audio Synthesis**: Direct PCM synthesis via `AudioTrack` and media playback via `MediaPlayer`.
