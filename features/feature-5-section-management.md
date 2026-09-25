# Feature: Section Management

**Feature ID:** 5
**Branch pattern:** `feature/5-section-management` **Status:** Ready
**Created:** 2026-09-23
**Input:** Signed-in faculty users manage a section and section view. A section has a time, belongs to a course, and has students. The section view shows section info, **Edit section**, and . A student is a Feature 1 person on that has a name.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Semester Management](feature-2-semester-management.md), [Feature 3 — Course Management](feature-3-course-management.md), [Feature 4 — Faculty Management](feature-4-faculty-management.md)

---



## User Stories



### US-5.1: Select to work with sections

**As a** signed-in faculty user  
**I want to** open the section view from the menu  
**So that** I can maintain course sections

**Priority:** P1  
**Independent test:** login, view sections on menubar; section view appears  
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Create section

**As a** signed-in factuly user  
**I want to** create a section with a section number in a course  
**So that** the course has sections

**Priority:** P1  
**Independent test:** Open add-section dialog, create a section for an existing course; it appears in the section view  
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: View sections

**As a** signed-in factuly user  
**I want to** see all sections on one screen  
**So that** I can see each course's sections

**Priority:** P1  
**Independent test:** Selecting sections loads a screen that displays all sections  
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Manage section rows

**As a** signed-in faculty user  
**I want** each section row to show a **section** icon and a **delete** action  
**So that** I can open a section or remove it from the list

**Priority:** P1  
**Independent test:** Each section row shows an **Open section** icon and a delete icon action  
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

### US-5.5: View a section

**As a** signed-in faculty user  
**I want to** open a section view with section info, and **Edit section**
**So that** I can work with section information

**Priority:** P1  
**Independent test:** From the sectoin list, open a section; heading shows section info
**Acceptance scenarios:** see ### US-5.5 under Acceptance Criteria

### US-5.6: Edit a section

**As a** signed-in faculty user  
**I want to** edit a section's time or course from the section view  
**So that** I can keep section data accurate

**Priority:** P2  
**Independent test:** On the section view, **Edit section** opens the Edit Section dialog; save updates the heading  
**Acceptance scenarios:** see ### US-5.6 under Acceptance Criteria

### US-5.7: Delete a section

**As a** signed-in faculty user  
**I want to** delete a section  
**So that** I can remove sections that no longer belong in a course

**Priority:** P2  
**Independent test:** Delete a section from row actions; sections view updates  
**Acceptance scenarios:** see ### US-5.7 under Acceptance Criteria

### US-5.8: Restrict section management to factuly

**As the** application  
**I want to** allow only users with role `factuly` to manage sections 
**So that** students cannot create, edit, or delete sections or student rows

**Priority:** P1  
**Independent test:** Sign in as a student — **Sections** is hidden; `POST /courses-t4/courses/sections` returns `403`  
**Acceptance scenarios:** see ### US-5.8 under Acceptance Criteria


## Requirements



### Functional Requirements

