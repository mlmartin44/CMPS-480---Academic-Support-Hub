
# ASH API — Week 2 Starter

Minimal **Node.js + Express** API (mock data) to support **All Use cases** so we can deploy even if DB/jails aren't ready.

## Endpoints

### Use Case 1: Join a Study Group 
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
### Use Case 1: Join a Study Group 
- Render deployed link: https://cmps-480-academic-support-hub.onrender.com/
  
## Repo Layout
```
/docs/week2/architecture.png
/app/server.js
package.json
README.md
```
