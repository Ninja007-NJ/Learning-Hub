from pathlib import Path
import re, html, textwrap, sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted, KeepTogether, HRFlowable, Table, TableStyle

ROOT = Path.cwd()
OUT = ROOT / 'output' / 'pdf' / 'syllabus-hub-project-guide-and-full-source.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

# Arial and Consolas provide readable prose and source code on Windows.
fonts = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Arial', str(fonts / 'arial.ttf')))
pdfmetrics.registerFont(TTFont('Arial-Bold', str(fonts / 'arialbd.ttf')))
pdfmetrics.registerFont(TTFont('Consolas', str(fonts / 'consola.ttf')))

NAVY = colors.HexColor('#102A3A')
INK = colors.HexColor('#15232B')
MUTED = colors.HexColor('#54636D')
ORANGE = colors.HexColor('#F37505')
PAPER = colors.HexColor('#FBF4E9')
TEAL = colors.HexColor('#176B68')
PALE = colors.HexColor('#EFF3F3')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitleX', fontName='Arial-Bold', fontSize=27, leading=32, textColor=NAVY, alignment=TA_LEFT, spaceAfter=8))
styles.add(ParagraphStyle(name='CoverSubX', fontName='Arial', fontSize=12, leading=18, textColor=MUTED, spaceAfter=12))
styles.add(ParagraphStyle(name='SectionX', fontName='Arial-Bold', fontSize=17, leading=21, textColor=NAVY, spaceBefore=14, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name='SubX', fontName='Arial-Bold', fontSize=11.2, leading=14, textColor=TEAL, spaceBefore=8, spaceAfter=4, keepWithNext=True))
styles.add(ParagraphStyle(name='BodyX', fontName='Arial', fontSize=9.4, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name='SmallX', fontName='Arial', fontSize=8.2, leading=11, textColor=MUTED, spaceAfter=5))
styles.add(ParagraphStyle(name='BulletX', fontName='Arial', fontSize=9.2, leading=13, leftIndent=14, firstLineIndent=-8, bulletIndent=0, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name='CodeHeadX', fontName='Arial-Bold', fontSize=10, leading=13, textColor=NAVY, spaceBefore=6, spaceAfter=4, keepWithNext=True))
code_style = ParagraphStyle(name='CodeX', fontName='Consolas', fontSize=6.3, leading=7.7, textColor=colors.HexColor('#18252D'), backColor=colors.HexColor('#F6F7F7'), borderColor=colors.HexColor('#D8DFE2'), borderWidth=.4, borderPadding=5, leftIndent=2, rightIndent=2, spaceAfter=5, splitLongWords=1)

