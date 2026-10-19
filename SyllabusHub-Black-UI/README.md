# Syllabus Hub — complete frontend copy

This is the reusable React/Vite frontend for the Syllabus Hub demo. It includes the flow and features discussed in the project plan:

- Demo sign-in and a student dashboard with continue-studying actions
- Course, semester, subject, and syllabus-topic selection
- Topic workspace with Materials and Study space tabs
- Resource search, previews, bookmarking, and free learning links
- Upload text-based PDF, TXT, or Markdown files to private My Space or the demo class library
- Whiteboard with pen, highlighter, eraser, text, paper styles, undo/redo, and PNG export
- Typed notes saved per topic in browser storage
- Study assistant with local note search and an optional server API integration
- Profile page with editable display name and a study-data export

## Run it

1. Extract/open this folder in a terminal.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL Vite displays.
4. Run `npm run build` to make a production build.

## Main source files

- `src/App.jsx` — page flow, dashboard, workspace tabs, profile, and browser-local persistence
- `src/pages/LoginPage.jsx` — demo sign-in
- `src/pages/SelectPage.jsx` — course and syllabus setup
- `src/pages/ResourcesPage.jsx` — resources, search, sharing, and upload entry point
- `src/pages/StudyArea.jsx` — whiteboard, topic notes, and assistant panel
- `src/components/NotesUploadDialog.jsx` — upload parsing, topic suggestion, private/class choice, and sharing declaration
- `src/components/StudyAssistant.jsx` — local source search and optional `/api/study-chat` integration
- `src/data.js` — sample curriculum and learning resources; replace with your own
- `src/lib.js` — storage and resource helpers
- `src/index.css`, `tailwind.config.js` — black-and-white visual system

## Demo limitations

This package intentionally contains no `.env`, API key, or backend server. Demo sign-in is not secure authentication. Local notes and drawings stay in this browser. Class uploads are only a local demo library, not live sharing between students. Generated AI responses need a server endpoint; without one, the assistant searches readable notes locally. Do not place secret API keys in frontend code.
