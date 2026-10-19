# Feature: Semester Management

**Feature ID:** 2
**Branch pattern:** `feature/2-semester-management`
**Status:** Ready
**Created:** 2026-09-25
**Input:** A signed-in student opens **Semesters**, creates a semester by choosing a term (Fall, Winter, Spring, or Summer) and a year, and sees only their own semesters. Start and end dates are predetermined from that term and year. A signed-in faculty user opens the same view and sees every student's semesters, with the student's name on each one. Courses and sections inside a semester come in later features.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md)

---

## User Stories

### US-2.1: Open the semesters view
**As a** signed-in student or faculty user
**I want to** open the semesters view from the menu
**So that** I can see the semesters I am allowed to work with

**Priority:** P1
**Independent test:** Sign in as a student or as faculty, choose **Semesters** in the menu, and the semesters view appears
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: Create a semester
**As a** signed-in student
**I want to** create a semester by choosing a term and year (for example "Fall 2026" or "Spring 2025")
**So that** I can track that semester

**Priority:** P1
**Independent test:** Open the add-semester dialog, choose Fall and 2026, create it, and "Fall 2026" appears on the semesters view with the predetermined dates
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: View semesters as cards
**As a** signed-in student
**I want to** see each of my semesters as a card on one screen
**So that** I can see my semester catalog

**Priority:** P1
**Independent test:** Choosing **Semesters** loads a screen that shows that student's semesters as cards
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: See semester card details
**As a** signed-in student
**I want to** see the title (for example "Fall 2026" or "Spring 2025"), class count, start date, and end date on each semester card
**So that** I can identify a semester without opening it

**Priority:** P1
**Independent test:** Each of the student's semester cards shows the title, class count, start date, and end date
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

### US-2.5: Enlarge a semester card
**As a** signed-in student
**I want to** open a semester card and see its full details
**So that** I can review that semester

**Priority:** P1
**Independent test:** Selecting one semester card opens an enlarged view with that semester's full details
**Acceptance scenarios:** see ### US-2.5 under Acceptance Criteria

### US-2.6: Manage a semester from the card
**As a** signed-in student
**I want** each of my semester cards to show **edit** and **delete**
**So that** I can manage a semester without leaving the semesters view

**Priority:** P1
**Independent test:** Each of the student's semester cards exposes edit and delete icon actions
**Acceptance scenarios:** see ### US-2.6 under Acceptance Criteria

### US-2.7: Manage a semester from the enlarged view
**As a** signed-in student
**I want** the enlarged semester view to show **edit** and **delete**
**So that** I can manage that semester from its details

**Priority:** P1
**Independent test:** The enlarged semester view exposes edit and delete icon actions
**Acceptance scenarios:** see ### US-2.7 under Acceptance Criteria

### US-2.8: Edit a semester
**As a** signed-in student
**I want to** change a semester's term and year
**So that** I can keep the semester accurate

**Priority:** P2
**Independent test:** Edit a semester from the card or the enlarged view; the card updates and the dates follow the new term and year
**Acceptance scenarios:** see ### US-2.8 under Acceptance Criteria

### US-2.9: Delete a semester
**As a** signed-in student
**I want to** delete a semester
**So that** I can remove a semester I no longer need

**Priority:** P2
**Independent test:** Delete a semester from the card or the enlarged view; it disappears from the semesters view
**Acceptance scenarios:** see ### US-2.9 under Acceptance Criteria

### US-2.10: Show each role only the semesters they may see
**As the** application
**I want to** show a student only their own semesters, and show a faculty user every student's semesters with the student's name
**So that** a student cannot view another student's catalog and faculty can review the full catalog