body = [
('Project at a glance', [
('p', 'Syllabus Hub is a student-facing learning workspace that connects a course syllabus to study materials and a place to work. The current application is a local-first prototype built with React and Vite. A student can enter a demo profile, select an available course, semester, subject and topics, find topic-matched resources, upload readable notes, write or draw in a study area, and ask a source-grounded assistant about text it can actually read. The aim is to reduce the jumps between a syllabus PDF, search results, scattered class notes and a separate notebook.'),
('p', 'This guide describes the working code in the project root at the time of preparation. It distinguishes implemented behavior from ideas that still require a production backend. The attached source appendix contains the first-party application files and configuration used to run this copy; it excludes installed dependencies, generated build output, and environment files that can contain private API credentials.'),
]),
('The problem and the users', [
('p', 'A student often knows the subject name but not the fastest route from a course outline to a useful explanation, worked example, video or past question. Materials are fragmented across institutional syllabi, video platforms, learning websites, personal files and messaging groups. Students then spend time searching, deciding whether a resource matches the exact topic, and rewriting useful points somewhere else. That friction is especially costly during revision, when the student needs to resume a precise topic rather than reconstruct a study plan.'),
('p', 'There is also a quality and trust problem. A search result can be unrelated, outdated or incomplete. A shared note may have unclear authorship or reuse permission. A chatbot can sound confident while making up a fact or citing material it never saw. The project therefore treats the syllabus as the organizing structure and tries to keep the source visible. The prototype can record an uploader’s declaration and can constrain an AI answer to supplied readable notes, but neither behavior proves that a resource is academically correct or legally shareable.'),
('p', 'The primary audience is a student working through a defined program and semester. A secondary audience is a class contributor who has useful notes to organize for peers. In a real deployment, lecturers, course coordinators and moderators would also be relevant: they would approve curriculum versions, curate links, handle reports and decide how shared materials are reviewed.'),
]),
('What makes the approach distinctive', [
('p', 'The project’s defensible contribution is the combination and workflow, not a claim that no other product has a syllabus view, note uploader, whiteboard or AI assistant. Each individual capability exists in other learning tools. The value proposition is to connect those capabilities at the granularity of a chosen course topic: syllabus selection leads to a scoped resource list, those materials stay beside a personal study board, and the assistant can refer back to readable source passages.'),
('p', 'A useful differentiator to develop is a syllabus-to-evidence map. For every topic it could show the official syllabus reference, which notes, videos, book sections and questions support it, the date and owner of each item, and what is still missing. That gives a student an actionable coverage estimate instead of an ungrounded “complete” badge. The existing insights card starts this idea with counts and topic coverage estimates. Coverage is only an organizational signal; it must never be presented as proof of mastery or exam readiness.'),
('p', 'The second differentiator is source-linked study. A student should be able to select a paragraph in a document, ask a question about it, save an answer with the source and page, and turn that answer into a short note or practice question. The current assistant cites labels for supplied text sources; document-page coordinates, durable citations and answer-to-practice actions are future work. Keeping that boundary explicit makes the prototype credible and gives the next engineering steps a clear target.'),
]),
('Student journey and page flow', [
('p', 'The current app is organized around a short sequence and a dashboard that helps the student resume. First, the demo sign-in collects a display name and email and gives the session a local profile. The password-shaped field is for the demo interaction only; it is not sent or stored. Second, course setup filters by branch and semester, lists the subjects available in the local catalog, and lets the student select syllabus topics. Topic checkboxes start selected so a student can continue quickly. Unsupported semesters show an explanatory message rather than an empty subject list.'),
('p', 'Third, the dashboard acts as a return point: it summarizes the selected subject, topic count and saved notes, and opens the last topic in either materials or the study board. The resources workspace filters materials to selected topics, groups them by type, supports instant search, previews selected items, offers bookmark and quick-add actions, and provides note upload. Fourth, the study workspace pairs a drawing board and typed notes with a resource list and assistant. The board supports pointer/touch drawing, pen-like tools, color/size controls, paper patterns, undo/redo, clear, automatic browser saving and PNG export. The design intent is to keep related work together rather than make a student repeatedly navigate away.'),
('p', 'The current implementation remembers profile state in local storage and can reopen to the saved dashboard/workspace view and topic. This is convenience on one browser profile, not cross-device continuity. The user journey to demonstrate is: enter the demo profile, choose a loaded branch and semester, pick a subject and topic set, inspect an item, upload a text-based note to a topic, open the board, ask a question grounded in that note, and return to the dashboard.'),
]),
('UI and visual design', [
('p', 'The active root copy uses the Pixel robot look by default, with a separate Neon glass theme available through the look controls. Pixel style uses a warm cream paper background with a subtle square grid, dark navy ink, orange actions, crisp two-pixel borders and hard offset shadows. The top ticker adds a little motion, while dark terminal-style panels give the progress and assistant areas a clear contrast. Space Grotesk is used for interface text and Space Mono for compact labels. These choices echo the user’s supplied visual references while keeping the layout practical for studying.'),
('p', 'The design system is implemented mainly in src/index.css and src/theme.js, with reusable controls and panels in src/components/ui.jsx and src/components/ThemePanel.jsx. The content remains the focus: high-contrast headings, visible action states, descriptive empty states, topic counts and explicit estimates. Responsive layouts collapse to narrower stacks on small screens. Keyboard focus styles, semantic buttons/labels, status text alongside color and reduced-motion handling are present in the UI. The visual system should still be checked with real students, keyboard-only use, phone-sized screens and contrast tooling before calling it accessible.'),
('p', 'There are multiple prior UI copies and references in the project history. This guide describes the active project root, not an older nested black-theme copy or a static screenshot. For distribution, keep one canonical app folder and name the active theme clearly; otherwise screenshots, code and the running host can appear to show different products.'),
]),
('Frontend architecture and behavior', [
('p', 'The frontend is a single-page React application. src/main.jsx mounts src/App.jsx. App owns the student profile, current page, course selection, current topic, resource collections, bookmarks, notes and theme settings. Child pages receive the data and callbacks they need. This is understandable for a prototype, but the top-level component has become a central state hub. As the product grows, move state and business rules into focused hooks or services, define stable data types, and avoid spreading local-storage knowledge across page components.'),
('p', 'src/data.js contains the curriculum catalog, sample topic status and seed resources. src/lib.js provides defensive local-storage helpers and related small utilities. MiniSearch powers resource search; PDF.js extracts text from selectable-text PDFs in the browser. The upload dialog accepts text PDF, TXT and Markdown, reads text locally, suggests a topic from the file name and content, and lets the student confirm the destination. It is not a general document-management service: scanned PDFs are not OCR’d, and the files are represented by extracted text in browser storage.'),
('p', 'The course catalog currently includes KTU 2024 previews for B.Tech Computer Science and Engineering, Civil Engineering and Mechanical Engineering, plus a sample CSE course. In this root copy, CSE and Mechanical show S3/S4; Civil shows S3/S4/S5. Other semester choices are not all populated. Some branch lists are compact previews and use illustrative topic outlines, not a definitive, college-approved syllabus. Students must verify their admitted batch and allotted electives against the current official curriculum and their college notices. Catalog revisions should carry a source URL, scheme, version/date and review owner.'),
]),
('Backend and AI request path', [
('p', 'The backend currently has one main purpose: protect the Gemini API key while offering the study assistant endpoint. server.mjs runs Node’s HTTP server and mounts Vite middleware during development; in production-preview mode it serves the built dist folder and the same API. The server reads GEMINI_API_KEY from the root .env file without exposing it through a Vite client variable. The key must never be committed, placed in src, or prefixed with VITE_. The .gitignore excludes .env.'),
('p', 'The browser asks /api/study-chat/config whether AI is enabled. When a student submits a question, the assistant selects up to eight readable sources for the active topic, including typed notes and text extracted from supported uploads. The request passes the question, topic and source text to /api/study-chat. The server validates the origin and JSON content type, caps request size, applies a simple in-memory per-address throttle, trims question and source text, and sends the prompt to Gemini 3.1 Flash-Lite with a fallback model. The prompt directs the model to use only supplied materials, cite sources as [S1] and so on, say when the material does not support an answer, and treat document text as untrusted content rather than instructions. The client displays the citations and falls back to local excerpt search if the AI service is disabled or fails.'),
('p', 'These controls are sensible for a local demo, not enough for a public service. The throttle resets when the process restarts and does not identify accounts; origin checks are not authentication. The AI provider receives the selected source text and question. Provider pricing, free quotas, model availability and data handling can change, so the owner must review current terms and disclose them to students before deployment. The model can still misunderstand a source. Students should confirm important claims against the original material.'),
]),
('Technology inventory', [
('b', 'Frontend: React and React DOM for the UI; Vite and the React plugin for local development/build; Tailwind CSS 3 with PostCSS and Autoprefixer for styling; plain JavaScript ES modules and JSX.'),
('b', 'Interface and data: CSS custom properties and theme switching; MiniSearch for in-browser search; PDF.js for text extraction from supported PDFs; browser localStorage for demo persistence; Canvas/pointer input for the board and browser Blob/object URLs for exports.'),
('b', 'Server and AI: Node.js built-in HTTP, file-system and path modules; Vite middleware in development; Gemini API via server-side fetch for grounded study answers; local .env configuration for the secret key.'),
('b', 'Delivery: npm scripts for development, production build and preview; source code in src/ and server.mjs; dist/ is generated and should not be part of the source-code appendix.'),
('p', 'The package manifest currently uses latest tags for React, React DOM, Vite and the Vite React plugin while pinning some other packages. For repeatable builds, use a committed lockfile, review dependency updates and pin or range dependencies deliberately. Keep the runtime version documented. Before a real release, add automated checks for server ownership and access rules, unit checks for parsing/topic matching, end-to-end browser flows and a deployment checklist. This guide does not claim such a test suite exists.'),
]),
('What is implemented and what is not', [
('p', 'Implemented in this prototype: four major student-facing stages through sign-in, course/topic setup, resources and a combined study workspace; local demo profiles; saved topic choices and study data; sample curriculum and resource data; search, preview, bookmarks and quick-add; local text-note upload and topic suggestion; board drawing and typed notes; a server-side Gemini API proxy with cited-source prompting and local-search fallback; dashboard, profile export and theme controls. A local production build has previously succeeded in this workspace. This is evidence that the current source compiles, not a full reliability, security or usability evaluation.'),
('p', 'Not implemented as production services: verified student identity, password handling, account recovery, multi-user authorization, a database, cloud file storage, cross-device sync, real class sharing, a moderator workflow, malware scanning, OCR for scanned pages, durable version history, collaboration, institutional syllabus approval, or legal verification. The words “private” and “class library” in this prototype describe a local browser demo experience; they do not establish server-side privacy or sharing. The app records a rights declaration only. No automated process can make a legal decision from that checkbox.'),
('p', 'An especially important limit is browser persistence. Local storage is tied to a browser profile, can be cleared, is not encrypted by this application, has finite capacity, and can be read by another person using that same profile. Extracted notes and board state may contain private work. AI questions also transmit selected source text to Google when the API is enabled. Do not use sensitive or confidential student material in a public demo. Provide a clear consent notice and minimize the text sent.'),
]),
('How to take it to a real service', [
('p', 'Start by deciding the exact pilot: one institution, one scheme, a few classes and clearly named student roles. Interview students and a lecturer about their current resource search, note-sharing process, syllabus changes and privacy expectations. Measure a baseline such as time to find a relevant resource, successful topic matches, return rate and the number of answers students verify. The differentiation should be supported by these outcomes, not by claiming to be first or unique in the market.'),
('p', 'Next, establish one trusted curriculum source and a versioning process. Import the current official catalog, retain source and revision information, have a course owner review it, and represent core subjects, electives and labs accurately. Treat previews as previews. Do not show a subject as a student’s requirement until the college has confirmed the applicable batch and elective. Add deep links to official material where permitted, but keep search and study inside the app.'),
('p', 'Then build the security foundation before real sharing. Add server-side authentication, session renewal and account recovery; add owner and course membership checks to every API; put data in a relational database with migration and backup plans; store uploaded originals in private object storage using short-lived signed access; and apply database policies so one student cannot access another’s private items. Add deletion and export operations, retention settings, abuse reporting and security logging. A UI toggle cannot replace server authorization.'),
('p', 'Make uploads durable and reviewable: validate file type and actual content, enforce size limits server-side, scan files, process extraction in a background job, keep the original private, and show progress, failure and retry. Store attribution and declared licence as structured fields. Duplicate detection can flag possible copies, and moderators can investigate them, but the status should say “needs review” rather than “legal”. Provide reasons, an appeal path and takedown handling. OCR can be added later with consent and suitable cost/performance measurements.'),
('p', 'Move notes and boards to an authenticated save API with visible saved/saving/failed status, retry, version history and conflict handling. Preserve offline-first editing only if synchronization conflicts are designed and tested. Build AI retrieval with explicit selected sources, chunking, citations to file/page/section and a way to inspect the quoted evidence. Add prompt-injection defenses, request budgets, per-user rate limits and provider data controls. Provide the local-search mode as a useful fallback, and let users disable AI or remove a source before sending it.'),
('p', 'Finally, pilot with a small group and iterate. Test upload failures, large files, wrong topic suggestions, multiple tabs, expired sessions, narrow screens, keyboard navigation, slow networks, deleted courses and AI quota errors. Ask students whether they can resume and verify an answer. Track only data needed to improve the experience. Expand branches and semesters after curriculum review, and only then plan a wider rollout. A realistic order is: curriculum and user research; authentication and data model; private storage and permissions; uploads and moderation; dependable notes and board sync; source-grounded AI; then analytics and scale.'),
]),
('How to present the project', [
('p', 'A strong short demonstration tells one student story. Open with the scattered-materials problem, sign into the demo, choose an available KTU branch and semester, choose a subject and a small set of syllabus topics, and show that the resources list follows those topics. Add a text-based note, correct its suggested topic if needed, and show the disclosure that sharing rights are declared rather than verified. Open the study area, write or draw a short explanation, then ask the assistant a question that the uploaded text can answer. Point to its source label and show what happens when the source cannot answer. Finish with the dashboard resume flow and explain what local storage means.'),
('p', 'Keep the claims precise: “source-grounded prototype” is accurate; “fact checked”, “legally validated”, “secure student accounts”, “shared across the class” and “complete KTU syllabus” are not accurate for the current implementation. State that selected text is sent to the configured AI provider when Gemini is active. If the evaluator asks about novelty, emphasize the integrated topic-to-evidence-to-study workflow and propose validating its usefulness with a student pilot. If asked about sustainability, describe the backend roadmap and the costs of hosting, storage, model usage, moderation and curriculum maintenance.'),
]),
('Closing summary', [
('p', 'The project has a clear student problem, a coherent interface and a promising technical direction. Its strongest design decision is organizing study around syllabus topics and keeping materials, notes, a board and a source-aware assistant in one place. Its current implementation is a functional local prototype, not yet a secure multi-user learning platform. The next milestone should not be adding many more features: it should be a narrow, reviewed course pilot with a trusted curriculum, real accounts, server-enforced ownership and private storage. With those foundations, the topic evidence map and source-linked study workflow can become a credible differentiator that is measurable, transparent and useful.'),
]),
]

