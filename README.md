# Sound Enhancer 🎵⚡

[![GitHub Release](https://img.shields.io/github/v/release/Chilakala-Surya-Prakash/sound-enhancer?color=6d28d9&style=for-the-badge)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/latest)
[![Download APK](https://img.shields.io/badge/Download-Android%20APK-00E676?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.0.0/Soundenhancer-Studio.apk)
[![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)](LICENSE)

**Sound Enhancer** (also known as *AuraSonic / AudioAlchemy*) is a state-of-the-art audio enhancement suite built for both the Web and Android devices. It delivers studio-grade parametric equalization, real-time FFT spectrum visualization, hardware bass boosting, spatial 3D surround sound, and AI-driven instrument detection.

---

## 📱 Download Android App (APK)

Get the pre-compiled Android application to enhance system-wide audio on your phone:

[📥 **Download Soundenhancer-Studio.apk (v1.0.0)**](https://github.com/Chilakala-Surya-Prakash/sound-enhancer/releases/download/v1.0.0/Soundenhancer-Studio.apk)

### How to Install on Android:
1. Tap the download link above on your Android device.
2. Open your downloads folder and tap `Soundenhancer-Studio.apk`.
3. If prompted, enable **"Allow installation from unknown sources"** for your browser.
4. Tap **Install** and open **Sound Enhancer**.
5. Grant audio/notification permissions when prompted so the service can hook into active media sessions (Spotify, YouTube Music, Apple Music, etc.).

---

## ✨ What This App Actually Is

**Sound Enhancer** is a dual-engine audio processing platform designed to optimize sound quality, boost bass, clarify vocals, and analyze musical elements in real time.

### 🌐 1. Web Audio Studio App (`/src`)
A modern, browser-based digital audio studio powered by the Web Audio API and React.
- **9-Band Interactive Equalizer**: Real-time gain adjustment (32 Hz to 16 kHz) with smooth natural cubic spline curve rendering.
- **Curated Sound Presets**: Bass Boost, Vocal Clarity, Acoustic, EDM, Cinema, Gaming, Classical, and custom profiles.
- **Earphone Hardware Optimizer**: Targeted compensation profiles tailored for In-Ear Monitors, Over-Ear Studio Headphones, Open-Back, and Wireless Earbuds.
- **Live Spectrum Visualizer**: High-frequency FFT frequency visualizer with smooth animations.
- **Audio Intelligence & Instrument Detection**: Analyzes playing audio to identify dominant frequency ranges and instruments (Bass, Guitars, Vocals, Synthesizers, Drums).
- **Track Player & File Upload**: Upload local tracks (`.mp3`, `.wav`, `.flac`, `.m4a`) or listen to built-in high-quality demo tracks.

---

### 🤖 2. Native Android Equalizer App (`/Soundenhancer`)
A background service application built with Kotlin and Jetpack Compose that interfaces directly with Android Hardware DSP (`android.media.audiofx`).
- **System-Wide Audio Processing**: Hooks into active Android Audio Sessions (Session 0 + media players like Spotify, YouTube, Poweramp).
- **Hardware DSP Effects**:
  - **Equalizer**: Multi-band hardware parametric equalizer.
  - **Bass Boost (`BassBoost`)**: Deep hardware low-end excitation without distortion.
  - **3D Spatializer (`Virtualizer`)**: Wide soundstage expansion for headphones.
  - **Loudness Enhancer (`LoudnessEnhancer`)**: Dynamic gain compression for quiet tracks.
- **Foreground Service Engine**: Runs reliably in the background with persistent status controls in the notification shade.
- **Material 3 UI**: Futuristic dark interface with animated visualizers and intuitive controls.

---

## 🛠️ Project Structure

```
sound-enhancer/
├── src/                        # React + Web Audio API Web Application
│   ├── components/             # Equalizer, Visualizers, Instrument Detectors, Controls
│   ├── data/                   # EQ Presets, Earphone Profiles, Demo Tracks
│   ├── services/               # AudioEngine & Gemini AI integration
│   └── types/                  # TypeScript interfaces for audio engine
├── Soundenhancer/              # Native Android App Source Code
│   ├── app/src/main/java/      # Kotlin source (Service, UI, AudioFX Controller)
│   ├── app/src/main/res/       # Material theme resources & icons
│   └── build.gradle.kts        # Android Gradle build setup
├── Soundenhancer-Studio.apk    # Pre-built release APK binary
└── README.md                   # Project documentation
```

---

## 💻 How to Run Locally

### Running the Web App:
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Building the Android App:
```bash
cd Soundenhancer

# Build Debug / Release APK with Gradle Wrapper
./gradlew assembleRelease
```

---

## 🏗️ How This Project Was Created

This project was created through a hybrid multi-platform architecture, separating frontend web innovation from native mobile hardware engineering:

1. **Web Studio Layer**: Developed using **React**, **TypeScript**, **Vite**, and **TailwindCSS**, taking full advantage of the browser's high-performance `AudioContext` and `BiquadFilterNode` DSP pipeline.
2. **Native Android Layer**: Engineered separately in **Kotlin** using **Jetpack Compose (Material 3)**, **Coroutines Flow**, and low-level Android `AudioEffect` APIs (`Equalizer`, `BassBoost`, `Virtualizer`, `LoudnessEnhancer`).
3. **AI Architecture & Orchestration**: Designed, developed, and assembled with **Google Antigravity AI** powered by **Gemini 3.6 Flash**.
