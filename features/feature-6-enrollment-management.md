# Feature: Enrollment Management

**Feature ID:** 6
**Branch pattern:** `feature/6-enrollment-management`
**Status:** Ready
**Created:** 2026-09-24
**Input:** Signed-in student or faculty users maintain enrollments on one screen; new enrollments are added via a dialog. An enrollment has a section, and a student. A student has many enrollments.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Semester Management](feature-2-semester-management.md), [Feature 3 — Course Management](feature-3-course-management.md), [Feature 4 — faculty Management](feature-4-faculty-management.md), [Feature 5 — Section Management](feature-5-section-management.md)

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

**As a** signed-in student or faculty user  
**I want to** create a enrollment with a section, and student Id  
**So that** sections have enrollments

**Priority:** P1  
**Independent test:** Open add-enrollment dialog, create a enrollment for an existing section and student; it appears in the enrollments view  
**Acceptance scenarios:** see ### US-6.2 under Acceptance Criteria

### US-6.3: View enrollments

**As a** signed-in student or faculty user  
**I want to** see all enrollments on one screen  
**So that** I can see the enrollment catalog

**Priority:** P1  
**Independent test:** Selecting Enrollments loads a screen that displays all enrollments  
**Acceptance scenarios:** see ### US-6.3 under Acceptance Criteria

### US-6.4: Manage enrollment rows

**As a** signed-in student or faculty user  
**I want** each enrollment row to show **edit** and **delete** actions  
**So that** I can manage enrollments without leaving the enrollments view

**Priority:** P1  
**Independent test:** Each enrollment row exposes edit and delete icon actions  
**Acceptance scenarios:** see ### US-6.4 under Acceptance Criteria

### US-6.5: Edit a enrollment

**As a** signed-in student or faculty user  
**I want to** edit enrollment data  
**So that** I can keep enrollment data accurate

**Priority:** P2  
**Independent test:** Edit a enrollment from row actions; enrollments view updates  
**Acceptance scenarios:** see ### US-6.5 under Acceptance Criteria

### US-6.6: Delete a enrollment

**As a** signed-in student or faculty user  
**I want to** delete a enrollment  
**So that** I can remove enrollments that should not stay on the schedule

**Priority:** P2  
**Independent test:** Delete a enrollment from row actions; enrollments view updates  
**Acceptance scenarios:** see ### US-6.6 under Acceptance Criteria

### US-6.7: Restrict enrollment management to students

**As the** application  
**I want to** allow only users with role `student` or `faculty` to manage the enrollment catalog  
**So that** students or faculty can create, edit, or delete enrollments

**Priority:** P1  
**Independent test:** Sign in as a student or faculty — **Enrollments** is visible; `POST /course/enrollments` returns `200`  
**Acceptance scenarios:** see ### US-6.7 under Acceptance Criteria

### US-6.8: Block delete of a section or student that has a enrollment

**As the** application  
**I want to** refuse delete of a section or student that still has enrollments  
**So that** enrollments are not left pointing at missing rows