# Source appendix: all first-party project code/configuration, excluding dependencies, generated output and secrets.
source_paths = [
    'package.json', 'index.html', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js', 'server.mjs', 'README.md',
    'src/main.jsx', 'src/App.jsx', 'src/data.js', 'src/lib.js', 'src/theme.js', 'src/index.css',
    'src/pages/LoginPage.jsx', 'src/pages/SelectPage.jsx', 'src/pages/ResourcesPage.jsx', 'src/pages/StudyArea.jsx',
    'src/components/ui.jsx', 'src/components/ThemePanel.jsx', 'src/components/InsightsCard.jsx', 'src/components/NotesUploadDialog.jsx', 'src/components/StudyAssistant.jsx',
]
missing = [p for p in source_paths if not (ROOT / p).is_file()]
if missing:
    raise SystemExit('Source file missing: ' + ', '.join(missing))

class NumberedDocTemplate(SimpleDocTemplate):
    pass

def footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page > 1:
        canvas.setStrokeColor(colors.HexColor('#D9E0E2'))
        canvas.setLineWidth(.5)
        canvas.line(18*mm, 14*mm, w-18*mm, 14*mm)
        canvas.setFont('Arial', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(18*mm, 9*mm, 'SYLLABUS HUB  |  PROJECT GUIDE AND SOURCE APPENDIX')
        canvas.drawRightString(w-18*mm, 9*mm, f'{doc.page}')
    canvas.restoreState()

doc = NumberedDocTemplate(str(OUT), pagesize=A4, rightMargin=19*mm, leftMargin=19*mm, topMargin=18*mm, bottomMargin=20*mm, title='Syllabus Hub - Project Guide and Full Source Code', author='Project documentation', subject='Project architecture, implementation guide and source appendix')
story = []
story += [Spacer(1, 18*mm), Paragraph('SYLLABUS HUB', styles['CoverTitleX']), Paragraph('Project guide and complete first-party source code', styles['CoverSubX']), HRFlowable(width='100%', thickness=3, color=ORANGE, spaceBefore=4, spaceAfter=12), Paragraph('From syllabus selection to a source-aware study workspace', ParagraphStyle('strap', parent=styles['CoverSubX'], fontName='Arial-Bold', fontSize=16, leading=22, textColor=NAVY)), Spacer(1, 7*mm)]
cover_box = Table([[Paragraph('<b>What is inside</b><br/>A 2,000-3,000 word explanation of the problem, product workflow, interface design, frontend, backend and AI request path, technology stack, limitations, differentiation and practical delivery plan. The full active project source follows as an appendix.', styles['BodyX'])]], colWidths=[170*mm])
cover_box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PAPER),('BOX',(0,0),(-1,-1),1.5,NAVY),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
story += [cover_box, Spacer(1, 12*mm), Paragraph('Prepared 17 October 2026', styles['SmallX']), Paragraph('Scope note: this guide documents the active root copy in the supplied workspace. The code appendix intentionally excludes node_modules, dist, media assets, and .env secrets.', styles['SmallX']), PageBreak()]
story += [Paragraph('Project explanation', styles['SectionX']), Paragraph('Guide narrative: approximately 2,000-3,000 words. The source appendix is additional.', styles['SmallX'])]
word_count = 0
for heading, blocks in body:
    story.append(Paragraph(html.escape(heading), styles['SectionX']))
    for kind, text in blocks:
        word_count += len(re.findall(r"\b[\w’'-]+\b", text))
        if kind == 'b':
            story.append(Paragraph('• ' + html.escape(text), styles['BulletX']))
        else:
            story.append(Paragraph(html.escape(text), styles['BodyX']))

if not (2000 <= word_count <= 3000):
    raise SystemExit(f'Narrative word count {word_count} is outside the requested 2,000-3,000 range.')

story += [PageBreak(), Paragraph('Appendix A - Complete project source', styles['SectionX']), Paragraph(f'{len(source_paths)} first-party files. Contents are copied from the active workspace at PDF creation time. Dependencies and generated build files are excluded. The .env file is intentionally omitted because it can contain a private Gemini API key; package-lock.json is omitted because dependency implementation is not application source.', styles['BodyX'])]
for rel in source_paths:
    story.append(Paragraph(html.escape(rel), styles['CodeHeadX']))
    raw = (ROOT / rel).read_text(encoding='utf-8')
    if not raw.endswith('\n'):
        raw += '\n'
    # Keep source intact; ReportLab wraps long lines visually within the page width.
    story.append(Preformatted(raw, code_style, maxLineLength=125))

# The last source file closes the appendix; no mostly-empty trailing page is added.
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'PDF={OUT}')
print(f'NARRATIVE_WORDS={word_count}')
print(f'SOURCE_FILES={len(source_paths)}')
print(f'SOURCE_BYTES={sum((ROOT/p).stat().st_size for p in source_paths)}')


