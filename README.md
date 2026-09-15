# Sound Enhancer 🎵⚡

[![GitHub Release](https://img.shields.io/github/v/release/Chilakala-Surya-Prakash/sound-enhancer?color=6d28d9&style=for-the-badge)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/latest)
[![Download APK](https://img.shields.io/badge/Download-Android%20APK-00E676?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.0.0/Soundenhancer-Studio.apk)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Sound Enhancer** (*Soundenhancer Studio*) is a powerful, system-wide audio enhancement application for Android. Built with Kotlin and Jetpack Compose, it hooks directly into Android's Hardware DSP (Digital Signal Processor) to deliver hardware-accelerated equalization, deep bass boosting, 3D surround spatialization, and real-time audio visualization for all your favorite music and video apps.

---

## 📱 Download APK

Directly download the ready-to-install Android APK file:

[📥 **Download Soundenhancer-Studio.apk (v1.0.0)**](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.0.0/Soundenhancer-Studio.apk)

### How to Install on Android:
1. Tap the download button above on your Android phone or tablet.
2. Open your downloaded files and tap `Soundenhancer-Studio.apk`.
3. If prompted by your browser, tap **Settings** and enable **"Allow from this source"**.
4. Tap **Install** and open **Sound Enhancer**.
5. Grant audio session permissions so the app can detect active media streams (Spotify, YouTube Music, Apple Music, Poweramp, etc.).

---

## ✨ Features

- **System-Wide Hardware DSP**: Enhances background audio across all installed media applications without needing root access.
- **Multi-Band Equalizer**: Precise hardware frequency curve tuning for custom audio output.
- **Hardware Bass Booster (`BassBoost`)**: Deep, thumping low-end enhancement tuned to prevent audio clipping.
- **3D Surround Virtualizer (`Virtualizer`)**: Expands spatial soundstage imaging for wired and Bluetooth headphones.
- **Loudness Enhancer (`LoudnessEnhancer`)**: Boosts quiet audio tracks with dynamic range compensation.
- **Real-Time Spectrum Visualizer**: Live FFT audio frequency visualization with responsive animations.
- **Real-Time Instrument Detector**: Analyzes active audio frequencies to detect dominant musical elements (Bass, Guitars, Vocals, Drums).
- **Persistent Foreground Service**: Runs seamlessly in the background with convenient quick controls in the Android notification shade.
- **Modern Jetpack Compose UI**: Clean, responsive dark-themed Material 3 interface built for modern Android devices.

---

## 🛠️ Project Structure

```
sound-enhancer/
├── Soundenhancer/              # Native Android App Source Code
│   ├── app/src/main/java/      # Kotlin source code (AudioFX Service, ViewModels, UI)
│   ├── app/src/main/res/       # App drawables, strings, and XML resources
│   └── build.gradle.kts        # Android build configuration
├── Soundenhancer-Studio.apk    # Pre-built APK binary
└── README.md                   # Project documentation
```

---

## 💻 How to Build from Source

### Prerequisites:
- Android Studio Ladybug (or newer) / Android SDK
- JDK 17+

### Build Steps:
```bash
# Clone the repository
git clone https://github.com/Chilakala-Surya-Prakash/sound-enhancer.git
cd sound-enhancer/Soundenhancer

# Build Debug or Release APK using Gradle Wrapper
./gradlew assembleRelease
```
The output APK will be generated at `Soundenhancer/app/build/outputs/apk/release/app-release.apk`.

---

## 🏗️ How This Project Was Created

This application was engineered separately using modern native Android technologies:
- **Language & Framework**: Written entirely in **Kotlin** using **Jetpack Compose** and **Material 3**.
- **Audio Processing Engine**: Built on top of Android's native `android.media.audiofx` API (`Equalizer`, `BassBoost`, `Virtualizer`, `LoudnessEnhancer`, `Visualizer`) operating within an Android `ForegroundService`.
- **AI Architecture & Assistance**: Developed and structured using **Google Antigravity AI** powered by **Gemini 3.6 Flash**.
