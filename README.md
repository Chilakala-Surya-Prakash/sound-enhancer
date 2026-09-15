# Sound Enhancer 🎵⚡

[![GitHub Release](https://img.shields.io/github/v/release/Chilakala-Surya-Prakash/sound-enhancer?color=6d28d9&style=for-the-badge)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/latest)
[![Download APK](https://img.shields.io/badge/Download-Android%20APK-00E676?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.0.0/Soundenhancer-Studio.apk)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Sound Enhancer** (*Soundenhancer Studio*) is a high-performance, system-wide audio enhancement application for Android. Built with Kotlin and Jetpack Compose, it interfaces directly with Android's Hardware DSP (Digital Signal Processor) to deliver maximum sub-bass power, dynamic multi-instrument elevation, real-time active instrument detection, and single-instrument frequency solo isolation for all media apps.

---

## 📱 Download APK

Download the latest pre-compiled Android APK file:

[📥 **Download Soundenhancer-Studio.apk (v1.0.0)**](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.0.0/Soundenhancer-Studio.apk)

### How to Install on Android:
1. Tap the download link above on your Android device.
2. Open your downloaded files and tap `Soundenhancer-Studio.apk`.
3. If prompted by your browser, tap **Settings** and enable **"Allow from this source"**.
4. Tap **Install** and open **Sound Enhancer**.
5. Grant audio session permissions so the app can detect active media streams (Spotify, YouTube Music, Apple Music, Poweramp, etc.).

---

## ✨ Features

- **System-Wide Hardware DSP Engine**: Intercepts and enhances background audio across all installed media players without requiring root.
- **Maximum High-Bass Punch (`BassBoost`)**: Hardware sub-bass and high-bass frequencies are boosted to max strength (`1000`) with zero headroom attenuation for deep, booming low-end.
- **Audio Enhancer Master Engine**: Elevates the overall listening experience by boosting mid-range presence and high air so **all instrument layers across the track are clearly audible**.
- **Real-Time Active Instrument Detection**: Continuously analyzes FFT audio spectrum data and displays **only the instruments currently being played in the music stream**.
- **🎧 Instrument Solo Isolation Mode**: Click any detected instrument chip (e.g. Guitar, Vocals, Piano, Drums) to enter Solo Mode. The app boosts the selected instrument's primary & harmonic frequency bands (+12dB) while **muting all other instrument and vocal frequencies (-12dB)** so only that targeted sound is audible!
- **9-Band Hardware Graphic Equalizer**: Precise manual gain adjustments across 63Hz to 16kHz.
- **3D Spatial Surround Virtualizer (`Virtualizer`)**: Expands stereo soundstage imaging for headphones and external speakers.
- **Dynamic Loudness Enhancer (`LoudnessEnhancer`)**: Elevates track dynamics without distortion.
- **Clean Material 3 UI**: Clean, clutter-free dark theme UI built with Jetpack Compose.

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
