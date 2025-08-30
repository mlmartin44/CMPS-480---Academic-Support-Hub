# CMPS-480---Academic-Support-Hub
To use for the CMPS 480 Senior Project 

# Academic Support Hub

A platform where students can:
- Find study groups by course/major
- Access approved study materials
- Participate in peer-to-peer Q&A
- Use a built-in planner for assignments and deadlines

---

## Branches
- `main` → stable production-ready code
- `dev` → integration branch (merge feature branches here first)

## Team Workflow
1. Create a feature branch from `dev`
2. Commit & push your changes to your branch
3. Open a Pull Request → merge into `dev`
4. Instructor-ready releases → merge `dev` into `main`

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Git (to clone the repo)

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/YOURORG/CMPS-480---Academic-Support-Hub.git
   cd CMPS-480---Academic-Support-Hub
   git checkout dev
Go into the app folder and install dependencies:

bash
Copy code
cd app
npm install
Start the development server:

bash
Copy code
npm start
Open in browser:

Home: http://localhost:3000/

Health check: http://localhost:3000/health

Study groups: http://localhost:3000/study-groups

Resources: http://localhost:3000/resources

Planner: http://localhost:3000/planner

## Notes
Do not commit node_modules or .env files (they’re ignored in .gitignore).

Always branch off dev when adding features.

Keep commits small and meaningful.

yaml
Copy code

---

✅ This gives your teammates **step-by-step setup instructions** so they can clone, install, and run immediately.  

Do you want me to also create a **short section for “Module 1 Submission Checklist”** at the bottom of the README, so you can