# Feature: Course Management

**Feature ID:** 3
**Branch pattern:** `feature/3-course-management`
**Status:** Draft
**Created:** 2026-10-03
**Input:** Logged-in student maintains a shared catalog of courses on a single view via dialogs; courses are not tied to a userId
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md)

---

## User Stories

### US-3.1: View Course List Page

**As a** singed-in student
**I want to** select "Course" from the navigation menu
**So that** I can access the course management screen
 
**Priority:** P1
**Independent test:** Verify clicking "Course" in MenuBar redirects to /course view
**Acceptance scenarios:** See ### US-3.1 under Acceptance Criteria

### US-3.2: Create Course

**As a** signed-in student
**I want to** create a new course using a modal dialog
**So that** it is added to the shared application catalog

**Priority:** P1
**Independent test:** Open modal, submit valid course details, and check if it appears in the table
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria


### US-3.3: Read Course Catalog

**As a** signed-in student
**I want to** view the list of all courses in the catalog
**So that** I can review existing course details

**Priority:** P1
**Independent test:** Verify that courses returned by API are listed in the data table
**Acceptance scenarios:** see ### US-3.3 under Acceptance Criteria

### US-3.4: Row Action Icons

**As a** signed-in student
**I want to** see Edit and Delete icons on each row in the course table
**So that** I can trigger actions directly for a specific course

**Priority:** P1
**Independent test:** Verify row action buttons are rendered for every course entry
**Acceptance scenarios:** see ### US-3.4 under Acceptance Criteria

### US-3.5: Edit Course
**As a** signed-in student
**I want** to update an existing course's details
**So that** the catalog information remains accurate

**Priority:** P2
**Independent test:** Edit course name/number and confirm changes persist in the list
**Acceptance scenarios:** see ### US-3.5 under Acceptance Criteria

### US-3.6: Delete Course

**As a** signed-in student
**I want** to delete a course after confirmation
**So that** obsolete courses are removed from the system

**Priority:** P2
**Independent test:** Delete a course via confirmation dialog and verify its removal
**Acceptance scenarios:** see ### US-3.6 under Acceptance Criteria

### US-3.7: Role-Based Access Control

**As** the application
**I want** to restrict Course catalog modifications and menu visibility exclusively to students
**So that** faculty users cannot modify or see the course management view

**Priority:** P1
**Independent test:** Sign in as faculty to ensure "Course" is absent from MenuBar and direct POST requests yield 403
**Acceptance scenarios:** see ### US-3.7 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001:** All course endpoints MUST require authentication (`authenticate` middleware). 
- **FR-002:** `GET /course/courses` MUST be accessible by any authenticated user (both `student` and `faculty`).
-**FR-003:**  `POST`, `PUT`, and `DELETE` endpoints MUST be restricted strictly to users with `req.user.role === "student"`.
-**FR-004:** Courses MUST be stored as a shared catalog without a `userId` field. Any `userId` supplied in the request body MUST be ignored.
-**FR-005:** If a `faculty` user attempts a `POST`, `PUT`, or `DELETE` request, the API MUST return HTTP status `403 Forbidden` with `{ "message": "Student role required." }`.
-**FR-006:** All input strings MUST be trimmed. Submissions containing empty or whitespace-only strings for required fields MUST be rejected with HTTP `400 Bad Request`.
-**FR-007:** Requests without a valid session token MUST yield HTTP `401 Unauthorized`. Unauthenticated route navigation to `/course` MUST redirect to `/login`.
-**FR-008:** The course list MUST be sorted alphabetically by `courseName` by default.
-**FR-009:** `courseNumber` MUST be required, unique, and max 15 characters long. Duplicate or overly long values MUST return HTTP `400 Bad Request`.

## Assumptions

- Feature 1 user authentication is merged and active on `dev`.
- The `MenuBar` component exists and supports conditional rendering based on user role.
- Courses represent a shared global catalog rather than user-based resources.
- Course interactions use modal dialogs on a single view (`Courses.vue`) rather than split-scren views.
- Feature 5 (Sections) will associate `courseId` with sections at a larger stage.

---

## Edge Cases

- Missing required fields: triggers client-side validation ("Required field") without making API calls.
- Duplicate `courseNumber`: API returns HTTP `400 Bad Request` with `"Course number already exists"`.
- Invalid ID on Update/Delete: API returns HTTP `404 Not Found` with `"Course with id= not found."`.
- Faculty Mutation Attempt: API returns HTTP `403 Forbbiden`.
- Unauthenticated Access: Direct navigation to `/course` redirects to `/login`; API calls return HTTP `401`.