# Docrot Detector Frontend

Live Dashboard: https://docrot-detector.web.app/

Built as part of the **CS 4485 Capstone course**.

---

## Overview

Docrot Detector Frontend is the user-facing dashboard for the **Docrot Detector system**, a platform that detects semantically meaningful code changes and flags linked documentation for review.

The frontend connects directly to **Firebase Firestore** to display live scan results, repository health metrics, documentation alerts, scan history, and AI-generated documentation suggestions produced by the backend pipeline.

**Backend Repository:**  
https://github.com/SuchiiJain/CS4485_Capstone

---

## How It Works

The Docrot Detector platform consists of three major layers:

### 1. Backend Analysis Engine

The backend scans repositories, parses Python files, builds semantic fingerprints, compares behavior changes across scans, and identifies documentation that may be stale.

### 2. Cloud Function + Firestore Data Layer

GitHub Actions trigger a Google Cloud Function that receives scan output and stores repository data, alerts, summaries, and scan history in Firestore.

### 3. Frontend Dashboard

The React frontend reads Firestore data in real time and displays repository dashboards, alerts, scan history, and documentation health summaries.

---

## Typical Workflow

1. GitHub Actions triggers on push events.
2. Docrot scans Python files using AST-based semantic analysis.
3. Scan results are sent to the Cloud Function (`ingestScan`).
4. The Cloud Function writes results into Firebase Firestore.
5. The frontend updates automatically and displays the newest data.

---

## Features

- **Dashboard** — Repository health summaries and latest scan activity
- **Projects Page** — Per-repository scores, issue counts, and repository status
- **Issues Page** — Filterable documentation alert table with detail panel
- **Scan History** — Historical timeline of previous scans
- **AI Suggestions** — Groq-powered recommendations for stale documentation
- **GitHub Authentication** — Firebase GitHub OAuth login
- **User Settings** — Account and user preference management
- **Configuration View** — View project `.docrot-config.json` settings

---

## Tech Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Firebase Firestore**
- **Firebase Authentication**
- **Firebase Hosting**
- **CSS**
- **ESLint**

---

## Folder Structure

```text
.
├── public/
├── src/
│   ├── api/
│   ├── assets/
│   ├── auth/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── types/
│   ├── utils/
│   ├── App.css
│   ├── App.tsx
│   ├── firebase.ts
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Frontend Modules

| Module        | Responsibility                            |
| ------------- | ----------------------------------------- |
| `api/`        | Firestore reads and backend communication |
| `assets/`     | Images and static resources               |
| `auth/`       | Authentication logic and GitHub sign-in   |
| `components/` | Reusable UI components                    |
| `hooks/`      | Custom React hooks                        |
| `pages/`      | Full page views                           |
| `types/`      | Shared TypeScript interfaces              |
| `utils/`      | Helper utilities                          |

---

## Firestore Data Structure

The frontend reads from Firestore using the Firebase client SDK.

```text
repos/{repoId}
repos/{repoId}/scan_runs/{scanId}
repos/{repoId}/scan_runs/{scanId}/flags/{flagId}
repos/{repoId}/scan_runs/{scanId}/ai_suggestions/{suggestionId}
```

Common mapped fields:

* `repos.full_name`
* `repos.latest_scan_id`
* `scan_runs.scanned_at`
* `scan_runs.status`
* `scan_runs.total_issues`

---

## UI Design

Wireframes and prototypes were created in Figma:

[https://www.figma.com/buzz/mL6QjBH9IeETv4zAOJ3g94/CS4485-Project](https://www.figma.com/buzz/mL6QjBH9IeETv4zAOJ3g94/CS4485-Project)

Includes:

* Dashboard layouts
* Repository overview pages
* Documentation alert views
* Navigation and page structure

---

## Setup

### 1. Clone Repository

```bash
git clone https://github.com/marieliske/CS4485_Capstone_Frontend.git
cd CS4485_Capstone_Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Application runs locally at:

```text
http://localhost:5173
```

---

## Environment Variables

Create a `.env` file using the provided example:

```bash
cp .env.example .env
```

Add your Firebase values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_BACKEND_ORIGIN=http://127.0.0.1:8010
VITE_API_BASE_URL=/api
VITE_DOCROT_TOKEN=
VITE_SCAN_EVENTS_PATH=/events/scans
```

`.env` is gitignored. Never commit real credentials.

---

## AI Integration

The backend uses **Groq (llama-3.3-70b-versatile)** to generate documentation fix suggestions for flagged issues.

Suggestions are stored in:

```text
repos/{repoId}/scan_runs/{scanId}/ai_suggestions
```

The API key is securely managed server-side through Google Cloud.

---

## Recent Development Progress

Recent frontend improvements include:

* Migration to Firebase Firestore
* GitHub OAuth authentication
* Live dashboards connected to Firestore
* AI suggestion display integration
* Improved Issues page readability and UI polish
* Responsive layout cleanup
* Final demo preparation updates

---

## Development Status

The frontend is currently under active development as part of the capstone final delivery.

---

## License

This project was developed for academic use as part of the **CS 4485 Capstone course**.