- **FR-001**: All section and student endpoints MUST require a valid session (`authenticate`). `GET` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` MUST require `req.user.role` equal to `faculty`.
- **FR-002**: Section and students MUST be a **shared catalog**. The `section` and `students` tables MUST NOT use `userId` as ownership. The API MUST ignore any client-supplied ownership `userId`.
- **FR-003**: Authenticated non-faculty users (including `student`) MUST receive `403` with `{ "message": "Faculty role required." }` on `POST`, `PUT`, and `DELETE`. `GET` MUST return `200` for any authenticated user. They MUST NOT see **Sections** in `MenuBar`.
- **FR-004**: Required section and student fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`).
- **FR-005**: Unauthenticated section API requests MUST return `401`. Unauthenticated navigation to `/section` or `/section/:sectionID` MUST redirect to `login`.
- **FR-006**: Sections MUST be ordered by related course `name`, then section `sectionNumer`, in API responses.
- **FR-007**: This feature MUST deliver a **section list** in `Sections.vue` and a **section view** in `Section.vue`. The section view MUST have a heading area for section info, an **Edit section** button that opens the **Edit Section** dialog. Section mutations stay dialog-based. No sidebar/main split.
- **FR-008**: Section `sectionNumber` MUST be required, trimmed, and at most 10 characters. Too-long message: **"Section name must be 10 characters or fewer."** The pair (`courseID`, `sectionNumber`) MUST be unique. Duplicate message: **"Section number is already taken in this course."** `daysOfWeek` MUST be required, trimmed, and at most 10 characters. Too-long message: **"Section days of week must characters or fewer"** `startTime` MUST be required, and trimmed. Invalid time message: **"Section time must be a valid date."** `endTime` MUST be required, and trimmed. Invalid time message: **"Section time must be a valid date."**
- **FR-009**: `courseId` MUST be a required integer that exists in `courses`. Missing course message: **"Course not found."** (HTTP `400`). A course MAY have many sections.
- **FR-010**: `DELETE` of a course MUST fail with `400` when any section references that course. Do **not** cascade-delete sections when a course is deleted. Messages: **"Cannot delete course: sections still exist."** The parent row and its dependents MUST remain stored.

---



## Assumptions

