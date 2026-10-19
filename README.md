# Syllabus-aware learning hub

## Run locally

Run `npm install` and `npm run dev`. The prototype uses React, Vite, Tailwind CSS, MiniSearch, PDF.js, and optional browser-side Tesseract OCR. Run `npm test` for the pure utility tests and `npm run build` for a production build.

## Student workflow

1. Sign in with a demo name, email, and password-shaped value. Nothing is sent to a server and the app does not save the password.
2. Choose a course, semester, subject, and syllabus topics.
3. Open topic-matched resources and free-provider links for YouTube, NPTEL, and MIT OpenCourseWare.
4. Study on the drawing board, keep typed notes, and ask the Gemini study assistant questions about readable materials.

The step bar prevents skipping required steps. Student selection, bookmarks, personal resources, typed notes, current page, topic, and board strokes persist in local storage under `hub2.*`.

## Pilot features in this prototype

- The resource page includes a topic evidence map showing the number of notes, videos, code, textbook items, and past questions. Counts show availability only; they do not verify relevance or syllabus coverage.
- The dashboard has an optional weekly study goal. Pilot measures are off by default and require opt-in; they remain local to this browser profile and are not research-grade analytics.
- Students can save a source-backed assistant response as a practice card and review it in the Study area. The card remains a draft and should be checked against its cited source.
- Smart Notes includes source-linked summaries, note comparisons, 1/2/4/8-day spaced-review flashcards, and a confidence-based exam plan. The Study area also has a focus timer with a recap saved into topic notes.
- First-time students get a short onboarding walkthrough. Profile includes the privacy notice, configured feedback/takedown email drafts, backup controls, and a walkthrough replay.
- Uploads show possible exact-text duplicates from material already in this browser. This is a prompt for human review, not a copyright or legal check.
- The Look settings include larger text, a readable system-font option, reduced motion, and the Pixel/Neon themes.
- If local profile saving fails, the notes panel offers a retry action.

## Notes and sharing prototype

Students can select individual files or a folder containing up to 20 PDF, TXT, or Markdown files. Text is extracted and matched to syllabus topics in the browser. Scanned PDFs require the student to opt into OCR; OCR is performed locally on up to 12 scanned pages per PDF. The first OCR use downloads the OCR engine and language data. The uploader can edit extracted text and change each suggested topic before saving.

Shared notes are currently stored in the uploader’s demo profile in this browser. They are not delivered to classmates. The upload form records the uploader’s declared basis for sharing and any source/attribution details. Those fields are not independent copyright or legal verification; unclear claims need a human review process before real publication. Takedown email drafts require a configured `VITE_TAKEDOWN_EMAIL` address.

The current curated starter links are official NPTEL course pages, checked 19 October 2026: [Operating System Fundamentals (IIT Kharagpur)](https://nptel.ac.in/courses/106105214), [Data Structures and Algorithms (IIT Delhi)](https://nptel.ac.in/courses/106102064), and [Introduction to Database Systems (IIT Madras)](https://nptel.ac.in/courses/106106220). They are course-level references, not KTU-approved study notes or past question papers. The app displays who added each link and the date checked.

## AI study assistant

The Study area uses Google's Gemini 3.1 Flash-Lite model through a server-side API route. It sends up to eight readable sources from the active topic (including typed notes) when the student submits a question. The model is instructed to answer only from those sources and cite them as `[S1]`, `[S2]`, and so on. Links and video titles are not fetched or treated as readable source content. The assistant says when no readable notes are available and keeps a local excerpt search as a fallback.

To connect it, create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey), copy `.env.example` to `.env`, and put the key after `GEMINI_API_KEY=`. Restart with `npm run dev`. The key stays on the server and must never be placed in `src/` or a `VITE_` variable. The in-app privacy notice explains that only current-topic readable text sent with Ask or ticked sources sent with Prepare go to Gemini. Google’s [current additional terms](https://ai.google.dev/gemini-api/terms) state that unpaid-service inputs and outputs may be used to improve products and human reviewers may process them; they also include an 18+ user requirement and a restriction against API clients directed to or likely accessed by people under 18. Paid API use with active billing is treated differently for product-improvement use but may still have limited safety/security logging. Review the current terms and eligibility before a student pilot; do not submit sensitive, confidential, or personal notes.

`npm run preview` serves the production build and the same API endpoint, so set `GEMINI_API_KEY` in the server environment there as well. The included request throttle is only an in-memory local-demo safeguard, not production authentication or abuse prevention. See [RUNBOOK.md](RUNBOOK.md) for key rotation, restart, pilot checks and rollback guidance.

The local server binds to `127.0.0.1`, checks same-origin requests for the AI endpoint, caps request/source sizes, and throttles requests. This protects the local demo from accidental exposure; it does not provide student accounts, secure shared hosting, or production-grade privacy. The sign-in remains a browser-only demo and local study data is not encrypted or protected from another person using the same browser profile.

Pilot metrics, notes, practice cards, boards, and uploads are browser-local. There is no database, cloud file storage, multi-user authorization, server moderation queue, or offline synchronization yet. Do not treat the class library as a real shared service.

## Before using real students

- Replace sample curriculum and resources in `src/data.js` with reviewed institutional data.
- Add server-side sign-in and per-student/class authorization.
- Move personal and shared notes to a database/object store with retention, deletion, backup, and moderation policies.
- Add an institution-owned rights review workflow; uploader declarations alone do not establish that a note may be shared.
- Add real student sign-in, server-side authorization, robust API rate limits, and an institutional privacy review before exposing the model endpoint publicly.
- Configure and test the feedback and takedown contacts; these local-demo buttons only prepare email drafts.
- Complete the screen-reader, keyboard-only and contrast checks recorded in the runbook. They have not been verified yet.

The starter links are curated third-party course references, not endorsements. External pages may change; confirm course relevance, availability and reuse terms on the provider’s site. Student-uploaded material is labeled by uploader and date; automated flags do not establish accuracy or legal permission.
