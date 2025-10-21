# 📚 Academic Support Hub — 10.20.2025

## 📌 Overview

The **Academic Support Hub (ASH)** is a student collaboration platform that provides:

- **Study Groups** — create, join, and view study groups by course  
- **Resources** — upload and tag study materials *(coming soon)*  
- **Q&A** — ask and answer peer questions *(coming soon)*  
- **Planner** — track assignments and deadlines *(coming soon)*  

> **This week’s focus:** Connecting the frontend interface to the **MySQL database** using **Express + AJAX** for live data fetching.

---

## 🚀 Getting Started

### 🧰 Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm (included with Node.js)
- MySQL database access (credentials in `.env`)

---

### 🪄 Clone the Repository

```bash
git clone <repo-url>
cd academic-support-hub
git checkout week3
⚙️ Running the Backend
1️⃣ Install dependencies
bash
Copy code
cd backend
npm install
2️⃣ Start the server
bash
Copy code
npm run dev
By default, the API runs at:
👉 http://localhost:5000

---

###🗃️ Database Configuration
The backend connects to the MySQL database using credentials stored in .env:

env
Copy code
DB_HOST=db.it.pointpark.edu
DB_USER=ash
DB_PASS=P9fhABtRJlBvD74Z
DB_NAME=ash
DB_PORT=3306

---

###🔌 Available Endpoints

Method	Endpoint	Description
GET	/api/study-groups	Fetch all study groups (optionally filter by course name)
POST	/api/study-groups	Create a new study group (stores course name + title)
POST	/api/study-groups/:id/join	Join a study group (placeholder for future logic)

The server now communicates directly with the MySQL database, replacing previous in-memory data.

---
###💻 Running the Frontend

1️⃣ Open the frontend directory
bash
Copy code
cd app
2️⃣ Launch in browser
Open home.html in your browser.
If you use VS Code, right-click the file and select:
👉 “Open with Live Server”

---

###🧭 Navigation Pages

Page	Description
home.html	Main entry point
study-groups.html	Fully connected to backend via AJAX
resources.html	Placeholder for future use
qa.html	Placeholder for Q&A feature
planner.html	Placeholder for assignment planner

The frontend uses JavaScript (fetch/AJAX) to send and receive data from the API endpoints dynamically.


---
###📂 Project Structure
perl
Copy code
academic-support-hub/
├── backend/              # Express + MySQL API
│   ├── db.js             # Database connection pool
│   ├── server.js         # API routes (Study Groups + placeholders)
│   ├── package.json
│   └── .env
│
├── app/                  # Frontend (HTML, CSS, JS)
│   ├── home.html
│   ├── study-groups.html
│   ├── resources.html    # placeholder
│   ├── qa.html           # placeholder
│   ├── planner.html      # placeholder
│   ├── style.css
│   ├── api.js
│   ├── study-groups.js
│   └── ...
│
└── README.md

---
###✅ Current Features

🧩 Study Groups
Fetches study group data directly from MySQL

Allows users to create new groups (course name + title)

Displays groups dynamically using AJAX (fetch) requests

Works both locally (localhost:5000) and on the jail (/project/api)

---
###🔜 Planned Features
Resources (UC-3): Upload and tag course materials

Q&A (UC-2): Post and answer peer questions

Planner (UC-4): Track assignments and deadlines with calendar view

---
###👥 Contributors
Name	Role
Mariah Martin	UC-1: Study Groups, backend API, MySQL integration
(Teammate 1)	UC-2: Q&A
(Teammate 2)	UC-3: Resources
(Teammate 3)	UC-4: Planner

---
###☁️ Deployment Notes
On the FreeBSD jail server:

The backend runs at port 5000, proxied via Nginx to /project/api

Frontend pages are served from /project/

Use tmux to keep the Node.js process running after logout:

bash
Copy code
tmux new -s backend
node server.js
# (detach with Ctrl+b then d)

##Access the site at:
#TBD