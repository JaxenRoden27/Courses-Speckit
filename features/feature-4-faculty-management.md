# Feature: Faculty Management

**Feature ID:** 4
**Branch pattern:** `feature/4-faculty-management`
**Status:** Ready
**Created:** 2026-09-30
**Input:** Signed-in faculty users manage a shared faculty catalog on one screen; new faculty members are added via a dialog. A faculty member has a first name, last name, and department. A faculty member may optionally be linked to one Feature 1 user account whose role is `faculty`.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md)
**Related:** [Feature 2 — Semester Management](feature-2-semester-management.md) (preserve **Semesters** on `MenuBar` if already merged), [Feature 3 — Course Management](feature-3-course-management.md) (preserve **Course** on `MenuBar` if already merged), [Feature 5 — Section Management](feature-5-section-management.md) (consumes this catalog as `facultyId`)

---

## User Stories

### US-4.1: Select to work with Faculty

**As a** signed-in faculty user
**I want to** open the faculty view from the menu
**So that** I can maintain the faculty catalog

**Priority:** P1
**Independent test:** login as faculty, view **Faculty** on menubar; faculty view appears
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Create faculty member

**As a** signed-in faculty user
**I want to** create faculty members (e.g. "Jane Doe", "Robert Smith")
**So that** I can track instructors in the catalog

**Priority:** P1
**Independent test:** Open add-faculty dialog, create a faculty member with name and department; it appears in the faculty view
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: View faculty

**As a** signed-in faculty user
**I want to** see all faculty members on one screen
**So that** I can see who is in the catalog

**Priority:** P1
**Independent test:** Selecting **Faculty** loads a screen that displays all faculty members
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Manage faculty rows

**As a** signed-in faculty user
**I want** each faculty row to show **edit** and **delete** actions
**So that** I can manage faculty without leaving the faculty view

**Priority:** P1
**Independent test:** Each faculty row exposes edit and delete icon actions
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

### US-4.5: Edit a faculty member

**As a** signed-in faculty user
**I want to** edit faculty data
**So that** I can keep the faculty catalog accurate

**Priority:** P2
**Independent test:** Edit a faculty member from row actions; faculty view updates
**Acceptance scenarios:** see ### US-4.5 under Acceptance Criteria

### US-4.6: Delete a faculty member

**As a** signed-in faculty user
**I want to** delete a faculty member
**So that** I can remove people who no longer belong in the catalog

**Priority:** P2
**Independent test:** Delete a faculty member from row actions; faculty view updates
**Acceptance scenarios:** see ### US-4.6 under Acceptance Criteria

### US-4.7: Restrict faculty management to faculty users

**As the** application
**I want to** allow only users with role `faculty` to manage the faculty catalog
**So that** students cannot create, edit, or delete faculty members

**Priority:** P1
**Independent test:** Sign in as a student — **Faculty** is hidden; `POST /courses/faculty` returns `403`
**Acceptance scenarios:** see ### US-4.7 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: All faculty endpoints MUST require a valid session (`authenticate`). `GET /courses/faculty` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` on faculty, and `GET /courses/users`, MUST require `req.user.role` equal to `faculty`.
- **FR-002**: Faculty MUST be a **shared catalog**. A faculty member is not owned by the signed-in faculty user. Optional `userId` is a **link** to a Feature 1 login account, not row ownership.
- **FR-003**: Authenticated non-faculty users (including `student`) MUST receive `403` with `{ "message": "Faculty role required." }` on `POST`, `PUT`, and `DELETE` of faculty and on `GET /courses/users`. `GET /courses/faculty` MUST return `200` for any authenticated user. They MUST NOT see **Faculty** in `MenuBar`.
- **FR-004**: Required faculty fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`).
- **FR-005**: Unauthenticated faculty API requests MUST return `401` with `{ "message": "Unauthorized! No token provided." }`. Unauthenticated navigation to `/faculty` MUST redirect to `login`.
- **FR-006**: Faculty MUST be ordered alphabetically by `lastName`, then `firstName`, in API responses.
- **FR-007**: This feature MUST deliver faculty CRUD and a **single-view** faculty UI in `Faculty.vue` (dialog-based add/edit/delete). No sidebar/main split.
- **FR-008**: `firstName` MUST be required, trimmed, and at most 50 characters. Too-long message: **"First name must be 50 characters or fewer."**
- **FR-009**: `lastName` MUST be required, trimmed, and at most 50 characters. Too-long message: **"Last name must be 50 characters or fewer."**
- **FR-010**: `dept` MUST be required, trimmed, and at most 50 characters. Too-long message: **"Department must be 50 characters or fewer."**
- **FR-011**: `userId` is **optional**. When omitted or `null`, the faculty member has no login account. When present, it MUST be an integer that exists in `users`, and that user's `role` MUST be `faculty`. Missing user message: **"User not found."** Wrong-role message: **"User must have role faculty."** A given `users.id` MUST be linked to at most one faculty member. Duplicate-link message: **"User is already linked to a faculty member."** Creating or deleting a faculty member MUST NOT create or delete a Feature 1 user.
- **FR-012**: This feature MUST add `requireFaculty` (check `req.user.role === "faculty"`) and use it after `authenticate` on mutations and on `GET /courses/users`. Do **not** use the starter `authenticateAdmin` / `admin` role — this product has no `admin` role (Feature 1).
- **FR-013**: `GET /courses/users` (existing starter list) MUST return only users whose `role` is `faculty`, as an array of `{ "id", "universityId", "fName", "lName" }`. It MUST NOT include `password`. Listing students is [Feature 7](feature-7-student-course-listing.md).

---