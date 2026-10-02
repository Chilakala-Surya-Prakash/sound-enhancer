# Sound Enhancer 🎵⚡

[![GitHub Release](https://img.shields.io/github/v/release/Chilakala-Surya-Prakash/sound-enhancer?color=6d28d9&style=for-the-badge)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/latest)
[![Download APK](https://img.shields.io/badge/Download-Android%20APK-00E676?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.2.0/Soundenhancer-Studio.apk)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Sound Enhancer** (*Soundenhancer Studio*) is a high-performance, system-wide audio enhancement application for Android. Built with Kotlin and Jetpack Compose, it interfaces directly with Android's Hardware DSP (Digital Signal Processor) coprocessors to deliver interactive sub-bass tuning, 3D spatial virtualizer stage expansion, dynamic studio loudness makeup gain, Harman reference target EQ presets, and real-time audio telemetry for all installed media players.

---

## 📱 Download APK

Download the latest pre-compiled Android APK file:

[📥 **Download Soundenhancer-Studio.apk (v1.2.0)**](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.2.0/Soundenhancer-Studio.apk)  
*(or download from [Latest Release Direct Link](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/latest/download/Soundenhancer-Studio.apk))*

### How to Install on Android:
1. Tap the download link above on your Android device.
2. Open your downloaded files and tap `Soundenhancer-Studio.apk`.
3. If prompted by your browser, tap **Settings** and enable **"Allow from this source"**.
4. Tap **Install** and open **Sound Enhancer**.
5. Grant audio session permissions so the app can detect active media streams (Spotify, YouTube Music, Apple Music, Poweramp, etc.).

---

## ✨ Features

- **System-Wide Hardware DSP Engine**: Intercepts and enhances audio streams across all installed media players (Spotify, YouTube Music, Apple Music, Poweramp, etc.) without requiring root.
- **🎛️ Interactive Hardware DSP Master Tuning**:
  - **Sub-Bass Punch Booster (`BassBoost`)**: Continuous 0–100% hardware slider with instant quick-strength presets (`Off`, `Subtle 40%`, `Punch 75%`, `Max Sub-Bass 100%`).
  - **3D Spatial Virtualizer (`Virtualizer`)**: Out-of-head stereo expansion slider (0–100%) with 3 acoustic stage modes: *Studio Nearfield* (40%), *3D Spatial Stage* (75%), and *Concert Hall* (100%).
  - **Dynamic Loudness Enhancer (`LoudnessEnhancer`)**: Transparent studio makeup gain slider (+0.0 dB to +6.0 dB) with dynamic headroom protection.
- **Audiophile & Studio EQ Presets**: One-tap presets including *Harman Reference Target*, *Club & Dance*, *Studio Balanced*, *Studio Sub-Bass*, *Acoustic Warmth*, *Master Dynamic*, *Vocal & Air*, and *Harmonic Sparkle*.
- **9-Band Hardware Graphic Equalizer**: Precise manual gain adjustments across 63Hz to 16kHz (-12dB to +12dB).
- **📊 Dual-Row Real-Time Audio Diagnostics & Telemetry**: Monospaced diagnostic terminal displaying live streaming hardware DSP metrics, active media player package detection, dominant frequencies, peak amplitude, and one-tap report copying.
- **Clean Material 3 UI**: Polished, distraction-free dark theme UI built with Jetpack Compose.

---

## 🛠️ Project Structure

```
sound-enhancer/
├── Soundenhancer/              # Native Android App Source Code
│   ├── app/src/main/java/      # Kotlin source code (AudioFX Service, Audio Engine, UI)
│   ├── app/src/main/res/       # App icons, drawables, strings, and theme definitions
│   └── build.gradle.kts        # Android build setup
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

## 🏗️ How This Project Was Created

This application was engineered separately using modern native Android technologies:
- **Language & Framework**: Developed in **Kotlin** using **Jetpack Compose** and **Material 3**.
- **Audio Processing Engine**: Interfaces directly with Android's `android.media.audiofx` native API (`Equalizer`, `BassBoost`, `Virtualizer`, `LoudnessEnhancer`, `Visualizer`) running inside a background `ForegroundService`.
- **AI Architecture & Design**: Designed, optimized, and built using **Google Antigravity AI** powered by **Gemini 3.6 Flash**.
