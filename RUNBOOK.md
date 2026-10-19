# Syllabus Hub pilot runbook

This runbook is for the local/browser-only prototype. It is not a production incident or security runbook: there are no real accounts, cloud database, or shared class library yet.

## Start and restart locally

1. Open PowerShell in the project folder.
2. Start the app with `npm run dev`.
3. Open `http://127.0.0.1:5173/`.
4. To restart, press `Ctrl+C` in that terminal, then run `npm run dev` again.

For a production-build smoke check, run `npm run build` and then `npm run preview`. Keep the terminal open while using the site.

## Gemini key handling

- Keep `GEMINI_API_KEY` in the untracked `.env` file or the hosting provider’s server-side secret store. Never add it to a `VITE_` variable, source file, screenshot, or commit.
- To rotate it, create a replacement key in the Google AI Studio project, update the server secret, restart/redeploy, verify `/api/study-chat/config` reports enabled, and then revoke the old key.
- If a key is exposed, revoke it immediately and inspect the project’s usage. Do not paste the key into feedback or support messages.
- Review Google’s current Gemini API terms before using AI with students. Current terms set age and audience restrictions; unpaid use may involve product-improvement use and human review of prompts and responses. Disable the Gemini endpoint for any pilot whose audience or data handling has not been approved.
- Apply a project quota/spend limit where available. A free quota does not guarantee that a project is eligible for every model or audience.

## Feedback and takedown contacts

Set `VITE_FEEDBACK_EMAIL` and `VITE_TAKEDOWN_EMAIL` before sharing the pilot. These addresses are public in the built web app. The buttons open an email draft; the app does not send it. Test that each opens the intended mailbox before inviting students.

## Before a student pilot

- Confirm the institution approves the data flow, intended age group, Gemini terms, and any use of uploaded notes.
- Test with synthetic notes first. Do not use confidential or personal material with an unpaid Gemini API project.
- With two consented students, manually record whether they can find, save and reopen a useful resource, resume their last topic, and inspect the cited source. Do not publish outcomes as learning gains without a study design.
- Pilot measurements in the dashboard default off. If a student opts in, the measures stay in that browser profile and can be cleared by turning the setting off.
- Run `npm test` and `npm run build` before each pilot build.
- Keyboard-only check: sign in, finish onboarding, operate course and topic selectors, open tabs, upload dialog, notes, board tools, timer, assistant, profile, backup and dialogs; confirm visible focus and Escape behavior.
- Screen-reader check: use NVDA with Firefox or Chrome. Confirm dialog names, tab selection, save/error states, form labels, status updates, and that confidence is described as the student’s own rating.
- Contrast check both Pixel and Neon looks with a contrast analyzer; check regular and large text and focus indicators. Do not mark accessibility as verified until these manual checks are recorded.
- Test at narrow phone width and with reduced-motion enabled.

## Rollback

For a hosted release, roll back to the last known-good deployment artifact using the host’s release controls. If the project is maintained in Git, revert the problematic commit, run `npm test` and `npm run build`, and deploy the reviewed prior version. This workspace may not have a Git remote configured, so keep a copy of the last working build before a pilot release.

## Current limits

Sign-in, private storage, takedown handling, and sharing are demo/local only. Email drafts rely on the student’s email app and do not confirm receipt. Browser-local data is not encrypted and can be seen by another person using that browser profile. This runbook does not authorize public deployment.
