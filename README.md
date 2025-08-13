# Vercel ToDo Pro (Next.js)

Local-first ToDo with **recurrence**, **streaks**, **priority**, **tags**, and **notes**. Deploy-ready on **Vercel**.

## Quick start
```bash
npm install
npm run dev
```
Tests:
```bash
npm test
```

## Deploy
Import the repo on Vercel. No env vars needed.

## Notes
- Completing a recurring task on/before due increments streak and shifts due forward.
- Missing the due day resets streak the next day.
- Monthly rule respects month length (31st → last day next month).
