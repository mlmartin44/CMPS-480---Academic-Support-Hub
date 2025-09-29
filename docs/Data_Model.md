# Academic Support Hub – Data Models

This document describes the data models for each use case (UC-1 through UC-4) and the unified model that integrates them into a single system.

---

## UC-1: Join a Study Group

**Purpose:**  
Supports users creating, joining, and managing study groups tied to courses.  

**Entities:**  
- **User** – core user info (ID, name, email, handle).  
- **Course** – courses offered; groups belong to a course.  
- **StudyGroup** – groups for collaboration; owned by a user and linked to a course.  
- **GroupMembership** – many-to-many join table between users and groups, with role (owner, member, moderator).  
- **JoinRequest** – tracks user requests to join a group (pending, approved, denied).  

**Key Relationships:**  
- One **Course** can have many **StudyGroups**.  
- One **User** can belong to many groups via **GroupMembership**.  
- One **User** can submit many **JoinRequests** to different groups.  
- One **StudyGroup** can have many memberships and join requests.  

---

## UC-2: Q&A (Post Question & Accept Answer)

**Purpose:**  
Enables users to post questions in study groups, answer them, and accept answers.  

**Entities:**  
- **User** – asks questions and posts answers/comments.  
- **StudyGroup** – context for questions.  
- **Question** – created by a user, scoped to a group.  
- **Answer** – linked to a question and posted by a user; can be marked as accepted.  
- **Comment** – polymorphic comments that can attach to either questions or answers.  

**Key Relationships:**  
- A **StudyGroup** has many **Questions**.  
- A **Question** can have many **Answers**.  
- A **User** can post many **Questions**, **Answers**, and **Comments**.  
- A **Comment** targets either a question or an answer.  

---

## UC-3: Resources & Tagging

**Purpose:**  
Allows users to upload study materials to groups and tag them for search.  

**Entities:**  
- **User** – uploads resources.  
- **StudyGroup** – holds resources.  
- **Resource** – uploaded material; includes `file_type`, `title`, `description`, `url/file_path`, file size, downloads, timestamps.  
- **Tag** – label used for categorization/search.  
- **ResourceTag** – join table linking resources and tags (many-to-many).  

**Key Relationships:**  
- A **User** uploads many **Resources**.  
- A **StudyGroup** contains many **Resources**.  
- A **Resource** can have many **Tags** via **ResourceTag**.  
- A **Tag** can be applied to many **Resources**.  

---

## UC-4: Planner & Calendar Sync

**Purpose:**  
Provides users with a planner for assignments, reminders, and optional calendar integration.  

**Entities:**  
- **User** – owns assignments.  
- **StudyGroup** – assignments can optionally link to a group/course.  
- **Assignment** – user’s task/assignment; includes title, notes, due date, status, priority.  
- **Reminder** – notifications for upcoming assignments (in-app, email, etc.).  
- **CalendarLink** – optional sync with external calendar providers (Google, Outlook, Apple), stores external event IDs.  

**Key Relationships:**  
- A **User** has many **Assignments**.  
- A **StudyGroup** may be linked to many **Assignments** (optional).  
- An **Assignment** can have many **Reminders**.  
- An **Assignment** may have one **CalendarLink**.  

---

## Unified Data Model

**Purpose:**  
Integrates all use cases into one cohesive schema. This is the overall data model for the Academic Support Hub system.  

**Highlights:**  
- **Core entities:** `User`, `Course`, `StudyGroup`.  
- **Membership:** handled via `GroupMembership` and `JoinRequest`.  
- **Q&A:** `Question`, `Answer`, `Comment` scoped to study groups.  
- **Resources:** `Resource`, `Tag`, `ResourceTag` for upload and tagging.  
- **Planner:** `Assignment`, `Reminder`, `CalendarLink` for scheduling and sync.  
- **Consistency:** all entities include appropriate primary keys (PK), foreign keys (FK), and timestamps (`created_at`, `updated_at`).  

**Overall Relationships:**  
- Users connect to Courses through **Enrollment**, and to Groups through **GroupMembership**.  
- Groups are the central hub for collaboration: they link Q&A, Resources, and Assignments.  
- Tagging enables flexible classification of resources.  
- The planner links back to users (and optionally groups/courses), and integrates with reminders and calendars.  
