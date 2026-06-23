# Appswebnet — Family Personal Dashboard

A beautiful personal dashboard for **Sweta & Amishi**, built with **React + Vite + Firebase**.

## Features

| Module | Description |
|--------|------------|
| 🏠 **Overview** | Welcome screen, finance trend, upcoming events, weekly stats |
| 💰 **Sweta Finance** | Income & expense tracker with charts, filtering, Excel export |
| 🏋️ **Amishi Gym** | Workout logger with streak, heatmap, weekly goal tracking |
| 🌟 **Amishi Activity** | Daily habits, mood tracker, diary notes, weekly review |
| 📅 **Family Calendar** | Shared events calendar with color-coded tags |

## Tech Stack

- **React 19** + **Vite 6**
- **Firebase 11** — Firestore, Auth (Google + Anonymous), Hosting
- **Recharts** — Interactive charts
- **XLSX** — Excel export

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Firebase credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run locally:
   ```bash
   npm run dev
   ```

## Firebase Setup

Enable in Firebase Console:
- **Authentication**: Google Sign-In + Anonymous
- **Firestore Database**: Create in production mode
- **Hosting**: Initialize with `npx firebase-tools init hosting`

## Deploy

```bash
# Build and deploy to Firebase Hosting
npm run build
npx firebase-tools deploy --only hosting
```

## Environment Variables

See `.env.example` for all required variables (never commit your real `.env`).

## Design

Inspired by the **Majestique Euriska Dashboard** — warm neutral palette, dark sidebar, glassmorphism cards, smooth animations.
