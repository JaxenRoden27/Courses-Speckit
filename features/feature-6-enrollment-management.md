# Feature: Enrollment Management

**Feature ID:** 6
**Branch pattern:** `feature/6-enrollment-management`
**Status:** Ready
**Created:** 2026-09-24
**Input:** Signed-in student user maintains enrollments on one screen; new enrollments are added via a dialog. An enrollment has a section, a semester, and a student. A student has many enrollments. A semester has many enrollments. Faculty can view each student's enrollments but not edit them.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Semester Management](feature-2-semester-management.md), [Feature 3 — Course Management](feature-3-course-management.md), [Feature 4 — Faculty Management](feature-4-faculty-management.md), [Feature 5 — Section Management](feature-5-section-management.md)

---

## User Stories

### US-6.1: Select to work with Enrollments

**As a** signed-in student or faculty user  
**I want to** open the enrollments view from the menu  
**So that** I can maintain enrollments

**Priority:** P1  
**Independent test:** login, view Enrollments on menubar; enrollments view appears  
**Acceptance scenarios:** see ### US-6.1 under Acceptance Criteria

### US-6.2: Create enrollment

**As a** signed-in student user  
**I want to** create an enrollment with a section, a semester, and student Id
**So that** sections have enrollments

**Priority:** P1  
**Independent test:** Open add-enrollment dialog, create an enrollment for an existing section, semester, and student; it appears in the enrollments view  
**Acceptance scenarios:** see ### US-6.2 under Acceptance Criteria

### US-6.3: Student View enrollments

**As a** signed-in student user  
**I want to** see all personal enrollments on one screen  
**So that** I can see the enrollment catalog

**Priority:** P1  
**Independent test:** Selecting Enrollments loads a screen that displays all personal enrollments  
**Acceptance scenarios:** see ### US-6.3 under Acceptance Criteria

### US-6.4: Faculty View enrollments

**As a** signed-in faculty user  
**I want to** see all student enrollments on one screen  
**So that** I can see the enrollment catalog

**Priority:** P1  
**Independent test:** Selecting Enrollments loads a screen that displays all student enrollments  
**Acceptance scenarios:** see ### US-6.4 under Acceptance Criteria

### US-6.5: Manage enrollment rows

**As a** signed-in student user  
**I want** each enrollment row to show **edit** and **delete** actions  
**So that** I can manage enrollments without leaving the enrollments view

**Priority:** P1  
**Independent test:** Each enrollment row exposes edit and delete icon actions  
**Acceptance scenarios:** see ### US-6.5 under Acceptance Criteria

### US-6.6: Edit an enrollment

**As a** signed-in student user  
**I want to** edit enrollment data  
**So that** I can keep enrollment data accurate

**Priority:** P2  
**Independent test:** Edit an enrollment from row actions; enrollments view updates  
**Acceptance scenarios:** see ### US-6.6 under Acceptance Criteria

### US-6.7: Delete an enrollment

**As a** signed-in student user  
**I want to** delete an enrollment  
**So that** I can remove enrollments that should not stay on the schedule

**Priority:** P2  
**Independent test:** Delete an enrollment from row actions; enrollments view updates  
**Acceptance scenarios:** see ### US-6.7 under Acceptance Criteria

### US-6.8: Restrict enrollment management to students

**As the** application  
**I want to** allow only users with role `student` to manage their enrollments  
**So that** students can create, edit, or delete enrollments

**Priority:** P1  
**Independent test:** Sign in as a student — **Enrollments** is visible; `POST /courses/students/:studentId/enrollments` returns `201`  
**Acceptance scenarios:** see ### US-6.8 under Acceptance Criteria

### US-6.9: Block delete of a section and semester that has an enrollment

**As the** application  
**I want to** refuse delete of a section that still has enrollments  
**So that** enrollments are not left pointing at a missing section

