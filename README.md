Academic Support Hub — Week 5

📌 Overview

This project is the Academic Support Hub (ASH), a student tool that provides:

Study Groups (join or create groups by course/major)

Resources (upload and tag study materials)

Q&A (ask and answer peer questions)

Planner (track assignments and deadlines)

This week’s focus was creating a minimal working interface and connecting the frontend (HTML/CSS/JS) with the backend API (Express).


🚀 Getting Started
Prerequisites

Node.js
 (v18+)

npm (comes with Node.js)

Clone the Repository
git clone <repo-url>
cd academic-support-hub
git checkout week3

⚙️ Running the Backend

Install dependencies:

cd backend
npm install


Start the server:

npm run dev


By default, the API runs at:

http://localhost:5000

Available Endpoints (so far)

GET /api/study-groups → List study groups (filter by course or tag)

POST /api/study-groups/:id/join → Join a study group (or waitlist if full)

👉 Placeholders exist for other APIs (Resources, Q&A, Planner).


🖥️ Running the Frontend

Open the frontend files:

cd app


Open home.html in your browser (right-click → “Open With Live Server” if using VS Code extension).

Navigation links are available for all pages:

home.html → Main entry point

study-groups.html → Connected to backend API

resources.html → (placeholder)

qa.html → (placeholder)

planner.html → (placeholder)


📂 Project Structure
academic-support-hub/
├── backend/              # Express API
│   ├── server.js         # API routes (Study Groups + placeholders)
│   ├── package.json
│   └── ...               
│
├── app/                  # Frontend (HTML, CSS, JS)
│   ├── home.html
│   ├── study-groups.html
│   ├── resources.html    # placeholder
│   ├── qa.html           # placeholder
│   ├── planner.html      # placeholder
│   ├── style.css
│   ├── study-groups.js
│   ├── api.js
│   └── ...
│
└── README.md             # This file


✅ Current Features

Study Groups:

Browse groups

Join groups / waitlist when full

Home page with navigation & Canvas-like styling


🔜 Planned Features

Resources Page (UC-3): Upload and tag study materials

Q&A Page (UC-2): Post questions, accept answers, and display history

Planner Page (UC-4): Add/view assignments by deadline, calendar sync


👥 Contributors

Mariah Martin — UC-1: Study Groups, repo/branch setup, slides

(Teammate Name) — UC-2: Q&A

(Teammate Name) — UC-3: Resources

(Teammate Name) — UC-4: Planner