**Priority:** P1
**Independent test:** A student sees only their cards; a faculty user sees every student's cards with a name on each; a student request for another student's semesters returns `403`
**Acceptance scenarios:** see ### US-2.10 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: Every semester endpoint MUST require a valid session (`authenticate`). A missing token returns `401` with `{ "message": "Unauthorized! No token provided." }`.
- **FR-002**: Each semester belongs to exactly one student. `studentId` is that student's `users.id`. The API MUST ignore any client-supplied `id`, `userId`, `studentId`, `name`, `startDate`, `endDate`, and `classCount`.
- **FR-003**: A student MAY create, view, edit, and delete only their own semesters. `studentId` in the path MUST equal the signed-in user's id. Another student's id returns `403` with `{ "message": "You can only access your own semesters." }`.
- **FR-004**: A faculty user MAY view every student's semesters. Faculty MUST NOT create, edit, or delete a semester. `POST`, `PUT`, and `DELETE` by faculty return `403` with `{ "message": "Only the owning student can change this semester." }`.
- **FR-005**: Create and update send `term` and `year` only. `term` MUST be `Fall`, `Winter`, `Spring`, or `Summer`. `year` MUST be a four-digit integer. The stored `name` MUST be `"{term} {year}"` (for example `Fall 2026`).
- **FR-006**: The server MUST set `startDate` and `endDate` from `term` and `year`. The client MUST NOT accept typed dates. `endDate` MUST be after `startDate`.
- **FR-007**: A month's **week 1** is the Monday–Sunday period that contains the 1st. The next weeks follow in seven-day steps. **Nth weekday** means the nth time that weekday occurs in the month.

  | Term | Start | End |
  | ---- | ----- | --- |
  | Fall | Last Thursday of August of `year` | 3rd Friday of December of `year` |
  | Spring | Monday of week 2 of January of `year` | 1st Thursday of May of `year` |
  | Summer | Monday of week 3 of May of `year` | Thursday of week 2 of August of `year` |
  | Winter | 4th Monday of December of `year` | 1st Thursday of January of `year + 1` |

  Worked examples: Fall 2026 is `2026-08-27` through `2026-12-18`. Spring 2026 is `2026-01-05` through `2026-05-07`. Summer 2026 is `2026-05-11` through `2026-08-06`. Winter 2026 is `2026-12-28` through `2027-01-07`.
- **FR-008**: The same student MUST NOT have two semesters with the same `term` and `year`. The duplicate response is `400` with `{ "message": "Semester already exists." }`.
- **FR-09**: An unknown `studentId`, or a `studentId` whose user is not role `student`, returns `404` with `{ "message": "Student not found." }`. An unknown `semesterId`, or a semester that does not belong to that `studentId`, returns `404` with `{ "message": "Semester not found." }`.
- **FR-010**: List responses MUST be ordered by `startDate` ascending, then `id` ascending.
- **FR-011**: `classCount` is the number of courses in the semester. This feature stores no courses, so `classCount` MUST be `0`.
- **FR-012**: Unauthenticated navigation to `/semesters` MUST redirect to `login`.
- **FR-013**: **Semesters** in `MenuBar` is visible to `student` and `faculty`. **+ New Semester**, **Edit semester**, and **Delete semester** are visible only to the owning student.

---

## Assumptions

- Feature 1 auth MUST be merged to `dev` before this feature. Tests that need a faculty user insert that row directly, as Feature 1 does.
- `studentId` is `users.id` for a user with role `student`. This feature does not add a `students` table.
- The semesters screen loads `GET /students/:studentId/semesters` for a student (their own id) and `GET /semesters` for faculty (every semester). Writes always use `/students/:studentId/semesters`.
- Winter's end date is the 1st Thursday of January of the next calendar year, so the term crosses the new year.
- A student's display name is `fName`, a space, and `lName` from `users`.
- Courses and sections are later features. Cards show a class count of `0` until courses exist.

## Edge Cases

- Empty term or year on create or edit → inline **"Required"**; no API call.
- Duplicate term and year for the same student → `400` with `{ "message": "Semester already exists." }`.
- Unknown `studentId` → `404` with `{ "message": "Student not found." }`.
- Unknown `semesterId` on PUT or DELETE → `404` with `{ "message": "Semester not found." }`.
- Student requests another student's path → `403` with `{ "message": "You can only access your own semesters." }`.
- Faculty `POST`, `PUT`, or `DELETE` → `403` with `{ "message": "Only the owning student can change this semester." }`.
- No session token → `401` with `{ "message": "Unauthorized! No token provided." }`.
- No `localStorage` session on `/semesters` → redirect to `login`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in student can create, view, edit, and delete only their own semesters.
- **SC-003**: A signed-in faculty user can view every student's semesters, with the student's name on each, and cannot create, edit, or delete one.
- **SC-004**: `npm test` passes for semester API and semesters view behavior.

---

## Data Ownership & Isolation

A semester is owned by the student who created it. Faculty may read every semester. Faculty may not write.