- Features 1–4 (auth/`MenuBar`, seasons, courses, people) MUST be merged to `dev` before implementing this feature.
- A user with role `admin` exists (Feature 1 `role`; tests may seed an admin).
- Tests MAY seed at least one course and one person (from Features 3–4) before creating a section or player.
- Sections belong to a **course**, not to a semester and not to a signed-in user. No FK from `sections` to `semester`.
- Add/Edit dialogs load courses from `GET /course/courses`.
- Foreign keys from `sections.semesterId`, `sections.courseId`, and `sections.facultyId` MUST use **RESTRICT**.
- This feature updates Feature 3–4 `DELETE` handlers for `/course/courses/:courseId` to enforce FR-010.
- The **sections list** creates and deletes sections. The **section view** edits one section.
- Section forms use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/course/…`. Use `/course/sections`.



## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- Section `sectionNumber` longer than 10 characters → **"Section number must be 10 characters or fewer."**
- Duplicate section `sectionNumber` in the same course → `400` with `{ "message": "Section number is already taken in this course." }`
- Same section number in a **different** course is allowed.
- Unknown `courseId` → `400` with `{ "message": "Course not found." }`
- Unknown `sectionId` on PUT/DELETE → `404` with `{ "message": "Section with id=<id> not found." }`
- `DELETE` course while sections still reference it → `400`; course and sections remain.
- `DELETE` section → section and its player rows are removed; people remain.
- Authenticated `student` (or any non-faculty) on `POST` / `PUT` / `DELETE` → `403`.
- Authenticated `student` on `GET` → `200`.
- Unauthenticated user on `/sections`, `/sections/:sectionId`, or `GET /course/sections` → redirect or `401`.
- Unknown `sectionId` on the section view → error **"Section with id= not found."**



## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in faculty can create and delete sections on the sections list, and edit a section from the section view.
- **SC-003**: A signed-in student MAY `GET` sections; they cannot open the sections manager and cannot mutate sections via the API.
- **SC-004**: A faculty cannot delete a course that still has sections.
- **SC-005**: `npm test` passes for section API and sections view behavior.

---



## Data Ownership & Isolation

Sections are not owned by the signed-in faculty. Only role `faculty` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI.


| Rule                | Requirement                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Read scope**      | `GET /course/sections` returns **all** sections (with course) to any authenticated user.                                     |
| **Write scope**     | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `faculty`.                                              |
| **Create scope**    | New sections and players have no owner. Ignore ownership `userId` if sent in the body.                                       |
| **Missing section** | Unknown `sectionId` → `404` with `{ "message": "Section with id=<id> not found." }`. Never use ownership `404` to hide rows. |
| **Non-faculty**     | Authenticated non-faculty `GET` → `200`. `POST` / `PUT` / `DELETE` → `403` with `{ "message": "Faculty role required." }`.   |
| **UI scope**        | **Sections** menu, `/sections`, and `/sections/:sectionId` are faculty-only. Students do not see this manager.               |
| **Implementation**  | Use `authenticate` on all endpoints. Use `requireFaculty` after `authenticate` on `POST`, `PUT`, and `DELETE` only.          |


---



## API Requirements


| Method   | Endpoint                                  | Auth       | Purpose                                                                 |
| -------- | ----------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `GET`    | `/course/sections`                        | Yes        | Fetch all sections with course                                          |
| `POST`   | `/course/sections`                        | Yes, admin | Create a section in a course                                            |
| `PUT`    | `/course/sections/:sectionId`             | Yes, admin | Update a section's name, course, days of week, start time, and end time |
| `DELETE` | `/course/sections/:sectionId`             | Yes, admin | Delete a section                                                        |


**Create section request body:**

```json
{
  "sectionNumber": "01",
  "semesterId": 1,
  "courseId": 1,
  "facultyId": 1,
  "daysOfWeek": "MWF",
  "startTime": 09:00:00,
  "endTime": 09:50:00
}
```

Do not send `id` on create.

**Update section request body:** same fields as create (no `id`).

**Section success response** (`200` / `201`):

```json
{
  "id": 1,
  "sectionNumber": "01",
  "semesterId": 1,
  "courseId": 1,
  "facultyId": 1,
  "daysOfWeek": "MWF",
  "startTime": 09:00:00,
  "endTime": 09:50:00,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /course/sections` returns an **array** of section objects in this shape.

This feature also changes Feature 3–4 delete APIs (FR-010): `DELETE /course/courses/:courseId` MUST return `400` with the quoted FR-013 message when sections still reference that row.

---



## Screen Requirements



### [View: Sections] — route name `sections` — path `/sections` — `Sections.vue`

- Heading: **Sections**
- Primary action: **+ New section** (`oc-cta`) opens the **Add Section** `<v-dialog>`.
- **Add Section** fields:
  - **Section Number** (`v-text-field`)
  - **Course** (`v-select` of existing courses, display course `name`)
  - **Days Of Week** (`v-text-field`)
  - **Start Time** (`v-text-field`)
  - **End Time** (`v-text-field`)
- **Add Section** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **section number**, **course**; rows ordered by course name then section name (FR-006).
- Section number is plain text (not a link).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Open section** — section icon (`mdi-account-group`) navigates to the **Section** view (`/sections/:sectionId`)
  - **Delete section** — opens **Delete Section** confirmation `<v-dialog>` with copy **"Delete this section?"**; **Delete Section** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state:** **"No sections yet. Create your first section."** when the catalog has zero sections.
- **Loading state:** skeleton or progress indicator while sections are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Faculty-only: **Sections** menu item and `/sections` are for signed-in faculty users. Other roles do not see the **Sections** item. Unauthenticated navigation to `/sections` redirects to `login`.



### [View: Section] — route name `section` — path `/sections/:sectionId` — `Section.vue`

This is the section view (section main).

- **Heading area** shows section info: section **sectionNumber**, **course** name, **daysOfWeek**, **startTime**, and **endTime**.
- Actions in the heading area:
  - **Edit section** (`oc-cta`) opens the **Edit Section** `<v-dialog>` pre-filled with current sectionNumber, course, daysOfWeek, startTime, and endTime.
- **Edit Section** fields (sectionNumber, course, daysOfWeek, startTime, and endTime):
  - **Section Number** (`v-text-field`)
  - **Course** (`v-select` of existing courses, display course `name`)
  - **Days Of Week** (`v-text-field`)
  - **Start Time** (`v-text-field`)
  - **End Time** (`v-text-field`)
- **Edit Section** actions: **Save Section** (`oc-cta`) / **Cancel** (secondary). After a successful save, the heading area shows the updated section info and the dialog closes.
- **Add Player** / **Edit Player** fields (same set; edit pre-filled):
  - **Person** (`v-select` of existing people, display last name, first name)
  - **Number** (`v-text-field` type number)
  - **Position** (`v-text-field`)
- **Loading state:** skeleton or progress indicator while the section is fetching.
- **Error state:** `<v-alert type="error">` for API failures. Unknown `sectionId` shows **"Section with id= not found."**
- Faculty-only: `/sections/:sectionId` is for signed-in faculty users. Unauthenticated navigation redirects to `login`.
- Section dialogs live in `Section.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Sections** (allowed role `faculty`; navigates to `/sections`) to `MenuBar`. Keep name, **Sign out**, **Semesters**, **Courses**, and **Faculty** from Features 1–4.
- Students MUST NOT see **Sections**.
- After login, the user remains on Feature 1 `home`. Selecting **Sections** in the menu opens the sections list. Opening a section from that list shows the section view.

---



## Key Entities

- **Section**: section number that belongs to a **Course**. Shared catalog row. Not owned by a user. A course may have many sections.

---



## Data Model Requirements



### `sections` table


| Field            | Type       | Rules                                                                           |
| ---------------- | ---------- | ------------------------------------------------------------------------------- |
| `id`             | INTEGER PK | Auto-increment                                                                  |
| `sectionNumber`  | STRING(2)  | Required; trimmed; exactly two digits (01 - 99); unique per course and semester |
| `semesterId`     | INTEGER FK | Required; references `semester.id`                                              |
| `courseId`       | INTEGER FK | Required; references `course.id`                                                |
| `facultyId`      | INTEGER FK | Required; references `faculty.id`                                               |
| `daysOfWeek`     | STRING(10) | Required; trimmed; at most 10 characters                                        |
| `StartTime`      | TIME       | Required; valid clock time HH:mm:ss                                             |
| `endTime`        | TIME       | Required; valid clock time HH:mm:ss                                             |


Unique index on (`semesterId`, `courseId`).
Unique index on (`facultyId`, `sectionNumber`).  
`semesterId` uses `ON DELETE CASADE`.
`courseId` uses `ON DELETE RESTRICT`.
`facultyId` uses `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Section belongsTo course` (`courseID`, `onDelete: 'RESTRICT'`)
- `Course hasMany Section`

---



## Acceptance Criteria (Gherkin)



### US-5.1 — Select to work with Sections



#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `faculty`
- **When** I click **Sections** in the `MenuBar`
- **Then** the sections view is displayed



### US-5.2 — Create section



#### Scenario: User creates a new section

- **Given** I am signed in as a user with role `faculty`
- **And** a semester `Spring 2027` exists
- **And** a course `Programming 1` exists
- **And** a faculty `David North` exists
- **And** I am viewing the sections view
- **When** I click **+ New section**
- **And** I enter section number `01`, select semester `Spring 2027`, select course `Programming 1`, select faculty `David North`, I enter days of week `MWF`, I enter start time `09:00:00`, and I enter end time `09:50:00`.
- **And** I click **Create**
- **Then** the API returns `201` with a section object containing `id`, `sectionNumber` `01`, `daysOfWeek` `MWF`, `startTime` `09:00:00`, `endTime` `09:50:00`, and nested `course.name` `Programming 1`
- **And** `Programming 1`, `01` appears in the sections view list
- **And** the add-section dialog closes



#### Scenario: User creates a section with a missing required field

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **When** I click **+ New section**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**



#### Scenario: User creates a section with a number that is too long

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **When** I click **+ New section**
- **And** I enter a section name longer than 10 characters with a valid course
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Section name must be 10 characters or fewer."**



#### Scenario: User creates a section with an unknown course

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **When** I send `POST /course/sections` with a `courseId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Course not found." }`
- **And** no section is stored



#### Scenario: User creates a section with a duplicate number in the same course

- **Given** I am signed in as a user with role `faculty`
- **And** a section number `01` already exists in course `Programming 1`
- **And** I am viewing the sections view
- **When** I click **+ New section**
- **And** I enter section number `01` and select course `Programming 1`
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "Section numer is already taken in this course." }`
- **And** no second section number`01` is stored in that course

---



### US-5.3 — View sections



#### Scenario: Sections view loads with existing sections

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **And** sections exist
- **When** I view the sections list
- **Then** all the sections are displayed in the list



#### Scenario: Courses have no sections

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **And** there are no sections
- **When** I view the sections list
- **Then** I see **"No sections yet. Create your first section."**

---



### US-5.4 — Manage section rows



#### Scenario: section rows open the section view and show a delete action

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **When** I view a section row
- **Then** the section name is not a link
- **And** the section row shows an **Open section** icon action
- **And** the section row shows a **Delete section** icon action

---


### US-5.5 — View a section



#### Scenario: User opens a section from the sections list

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the sections view
- **And** a section `OKC Strikers` exists in course `OKC Youth Soccer`
- **When** I click the **Open section** icon on the `OKC Strikers` row
- **Then** the section view is displayed



#### Scenario: Section view shows section info and actions

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the section view for `OKC Strikers` in course `OKC Youth Soccer`
- **Then** the heading area shows section name `OKC Strikers`
- **And** the heading area shows course `OKC Youth Soccer`
- **And** **Edit section** is shown
- **And** **Add Players** is shown



#### Scenario: Section view lists players with name, number, and position

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is a player on section `OKC Strikers` with number `10` and position `Forward`
- **And** I am viewing the section view for `OKC Strikers`
- **When** I view the players list
- **Then** the list shows name `Doe, Jane`, number `10`, and position `Forward`
- **And** the player row shows an **Edit player** icon action

---



### US-5.6 — Edit a section



#### Scenario: User selects to edit a section

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the section view
- **When** I click **Edit section**
- **Then** the section edit dialog is displayed



#### Scenario: User edits a section with valid values and saves

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the section view
- **And** the section edit dialog is displayed
- **When** I update values in the fields with valid values
- **And** I click **Save Section**
- **Then** the section data is updated
- **And** the heading area shows the updated section info
- **And** the dialog is closed



#### Scenario: User edits a section with invalid values and saves

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the section view
- **And** the section edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Section**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed



#### Scenario: User edits a section and cancels

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the section view
- **And** the section edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the section data is not updated
- **And** the dialog is closed

---



### US-5.7 — Delete a section



#### Scenario: User selects to delete a section

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **When** I click the delete icon on a section row
- **Then** the section delete dialog is displayed



#### Scenario: User deletes a section

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **And** the section delete dialog is displayed
- **When** I click **Delete Section**
- **Then** the section is deleted
- **And** the dialog is closed
- **And** the section is not in the sections list



#### Scenario: User cancels deleting a section

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the sections view
- **And** the section delete dialog is displayed
- **When** I click **Cancel**
- **Then** the section is not deleted
- **And** the dialog is closed
- **And** the section is still in the sections list

---



### US-5.8 — Restrict section management to faculty



#### Scenario: Student does not see Sections in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Sections** is not shown



#### Scenario: Student can list sections via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /course/sections`
- **Then** the API returns `200` with an array of section objects



