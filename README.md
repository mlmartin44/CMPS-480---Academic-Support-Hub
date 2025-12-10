# 📚 Academic Support Hub — 11.15.2025

## 📌 Overview

The **Academic Support Hub (ASH)** is a student collaboration platform that provides:

- **Study Groups** — create, join, and view study groups by course  
- **Resources** — upload and tag study materials *(coming soon)*  
- **Q&A** — ask and answer peer questions *(prototype implemented)*  
- **Planner** — track assignments and deadlines *(coming soon)*  

---

## 🚀 Getting Started

### 🧰 Prerequisites
- Node.js (v18+)
- npm (included with Node.js)
- MySQL database access (credentials in `.env`)
- VS Code recommended (Live Server extension helps with frontend testing)

---

### 🪄 Clone the Repository

git clone \<repo-url\>  
cd academic-support-hub  

---

### ⚙️ Running the Backend

1️⃣ Install dependencies  
bash  
Copy code  
cd backend  
npm install  

2️⃣ Start the server  
bash  
Copy code  
node server.js  

By default, the API runs at:  
👉 http://localhost:5000/api

---

### 🗃️ Database Configuration

The backend connects to the MySQL database using credentials stored in `.env`:

env  
Copy code  
DB_HOST=db.it.pointpark.edu  
DB_USER=ash  
DB_PASS=P9fhABtRJlBvD74Z  
DB_NAME=ash  
DB_PORT=3306  

---

### 🔌 Available Endpoints

**Study Groups (UC-1)**  

Method | Endpoint | Description  
------ | -------- | -----------  
GET | `/api/study-groups` | Fetch all study groups (optionally filter by course name)  
POST | `/api/study-groups` | Create a new study group (stores course name + title)  
POST | `/api/study-groups/:id/join` | Join a study group (placeholder for future logic)  

**Home Dashboard**  

- GET `/api/home` — returns welcome text, announcements, and highlight counts  

**Q&A Prototype (UC-2)**  

- GET `/api/questions` — returns list of questions from `qaapi.json`  
- POST `/api/questions` — adds a new question to `qaapi.json`  

The Q&A reactions UI is handled on the frontend using `reactions.js`.

---

### 💻 Running the Frontend

1️⃣ Open the frontend directory  
bash  
Copy code  
cd app  

2️⃣ Launch in browser  
Open `home.html` in your browser.  
If you use VS Code, right-click the file and select:  
👉 “Open with Live Server”

---

### 🧭 Navigation Pages

Page | Description  
-----|------------  
home.html | Main entry point  
study-groups.html | Fully connected to backend via AJAX (Study Groups)  
qa.html | Q&A prototype with reactions  
resources.html | Placeholder for future use (Resources)  
planner.html | Placeholder for assignment planner (Planner)  

The frontend uses JavaScript (fetch/AJAX) to send and receive data from the API endpoints dynamically.

---

### 📂 Project Structure

perl  
Copy code  
academic-support-hub/  
├── backend/              # Express + MySQL API  
│   ├── db.js             # Database connection pool  
│   ├── server.js         # API routes (Study Groups, Home, Q&A prototype)  
│   ├── homeapi.js        # Static home dashboard data  
│   ├── qaapi.json        # Static Q&A data store  
│   ├── package.json  
│   └── .env  
│  
├── app/                  # Frontend (HTML, CSS, JS)  
│   ├── home.html  
│   ├── study-groups.html  
│   ├── resources.html    # placeholder  
│   ├── qa.html           # Q&A prototype  
│   ├── planner.html      # placeholder  
│   ├── style.css  
│   ├── qastyle.css  
│   ├── api.js  
│   ├── study-groups.js  
│   ├── reactions.js  
│   └── ...  
│  
└── README.md  

---

### ✅ Current Features

🧩 **Study Groups (UC-1)**  
- Fetches study group data directly from MySQL  
- Allows users to create new groups (course name + title)  
- Displays groups dynamically using AJAX (fetch) requests  
- Works both locally (`localhost:5000/api`) and on the jail (`/project/api`)  

🏠 **Home Page**  
- Loads announcements and highlight counts from `/api/home`  

❓ **Q&A Prototype (UC-2)**  
- Loads questions from `/api/questions`  
- Allows posting new questions  
- Adds emoji reactions and replies using `reactions.js` *(front-end only)*  

---

### 🔜 Planned Features

- **Resources (UC-3):** Upload and tag course materials  
- **Q&A (UC-2, full):** Store questions/answers in MySQL, add voting/accepted answers  
- **Planner (UC-4):** Track assignments and deadlines with a calendar-style view  

---

### 👥 Contributors

Name | Role  
---- | ----  
Mariah Martin | UC-1: Study Groups, backend API, MySQL integration  
Ethan | UC-2: Q&A UI + reactions prototype  
Brandon | UC-3: Resources (design + future implementation)  
Teammate 3 | UC-4: Planner (future implementation)  
Teammate 4 | UC-4: Planner support  

---

### ☁️ Deployment Notes

On the FreeBSD jail server:

- The backend runs at port **5000**, proxied via Nginx to `/project/api`  
- Frontend pages are served from `/project/` (mapping to the `app` directory)  

Use `tmux` to keep the Node.js process running after logout:

bash  
Copy code  
tmux new -s backend  
node server.js  
# (detach with Ctrl+b then d)  

---

## Access the site at:
TBD (replace with your actual jail URL, e.g.  
`https://your-jail.it.pointpark.edu`)