| Rule | Requirement |
| ---- | ----------- |
| **Student read** | `GET /students/:studentId/semesters` returns that student's semesters when `studentId` is the signed-in student. |
| **Faculty read** | `GET /semesters` returns every semester, each with the owning student's name. Faculty MAY also `GET /students/:studentId/semesters` for one student. |
| **Write scope** | `POST`, `PUT`, and `DELETE` succeed only when the signed-in user is the student named by `:studentId` and owns that semester. |
| **Create scope** | The new row's `studentId` is the `:studentId` in the path. The body cannot assign a different owner. |
| **Missing semester** | Unknown `semesterId` → `404` with `{ "message": "Semester not found." }`. A student asking for another student's id receives `403`, not an empty `200`. |
| **Implementation** | Use `authenticate` on every endpoint. |

---

## API Requirements

| Method | Endpoint | Caller | Purpose |
| ------ | -------- | ------ | ------- |
| `GET` | `/students/:studentId/semesters` | Owning student, or faculty | That student's semesters |
| `POST` | `/students/:studentId/semesters` | Owning student | Create a semester |
| `PUT` | `/students/:studentId/semesters/:semesterId` | Owning student | Update term and year |
| `DELETE` | `/students/:studentId/semesters/:semesterId` | Owning student | Delete a semester |
| `GET` | `/semesters` | Faculty | Every semester, with the owning student's name |

**Create and update request body:**

```json
{
  "term": "Fall",
  "year": 2026
}
```

**Semester success response** (`201` on create, `200` on update and on each list item):

```json
{
  "id": 1,
  "name": "Fall 2026",
  "term": "Fall",
  "year": 2026,
  "startDate": "2026-08-27",
  "endDate": "2026-12-18",
  "studentId": 4,
  "classCount": 0,
  "student": {
    "id": 4,
    "fName": "Jane",
    "lName": "Doe"
  },
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET` returns an array of those objects. `DELETE` returns `200` with `{ "message": "Semester deleted." }`.

**Error response:** `{ "message": "Human-readable explanation." }` with the HTTP status in the FRs above.

---

## Screen Requirements

### [View: Semesters] — route name `semesters` — path `/semesters` — `Semesters.vue`

- Heading: **Semesters**
- **Student** primary action: **+ New Semester** (`oc-cta`) opens the **Add Semester** `<v-dialog>`. Faculty does not see this button.
- **Add Semester** and **Edit Semester** fields:
  - **Term** (`v-select`): `Fall`, `Winter`, `Spring`, `Summer`
  - **Year** (`v-text-field`): four-digit year
  - **Start date** and **End date**: read-only text, filled from FR-008 as soon as term and year are both valid. The user cannot type or edit these dates.
- **Add Semester** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- **Edit Semester** actions: **Save Semester** (`oc-cta`) / **Cancel** (secondary). The dialog opens pre-filled with the semester's term and year.
- Cards, not a table. One card per semester the caller is allowed to see, in `startDate` order.
- A student's card shows the title (`Fall 2026`), **0 classes**, the start date, and the end date.
- A faculty card shows those same fields plus the student's display name (`fName` + `lName`).
- Selecting a card opens the **enlarged semester** view on this same screen (dialog or expanded card). It shows the same details as the card. For a student it also shows **Edit semester** and **Delete semester**.
- Icon-only actions use `size="small"` and an accessible `aria-label`. They appear only on a student's own semesters:
  - **Edit semester** — opens **Edit Semester**
  - **Delete semester** — opens **Delete Semester** with the copy **"Delete this semester?"**; actions **Delete Semester** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: empty term or year shows **"Required"** and does not send a request.
- **Empty state (student):** **"No semesters yet. Create your first semester."**
- **Empty state (faculty):** **"No semesters yet. No students have semesters yet."**
- **Loading state:** skeleton or progress indicator while semesters are fetching.
- **Error state:** `<v-alert type="error">` for API failures, including **"Semester already exists."**
- Dialogs live in `Semesters.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` from [Feature 1](feature-1-user-auth.md). Do not create a second `MenuBar`. Do not hide it on `login` / `register`.
- Add **Semesters** (roles `student` and `faculty`; navigates to `/semesters`). Keep the signed-in name and **Sign out** from Feature 1.
- After login the user remains on Feature 1 `home`. US-2.1 is choosing **Semesters** in the menu.
- **Courses** is not on `MenuBar` yet. Feature 3 adds that item so don't add that.

---

## Key Entities

