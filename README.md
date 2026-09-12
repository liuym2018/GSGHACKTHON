# Vonage Mobile Video, SMS & AI Fashion Consultation Suite

A production-grade, full-stack application integrating **Vonage Video (OpenTok)** and **Vonage Verify SMS** with **Google Gemini AI** for real-time fashion consultation, runway model critique, and cross-platform mobile video calling.

This application directly implements the backend architecture of the **Vonage Learning Server (`learning-server-node`)** and the mobile client patterns of **`opentok-react-native` (GDG Fashion Week)**, alongside a multimodal AI styling engine.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [How to Run the Application](#how-to-run-the-application)
   - [Prerequisites](#prerequisites)
   - [Environment Configuration](#environment-configuration)
   - [Running in Development](#running-in-development)
   - [Production Build & Execution](#production-build--execution)
3. [Core Capabilities & Functional Description](#core-capabilities--functional-description)
   - [1. Live Video Capture & Runway Studio](#1-live-video-capture--runway-studio)
   - [2. Gemini AI Haute Couture Outfit Analysis](#2-gemini-ai-haute-couture-outfit-analysis)
   - [3. Interactive AI Fashion Stylist Chatbot](#3-interactive-ai-fashion-stylist-chatbot)
   - [4. Vonage Video & OpenTok Session Hub](#4-vonage-video--opentok-session-hub)
   - [5. Vonage SMS 2FA Verify Service](#5-vonage-sms-2fa-verify-service)
   - [6. React Native Codebase & Architecture Inspector](#6-react-native-codebase--architecture-inspector)
   - [7. Real-Time Telemetry & Event Logger](#7-real-time-telemetry--event-logger)
4. [REST API Reference](#rest-api-reference)
5. [Project Directory Structure](#project-directory-structure)

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER / CLIENT                                │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │ Live Video & Studio   │  │ Haute Couture Critique│  │ Stylist Chatbot │  │
│  │ (Webcam / Virtual 4K) │  │ (Garments, Colors)    │  │ (Gemini AI)     │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └────────┬────────┘  │
│              │                          │                       │           │
│  ┌───────────┴──────────────────────────┴───────────────────────┴────────┐  │
│  │              React 19 + Tailwind CSS + Lucide Icons                   │  │
│  │     (Mobile Viewports: Dual iPhone/Pixel, Tablet, Desktop)            │  │
│  └──────────────────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────────────────┼───────────────────────────────────┘
                                          │ HTTP / JSON
┌─────────────────────────────────────────▼───────────────────────────────────┐
│                    NODE.JS EXPRESS FULL-STACK SERVER                        │
│                                (server.ts)                                  │
│                                                                             │
│  ┌────────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐ │
│  │  Vonage Learning Hub   │ │   Gemini AI Engine    │ │ Telemetry Logger  │ │
│  │  - OpenTok Session IDs │ │   - Outfit Analyzer   │ │ - In-memory ring  │ │
│  │  - Participant Tokens  │ │   - Chatbot Dialogue  │ │   buffer (200 ev) │ │
│  │  - SMS OTP Verify V2   │ │   - Tailoring Advice  │ │ - Real-time stats │ │
│  └───────────┬────────────┘ └───────────┬───────────┘ └─────────┬─────────┘ │
└──────────────┼──────────────────────────┼───────────────────────┼───────────┘
               ▼                          ▼                       ▼
      [Vonage API Services]       [Google Gemini AI]      [React Native Export]
       Video API & SMS API         Gemini 3 Flash Lite     OpenTok Mobile Kits
```

---

## How to Run the Application

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **bun** / **yarn** / **pnpm**
- (Optional) **Vonage Developer Account**: [dashboard.vonage.com](https://dashboard.vonage.com/)
- (Optional) **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)

### Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Set the following variables as needed:

| Variable | Description | Required? |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for live multimodal analysis and chatbot dialogue. Automatically provisioned in Google AI Studio. | Recommended (smart fallback included if omitted) |
| `VONAGE_API_KEY` | Vonage Video / Communications API Key. | Optional (runs in sandbox simulation if omitted) |
| `VONAGE_API_SECRET`| Vonage API Secret. | Optional |
| `VONAGE_APPLICATION_ID` | Vonage Application ID (for OpenTok & Verify v2). | Optional |
| `VONAGE_PRIVATE_KEY` | Vonage Application Private Key. | Optional |
| `VONAGE_BRAND_NAME` | Name displayed in SMS verification messages (`VonageMobile`). | Optional |
| `VONAGE_SMS_FROM` | Sender ID or virtual number for SMS dispatch. | Optional |
| `PORT` | Local server port (Default: `3000`). | Optional |

### Running in Development

The project uses `tsx` to run the TypeScript server directly with Vite middleware mounted:

```bash
# Install dependencies
npm install

# Start the dev server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Changes are compiled and served instantly.

### Production Build & Execution

The production build compiles both the client-side assets and the Node.js server bundle:

```bash
# Compile client via Vite and server via esbuild into dist/server.cjs
npm run build

# Start the production server
npm run start
```

---

## Core Capabilities & Functional Description

### 1. Live Video Capture & Runway Studio

- **Physical Hardware Webcam Support**: Accesses the device's physical camera with full media-stream constraints, audio toggling, and snapshot capture.
- **Procedural Virtual Runway Feed**: Allows testing without a physical camera. Includes a canvas-based 60 FPS animation engine with studio lights and four designer looks:
  1. *Architectural Midnight Tuxedo*
  2. *Deconstructed Utility Streetwear*
  3. *Liquid Emerald Bias-Cut Silk Gown*
  4. *Parisian Double-Breasted Camel Trench*
- **Instant Snapshot Capture**: Captures 1080p full-resolution video frames directly into base64 for instant submission to the AI critique pipeline.
- **Curated Look Presets**: One-click selection of high-fashion editorial reference looks.
- **Custom Outfit Upload**: Drag-and-drop or file upload for custom wardrobe photos.

### 2. Gemini AI Haute Couture Outfit Analysis

When a frame is captured or selected, the backend invokes Google Gemini AI (`gemini-3.1-flash-lite` or `gemini-3.6-flash`) via the official `@google/genai` SDK:

- **Garment Piece Breakdown**: Granular evaluation of individual pieces (lapel cuts, fabric weights, seam construction).
- **Proportions & Silhouette Drape**: Identifies balance, vertical visual lines, and torso-to-leg ratios.
- **Seasonal Chromatic Theory**: Detects dominant and secondary color palettes, assigns seasonal color quadrants, and recommends complementary accessories.
- **Couture Redesign & Tailoring Alterations**: Actionable sewing and styling modifications (e.g., 3cm side-seam nips, zero-break hems, torc collar pairings).
- **Occasion Suitability Matrix**: Ratings across Galas, Editorial Runway, Casual Street, Corporate Executive, and Cocktail Soirées.
- **Analyzed Looks History Filmstrip**: A persistent comparison strip at the bottom of the studio displaying prior captures, scores, and timestamps.

### 3. Interactive AI Fashion Stylist Chatbot

Users can chat in real time with an AI Senior Couture Director:

- **Context-Aware Dialogue**: Automatically passes the current outfit's silhouette, aesthetics score, garment breakdown, and color palette to the conversation.
- **Styling Advice on Demand**: Ask specific questions such as:
  - *"What shoes or heels pair best with this drape?"*
  - *"What jewelry and bag complete this color palette?"*
  - *"How should I alter the hem to fix my proportions?"*
  - *"How do I transition this outfit from day to a black-tie gala?"*
- **Dynamic Follow-Up Prompts**: Generates contextual one-click suggestion chips after every response.
- **Smart Fallback Engine**: If an external API key is not present, an internal rules-based fashion engine delivers domain-accurate advice.

### 4. Vonage Video & OpenTok Session Hub

Implements the official Vonage Node Learning Server specification (`learning-server-node`):

- **`POST /api/vonage/session`**:
  - Initializes or retrieves persistent OpenTok session IDs (`vonage_session_<hash>`).
  - Generates signed JWT participant tokens with roles (`publisher`, `subscriber`, `moderator`).
  - Tracks active rooms, joined participants, and platform metadata (iOS / Android / Web).
- **Session Dispatch**: Provides simulated real-time peer connection signaling and room status endpoints.

### 5. Vonage SMS 2FA Verify Service

Provides phone number verification for mobile user onboarding:

- **`POST /api/vonage/verify/request`**: Generates a 6-digit OTP, sends SMS (or sandbox code `123456`), and enforces a 5-minute expiry window.
- **`POST /api/vonage/verify/check`**: Validates the submitted code, limits failed attempts (max 3), and unlocks the verified session.

### 6. React Native Codebase & Architecture Inspector

Under the **"Vonage API & Node Architecture"** tab, developers can inspect, review, and export the mobile client files:

1. **`VonageVideoCallScreen.tsx`**: Cross-platform OpenTok video calling component with publisher/subscriber video tiles and mute/camera controls.
2. **`FashionConsultationScreen.tsx`**: Mobile-native outfit consultation screen with live camera snapshots and styling badges.
3. **`permissions.ts`**: Cross-platform runtime permissions handler for iOS (`Info.plist`) and Android (`ACCESS_NETWORK_STATE`, `CAMERA`, `RECORD_AUDIO`).
4. **`Info.plist & Podfile`**: CocoaPods setup for `opentok-react-native` on iOS.
5. **`AndroidManifest.xml & build.gradle`**: Android camera, mic, and hardware-acceleration configurations.
6. **`vonageService.js`**: Reusable mobile client service connecting React Native to the Node.js backend endpoints.

### 7. Real-Time Telemetry & Event Logger

An in-memory circular buffer logs every system action with ISO timestamps:
- **SYSTEM**: Server boot, environment detection, and credentials checks.
- **VIDEO**: Session creation, room joins, token generations.
- **SMS**: Verification requests, code validation, delivery statuses.
- **FASHION_AI**: Image analyses, prompt latencies, and chatbot queries.

---

## REST API Reference

| Method | Endpoint | Description | Sample Request Body | Sample Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/vonage/status` | Returns Vonage credentials status and active rooms. | — | `{"configured": true, "activeRooms": 2}` |
| `POST` | `/api/vonage/session` | Creates or retrieves an OpenTok video session & token. | `{"roomId": "runway-1", "participantName": "Model-A", "platform": "ios"}` | `{"sessionId": "1_MX4...", "token": "T1==...", "apiKey": "..."}` |
| `POST` | `/api/vonage/verify/request` | Requests SMS 2FA verification code. | `{"phoneNumber": "+15551234567"}` | `{"requestId": "req_123", "status": "PENDING"}` |
| `POST` | `/api/vonage/verify/check` | Validates submitted 2FA code. | `{"requestId": "req_123", "code": "123456"}` | `{"success": true, "verified": true}` |
| `POST` | `/api/fashion/analyze-outfit` | Analyzes image frame with Gemini AI. | `{"image": "data:image/jpeg;base64...", "userNotes": "Black tie gala", "virtualLook": "tuxedo"}` | `{"success": true, "analysis": { "styleTitle": "...", "overallScore": 9.2 }}` |
| `POST` | `/api/fashion/chat` | Chat with AI Fashion Stylist about look. | `{"message": "What shoes pair with this?", "analysis": { ... }}` | `{"success": true, "reply": "...", "suggestedQuestions": [...]}` |
| `GET` | `/api/vonage/logs` | Fetches recent telemetry events. | — | `{"logs": [{ "timestamp": "...", "category": "VIDEO", "message": "..." }]}` |

---

## Project Directory Structure

```text
├── .env.example                     # Environment variables specification
├── index.html                       # HTML5 entry point & viewport meta
├── metadata.json                    # Application metadata & frame permissions
├── package.json                     # Scripts & dependencies
├── server.ts                        # Full-stack Node.js server (Vonage + Gemini API)
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite bundler & Tailwind CSS v4 setup
└── src/
    ├── main.tsx                     # React client mounting entry
    ├── App.tsx                      # Primary layout & tab navigation
    ├── types.ts                     # Shared TypeScript interfaces & types
    ├── index.css                    # Tailwind CSS v4 styling rules
    ├── components/
    │   ├── Header.tsx               # Top navigation & system status badge
    │   ├── FashionConsultationPanel.tsx  # Live video, snapshot, and analysis UI
    │   ├── StylistChatbot.tsx       # AI Fashion Stylist chatbot interface
    │   ├── CodeInspector.tsx        # React Native code viewer & export suite
    │   ├── LogsModal.tsx            # Live telemetry event drawer
    │   └── MobileDeviceFrame.tsx    # Responsive iOS / Android mockup frames
    ├── data/
    │   └── reactNativeTemplates.ts  # Exportable React Native screen source files
    └── utils/
        └── cameraStream.ts          # Hardware & virtual runway camera controller
```

---

## License & Credits

- Inspired by the **Vonage Learning Server Node** and **GDG Fashion Week OpenTok React Native** sample applications.
- Powered by **Google Gemini AI** and the **Vonage Communications Platform**.
