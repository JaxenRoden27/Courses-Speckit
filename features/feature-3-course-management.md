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

## Success criteria

- **SC-001**: Every Gherkin scenario is covered by automated unit/integration tests.
- **SC-002**: Students can perform complete CRUD operations on courses within a single screen using dialogs.
- **SC-003**: Faculty users can perform GET requests but don't see the "Course" menu item or have mutation access.
- **SC-004**: All test suites (`npm test`) pass completely without failiures.

## Data Ownership & Isolation

Courses belong to a global shared catalog and are not tied to individual user accounts (`userId` is not present in the course schema). Students manage catalog entries, while faculty users have read-only access.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /course/courses` returns all shared courses and is accessible by any authenticated user (`student` or `faculty`). |
| **Write scope** | `PUT` / `DELETE` `/course/courses/:courseId` succeed only when `req.user.role === "student"`. Faculty mutation attempts return `403`. |
| **Create scope** | `POST /course/courses` requires a valid student session (`req.user.role === "student"`). Course data is saved without a `userId` owner field. |
| **Cross-user access** | Any student can update or delete courses in the shared catalog. No `userId` validation exists for course rows. |
| **UI scope** | `Courses.vue` view and `Course` option in `MenuBar` render exclusively when logged in as `student`. |
| **Implementation** | `authenticate` middleware in `backend/app/routes/` verifies session. Role check confirms `req.user.role === "student"` for mutations (`POST`, `PUT`, `DELETE`). |

---

## Key Entities

- **Course**: shared course row in global catalog (no `userId` owner); has `courseNumber`, `courseName`, `courseDescription`, `courseSemesters`, `courseFrequency`, `courseHours`, and `courseDept`; may have section rows (Feature 5).
- **User / Session**: required for course list view navigation, modal CRUD actions (`student` role), and role checks (Feature 1).

---

## API Requirements

Mount prefix: `/course` (see `backend/server.js`). Flat JSON; errors `{ "message": "..." }`. Do not wrap in `{ success, data }`.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/course/courses` | Yes (`student`) | Create a course |
| `GET` | `/course/courses` | Yes | List all courses, sorted by `courseName` ascending |
| `GET` | `/course/courses/:courseId` | Yes | Fetch one course |
| `PUT` | `/course/courses/:courseId` | Yes (`student`) | Update a course |
| `DELETE` | `/course/courses/:courseId` | Yes (`student`) | Delete a course |

### Create – `POST /course/courses`

**Request body:**

```json
{
  "courseNumber": "CS101",
  "courseName": "Introduction to Computer Science",
  "courseDescription": "Basic programming concepts.",
  "courseSemesters": "Fall/Spring",
  "courseFrequency": "Annual",
  "courseHours": 3,
  "courseDept": "CS"
}
```

**Success** (`201`): course row JSON including `id`, `courseNumber`, `courseName`, `courseDescription`, `courseSemesters`, `courseFrequency`, `courseHours`, `courseDept`, timestamps.

**Errors (`400`):**

| Condition | `message` |
|-----------|-----------|
| Missing `courseNumber` | `Course Number cannot be empty for course!` |
| Missing `courseName` | `Course Name cannot be empty for course!` |
| Missing `courseSemesters` | `Course Semesters cannot be empty for course!` |
| Missing `courseFrequency` | `Course Frequency cannot be empty for course!` |
| Missing `courseHours` | `Course Hours cannot be empty for course!` |
| Missing `courseDept` | `Course Dept cannot be empty for course!` |
| Duplicate `courseNumber` | `Course number already exists.` |

**Unauthorized:** `401` when the Bearer token is missing or invalid.

### List all – `GET /course/courses`

**Success** (`200`): JSON array of all courses, ordered by `courseName` ASC.

### Get one – `GET /course/courses/:courseId`

**Success** (`200`): JSON **array** of matching courses (running controller uses `findAll`). The editor reads `response.data[0]`.

### Update – `PUT /course/courses/:courseId`

**Request body:** course fields to change (at least `courseNumber`, `courseName`, `courseDescription`, `courseSemesters`, `courseFrequency`, `courseHours`, `courseDept` as edited on screen).

**Success:** `{ "message": "Course was updated successfully." }`

**Not found / not owned:** `404` `{ "message": "Cannot find Course with id=." }`

### Delete – `DELETE /course/courses/:courseId`

**Success:** `{ "message": "Course was deleted successfully!" }`

**Not found / not owned:** `404` `{ "message": "Cannot find Course with id=." }`

**Error response (all):** `{ "message": "Human-readable explanation." }`

---

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc) for theme tokens. Labels below match the running Course UI.

### [View: Course list] – route name `courses` (`/courses`)

Feature 1 already specifies who may open this screen and the list navigation. This feature adds signed-in create, edit, and delete actions for `student` role.

**Shell**

- Heading: **Courses**
- Primary action: **Add Course** (`v-if="user && user.role === 'student'"`) – student role only
- **Error:** snackbar with API `message`
- No empty-state copy in the running view – do not invent one

**Course cards** (`CourseCardComponent`)