- **Semester**: a term and year owned by one student (`users.id`), with a server-calculated start date and end date. A student may have many semesters. Courses and sections of courses are not stored yet but when they do the course will get added to a semester but not owned by that semester.

---

## Data Model Requirements

### `semesters` table

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | INTEGER PK | Auto-increment |
| `term` | STRING(10) | Required; `Fall`, `Winter`, `Spring`, or `Summer` |
| `year` | INTEGER | Required; four-digit year |
| `name` | STRING(30) | Required; `"{term} {year}"`; not taken from the client |
| `startDate` | DATE | Required; set from FR-008 |
| `endDate` | DATE | Required; set from FR-008; after `startDate` |
| `studentId` | INTEGER FK | Required; references `users.id`; referenced user MUST have role `student` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

Unique index on (`studentId`, `term`, `year`).
`studentId` uses `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Semester belongsTo User` as `student` (`studentId`, `onDelete: 'RESTRICT'`)
- `User hasMany Semester`

---

## Acceptance Criteria (Gherkin)

### US-2.1 — Open the semesters view

#### Scenario: Student opens semesters from the menu

- **Given** I am signed in as a user with role `student`
- **When** I click **Semesters** in the menu
- **Then** the semesters view is displayed at `/semesters`

#### Scenario: Faculty opens semesters from the menu

- **Given** I am signed in as a user with role `faculty`
- **When** I click **Semesters** in the menu
- **Then** the semesters view is displayed at `/semesters`

### US-2.2 — Create a semester

#### Scenario: Student creates a semester

- **Given** I am signed in as a student
- **And** I am viewing the semesters view
- **When** I click **+ New Semester**
- **And** I select term `Fall` and year `2026`
- **Then** the dialog shows read-only start date `2026-08-27` and end date `2026-12-18`
- **When** I click **Create**
- **Then** `POST /students/:studentId/semesters` returns `201` with `name` `"Fall 2026"`, `term` `"Fall"`, `year` `2026`, `startDate` `"2026-08-27"`, `endDate` `"2026-12-18"`, and `classCount` `0`
- **And** a card titled **Fall 2026** appears on the semesters view
- **And** the add-semester dialog closes

#### Scenario: Student creates a semester with a missing required field

- **Given** I am signed in as a student
- **And** I am viewing the semesters view
- **When** I click **+ New Semester**
- **And** I leave term or year empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see **"Required"**

#### Scenario: Student creates a semester that already exists

- **Given** I am signed in as a student
- **And** I already have a Fall 2026 semester
- **When** I send `POST /students/:studentId/semesters` with `{ "term": "Fall", "year": 2026 }`
- **Then** the API returns `400` with `{ "message": "Semester already exists." }`
- **And** no second semester is stored

#### Scenario: Student creates a semester for an unknown student

- **Given** I am signed in as a student
- **When** I send `POST /students/999999/semesters` with `{ "term": "Fall", "year": 2026 }` for an id that is not a student
- **Then** the API returns `404` with `{ "message": "Student not found." }`
- **And** no semester is stored

#### Scenario: Student creates a semester for another student

- **Given** I am signed in as a student
- **When** I send `POST /students/:studentId/semesters` with `{ "term": "Fall", "year": 2026 }` using another student's `studentId`
- **Then** the API returns `403` with `{ "message": "You can only access your own semesters." }`
- **And** no semester is stored

#### Scenario: Winter semester ends in January of the next year

- **Given** I am signed in as a student
- **When** I send `POST /students/:studentId/semesters` with `{ "term": "Winter", "year": 2026 }`
- **Then** the API returns `201` with `name` `"Winter 2026"`, `startDate` `"2026-12-28"`, and `endDate` `"2027-01-07"`

### US-2.3 — View semesters as cards

#### Scenario: Student sees their semesters as cards

- **Given** I am signed in as a student
- **And** I own Fall 2026 and Spring 2026
- **When** I view the semesters view
- **Then** I see a card for **Spring 2026** and a card for **Fall 2026**
- **And** Spring 2026 appears before Fall 2026

#### Scenario: Student has no semesters

- **Given** I am signed in as a student
- **And** I own no semesters
- **When** I view the semesters view
- **Then** I see **"No semesters yet. Create your first semester."**

### US-2.4 — See semester card details

#### Scenario: Semester card shows title, class count, and dates