#### Scenario: Student cannot create a section via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /course/sections` with a valid section body
- **Then** the API returns `403` with `{ "message": "Faculty role required." }`
- **And** no new section is stored



#### Scenario: Unauthenticated API request to sections

- **Given** I have no valid session token
- **When** I request `GET /course/sections`
- **Then** the API returns `401` with an unauthorized message



#### Scenario: Unauthenticated user navigates to sections

- **Given** I have no session in `localStorage`
- **When** I navigate to `/sections`
- **Then** I am redirected to the login page



#### Scenario: Unauthenticated user navigates to a section

- **Given** I have no session in `localStorage`
- **When** I navigate to `/sections/1`
- **Then** I am redirected to the login page

---



## Test Coverage Map


| Story  | Scenario | Test file | Test name |
| ------ | -------- | --------- | --------- |
| US-5.1 | Menu Selection | `frontend/tests/MenuBar.test.js`, `frontend/tests/Sections.test.js` | `Menu Selection` |
| US-5.2 | User creates a new section | `backend/tests/sections.test.js`, `frontend/tests/Sections.test.js` | `User creates a new section` |
| US-5.2 | User creates a section with a missing required field | `frontend/tests/Sections.test.js` | `User creates a section with a missing required field` |
| US-5.2 | User creates a section with a number that is too long | `frontend/tests/Sections.test.js` | `User creates a section with a number that is too long` |
| US-5.2 | User creates a section with an unknown course | `backend/tests/sections.test.js` | `User creates a section with an unknown course` |
| US-5.2 | User creates a section with a duplicate number in the same course | `backend/tests/sections.test.js`, `frontend/tests/Sections.test.js` | `User creates a section with a duplicate number in the same course` |
| US-5.3 | Sections view loads with existing sections | `backend/tests/sections.test.js`, `frontend/tests/Sections.test.js` | `Sections view loads with existing sections` |
| US-5.3 | Courses have no sections | `frontend/tests/Sections.test.js` | `Courses have no sections` |
| US-5.4 | section rows open the section view and show a delete action | `frontend/tests/Sections.test.js` | `section rows open the section view and show a delete action` |
| US-5.5 | User opens a section from the sections list | `frontend/tests/Sections.test.js` | `User opens a section from the sections list` |
| US-5.5 | Section view shows section info and actions | `frontend/tests/Section.test.js` | `Section view shows section info and actions` |
| US-5.5 | Section view lists players with name, number, and position | `frontend/tests/Section.test.js` | `Section view lists players with name, number, and position` |
| US-5.6 | User selects to edit a section | `frontend/tests/Section.test.js` | `User selects to edit a section` |
| US-5.6 | User edits a section with valid values and saves | `backend/tests/sections.test.js`, `frontend/tests/Section.test.js` | `User edits a section with valid values and saves` |
| US-5.6 | User edits a section with invalid values and saves | `frontend/tests/Section.test.js` | `User edits a section with invalid values and saves` |
| US-5.6 | User edits a section and cancels | `frontend/tests/Section.test.js` | `User edits a section and cancels` |
| US-5.7 | User selects to delete a section | `frontend/tests/Sections.test.js` | `User selects to delete a section` |
| US-5.7 | User deletes a section | `backend/tests/sections.test.js`, `frontend/tests/Sections.test.js` | `User deletes a section` |
| US-5.7 | User cancels deleting a section | `frontend/tests/Sections.test.js` | `User cancels deleting a section` |
| US-5.8 | Student does not see Sections in the menu | `frontend/tests/MenuBar.test.js` | `Student does not see Sections in the menu` |
| US-5.8 | Student can list sections via the API | `backend/tests/sections.test.js` | `Student can list sections via the API` |
| US-5.8 | Student cannot create a section via the API | `backend/tests/sections.test.js` | `Student cannot create a section via the API` |
| US-5.8 | Unauthenticated API request to sections | `backend/tests/sections.test.js` | `Unauthenticated API request to sections` |
| US-5.8 | Unauthenticated user navigates to sections | `frontend/tests/router.test.js` | `Unauthenticated user navigates to sections` |
| US-5.8 | Unauthenticated user navigates to a section | `frontend/tests/router.test.js` | `Unauthenticated user navigates to a section` |




---



## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-section-management.md on branch `feature/5-section-management`.

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

- Student-facing section or roster UI (API `GET` is in this feature)
- Assigning a section to a season
- Non-faculty section management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Sections** for role `faculty`)

---



## Delivered to later features

- `MenuBar` is Feature 1 chrome; Features 2–4 added **Semesters**, **Courses**, and **Faculty**; this feature added **Sections** for `faculty`.
- A later feature MUST add its nav item to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- The `sections` table belongs to `courses`.
- [Feature 6](feature-6-enrollment-management.md) enrolls users to sections. A section MAY have many enrolled users. Feature 6 MUST reject `DELETE /course/sections/:sectionId` with `400` when enrolled users still reference that section.

---

