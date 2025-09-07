
# ASH API — Week 2 Starter

Minimal **Node.js + Express** API (mock data) to support **UC-1: Join a Study Group** so you can deploy even if DB/jails aren't ready.

## Endpoints
- `GET /api/study-groups?course=CMPS262&tag=graphs`
- `POST /api/study-groups/:id/join`  body: `{ "role": "member" }`

## Local Dev
```bash
npm install
npm run dev
# http://localhost:5000/api/study-groups?course=CMPS262
```

## Deploy (Render)
- Build: `npm install`
- Start: `node server.js`
- PORT: use default `$PORT`

## Repo Layout
```
/docs/week2/architecture.png
/app/server.js
package.json
README.md
```