- Show **courseNumber**, **courseName**, **courseHours** chip (`{n} Hours`), **courseDept** chip, **courseSemesters**, **courseFrequency**, and **courseDescription**
- Click the card to expand/collapse details. Expanded section rows are display-only here; add/edit/delete of section rows is Feature 5
- PDF icon (`mdi-file-pdf-box`) downloads a PDF (`CourseReports.generateCoursePDF`); `aria-label`: **Download PDF**
- Pencil icon (`mdi-pencil`) opens **Edit Course** modal or navigates to `editCourse` with that course's `id`; `aria-label`: **Edit course**
- Trash icon (`mdi-delete`) prompts delete confirmation and removes course on success; `aria-label`: **Delete course**

**Add Course dialog** (`v-dialog`)

- Title: **Add Course**
- Fields: **Course Number**, **Course Name**, **Description**, **Semesters**, **Frequency**, **Credit Hours**, **Department**
- Actions: **Close**, **Add Course**
- On success: close dialog, refresh list, snackbar **`{courseName} added successfully!`**
- On failure: error snackbar with API `message`

### [View: Edit course] – route name `editCourse` (`/course/:id`)

Session required (Feature 1). This feature owns the course **metadata** form only.

- Heading: **Edit Course**
- Fields: **Course Number**, **Course Name**, **Description**, **Semesters**, **Frequency**, **Credit Hours**, **Department**
- Primary action: **Update Course**
- On success: snackbar **`{courseName} updated successfully!`**, then reload the course
- On failure: error snackbar with API `message`
- **Sections** cards, **Add** / pencil / trash on those rows are Feature 5

### App chrome

- MenuBar **Courses** already routes here (Feature 1). This feature does not add nav items.

---

## Data Model Requirements

### `courses` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `courseNumber` | STRING | Required |
| `courseName` | STRING | Required |
| `courseDescription` | STRING | Optional |
| `courseSemesters` | STRING | Required |
| `courseFrequency` | STRING | Required |
| `courseHours` | INTEGER | Required |
| `courseDept` | STRING | Required |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

- `Course` hasMany `Section` – `onDelete: CASCADE` (child CRUD is Feature 5)
- `Section` belongsTo `Course`

---

## Acceptance Criteria (Gherkin)

### US–3.1 – View Course List Page

#### Scenario: Signed-in student navigates to course page

- **Given** I am signed in as a student
- **When** I select **Course** from the navigation menu
- **Then** I am redirected to the `/course` view
- **And** the course management screen is displayed

#### Scenario: Course menu item hidden for faculty

- **Given** I am signed in as faculty
- **When** I view the navigation menu
- **Then** I do not see the **Course** menu item

---

### US–3.2 – Create Course

#### Scenario: Signed-in student creates a new course

- **Given** I am signed in as a student on the course page
- **When** I click **Add Course**
- **Then** the course modal dialog opens
- **When** I enter course number `CS101`, course name `Intro to CS`, course description `Basic concepts`, semesters `Fall/Spring`, frequency `Annual`, credit hours `3`, and department `CS`
- **And** I click **Save**
- **Then** `POST /course/courses` returns `201` with a course whose `courseNumber` is `CS101`
- **And** `CS101` appears in the course table
- **And** I see a snackbar **`Intro to CS added successfully!`**

#### Scenario: Create without course number is rejected

- **Given** I am signed in as a student
- **When** I send `POST /course/courses` with a body missing `courseNumber`
- **Then** the API returns `400` with `{ "message": "Course Number cannot be empty for course!" }`

#### Scenario: Create without course name is rejected

- **Given** I am signed in as a student
- **When** I send `POST /course/courses` with a body missing `courseName`
- **Then** the API returns `400` with `{ "message": "Course Name cannot be empty for course!" }`

---

### US–3.3 – Read Course Catalog

#### Scenario: Signed-in student views courses catalog

- **Given** I am signed in as a student
- **When** I open the course management page
- **Then** `GET /course/courses` is called
- **And** all courses returned by the API are listed in the data table

---

### US–3.4 – Row Action Icons

#### Scenario: Row action buttons visible for student

- **Given** I am signed in as a student on the course page
- **When** I view the course data table
- **Then** I see **Edit** (pencil icon) and **Delete** (trash icon) buttons rendered on each course row

---

### US–3.5 – Edit Course

#### Scenario: Signed-in student updates course details

- **Given** I am signed in as a student on the course page
- **And** a course `CS101` exists with credit hours `3`
- **When** I click the **Edit** icon on `CS101`
- **Then** the edit course modal dialog opens
- **When** I change credit hours to `4`
- **And** I click **Update Course**
- **Then** `PUT /course/courses/:courseId` returns `{ "message": "Course was updated successfully." }`
- **And** `CS101` shows updated credit hours `4` in the data table
- **And** I see a snackbar **`Intro to CS updated successfully!`**

---

### US–3.6 – Delete Course

#### Scenario: Signed-in student deletes a course with confirmation

- **Given** I am signed in as a student on the course page
- **And** a course `CS101` exists in the table
- **When** I click the **Delete** icon on `CS101`
- **Then** a deletion confirmation dialog appears
- **When** I confirm the deletion
- **Then** `DELETE /course/courses/:courseId` returns `200`
- **And** `CS101` is removed from the course table
- **And** I see a snackbar **`Course deleted successfully!`**

---

### US–3.7 – Role-Based Access Control

#### Scenario: Faculty user access restricted

- **Given** I am signed in as faculty
- **When** I view the navigation menu
- **Then** the **Course** option is absent
- **When** I send a direct `POST /course/courses`, `PUT /course/courses/:id`, or `DELETE /course/courses/:id` request
- **Then** the API returns `403` Forbidden
- **And** course catalog data remains unchanged