- **Given** I am signed in as a student
- **And** I own Fall 2026
- **When** I view that semester card
- **Then** the card shows **Fall 2026**
- **And** the card shows **0 classes**
- **And** the card shows start date `2026-08-27` and end date `2026-12-18`

### US-2.5 — Enlarge a semester card

#### Scenario: Student enlarges a semester card

- **Given** I am signed in as a student
- **And** I am viewing a card for Fall 2026
- **When** I select that card
- **Then** the enlarged semester view shows **Fall 2026**, **0 classes**, start date `2026-08-27`, and end date `2026-12-18`

### US-2.6 — Manage a semester from the card

#### Scenario: Semester card shows edit and delete

- **Given** I am signed in as a student
- **And** I am viewing one of my semester cards
- **When** I look at that card
- **Then** the card shows an **Edit semester** icon action
- **And** the card shows a **Delete semester** icon action

### US-2.7 — Manage a semester from the enlarged view

#### Scenario: Enlarged semester view shows edit and delete

- **Given** I am signed in as a student
- **And** the enlarged view for one of my semesters is open
- **When** I look at the enlarged view
- **Then** it shows an **Edit semester** icon action
- **And** it shows a **Delete semester** icon action

### US-2.8 — Edit a semester

#### Scenario: Student selects to edit a semester from the card

- **Given** I am signed in as a student
- **And** I am viewing the semesters view
- **When** I click **Edit semester** on a card
- **Then** the edit dialog is displayed with that semester's term and year

#### Scenario: Student selects to edit a semester from the enlarged view

- **Given** I am signed in as a student
- **And** the enlarged view for one of my semesters is open
- **When** I click **Edit semester**
- **Then** the edit dialog is displayed with that semester's term and year

#### Scenario: Student saves a valid semester edit

- **Given** I am signed in as a student
- **And** the edit dialog is open on Fall 2026
- **When** I change the term to `Spring` and the year to `2025`
- **And** I click **Save Semester**
- **Then** `PUT /students/:studentId/semesters/:semesterId` returns `200` with `name` `"Spring 2025"`, `startDate` `"2025-01-06"`, and `endDate` `"2025-05-01"`
- **And** the card shows **Spring 2025**
- **And** the dialog closes

#### Scenario: Student saves an edit with a missing required field

- **Given** I am signed in as a student
- **And** the edit dialog is open
- **When** I clear the year
- **And** I click **Save Semester**
- **Then** no API call is made
- **And** I see **"Required"**
- **And** the dialog stays open

#### Scenario: Student cancels editing a semester

- **Given** I am signed in as a student
- **And** the edit dialog is open on Fall 2026
- **When** I change the term to `Spring`
- **And** I click **Cancel**
- **Then** the semester remains Fall 2026
- **And** the dialog closes

### US-2.9 — Delete a semester

#### Scenario: Student selects to delete a semester from the card

- **Given** I am signed in as a student
- **And** I am viewing the semesters view
- **When** I click **Delete semester** on a card
- **Then** the delete dialog shows **"Delete this semester?"**

#### Scenario: Student selects to delete a semester from the enlarged view

- **Given** I am signed in as a student
- **And** the enlarged view for one of my semesters is open
- **When** I click **Delete semester**
- **Then** the delete dialog shows **"Delete this semester?"**

#### Scenario: Student deletes a semester

- **Given** I am signed in as a student
- **And** the delete dialog is open for Fall 2026
- **When** I click **Delete Semester**
- **Then** `DELETE /students/:studentId/semesters/:semesterId` returns `200` with `{ "message": "Semester deleted." }`
- **And** the dialog closes
- **And** Fall 2026 is no longer on the semesters view

#### Scenario: Student cancels deleting a semester

- **Given** I am signed in as a student
- **And** the delete dialog is open for Fall 2026
- **When** I click **Cancel**
- **Then** Fall 2026 is still on the semesters view
- **And** the dialog closes

### US-2.10 — Show each role only the semesters they may see

#### Scenario: Student does not see another student's semesters

- **Given** I am signed in as a student
- **And** another student owns Spring 2025
- **And** I do not own Spring 2025
- **When** I view the semesters view
- **Then** Spring 2025 is not shown

#### Scenario: Faculty sees every student's semesters with the student name

- **Given** I am signed in as a faculty user
- **And** Jane Doe owns Fall 2026
- **And** another student owns Spring 2025
- **When** I view the semesters view
- **Then** I see a card for **Fall 2026** labeled **Jane Doe**
- **And** I see a card for **Spring 2025** with that student's name
- **And** I do not see **+ New Semester**, **Edit semester**, or **Delete semester**

