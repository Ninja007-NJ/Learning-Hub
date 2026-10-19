# Syllabus Hub

A syllabus-aware study workspace for engineering students. It organizes a student's selected course, semester, subjects and topics, then brings learning resources, personal notes, practice and study planning into one browser-based app.

> **Prototype status:** this is a local pilot/demo, not a production student service. Sign-in is not real authentication, saved data stays in the current browser profile, and notes are not actually shared between students.

## What it includes

- A guided flow for demo sign-in, course/semester/subject selection, topic resources and a topic study area.
- Resource organization and search for notes, videos, code, textbook references and past questions. Starter links include checked NPTEL course pages; they are not a complete or institution-approved KTU syllabus/resource set.
- A study area with typed notes, a drawing board, uploads of PDF/TXT/Markdown notes, local text extraction, optional local OCR for scanned PDFs, and source-aware assistant tools.
- Smart Notes, source-linked practice cards, spaced review, a focus timer, exam planning, deadlines and backups.
- Profile privacy guidance, first-use walkthrough, feedback/takedown email drafts, larger text, a readable font option, reduced motion and visual themes.
- Optional Gemini study assistance through a server route. The API key stays on the server and is never put in the browser bundle.

## Requirements

- Node.js 20.6 or newer
- npm
- A Gemini API key only if you want to use Gemini assistant features

## Run locally

```bash
git clone <your-repository-url>
cd <repository-folder>
npm install
Copy-Item .env.example .env
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Keep the terminal running while using the app. On macOS/Linux, replace the PowerShell copy command with `cp .env.example .env`.

The app can be used without Gemini. To enable it, create a key in [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to the root `.env` file:

```dotenv
GEMINI_API_KEY=your_key_here
```

Restart `npm run dev` after changing `.env`. Never use a `VITE_` prefix for the key, commit `.env`, or paste the key into source code. Optional public contact addresses for email drafts can be set as `VITE_FEEDBACK_EMAIL` and `VITE_TAKEDOWN_EMAIL` in `.env`; restart the dev server after changing them.

## Useful commands

```bash
npm run dev      # local app and API server
npm test         # utility tests
npm run build    # production build
npm run preview  # serve the production build locally
```

## Data, privacy and AI

- The demo sign-in does not verify identity. It does not save the password.
- Student selections, notes, boards, uploads, flashcards and other profile data are stored in browser local storage. They are not encrypted, backed up to a server, or automatically synchronized. Anyone using the same browser profile may be able to access them.
- Upload text extraction and optional OCR run in the browser. OCR may download its engine and language data on first use.
- When a student submits a question to Gemini, the app sends readable content from the active topic and the selected sources needed for that request. Smart Notes sends the sources the student selects when they choose Prepare. The API key remains server-side.
- Google’s [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms) describe different data handling for unpaid and paid services and include age/audience restrictions. Review the current terms and eligibility before using Gemini with students. Do not send sensitive, confidential or personal data.
- Uploaded source declarations, duplicate detection and automatic flags are prompts for human review; they do not prove accuracy, ownership or legal permission to share.
- Feedback and takedown buttons prepare email drafts. They do not send messages or create a server-side review queue.

## Technology

- React 19 and Vite 8
- Tailwind CSS 3
- Node.js HTTP server for the local app and Gemini API route
- MiniSearch for local search
- PDF.js for PDF text extraction and Tesseract.js for optional browser OCR
- Browser local storage for demo profile data

## Project layout

```text
src/
  components/   shared UI, assistant, uploads, profile/support, study tools
  lib/          local storage, backup, topic matching, OCR and study helpers
  pages/        sign-in, course/topic selection, resources and study area
  App.jsx       application flow and profile state
  data.js       sample curriculum and curated starter resources
server.mjs      local HTTP/Vite server and server-side Gemini route
smartNotes.mjs  Smart Notes Gemini handler
tests/          Node utility tests
RUNBOOK.md      restart, key rotation, pilot checks and recovery notes
```

## Before a real student pilot

1. Replace sample curriculum with the exact, reviewed course scheme and syllabus version for the target institution and batch.
2. Add real authentication, server-side ownership checks, database storage, private file storage, backup/recovery and moderation before describing materials as shared or private across accounts.
3. Review privacy, copyright, age eligibility and institutional policies; configure and verify the feedback and takedown contacts.
4. Complete keyboard-only, screen-reader and contrast checks. The project runbook contains a manual checklist; those checks are not represented as completed.
5. Pilot with a small group and measure tasks with consent before making claims about learning outcomes.

Read [RUNBOOK.md](RUNBOOK.md) for restart, key rotation and pilot guidance.

## GitHub setup

This folder already contains a Git repository, a `README.md`, a `.gitignore` and a lockfile. When creating the GitHub repository from this existing project, choose visibility intentionally, leave **Add a README** off and choose **No .gitignore** so GitHub does not create conflicting files. Decide on a license only after confirming you have the rights to license all included code and assets; no license means others do not receive permission to reuse the project by default.

After creating an empty GitHub repository, connect and push it from this folder:

```bash
git status
git remote add origin https://github.com/<your-username>/<your-repository>.git
git branch -M main
git push -u origin main
```

If `origin` already exists, inspect it with `git remote -v` and use `git remote set-url origin <repository-url>` instead of adding a second remote. Review `git status` and `git ls-files` before pushing, especially for keys, personal data, generated files, and the nested `SyllabusHub-Black-UI` snapshot.