**Priority:** P1  
**Independent test:** Create an enrollment; `DELETE` of that section returns `400` and the section remains  
**Acceptance scenarios:** see ### US-6.9 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: Every enrollment endpoint MUST require a valid session (`authenticate`). A request with no valid session MUST return `401`. Navigation to `/enrollments` with no session MUST redirect to `login`.
- **FR-002**: A signed-in `student` or `faculty` user MUST see **Enrollments** in `MenuBar` and MUST be able to open the enrollments view from that item.
- **FR-003**: A signed-in `student` MUST be able to create an enrollment from the enrollments view. The enrollment MUST store one `sectionId`, one `semesterId`, and one `studentId`. `studentId` MUST be the signed-in student's id. A successful `POST` MUST return `201`, and the new enrollment MUST appear in that student's list.
- **FR-004**: The create and update body MUST include `sectionId` and `semesterId`. An empty course, section, or semester selection MUST be blocked in the client with **"Required"**, and the client MUST NOT call the API. `studentId` MUST NOT be sent in the body. It is `:studentId` in the path and MUST be the signed-in student's `users.id`. `courseId` is not sent.
- **FR-005**: `sectionId` MUST reference an existing section. A missing section MUST return `400` with `{ "message": "Section not found." }` and MUST NOT store an enrollment. `semesterId` MUST reference an existing semester. A missing semester MUST return `400` with `{ "message": "Semester not found." }` and MUST NOT store an enrollment. `:studentId` MUST be an existing `users.id` whose `role` is `student`. A missing user, or a user whose role is not `student`, MUST return `404` with `{ "message": "Student not found." }` and MUST NOT store an enrollment.
- **FR-006**: The enrollments view for a signed-in `student` MUST list only that student's enrollments. A student requesting another student's `:studentId` on `GET`, `POST`, `PUT`, or `DELETE` MUST return `403` with `{ "message": "You can only access your own enrollments." }`. A student calling `GET /courses/enrollments` MUST return `403` with `{ "message": "Faculty role required." }`.
- **FR-007**: The enrollments view for a signed-in `faculty` user MUST list every student's enrollments. Faculty MUST NOT create, edit, or delete an enrollment. Faculty `POST`, `PUT`, and `DELETE` MUST return `403` with `{ "message": "Student role required." }`.
- **FR-008**: Each enrollment row for a signed-in `student` MUST offer **edit** and **delete**. Saving a valid edit MUST update that enrollment and refresh the list. Confirming delete MUST remove that enrollment and refresh the list. Cancel on edit or delete MUST leave the enrollment unchanged.
- **FR-009**: Create, edit, and delete MUST run in dialogs on one enrollments screen. This feature MUST NOT use a sidebar and main-panel split.
- **FR-010**: `DELETE /courses/sections/:sectionId` for a section that still has enrollments MUST return `400` with `{ "message": "Cannot delete section: enrollments still exist." }` and MUST leave the section and those enrollments stored. `sectionId`, `studentId`, and `semesterId` MUST use `ON DELETE RESTRICT`. This feature MUST NOT cascade-delete enrollments. This feature does not delete user accounts. `DELETE /courses/semesters/:semesterId` for a semester that still has enrollments MUST return `400` with `{ "message": "Cannot delete semester: enrollments still exist." }` and MUST leave the semester and those enrollments stored.
- **FR-011**: The pair (`studentId`, `sectionId`) MUST be unique. A duplicate `POST` or `PUT` MUST return `400` with `{ "message": "Enrollment already exists." }` and MUST NOT store a second row.
- **FR-012**: `GET` list responses MUST be ordered by `sectionId` ascending, then `id` ascending.

---

## Assumptions