#### Scenario: Faculty has no semesters to review

- **Given** I am signed in as a faculty user
- **And** no semesters are stored
- **When** I view the semesters view
- **Then** I see **"No semesters yet."**

#### Scenario: Student lists only their own semesters

- **Given** I am signed in as a student who owns Fall 2026
- **And** another student owns Spring 2025
- **When** I request `GET /students/:studentId/semesters` with my own `studentId`
- **Then** the API returns `200` with only Fall 2026

#### Scenario: Student cannot list another student's semesters

- **Given** I am signed in as a student
- **When** I request `GET /students/:studentId/semesters` with another student's `studentId`
- **Then** the API returns `403` with `{ "message": "You can only access your own semesters." }`

#### Scenario: Faculty lists every semester

- **Given** I am signed in as a faculty user
- **And** two students each own a semester
- **When** I request `GET /semesters`
- **Then** the API returns `200` with both semesters
- **And** each semester includes `student.fName` and `student.lName`

#### Scenario: Faculty cannot create a semester

- **Given** I am signed in as a faculty user
- **When** I send `POST /students/:studentId/semesters` with `{ "term": "Fall", "year": 2026 }`
- **Then** the API returns `403` with `{ "message": "Only the owning student can change this semester." }`
- **And** no semester is stored

#### Scenario: Faculty cannot edit a semester

- **Given** I am signed in as a faculty user
- **And** a student owns Fall 2026
- **When** I send `PUT /students/:studentId/semesters/:semesterId` with `{ "term": "Spring", "year": 2026 }`
- **Then** the API returns `403` with `{ "message": "Only the owning student can change this semester." }`
- **And** Fall 2026 is unchanged

#### Scenario: Faculty cannot delete a semester

- **Given** I am signed in as a faculty user
- **And** a student owns Fall 2026
- **When** I send `DELETE /students/:studentId/semesters/:semesterId` for that semester
- **Then** the API returns `403` with `{ "message": "Only the owning student can change this semester." }`
- **And** Fall 2026 is still stored

#### Scenario: Unauthenticated API request to semesters

- **Given** I have no valid session token
- **When** I request `GET /students/:studentId/semesters`
- **Then** the API returns `401` with `{ "message": "Unauthorized! No token provided." }`

#### Scenario: Unauthenticated user navigates to semesters