**Priority:** P1  
**Independent test:** Create a enrollment; `DELETE` of that section or student returns `400` and the parent row remains  
**Acceptance scenarios:** see ### US-6.8 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: All enrollment endpoints MUST require a valid session (`authenticate`). `GET` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` MUST require `req.user.role` equal to `student`.
- **FR-002**: Enrollments MUST be a **shared catalog**. The `enrollments` table MUST NOT include `userId`. The API MUST ignore any client-supplied ownership `userId`.
- **FR-003**: Authenticated non-student users (including `student`) MUST receive `403` with `{ "message": "Student role required." }` on `POST`, `PUT`, and `DELETE`. `GET` MUST return `200` for any authenticated user. They MUST NOT see **Enrollments** in `MenuBar`.
- **FR-004**: Required enrollment fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`). Required fields are `semesterId`, `enrollmentDate`, `startTime`, `homeSectionId`, and `visitingSectionId`. `location` is not required on create.
- **FR-005**: Unauthenticated enrollment API requests MUST return `401`. Unauthenticated navigation to `/enrollments` MUST redirect to `login`.
- **FR-006**: Enrollments MUST be ordered by `enrollmentDate`, then `startTime`, in API responses.
- **FR-007**: This feature MUST deliver student enrollment CRUD and a **single-view** enrollment UI in `Enrollments.vue` (dialog-based add/edit/delete). No sidebar/main split.
- **FR-008**: `semesterId` MUST be a required integer that exists in `semesters`. Missing semester message: **"Semester not found."** (HTTP `400`). A semester MAY have many enrollments.
- **FR-009**: `homeSectionId` and `visitingSectionId` MUST be required integers that exist in `sections`. Missing section messages: **"Home section not found."**, **"Visiting section not found."** (HTTP `400`). They MUST be different. Same-section message: **"Home section and visiting section must be different."** Both sections MUST belong to the same course as the selected semester. Course-mismatch message: **"Home section and visiting section must be in the semester's course."** A section MAY have many enrollments (as home or visiting).
- **FR-010**: `enrollmentDate` MUST be a required date. `startTime` MUST be a required time.
- **FR-011**: On create, `location` MUST be set from the home section's `homeField` (Feature 5). The client MUST NOT be required to send `location` on create. The **Edit Enrollment** dialog MUST show **Location** so an student can set or clear it. When present on edit, `location` MUST be trimmed and at most 50 characters. Too-long message: **"Location must be 50 characters or fewer."** Empty or whitespace-only on edit MUST store `null`.
- **FR-012**: `homeSectionScore` and `visitingSectionScore` MAY be omitted or `null` (a scheduled enrollment with no score yet). When present, each MUST be an integer from `0` through `999`. Invalid message: **"Score must be between 0 and 999."**
- **FR-013**: `DELETE` of a semester MUST fail with `400` when any enrollment references that semester. `DELETE` of a section MUST fail with `400` when any enrollment uses that section as home or visiting. Do **not** cascade-delete enrollments when a semester or section is deleted. Messages: **"Cannot delete semester: enrollments still exist."**, **"Cannot delete section: enrollments still exist."** The parent row and its enrollments MUST remain stored.

---

## Assumptions

- Features 1–5 (auth/`MenuBar`, semesters, courses, faculty, sections) MUST be merged to `dev` before implementing this feature.
- A user with role `student` exists (Feature 1 `role`; tests may seed an student).
- Tests MAY seed at least one course, one semester, and two sections in that semester's course before creating a enrollment.
- A enrollment belongs to one **Section**. Sections belong to one **Course** each. The semester's `courseId` is the course both sections MUST use.
- A section MAY appear in many enrollments. A section MAY be in one students enrollment and in another.
- Add/Edit dialogs load semesters from `GET /course/semesters` and sections from `GET /course/sections`.
- Foreign keys from `enrollments.sectionId` and `enrollments.studentId` MUST use **RESTRICT**.
- This feature updates Feature 2 and Feature 5 `DELETE` handlers for `/course/semesters/:sectionId` and `/course/sections/:studentId` to enforce FR-013.
- Enrollments use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/course/…`. Use `/course/enrollments`.

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- Unknown `sectionId` → `400` with `{ "message": "Section not found." }`
- Unknown `studentId` → `400` with `{ "message": "Student not found." }`
- `DELETE` section while enrollments still reference it → `400`; seciton and enrollments remain.
- `DELETE` student while enrollments still reference it → `400`; student and enrollments remain.
- Authenticated `student` on `POST` / `PUT` / `DELETE` → `200`.
- Authenticated `faculty` on `POST` / `PUT` / `DELETE` → `200`.
- Unauthenticated user on `/enrollments` or `GET /course/enrollments` → redirect or `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in student or faculty can create, view, edit, and delete the shared enrollment catalog on one screen.
- **SC-003**: A signed-in student or faculty MAY `GET` the enrollment catalog; they can open the enrollments manager and can mutate enrollments via the API.
- **SC-004**: A student cannot delete a semester or section that still has enrollments.
- **SC-005**: `npm test` passes for enrollment API and enrollments view behavior.

---

## Data Ownership & Isolation

Enrollments are owned by the signed-in student.The role `student` or `faculty` may manage them. Any authenticated user MAY `GET`, `POST` / `PUT`, or `DELETE` enrollments.

| Rule                   | Requirement                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Read scope**         | `GET /course/enrollments` returns **all** enrollments (with semester, home section, and visiting section) to any authenticated user.    |
| **Write scope**        | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `student` or `faculty`.                                            |
| **Create scope**       | New enrollments have no owner. Ignore ownership `userId` if sent in the body.                                                           |
| **Missing enrollment** | Unknown `enrollmentId` → `404` with `{ "message": "Enrollment with id=<id> not found." }`. Never use ownership `404` to hide rows.      |
| **UI scope**           | **Enrollments** menu and `/enrollments` are student and faculty only.                                                                   |
| **Implementation**     | Use `authenticate` on all endpoints. Use `requireStudent` or `requireFaculty` after `authenticate` on `POST`, `PUT`, and `DELETE` only.                    |

---

## API Requirements

| Method   | Endpoint                   | Auth       | Purpose                                |
| -------- | -------------------------- | ---------- | -------------------------------------- |
| `GET`    | `/course/enrollments`            | Yes        | Fetch all enrollments with semester and sections  |
| `POST`   | `/course/enrollments`            | Yes, student, faculty | Create a enrollment                          |
| `PUT`    | `/course/enrollments/:enrollmentId`    | Yes, student, faculty | Update a enrollment                          |
| `DELETE` | `/course/enrollments/:enrollmentId`    | Yes, student, faculty | Delete a enrollment                          |

**Create enrollment request body:**

```json
{
  "sectionId": 1,
  "studentId": 1595185 
}
```

Do not send `id` on create.

**Update enrollment request body:** same fields as create (no `id`).

**Enrollment success response** (`200` / `201`):

```json
{
  "sectionId": 1,
  "studentId": 1595185,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /course/enrollments` returns an **array** of enrollment objects in this shape.

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found:** `404` for unknown `enrollmentId`.  
**Missing parent / validation:** `400` (FR-008 / FR-009 / FR-011 / FR-012).

This feature also changes Feature 2 and Feature 5 delete APIs (FR-013): `DELETE /course/semesters/:sectionId` and `DELETE /course/sections/:studentId` MUST return `400` with the quoted FR-013 message when enrollments still reference that row.

---

## Screen Requirements

### [View: Enrollments] — route name `enrollments` — path `/enrollments` — `Enrollments.vue`

- Heading: **Enrollments**
- Primary action: **+ New enrollment** (`oc-cta`) opens the **Add Enrollment** `<v-dialog>`.
- **Add Enrollment** fields:
  - **Semester** (`v-select` of existing semesters from `GET /course/semesters`, display semester `name`)
  - **Date** (`v-text-field` type date)
  - **Start Time** (`v-text-field` type time)
  - **Home Section** (`v-select` of existing sections from `GET /course/sections`, display section `name`)
  - **Visiting Section** (`v-select` of existing sections, display section `name`)
  - **Home Section Score** (`v-text-field` type number; optional)
  - **Visiting Section Score** (`v-text-field` type number; optional)
- **Edit Enrollment** uses the same fields plus **Location** (`v-text-field`, optional, max 50), pre-filled.
- **Add Enrollment** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **date**, **start time**, **location**, **home section**, **visiting section**, **home score**, **visiting score**, and **semester**; rows ordered by date then start time (FR-006).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Edit enrollment** — opens **Edit Enrollment** `<v-dialog>` pre-filled with current data; **Save Enrollment** (`oc-cta`) / **Cancel** (secondary)
  - **Delete enrollment** — opens **Delete Enrollment** confirmation `<v-dialog>` with copy **"Delete this enrollment?"**; **Delete Enrollment** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state:** **"No enrollments yet. Create your first enrollment."** when the catalog has zero enrollments.
- **Loading state:** skeleton or progress indicator while enrollments are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Student-only: **Enrollments** menu item and `/enrollments` are for signed-in student users. Other roles do not see the **Enrollments** item. Unauthenticated navigation to `/enrollments` redirects to `login`.
- Enrollment CRUD dialogs live in `Enrollments.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Enrollments** (allowed role `student`; navigates to `/enrollments`) to `MenuBar` after **Sections**. Menu order: **Courses**, **Sections**, **Enrollments**, **People**, **Semesters**.
- Students MUST NOT see **Enrollments**.
- After login, the user remains on Feature 1 `home`. Selecting **Enrollments** in the menu opens this feature's view.

---

## Key Entities

- **Enrollment**: scheduled (and optionally scored) contest in one **Semester** between a **home section** and a **visiting section**. Shared catalog row. Not owned by a user. A section may have many enrollments.

---

## Data Model Requirements

### `enrollments` table

| Field                | Type       | Rules                                                       |
| -------------------- | ---------- | ----------------------------------------------------------- |
| `id`                 | INTEGER PK | Auto-increment                                              |
| `semesterId`           | INTEGER FK | Required; references `semesters.id`                           |
| `enrollmentDate`           | DATE       | Required                                                    |
| `startTime`          | TIME       | Required                                                    |
| `location`           | STRING(50) | Optional; trimmed; at most 50 characters; `null` when empty |
| `homeSectionId`         | INTEGER FK | Required; references `sections.id`                             |
| `visitingSectionId`     | INTEGER FK | Required; references `sections.id`                             |
| `homeSectionScore`      | INTEGER    | Optional; when present, integer 0–999                       |
| `visitingSectionScore`  | INTEGER    | Optional; when present, integer 0–999                       |
| `createdAt`          | DATE       | Sequelize timestamps                                        |
| `updatedAt`          | DATE       | Sequelize timestamps                                        |

`semesterId`, `homeSectionId`, and `visitingSectionId` use `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Enrollment belongsTo Semester` (`semesterId`, `onDelete: 'RESTRICT'`)
- `Semester hasMany Enrollment`
- `Enrollment belongsTo Section` as `homeSection` (`homeSectionId`, `onDelete: 'RESTRICT'`)
- `Enrollment belongsTo Section` as `visitingSection` (`visitingSectionId`, `onDelete: 'RESTRICT'`)
- `Section hasMany Enrollment` as `homeEnrollments` (`homeSectionId`)
- `Section hasMany Enrollment` as `visitingEnrollments` (`visitingSectionId`)

---

## Acceptance Criteria (Gherkin)

### US-6.1 — Select to work with Enrollments

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `student`
- **When** I click **Enrollments** in the `MenuBar`
- **Then** the enrollments view is displayed

### US-6.2 — Create enrollment

#### Scenario: User creates a new enrollment

- **Given** I am signed in as a user with role `student`
- **And** a semester `2026 Fall` exists
- **And** sections `OKC Strikers` and `Tulsa FC` exist in that semester's course
- **And** I am viewing the enrollments view
- **When** I click **+ New enrollment**
- **And** I select semester `2026 Fall`, date `2026-09-12`, start time `18:00`, home section `OKC Strikers`, and visiting section `Tulsa FC`
- **And** I click **Create**
- **Then** the API returns `201` with a enrollment object containing `id`, nested `semester.name` `2026 Fall`, `homeSection.name` `OKC Strikers`, and `visitingSection.name` `Tulsa FC`
- **And** `OKC Strikers` appears in the enrollments view list
- **And** the add-enrollment dialog closes

#### Scenario: User creates a enrollment with a missing required field

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I click **+ New enrollment**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates a enrollment with the same home and visiting section

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I send `POST /course/enrollments` with the same `homeSectionId` and `visitingSectionId` and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Home section and visiting section must be different." }`
- **And** no enrollment is stored

#### Scenario: User creates a enrollment with an unknown semester

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /course/enrollments` with a `semesterId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Semester not found." }`
- **And** no enrollment is stored

#### Scenario: User creates a enrollment with a section that is not in the semester's course

- **Given** I am signed in as a user with role `student`
- **And** semester `2026 Fall` belongs to course `OKC Youth Soccer`
- **And** section `Metro Sluggers` belongs to a different course
- **When** I send `POST /course/enrollments` with that semester and `Metro Sluggers` as a section
- **Then** the API returns `400` with `{ "message": "Home section and visiting section must be in the semester's course." }`
- **And** no enrollment is stored

---

### US-6.3 — View enrollments

#### Scenario: Enrollments view loads with existing enrollments

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** enrollments exist
- **When** I view the enrollments list
- **Then** all the enrollments are displayed in the list

#### Scenario: User has no enrollments

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** there are no enrollments
- **When** I view the enrollments list
- **Then** I see **"No enrollments yet. Create your first enrollment."**

---

### US-6.4 — Manage enrollment rows

#### Scenario: enrollment rows show edit and delete actions

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I view a enrollment row
- **Then** the enrollment row shows an **Edit enrollment** icon action
- **And** the enrollment row shows a **Delete enrollment** icon action

---

### US-6.5 — Edit a enrollment

#### Scenario: User selects to edit a enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I click the edit icon on a enrollment row
- **Then** the enrollment edit dialog is displayed

#### Scenario: User edits a enrollment with valid values and saves

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment edit dialog is displayed
- **When** I update values in the fields with valid values including location `North Field` and scores `2` and `1`
- **And** I click **Save Enrollment**
- **Then** the enrollment data is updated
- **And** the dialog is closed

#### Scenario: User edits a enrollment with invalid values and saves

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Enrollment**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed

#### Scenario: User edits a enrollment and cancels

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the enrollment data is not updated
- **And** the dialog is closed

---

### US-6.6 — Delete a enrollment

#### Scenario: User selects to delete a enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **When** I click the delete icon on a enrollment row
- **Then** the enrollment delete dialog is displayed

#### Scenario: User deletes a enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment delete dialog is displayed
- **When** I click **Delete Enrollment**
- **Then** the enrollment is deleted
- **And** the dialog is closed
- **And** the enrollment is not in the enrollments list

#### Scenario: User cancels deleting a enrollment

- **Given** I am signed in as a user with role `student`
- **And** I am viewing the enrollments view
- **And** the enrollment delete dialog is displayed
- **When** I click **Cancel**
- **Then** the enrollment is not deleted
- **And** the dialog is closed
- **And** the enrollment is still in the enrollments list

---

### US-6.7 — Restrict enrollment management to students

#### Scenario: Student does not see Enrollments in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Enrollments** is not shown

#### Scenario: Student can list enrollments via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /course/enrollments`
- **Then** the API returns `200` with an array of enrollment objects

#### Scenario: Student cannot create a enrollment via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /course/enrollments` with a valid enrollment body
- **Then** the API returns `403` with `{ "message": "Student role required." }`
- **And** no new enrollment is stored

#### Scenario: Unauthenticated API request to enrollments

- **Given** I have no valid session token
- **When** I request `GET /course/enrollments`
- **Then** the API returns `401` with an unauthorized message

#### Scenario: Unauthenticated user navigates to enrollments

- **Given** I have no session in `localStorage`
- **When** I navigate to `/enrollments`
- **Then** I am redirected to the login page

---

### US-6.8 — Block delete of a semester or section that has a enrollment

#### Scenario: User cannot delete a semester that has a enrollment

- **Given** I am signed in as a user with role `student`
- **And** a enrollment exists in semester `2026 Fall`
- **When** I send `DELETE /course/semesters/:semesterId` for that semester
- **Then** the API returns `400` with `{ "message": "Cannot delete semester: enrollments still exist." }`
- **And** the semester is still stored
- **And** the enrollment is still stored

#### Scenario: User cannot delete a section that has a enrollment

- **Given** I am signed in as a user with role `student`
- **And** a enrollment exists with home section `OKC Strikers`
- **When** I send `DELETE /course/sections/:sectionId` for that section
- **Then** the API returns `400` with `{ "message": "Cannot delete section: enrollments still exist." }`
- **And** the section is still stored
- **And** the enrollment is still stored

---

## Test Coverage Map

| Story  | Scenario                                                      | Test file                                                          | Test name                                                       |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| US-6.1 | Menu Selection                                                | `frontend/tests/MenuBar.test.js`, `frontend/tests/Enrollments.test.js`   | `Menu Selection`                                                |
| US-6.2 | User creates a new enrollment                                       | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js`      | `User creates a new enrollment`                                       |
| US-6.2 | User creates a enrollment with a missing required field             | `frontend/tests/Enrollments.test.js`                                     | `User creates a enrollment with a missing required field`             |
| US-6.2 | User creates a enrollment with the same home and visiting section      | `backend/tests/enrollments.test.js`                                      | `User creates a enrollment with the same home and visiting section`      |
| US-6.2 | User creates a enrollment with an unknown semester                    | `backend/tests/enrollments.test.js`                                      | `User creates a enrollment with an unknown semester`                    |
| US-6.2 | User creates a enrollment with a section that is not in the semester's course | `backend/tests/enrollments.test.js`                                 | `User creates a enrollment with a section that is not in the semester's course` |
| US-6.3 | Enrollments view loads with existing enrollments                          | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js`      | `Enrollments view loads with existing enrollments`                          |
| US-6.3 | User has no enrollments                                             | `frontend/tests/Enrollments.test.js`                                     | `User has no enrollments`                                             |
| US-6.4 | enrollment rows show edit and delete actions                        | `frontend/tests/Enrollments.test.js`                                     | `enrollment rows show edit and delete actions`                        |
| US-6.5 | User selects to edit a enrollment                                   | `frontend/tests/Enrollments.test.js`                                     | `User selects to edit a enrollment`                                   |
| US-6.5 | User edits a enrollment with valid values and saves                 | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js`      | `User edits a enrollment with valid values and saves`                 |
| US-6.5 | User edits a enrollment with invalid values and saves               | `frontend/tests/Enrollments.test.js`                                     | `User edits a enrollment with invalid values and saves`               |
| US-6.5 | User edits a enrollment and cancels                                 | `frontend/tests/Enrollments.test.js`                                     | `User edits a enrollment and cancels`                                 |
| US-6.6 | User selects to delete a enrollment                                 | `frontend/tests/Enrollments.test.js`                                     | `User selects to delete a enrollment`                                 |
| US-6.6 | User deletes a enrollment                                           | `backend/tests/enrollments.test.js`, `frontend/tests/Enrollments.test.js`      | `User deletes a enrollment`                                           |
| US-6.6 | User cancels deleting a enrollment                                  | `frontend/tests/Enrollments.test.js`                                     | `User cancels deleting a enrollment`                                  |
| US-6.7 | Student does not see Enrollments in the menu                        | `frontend/tests/MenuBar.test.js`                                   | `Student does not see Enrollments in the menu`                        |
| US-6.7 | Student can list enrollments via the API                            | `backend/tests/enrollments.test.js`                                      | `Student can list enrollments via the API`                            |
| US-6.7 | Student cannot create a enrollment via the API                      | `backend/tests/enrollments.test.js`                                      | `Student cannot create a enrollment via the API`                      |
| US-6.7 | Unauthenticated API request to enrollments                          | `backend/tests/enrollments.test.js`                                      | `Unauthenticated API request to enrollments`                          |
| US-6.7 | Unauthenticated user navigates to enrollments                       | `frontend/tests/router.test.js`                                    | `Unauthenticated user navigates to enrollments`                       |
| US-6.8 | User cannot delete a semester that has a enrollment                   | `backend/tests/semesters.test.js`, `backend/tests/enrollments.test.js`     | `User cannot delete a semester that has a enrollment`                   |
| US-6.8 | User cannot delete a section that has a enrollment                     | `backend/tests/sections.test.js`, `backend/tests/enrollments.test.js`       | `User cannot delete a section that has a enrollment`                     |

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

- [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [x] **Success Criteria (SC-00N)** met
- [x] All mapped tests pass (`npm test`)
- [x] Test Coverage Map complete
- [x] `features/reference/data-model.md` updated (if schema changed)
- [x] `features/reference/api.md` updated (if API changed)
- [x] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Student-facing enrollment or scoreboard UI (API `GET` is in this feature)
- Standings, playoffs, or automatic ranking
- Officials, weather, or recap notes
- Creating semesters or sections from the add-enrollment dialog
- Non-student enrollment management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Enrollments** for role `student`)

---

## Delivered to later features

- `MenuBar` is Feature 1 chrome; Features 2–5 added **Semesters**, **Courses**, **People**, and **Sections**; this feature added **Enrollments** for `student`.
- A later feature MUST add its nav item to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- The `enrollments` table belongs to one semester and two sections. A section has many enrollments.
- [Feature 7](feature-7-semester-view.md) lists a semester's enrollments on the semester view and adds a enrollment with that semester already selected.