- Features 1–5 (auth/`MenuBar`, semesters, courses, faculty, sections) MUST be merged to `dev` before implementing this feature.
- A user with role `student` exists (Feature 1 `role`; tests may seed a student).
- Tests MAY seed at least one course, one semester, and two sections of that course before creating an enrollment.
- An enrollment belongs to one **Section**, one **Semester**, and one **User** with role `student`. `studentId` is `users.id`. `semesterId` is `semesters.id`. This feature does not add a `students` table. A section belongs to one **Course**.
- A section MAY appear in many enrollments, including enrollments for different students. The same student MUST NOT have two enrollments for the same section.
- Add and Edit dialogs load courses from `GET /courses/courses` and sections from `GET /courses/sections`. The section select shows only sections whose `courseId` is the selected course. Feature 5 does not define a `courseId` query parameter; filter on the client.
- Foreign keys from `enrollments.sectionId`, `enrollments.studentId`, and `enrollments.semesterId` MUST use **RESTRICT**.
- Blocking delete of a section is Feature 5's `DELETE /courses/sections/:sectionId`. Blocking delete of a semester is Feature 2's `DELETE /courses/semesters/:semesterId`. This feature does not add a user-delete route.
- Enrollments use **dialog-based** workflows (no split sidebar / main panel).
- The server mount is `/courses`. Enrollment routes are `/courses/students/:studentId/enrollments` and `/courses/enrollments`.

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- Unknown `sectionId` → `400` with `{ "message": "Section not found." }`
- Unknown `semesterId` → `400` with `{ "message": "Semester not found." }`
- Unknown `studentId`, or a `studentId` whose user is not role `student` → `404` with `{ "message": "Student not found." }`
- Same student and same `sectionId` already stored → `400` with `{ "message": "Enrollment already exists." }`
- `DELETE` section while enrollments still reference it → `400`; section and enrollments remain.
- `DELETE` semester while enrollments still reference it → `400`; semester and enrollments remain.
- Student requests another student's `:studentId` → `403` with `{ "message": "You can only access your own enrollments." }`
- Student calls `GET /courses/enrollments` → `403` with `{ "message": "Faculty role required." }`
- Authenticated `student` on `POST` → `201`. Authenticated `student` on `PUT` / `DELETE` → `200`.
- Authenticated `faculty` on `POST` / `PUT` / `DELETE` → `403` with `{ "message": "Student role required." }`.
- Unauthenticated user on `/enrollments` → redirect to `login`. Unauthenticated `GET /courses/students/:studentId/enrollments` or `GET /courses/enrollments` → `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in student can create, view, edit, and delete their own enrollments on one screen. A signed-in faculty user can view every student's enrollments on that screen.
- **SC-003**: A signed-in student or faculty user can open the enrollments view and `GET` enrollments (own rows for a student, all rows for faculty). Only a student can create, edit, or delete.
- **SC-004**: Delete of a section or a semester that still has enrollments returns `400`, and the section or semester and the enrollments remain.
- **SC-005**: `npm test` passes for enrollment API and enrollments view behavior.

---

## Data Ownership & Isolation

Enrollments are owned by the signed-in student. Faculty may read every enrollment. Faculty may not write.

| Rule | Requirement |
| ---- | ----------- |
| **Student read** | `GET /courses/students/:studentId/enrollments` returns that student's enrollments when `:studentId` is the signed-in student. Another student's id returns `403` with `{ "message": "You can only access your own enrollments." }`. |
| **Faculty read** | `GET /courses/enrollments` returns every enrollment. A `student` calling this route returns `403` with `{ "message": "Faculty role required." }`. |
| **Write scope** | `POST`, `PUT`, and `DELETE` succeed only when `req.user.role` is `student` and `:studentId` is that student. Faculty receive `403` with `{ "message": "Student role required." }`. A student writing another student's `:studentId` receives `403` with `{ "message": "You can only access your own enrollments." }`. |
| **Create scope** | The new row's `studentId` is `:studentId` in the path. The body is `{ "sectionId": 1, "semesterId": 1 }` only. (`studentId`, `sectionId`) is unique. |
| **Missing enrollment** | Unknown `enrollmentId` → `404` with `{ "message": "Enrollment with id=<id> not found." }`. |
| **UI scope** | **Enrollments** menu and `/enrollments` are for `student` and `faculty`. |
| **Implementation** | Use `authenticate` on every endpoint. Use `requireStudent` on `POST`, `PUT`, and `DELETE` only. |

---

## API Requirements

| Method   | Endpoint                   | Auth       | Purpose                                |
| -------- | -------------------------- | ---------- | -------------------------------------- |
| `GET`    | `/courses/students/:studentId/enrollments`            | That student, or faculty     | That student's enrollments                   |
| `POST`   | `/courses/students/:studentId/enrollments`            | That student                 | Create an enrollment for that student        |
| `PUT`    | `/courses/students/:studentId/enrollments/:enrollmentId` | That student              | Update that student's enrollment             |
| `DELETE` | `/courses/students/:studentId/enrollments/:enrollmentId` | That student              | Delete that student's enrollment             |
| `GET`    | `/courses/enrollments`                                | Faculty                      | Every student's enrollments                  |

**Create enrollment request body:**

```json
{
  "sectionId": 1,
  "semesterId": 1
}
```

Do not send `id` or `studentId` on create. `studentId` is `:studentId` in the path and must be the signed-in student.

**Update enrollment request body:** same fields as create (no `id`).

**Enrollment success response** (`201` on create, `200` on update and on each list item):

```json
{
  "id": 1,
  "sectionId": 1,
  "semesterId": 1,
  "studentId": 4,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /courses/students/:studentId/enrollments` and `GET /courses/enrollments` return an array of enrollment objects in this shape.

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found:** `404` for unknown `enrollmentId`. Unknown `:studentId`, or a user who is not role `student`, is `404` with `{ "message": "Student not found." }`.  
**Missing parent / validation:** `400` for an unknown `sectionId` with `{ "message": "Section not found." }` (FR-005), an unknown `semesterId` with `{ "message": "Semester not found." }` (FR-005), and a duplicate (`studentId`, `sectionId`) pair (FR-011).
**Wrong owner:** `403` with `{ "message": "You can only access your own enrollments." }`.

Section delete is Feature 5's section `DELETE` and MUST return `400` with `{ "message": "Cannot delete section: enrollments still exist." }` when enrollments still reference that section. Semester delete is Feature 2's semester `DELETE` and MUST return `400` with `{ "message": "Cannot delete semester: enrollments still exist." }` when enrollments still reference that semester. This feature does not delete users.

---

## Screen Requirements

### [View: Enrollments] — route name `enrollments` — path `/enrollments` — `Enrollments.vue`

- Heading: **Enrollments**
- Primary action for a signed-in `student`: **+ New enrollment** (`oc-cta`) opens the **Add Enrollment** `<v-dialog>`. A signed-in `faculty` user MUST NOT see **+ New enrollment**.
- **Add Enrollment** fields:
  - **Course** (`v-select` from `GET /courses/courses`, display the course name)
  - **Section** (`v-select` of sections from `GET /courses/sections` whose `courseId` is the selected course, display `sectionNumber`)
  - **Semester** (`v-select` from `GET /courses/semesters`, display the semester `name`)
- There is no student field. Create and edit use the signed-in student's `users.id` as `:studentId`. Edit MUST NOT change `studentId`.
- **Edit Enrollment** uses the same course, section, and semester fields, pre-filled from the row.
- **Add Enrollment** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **course name** and **section number**. A faculty list also shows **studentId**. Rows follow FR-012. Student names on this list are out of scope.
- Icon-only row actions for a signed-in `student` use `size="small"` and accessible `aria-label`s. Faculty rows have no edit or delete icons.
  - **Edit enrollment** — opens **Edit Enrollment** `<v-dialog>` pre-filled with current data; **Save Enrollment** (`oc-cta`) / **Cancel** (secondary)
  - **Delete enrollment** — opens **Delete Enrollment** confirmation `<v-dialog>` with copy **"Delete this enrollment?"**; **Delete Enrollment** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state (student):** **"No enrollments yet. Create your first enrollment."**
- **Empty state (faculty):** **"No enrollments yet for students."**
- **Loading state:** skeleton or progress indicator while enrollments are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Student and faculty only: **Enrollments** menu item and `/enrollments` are for signed-in student and faculty users. Other roles do not see the **Enrollments** item. Unauthenticated navigation to `/enrollments` redirects to `login`.
- Enrollment CRUD dialogs live in `Enrollments.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Enrollments** (allowed roles `student` and `faculty`; navigates to `/enrollments`) after **Sections**. Do not rename or reorder **Semesters**, **Course**, **Faculty**, or **Sections**.
- Students and faculty see **Enrollments**.
- After login, the user remains on Feature 1 `home`. Selecting **Enrollments** in the menu opens this feature's view.

---

## Key Entities

- **Enrollment**: Has a **sectionId**, a **semesterId**, and a **studentId**. A section may have many enrollments. A semester may have many enrollments.

---

## Data Model Requirements

### `enrollments` table

| Field                | Type       | Rules                                                       |
| -------------------- | ---------- | ----------------------------------------------------------- |
| `id`                 | INTEGER PK | Auto-increment                                              |
| `sectionId`          | INTEGER FK | Required; references `sections.id`                          |
| `studentId`          | INTEGER FK | Required; references `users.id`; referenced user MUST have role `student` |
| `semesterId`         | INTEGER FK | Required; references `semesters.id`                         |
| `createdAt`          | DATE       | Sequelize timestamps                                                      |
| `updatedAt`          | DATE       | Sequelize timestamps                                                      |

Unique index on (`studentId`, `sectionId`).
`sectionId`, `studentId`, and `semesterId` use `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Enrollment belongsTo Section` (`sectionId`, `onDelete: 'RESTRICT'`)
- `Section hasMany Enrollment`
- `Enrollment belongsTo User` as the student (`studentId`, `onDelete: 'RESTRICT'`)
- `User hasMany Enrollment`
- `Enrollment belongsTo Semester` (`semesterId`, `onDelete: 'RESTRICT'`)
- `Semester hasMany Enrollment`

---

## Acceptance Criteria (Gherkin)

### US-6.1 — Select to work with Enrollments

#### Scenario: Student opens enrollments from the menu

- **Given** I am signed in as a user with role `student`
- **When** I click **Enrollments** in the `MenuBar`
- **Then** the enrollments view is displayed

#### Scenario: Faculty opens enrollments from the menu

- **Given** I am signed in as a user with role `faculty`
- **When** I click **Enrollments** in the `MenuBar`
- **Then** the enrollments view is displayed

### US-6.2 — Create enrollment

#### Scenario: User creates a new enrollment

- **Given** I am signed in as a user with role `student`
- **And** course `Programming 1` exists with section number `01`
- **And** semester `Fall 2026` exists
- **And** I am viewing the enrollments view
- **When** I click **+ New enrollment**
- **And** I select course `Programming 1`
- **And** I select section `01`
- **And** I select semester `Fall 2026`
- **And** I click **Create**
- **Then** the API returns `201` with an enrollment object containing `id`, `sectionId`, `semesterId`, and `studentId`
- **And** that enrollment appears in the enrollments view list
- **And** the add-enrollment dialog closes

#### Scenario: User creates an enrollment with a missing required field

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I click **+ New enrollment**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates an enrollment with an unknown section

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /courses/students/:studentId/enrollments` with a `sectionId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Section not found." }`
- **And** no enrollment is stored

#### Scenario: User creates an enrollment with an unknown semester

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /courses/students/:studentId/enrollments` with a `semesterId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Semester not found." }`
- **And** no enrollment is stored

#### Scenario: User creates an enrollment with a faculty account

- **Given** I am signed in as a user with role `faculty`
- **And** a section `1` exists
- **And** I am viewing the enrollments view
- **Then** I do not see a button to create an enrollment

---

### US-6.3 — Student View enrollments

#### Scenario: Student enrollments view loads with existing enrollments

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** enrollments exist
- **When** I view the enrollments list
- **Then** all enrollments for that user are displayed in the list

#### Scenario: Student has no enrollments

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** there are no enrollments for that user
- **When** I view the enrollments list
- **Then** I see **"No enrollments yet. Create your first enrollment."**

---

### US-6.4 — Faculty View enrollments

#### Scenario: Faculty enrollments view loads with existing enrollments

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the enrollments view
- **And** enrollments exist
- **When** I view the enrollments list for students
- **Then** all the enrollments are displayed in a list for each student

#### Scenario: Faculty has no enrollments

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the enrollments view
- **And** there are no enrollments
- **When** I view the enrollments list
- **Then** I see **"No enrollments yet for students."**

---

### US-6.5 — Manage enrollment rows

#### Scenario: Student enrollment rows show edit and delete actions

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I view an enrollment row
- **Then** the enrollment row shows an **Edit enrollment** icon action
- **And** the enrollment row shows a **Delete enrollment** icon action

#### Scenario: Faculty enrollment rows do not show edit and delete actions

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the enrollments view
- **When** I view an enrollment row
- **Then** the enrollment row does not show an **Edit enrollment** icon action
- **And** the enrollment row does not show a **Delete enrollment** icon action

---

### US-6.6 — Edit an enrollment

#### Scenario: User selects to edit an enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I click the edit icon on an enrollment row
- **Then** the enrollment edit dialog is displayed

#### Scenario: User edits an enrollment with valid values and saves

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment edit dialog is displayed
- **When** I select course `Programming 1` and section `02`
- **And** I click **Save Enrollment**
- **Then** the enrollment data is updated
- **And** the dialog is closed

#### Scenario: User edits an enrollment with invalid values and saves

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment edit dialog is displayed
- **When** I clear the section selection
- **And** I click **Save Enrollment**
- **Then** I see the message **"Required"**
- **And** no API call is made
- **And** the dialog is not closed

#### Scenario: User edits an enrollment and cancels

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the enrollment data is not updated
- **And** the dialog is closed

---

### US-6.7 — Delete an enrollment

#### Scenario: User selects to delete an enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I click the delete icon on an enrollment row
- **Then** the enrollment delete dialog is displayed

#### Scenario: User deletes an enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment delete dialog is displayed
- **When** I click **Delete Enrollment**
- **Then** the enrollment is deleted
- **And** the dialog is closed
- **And** the enrollment is not in the enrollments list

#### Scenario: User cancels deleting an enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment delete dialog is displayed
- **When** I click **Cancel**
- **Then** the enrollment is not deleted
- **And** the dialog is closed
- **And** the enrollment is still in the enrollments list

---

### US-6.8 — Restrict enrollment management to students

#### Scenario: Student can GET enrollments via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /courses/students/:studentId/enrollments`
- **Then** the API returns `200` with an array of enrollment objects for that student

#### Scenario: Faculty can GET enrollments via the API

- **Given** I am signed in as a user with role `faculty`
- **When** I request `GET /courses/enrollments`
- **Then** the API returns `200` with an array of enrollment objects for each student

#### Scenario: Faculty cannot create an enrollment via the API

- **Given** I am signed in as a user with role `faculty`
- **When** I send `POST /courses/students/:studentId/enrollments` with a valid enrollment body
- **Then** the API returns `403` with `{ "message": "Student role required." }`
- **And** no new enrollment is stored

#### Scenario: Faculty cannot update an enrollment via the API

- **Given** I am signed in as a user with role `faculty`
- **And** an enrollment exists
- **When** I send `PUT /courses/students/:studentId/enrollments/:enrollmentId` with a valid enrollment body
- **Then** the API returns `403` with `{ "message": "Student role required." }`
- **And** the enrollment is unchanged

#### Scenario: Faculty cannot delete an enrollment via the API

- **Given** I am signed in as a user with role `faculty`
- **And** an enrollment exists
- **When** I send `DELETE /courses/students/:studentId/enrollments/:enrollmentId`
- **Then** the API returns `403` with `{ "message": "Student role required." }`
- **And** the enrollment is still stored

#### Scenario: Student cannot read another student's enrollments

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /courses/students/:studentId/enrollments` for a different student
- **Then** the API returns `403` with `{ "message": "You can only access your own enrollments." }`

#### Scenario: Student cannot list every enrollment

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /courses/enrollments`
- **Then** the API returns `403` with `{ "message": "Faculty role required." }`

#### Scenario: Student cannot enroll in the same section twice

- **Given** I am signed in as a user with role `student`
- **And** I already have an enrollment for section `1`
- **When** I send `POST /courses/students/:studentId/enrollments` with that same `sectionId`
- **Then** the API returns `400` with `{ "message": "Enrollment already exists." }`
- **And** no second enrollment is stored


#### Scenario: Unauthenticated API request to enrollments

- **Given** I have no valid session token
- **When** I request `GET /courses/students/:studentId/enrollments`
- **Then** the API returns `401` with an unauthorized message

#### Scenario: Unauthenticated user navigates to enrollments

- **Given** I have no session in `localStorage`
- **When** I navigate to `/enrollments`
- **Then** I am redirected to the login page

---

### US-6.9 — Block delete of a section and semester that has an enrollment

#### Scenario: User cannot delete a section that has an enrollment

- **Given** I am signed in as a user with role `faculty`
- **And** an enrollment exists in section `1`
- **When** I send `DELETE /courses/sections/:sectionId` for that section
- **Then** the API returns `400` with `{ "message": "Cannot delete section: enrollments still exist." }`
- **And** the section is still stored
- **And** the enrollment is still stored

#### Scenario: User cannot delete a semester that has an enrollment

- **Given** I am signed in as a user with role `student`
- **And** an enrollment exists for semester `1`
- **When** I send `DELETE /courses/semesters/:semesterId` for that semester
- **Then** the API returns `400` with `{ "message": "Cannot delete semester: enrollments still exist." }`
- **And** the semester is still stored
- **And** the enrollment is still stored

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
| ----- | -------- | --------- | --------- |
| US-6.1 | Student opens enrollments from the menu | `frontend/tests/MenuBar.test.js`, `frontend/tests/Enrollments.test.js` | `Student opens enrollments from the menu` |
| US-6.1 | Faculty opens enrollments from the menu | `frontend/tests/MenuBar.test.js`, `frontend/tests/Enrollments.test.js` | `Faculty opens enrollments from the menu` |
| US-6.2 | User creates a new enrollment | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js` | `User creates a new enrollment` |
| US-6.2 | User creates an enrollment with a missing required field | `frontend/tests/Enrollments.test.js` | `User creates an enrollment with a missing required field` |
| US-6.2 | User creates an enrollment with an unknown section | `backend/tests/enrollments.test.js` | `User creates an enrollment with an unknown section` |
| US-6.2 | User creates an enrollment with an unknown semester | `backend/tests/enrollments.test.js` | `User creates an enrollment with an unknown semester` |
| US-6.2 | User creates an enrollment with a faculty account | `frontend/tests/Enrollments.test.js` | `User creates an enrollment with a faculty account` |
| US-6.3 | Student enrollments view loads with existing enrollments | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js` | `Student enrollments view loads with existing enrollments` |
| US-6.3 | Student has no enrollments | `frontend/tests/Enrollments.test.js` | `Student has no enrollments` |
| US-6.4 | Faculty enrollments view loads with existing enrollments | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js` | `Faculty enrollments view loads with existing enrollments` |
| US-6.4 | Faculty has no enrollments | `frontend/tests/Enrollments.test.js` | `Faculty has no enrollments` |
| US-6.5 | Student enrollment rows show edit and delete actions | `frontend/tests/Enrollments.test.js` | `Student enrollment rows show edit and delete actions` |
| US-6.5 | Faculty enrollment rows do not show edit and delete actions | `frontend/tests/Enrollments.test.js` | `Faculty enrollment rows do not show edit and delete actions` |
| US-6.6 | User selects to edit an enrollment | `frontend/tests/Enrollments.test.js` | `User selects to edit an enrollment` |
| US-6.6 | User edits an enrollment with valid values and saves | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js` | `User edits an enrollment with valid values and saves` |
| US-6.6 | User edits an enrollment with invalid values and saves | `frontend/tests/Enrollments.test.js` | `User edits an enrollment with invalid values and saves` |
| US-6.6 | User edits an enrollment and cancels | `frontend/tests/Enrollments.test.js` | `User edits an enrollment and cancels` |
| US-6.7 | User selects to delete an enrollment | `frontend/tests/Enrollments.test.js` | `User selects to delete an enrollment` |
| US-6.7 | User deletes an enrollment | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js` | `User deletes an enrollment` |
| US-6.7 | User cancels deleting an enrollment | `frontend/tests/Enrollments.test.js` | `User cancels deleting an enrollment` |
| US-6.8 | Student can GET enrollments via the API | `backend/tests/enrollments.test.js` | `Student can GET enrollments via the API` |
| US-6.8 | Faculty can GET enrollments via the API | `backend/tests/enrollments.test.js` | `Faculty can GET enrollments via the API` |
| US-6.8 | Faculty cannot create an enrollment via the API | `backend/tests/enrollments.test.js` | `Faculty cannot create an enrollment via the API` |
| US-6.8 | Faculty cannot update an enrollment via the API | `backend/tests/enrollments.test.js` | `Faculty cannot update an enrollment via the API` |
| US-6.8 | Faculty cannot delete an enrollment via the API | `backend/tests/enrollments.test.js` | `Faculty cannot delete an enrollment via the API` |
| US-6.8 | Student cannot read another student's enrollments | `backend/tests/enrollments.test.js` | `Student cannot read another student's enrollments` |
| US-6.8 | Student cannot list every enrollment | `backend/tests/enrollments.test.js` | `Student cannot list every enrollment` |
| US-6.8 | Student cannot enroll in the same section twice | `backend/tests/enrollments.test.js` | `Student cannot enroll in the same section twice` |
| US-6.8 | Unauthenticated API request to enrollments | `backend/tests/enrollments.test.js` | `Unauthenticated API request to enrollments` |
| US-6.8 | Unauthenticated user navigates to enrollments | `frontend/tests/router.test.js` | `Unauthenticated user navigates to enrollments` |
| US-6.9 | User cannot delete a section that has an enrollment | `backend/tests/sections.test.js`, `backend/tests/enrollments.test.js` | `User cannot delete a section that has an enrollment` |
| US-6.9 | User cannot delete a semester that has an enrollment | `backend/tests/semesters.test.js`, `backend/tests/enrollments.test.js` | `User cannot delete a semester that has an enrollment` |


---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 6 from @features/feature-6-enrollment-management.md on branch `feature/6-enrollment-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

- [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [ ] **Success Criteria (SC-00N)** met
- [ ] All mapped tests pass (`npm test`)
- [ ] Test Coverage Map complete
- [ ] `features/reference/data-model.md` updated (if schema changed)
- [ ] `features/reference/api.md` updated (if API changed)
- [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Creating sections, courses, or users from the add-enrollment dialog
- Deleting a user account
- Student names on the faculty enrollment list
- Non-student enrollment management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Enrollments** for roles `student` and `faculty`)
- Reordering or renaming **Semesters**, **Course**, **Faculty**, or **Sections**

---

## Delivered to later features

- `MenuBar` is Feature 1 chrome; Features 2–5 added **Semesters**, **Courses**, **Faculty**, and **Sections**; this feature added **Enrollments** for `student` and `faculty`.
- A later feature MUST add its nav item to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- The `enrollments` table belongs to one section, one semester, and one student. A section has many enrollments. A semester has many enrollments. A student has many enrollments.