- **Given** I have no session in `localStorage`
- **When** I navigate to `/semesters`
- **Then** I am redirected to the login page

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
| ----- | -------- | --------- | --------- |
| US-2.1 | Student opens semesters from the menu | `frontend/tests/MenuBar.test.js`, `frontend/tests/Semesters.test.js` | `Student opens semesters from the menu` |
| US-2.1 | Faculty opens semesters from the menu | `frontend/tests/MenuBar.test.js`, `frontend/tests/Semesters.test.js` | `Faculty opens semesters from the menu` |
| US-2.2 | Student creates a semester | `backend/tests/semesters.test.js`, `frontend/tests/Semesters.test.js` | `Student creates a semester` |
| US-2.2 | Student creates a semester with a missing required field | `frontend/tests/Semesters.test.js` | `Student creates a semester with a missing required field` |
| US-2.2 | Student creates a semester that already exists | `backend/tests/semesters.test.js` | `Student creates a semester that already exists` |
| US-2.2 | Student creates a semester for an unknown student | `backend/tests/semesters.test.js` | `Student creates a semester for an unknown student` |
| US-2.2 | Student creates a semester for another student | `backend/tests/semesters.test.js` | `Student creates a semester for another student` |
| US-2.2 | Winter semester ends in January of the next year | `backend/tests/semesters.test.js` | `Winter semester ends in January of the next year` |
| US-2.3 | Student sees their semesters as cards | `backend/tests/semesters.test.js`, `frontend/tests/Semesters.test.js` | `Student sees their semesters as cards` |
| US-2.3 | Student has no semesters | `frontend/tests/Semesters.test.js` | `Student has no semesters` |
| US-2.4 | Semester card shows title, class count, and dates | `frontend/tests/Semesters.test.js` | `Semester card shows title, class count, and dates` |
| US-2.5 | Student enlarges a semester card | `frontend/tests/Semesters.test.js` | `Student enlarges a semester card` |
| US-2.6 | Semester card shows edit and delete | `frontend/tests/Semesters.test.js` | `Semester card shows edit and delete` |
| US-2.7 | Enlarged semester view shows edit and delete | `frontend/tests/Semesters.test.js` | `Enlarged semester view shows edit and delete` |
| US-2.8 | Student selects to edit a semester from the card | `frontend/tests/Semesters.test.js` | `Student selects to edit a semester from the card` |
| US-2.8 | Student selects to edit a semester from the enlarged view | `frontend/tests/Semesters.test.js` | `Student selects to edit a semester from the enlarged view` |
| US-2.8 | Student saves a valid semester edit | `backend/tests/semesters.test.js`, `frontend/tests/Semesters.test.js` | `Student saves a valid semester edit` |
| US-2.8 | Student saves an edit with a missing required field | `frontend/tests/Semesters.test.js` | `Student saves an edit with a missing required field` |
| US-2.8 | Student cancels editing a semester | `frontend/tests/Semesters.test.js` | `Student cancels editing a semester` |
| US-2.9 | Student selects to delete a semester from the card | `frontend/tests/Semesters.test.js` | `Student selects to delete a semester from the card` |
| US-2.9 | Student selects to delete a semester from the enlarged view | `frontend/tests/Semesters.test.js` | `Student selects to delete a semester from the enlarged view` |
| US-2.9 | Student deletes a semester | `backend/tests/semesters.test.js`, `frontend/tests/Semesters.test.js` | `Student deletes a semester` |
| US-2.9 | Student cancels deleting a semester | `frontend/tests/Semesters.test.js` | `Student cancels deleting a semester` |
| US-2.10 | Student does not see another student's semesters | `frontend/tests/Semesters.test.js` | `Student does not see another student's semesters` |
| US-2.10 | Faculty sees every student's semesters with the student name | `frontend/tests/Semesters.test.js` | `Faculty sees every student's semesters with the student name` |
| US-2.10 | Faculty has no semesters to review | `frontend/tests/Semesters.test.js` | `Faculty has no semesters to review` |
| US-2.10 | Student lists only their own semesters | `backend/tests/semesters.test.js` | `Student lists only their own semesters` |
| US-2.10 | Student cannot list another student's semesters | `backend/tests/semesters.test.js` | `Student cannot list another student's semesters` |
| US-2.10 | Faculty lists every semester | `backend/tests/semesters.test.js` | `Faculty lists every semester` |
| US-2.10 | Faculty cannot create a semester | `backend/tests/semesters.test.js` | `Faculty cannot create a semester` |
| US-2.10 | Faculty cannot edit a semester | `backend/tests/semesters.test.js` | `Faculty cannot edit a semester` |
| US-2.10 | Faculty cannot delete a semester | `backend/tests/semesters.test.js` | `Faculty cannot delete a semester` |
| US-2.10 | Unauthenticated API request to semesters | `backend/tests/semesters.test.js` | `Unauthenticated API request to semesters` |
| US-2.10 | Unauthenticated user navigates to semesters | `frontend/tests/router.test.js` | `Unauthenticated user navigates to semesters` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 2 from @features/feature-2-semester-management.md on branch `feature/2-semester-management`.

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

- Courses that are in a semester ([Feature 3](feature-3-course-management.md))
- Sections inside a course ([Feature 5](feature-5-section-management.md))
- Enrolling a student in a section ([Feature 6](feature-6-enrollment-management.md))
- **Courses** menu item and courses view ([Feature 3](feature-3-course-management.md))
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Semesters**)
- An `admin` role
- Deleting a user who still has semesters (the `studentId` foreign key is `ON DELETE RESTRICT` so a later feature cannot cascade them away)

---

## Delivered to Feature 3

- `MenuBar` is Feature 1 chrome. Feature 2 added **Semesters** for `student` and `faculty`.
- A semester is owned by one student and is addressed at `/students/:studentId/semesters`.
- Feature 3 adds **Courses** to this `MenuBar` and adds courses inside a semester. It MUST NOT create a second `MenuBar`. `classCount` on a semester becomes the number of those courses.
- [Feature 4](feature-4-faculty-management.md) adds faculty.
- [Feature 5](feature-5-section-management.md) adds sections inside a course.
- [Feature 6](feature-6-enrollment-management.md) enrolls a student in a section for a semester.
