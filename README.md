# Docrot Detector Frontend

## Quick Start (Setup + Run)

Use this flow each time you start local development.

1. Configure frontend environment (this repo)

Create a local .env file from .env.example and set values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Notes:

- .env is ignored by git and should contain real local values.
- .env.example is committed and should only contain placeholders.

2. Install and run frontend

```powershell
npm install
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173 or http://localhost:5174).

3. Enable Firebase services

- In Firebase Console, enable Firestore Database (Native mode).
- In Firebase Console, enable Authentication and turn on GitHub provider.
- Configure GitHub OAuth callback URL provided by Firebase Auth.

4. Real-time dashboard updates

- Frontend listens to Firestore snapshots on the `repos` collection.
- Dashboard refreshes automatically when Cloud Function writes new scan data.

5. If no data appears

- Confirm your Cloud Function is writing to Firestore paths expected by this UI:
  - `repos/{repoId}`
  - `repos/{repoId}/scan_runs/{scanId}`
  - `repos/{repoId}/scan_runs/{scanId}/issues/{issueId}`
- Confirm your signed-in GitHub username matches the repo owner prefix in `repos.full_name` (for example `owner/repo`).
- Confirm Firestore security rules allow read access for authenticated users.

---

## Overview

Docrot Detector Frontend is the user interface for the **Docrot Detector system**, a tool that detects when Python code changes in semantically meaningful ways and flags linked documentation for review.

The backend performs AST-based semantic analysis of Python code, scoring code changes and identifying when documentation may be outdated. The frontend provides a visual interface for developers to explore repositories, review flagged documentation alerts, and understand semantic code changes detected by the backend.

Built as part of the **CS 4485 Capstone course**.

---

# How It Works

The Docrot Detector system consists of two major components:

1. **Backend Analysis Engine** — Scans repositories, extracts semantic fingerprints from Python code, compares changes, and generates documentation alerts.
2. **Cloud Function + Firestore Data Plane** — GitHub Actions trigger a Cloud Function that writes scan output into Firestore.
3. **Frontend Interface** — React app reads Firestore directly to display scans, issues, and summaries.

The frontend queries Firestore directly (no local backend token/API required for dashboard data).

Typical workflow:

1. A GitHub Action triggers your Google Cloud Function.
2. The Cloud Function processes scan output and writes docs into Firestore.
3. The frontend reads Firestore collections and renders dashboards/issues/history.
4. Firestore updates automatically flow into the UI through snapshot listeners.

---

# Features

- **Dashboard Interface** — Displays repository summaries and documentation alert status.
- **Documentation Alerts View** — Shows files where documentation may be outdated.
- **Semantic Change Display** — Shows change scores and affected functions returned by the backend.
- **Repository Overview** — Provides high-level summaries of code changes detected by the backend.
- **Firestore Integration** — Retrieves scans/issues directly from Firestore.
- **Wireframe-Driven UI** — Interface layout is based on design prototypes created in Figma.

---

# Tech Stack

The frontend is built using modern web development tools:

- **React** — UI framework for building the application interface
- **TypeScript** — Strongly typed JavaScript for improved maintainability
- **Vite** — Fast development build tool
- **CSS** — Styling and layout
- **ESLint** — Code quality and linting

---

# Folder Structure

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
    ├── api/                 # API communication with backend
    ├── assets/              # Images and static resources
    ├── components/          # Reusable UI components
    ├── hooks/               # Custom React hooks
    ├── pages/               # Application views and pages
    ├── types/               # TypeScript type definitions
    ├── utils/               # Helper utilities
    ├── App.css              # Global component styling
    ├── App.tsx              # Root React component
    ├── index.css            # Global CSS
    └── main.tsx             # React entry point
```

---

# Frontend Modules

| Module | Responsibility |
|------|------|
| `api/` | Firestore data-access and data normalization helpers |
| `components/` | Reusable UI components used throughout the application |
| `pages/` | Page-level views such as dashboards and alert views |
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

1. **Clone the repository**

```
git clone <repo-url>
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

# Environment Variables

The project uses Firebase environment variables for Firestore/Auth integration.

Create a `.env` file using the example:

```
cp .env.example .env
```

Example variable:

```
VITE_FIREBASE_PROJECT_ID
```

These values come from Firebase Console -> Project settings -> Your apps -> Web app config.

---

# React + TypeScript + Vite

This frontend project was bootstrapped using **React + TypeScript + Vite**.

This template provides a minimal setup to get React working in Vite with **Hot Module Replacement (HMR)** and some ESLint rules.

Currently, two official plugins are available:

- **@vitejs/plugin-react** — Uses Babel for Fast Refresh.
- **@vitejs/plugin-react-swc** — Uses SWC for Fast Refresh.

---

# React Compiler

The React Compiler is not enabled on this template because of its impact on development and build performance.

To enable it, refer to the official React documentation.

---

# Expanding the ESLint Configuration

If developing a production application, it is recommended to enable type-aware lint rules.

Example configuration:

```javascript
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

Additional React lint plugins can also be used:

```
eslint-plugin-react-x
eslint-plugin-react-dom
```

Example:

```javascript
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

---

# Development Status

The frontend is currently under **active development**.

Recent work includes:

- implementing page layouts based on project wireframes
- updating navigation links and styling
- integrating dashboard components
- aligning frontend pages with the system specification

Future work includes:

- deeper backend integration
- improved visualization of semantic change reports
- expanded documentation alert views

---

# License

This project is developed for academic use as part of the **CS 4485 Capstone course**.
