# 💑 Couple App: Dopaminergic & Local-First Connection

> *A privacy-first, highly-engaging ecosystem designed to deeply connect partners without relying on traditional text messaging.*

⚠️ **Project Status**: Full MVP Implemented 🚀

## 🌟 Vision & Architecture

**Couple App** redefines digital intimacy. Instead of building another standard chat app, this platform focuses on a **"Dopaminergic Loop"** using gamification, psychology, and ephemeral connection methods (Snapchat-vibes).

### 🔒 The "Local-First" Privacy Promise
*Your memories do not belong to a corporation.*
This application is strictly built on a **Local-First Architecture**.
* All core data (photos, memories, journal entries) is stored locally on the device using encrypted `AsyncStorage` and `expo-file-system`.
* The **FastAPI Backend** acts **ONLY** as a lightweight metadata synchronizer and a temporary relay for ephemeral messages. It does not permanently store your photos or chat history.

## 🛠️ Technology Stack

*   **Frontend**: React Native & Expo (Performance, native hardware access).
*   **State & Sync**: Custom `SyncManager` built on `AsyncStorage` + Axios.
*   **UI/UX**: Reanimated, Moti (Smooth 60fps animations), Expo-Haptics.
*   **Backend**: FastAPI 🚀 (High-speed ASGI Python server).
*   **Database**: SQLAlchemy with SQLite (for lightweight metadata syncing).
*   **Security**: JWT Authentication & Passlib/Bcrypt.

## ✨ Core Features (The Dopamine Loop)

### 1. 🔄 Connection Streak & Relationship Tamagotchi
*   **Shared Streak:** Connect daily to keep the streak alive. If one misses a day, the streak breaks for both.
*   **Our Tree 🌳:** A dynamic Tamagotchi-style visualizer on the Home screen that grows from a seedling (🌱) to a blooming tree (🌺🌳🌺) as your streak increases.

### 2. 🌟 Mood Sync & Visual Auras
*   **Dynamic Avatars:** Choose your spirit animal (Owl 🦉 or Alien 👽).
*   **Glowing Aura:** Your partner's avatar glows with a specific color representing their real-time mood (1-5 scale). It's an instant visual pulse-check without needing to ask "how are you?".

### 3. ⚡ Ephemeral Sparks (Snapchat-style)
*   **Haptic Heartbeats 💓:** Send a physical vibration to your partner's phone.
*   **Mystery Polaroids 📸:** Send a fragmented/blurred snapshot that disappears forever once closed.
*   **Secret Signal:** A hidden, invisible button on the home screen. Tap it 3 times to send a completely silent haptic pulse to your partner—perfect for undercover communication during meetings.

### 4. ⏳ Time Capsules
*   Record a message today that automatically locks itself and cannot be opened by your partner until the following day.

### 5. 😇 Emotional Debt Thermometer (Karma)
*   Track the nice things your partner does for you (e.g., "Brought me coffee ☕"). Acknowledging their effort increases their "Karma" score on the server, gamifying appreciation.

### 6. 🤝 Shake to Connect
*   Using device accelerometers, if both partners shake their phones at the same time (within a 30-second window), the app detects the physical synchrony and fires a visual and haptic reward.

### 7. 🍿 Movie Mode
*   A distraction-free dark UI mode. When watching a movie together (physically or remotely), you can send ephemeral "whispers" that completely wipe from memory the moment you exit the mode.

### 8. ✈️ Long Distance (LDR) Mode
*   Toggle this mode to activate a massive countdown timer until the day you reunite. It also includes a live, ticking clock synced to your partner's exact timezone offset.

### 9. 📖 Asymmetric Shared Journal
*   A daily prompt (e.g., "What made you smile today?"). You cannot see your partner's answer until you submit yours. The anticipation creates a powerful psychological pull.

### 10. 📸 Stolen Moments (Private Camera)
*   A lightning-fast camera shortcut that bypasses your public phone gallery. Photos and GPS metadata are saved exclusively to the app's hidden local storage to build a private, chronological documentary of your relationship.

### 11. 🎲 Random Plan Generator
*   A zero-friction "Date Night" button that suggests random offline activities to eliminate the "What do you want to do?" debate.

### 12. 💙 Passive Conflict Predictor
*   The `SyncManager` analyzes both moods. If both partners log a low mood (<= 2) simultaneously, a gentle, proactive banner appears suggesting a quiet chat to decompress.

---

### 📂 Project Structure
*   `/frontend`: The React Native/Expo client application.
*   `/backend`: The FastAPI server.

---
*Developed by Axel Irribarren. Enhanced for Dopaminergic Local-First Connections.*