# Docrot Detector Frontend

Live dashboard: https://docrot-detector.web.app/

Built as part of the **CS 4485 Capstone course**.

---

## Overview

Docrot Detector Frontend is the user interface for the **Docrot Detector system**, a tool that detects when Python code changes in semantically meaningful ways and flags linked documentation for review.

The frontend connects directly to **Firebase Firestore** to display live scan results, repository health, documentation alerts, and AI-generated suggestions produced by the backend pipeline.

Backend repository: https://github.com/SuchiiJain/CS4485_Capstone

---

## How It Works

The Docrot Detector system consists of two major components:

1. **Backend Analysis Engine** — Scans repositories, extracts semantic fingerprints from Python code, compares changes, and generates documentation alerts.
2. **Cloud Function + Firestore Data Plane** — GitHub Actions trigger a Cloud Function that writes scan output into Firestore.
3. **Frontend Interface** — React app reads Firestore directly to display scans, issues, and summaries.

The frontend queries Firestore directly (no local backend token/API required for dashboard data).
2. **Frontend Interface** — Displays analysis results and provides a user-friendly interface for reviewing flagged documentation and semantic change reports.

Typical workflow:

1. A GitHub Action triggers your Google Cloud Function.
2. The Cloud Function processes scan output and writes docs into Firestore.
3. The frontend reads Firestore collections and renders dashboards/issues/history.
4. Firestore updates automatically flow into the UI through snapshot listeners.
1. A GitHub Actions workflow triggers on push or PR to a monitored repository.
2. The Docrot scanner performs AST-based semantic analysis of Python files.
3. Scan results are sent to a Google Cloud Function (ingestScan).
4. The Cloud Function writes scan data into Firebase Firestore.
5. The frontend reads from Firestore in real time and displays results.

---

## Features

- **Dashboard** — Repository health summaries and recent scan status.
- **Projects Page** — Per-repo rot scores, mismatch counts, and scan history.
- **Issues Page** — Filterable documentation alert table with detail view.
- **Scan History** — Full timeline of past scans per repository.
- **AI Suggestions** — Groq-powered recommendations for fixing stale docs, stored under `repos/{repoId}/scan_runs/{scanId}/ai_suggestions`.
- **GitHub Auth** — Sign in with GitHub via Firebase Authentication. The dashboard filters repos to show only repositories owned by the authenticated user.
- **Configuration Page** — View and edit `.docrot-config.json` settings.

---

## Tech Stack

The frontend is built using modern web development tools:

- **React 19** — UI framework for building the application interface
- **TypeScript** — Strongly typed JavaScript for improved maintainability
- **Vite** — Fast development build tool
- **Firebase Firestore** — Real-time database for live scan data
- **Firebase Authentication** — GitHub OAuth sign-in
- **Firebase Hosting** — Production deployment
- **CSS** — Styling and layout
- **ESLint** — Code quality and linting

---

## Folder Structure

```
.
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── .env.example
├── public/                  # Static assets
└── src/                     # Frontend source code
    ├── api/                 # Firestore + backend API calls
    ├── assets/              # Images and static resources
    ├── components/          # Reusable UI components
    ├── hooks/               # Custom React hooks
    ├── pages/               # Application views and pages
    ├── types/               # TypeScript type definitions
    ├── utils/               # Helper utilities
    ├── App.css              # Global component styling
    ├── App.tsx              # Root React component
    ├── firebase.ts          # Firebase app initialization
    ├── index.css            # Global CSS
    └── main.tsx             # React entry point
```

---

## Frontend Modules

| Module | Responsibility |
|---|---|
| `api/` | Firestore reads and backend API communication |
| `components/` | Reusable UI components used throughout the application |
| `pages/` | Page-level views such as dashboard, issues, and scan history |
| `hooks/` | Custom React hooks for managing application state |
| `types/` | TypeScript interfaces and shared types |
| `utils/` | Helper functions used across the frontend |

---

# Data Integration

The frontend reads from Firestore using Firebase client SDK.

Expected Firestore structure:

- `repos/{repoId}`
- `repos/{repoId}/scan_runs/{scanId}`
- `repos/{repoId}/scan_runs/{scanId}/issues/{issueId}`

The UI currently maps fields like:

- `repos.full_name`, `repos.latest_scan_id`
- `scan_runs.scanned_at`, `scan_runs.status`, `scan_runs.total_issues`
- `issues` documents with title/priority/status/message-like fields

Backend repository:

https://github.com/SuchiiJain/CS4485_Capstone

---

# UI Design

User interface designs and wireframes are available in the project Figma file:

https://www.figma.com/buzz/mL6QjBH9IeETv4zAOJ3g94/CS4485-Project

The Figma includes design prototypes for:

- application dashboard
- repository overview pages
- documentation alert views
- navigation and layout structure

---

# Setup
## Setup

1. **Clone the repository**

```
git clone https://github.com/marieliske/CS4485_Capstone_Frontend.git
cd CS4485_Capstone_Frontend
```

2. **Install dependencies**

```
npm install
```

3. **Run the development server**

```
npm run dev
```

The application will start locally (typically at `http://localhost:5173`).

---

## Environment Variables

The project uses Firebase environment variables for Firestore/Auth integration.
The project uses environment variables for Firebase integration.

Create a `.env` file using the example:

```
cp .env.example .env
```

Fill in your values:

```env
# Firebase (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Local development backend (optional)
VITE_BACKEND_ORIGIN=http://127.0.0.1:8010
VITE_API_BASE_URL=/api
VITE_DOCROT_TOKEN=
VITE_SCAN_EVENTS_PATH=/events/scans
```

`.env` is gitignored. Never commit real credentials.

---

## AI Integration

The backend optionally uses Groq (llama-3.3-70b-versatile) to generate documentation fix suggestions for flagged issues. To enable it, add an `"ai"` block to your `.docrot-config.json`:

```json
{
  "language": "python",
  "doc_mappings": [
    {
      "code_glob": "src/*.py",
      "docs": ["README.md"]
    }
  ],
  "thresholds": {
    "per_function_substantial": 4,
    "per_doc_cumulative": 8
  },
  "ai": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "api_key_env": "GROQ_API_KEY"
  }
}
```

The Groq API key is managed server-side in Google Cloud — no API key setup is needed by the user. AI responses are saved to Firestore under `repos/{repoId}/scan_runs/{scanId}/ai_suggestions`.

**Note:** Doc file names in `doc_mappings` are case-sensitive. Use `README.md` not `Readme.md`.

---

## UI Design

User interface designs and wireframes are available in the project Figma file:

https://www.figma.com/buzz/mL6QjBH9IeETv4zAOJ3g94/CS4485-Project

The Figma includes design prototypes for:

- application dashboard
- repository overview pages
- documentation alert views
- navigation and layout structure

---

## Development Status

The frontend is currently under **active development**.

Recent work includes:

- migrating from local API backend to Firebase Firestore and Firebase Hosting
- implementing GitHub OAuth authentication via Firebase
- connecting dashboard, projects, issues, and scan history pages to live Firestore data
- integrating AI suggestion display powered by Groq
- implementing page layouts based on project wireframes

---

## License

This project is developed for academic use as part of the **CS 4485 Capstone course**.
