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

## Assumptions

- Feature 1 auth/`MenuBar` MUST be merged to `dev` before implementing this feature.
- A user with role `faculty` exists (Feature 1 `role`; tests may seed a faculty user by inserting the row — registration always stores `student`).
- Faculty members are a shared catalog. **Feature 2** and **Feature 3** are not schema dependencies. If they are already on `dev`, keep **Semesters** and **Course** on `MenuBar`. This feature MUST NOT create a second `MenuBar`. No FK from `faculties` to `semesters` or courses in this feature.
- A faculty member **may** have one Feature 1 user (`userId`) whose role is `faculty`. A faculty member with no user is valid (catalog-only instructor). Linking is optional on create and edit. This feature does **not** register login accounts and does **not** change Feature 1 registration.
- Faculty catalog names (`firstName` / `lastName`) are independent of the linked user's `fName` / `lName`. Duplicate names in the catalog are allowed. Uniqueness is on optional `userId`, not on name.
- `dept` is free text (not a closed department list). Course department values, if Feature 3 adds them, are a separate field.
- Faculty use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this app is `/courses/…`. Use `/courses/faculty`.
- Feature 1 university IDs for faculty logins are `FA####`. That identifier lives on `users.universityId`, not on the faculty catalog row.

---

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- `firstName` longer than 50 characters → **"First name must be 50 characters or fewer."**
- `lastName` longer than 50 characters → **"Last name must be 50 characters or fewer."**
- `dept` longer than 50 characters → **"Department must be 50 characters or fewer."**
- `userId` omitted → faculty member is stored with no linked user.
- Unknown `userId` → `400` with `{ "message": "User not found." }`
- `userId` whose role is `student` (or any non-`faculty` role) → `400` with `{ "message": "User must have role faculty." }`
- `userId` already linked to another faculty member → `400` with `{ "message": "User is already linked to a faculty member." }`
- Unknown `facultyId` on PUT/DELETE → `404` with `{ "message": "Faculty with id=<id> not found." }`
- Delete faculty member that has a linked user → faculty row is deleted; the Feature 1 user remains.
- Authenticated `student` on `POST` / `PUT` / `DELETE` or `GET /courses/users` → `403`.
- Authenticated `student` on `GET /courses/faculty` → `200` with the shared catalog.
- Unauthenticated user on `/faculty` or `GET /courses/faculty` → redirect or `401`.

---

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in faculty user can create, view, edit, and delete the shared faculty catalog on one screen.
- **SC-003**: A signed-in student MAY `GET` the faculty catalog; they cannot open the faculty manager and cannot mutate faculty via the API.
- **SC-004**: A faculty member MAY be created with or without a linked Feature 1 faculty user; a user can be linked to at most one faculty member.
- **SC-005**: `npm test` passes for faculty API and faculty view behavior.

---

## Data Ownership & Isolation

Faculty members are a **shared catalog**. They are not owned by the signed-in faculty user. Only role `faculty` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI. Optional `userId` links a faculty member to a login account; it is not used as an ownership filter.

| Rule               | Requirement                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Read scope**     | `GET /courses/faculty` returns **all** faculty members to any authenticated user.                                                    |
| **Write scope**    | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `faculty`.                                                      |
| **Create scope**   | New faculty members have no owner. Optional `userId` links to `users.id` when provided.                                              |
| **Missing faculty**| Unknown `facultyId` → `404` with `{ "message": "Faculty with id=<id> not found." }`. Never use ownership `404` to hide rows.         |
| **Non-faculty**    | Authenticated non-faculty `GET /courses/faculty` → `200`. Mutations and `GET /courses/users` → `403` with `{ "message": "Faculty role required." }`. |
| **UI scope**       | **Faculty** menu and `/faculty` are faculty-only. Students do not see this manager.                                                  |
| **Implementation** | Use `authenticate` on all endpoints. Use `requireFaculty` after `authenticate` on `POST`, `PUT`, `DELETE`, and `GET /courses/users`. |

---

## API Requirements

| Method   | Endpoint                      | Auth         | Purpose                                              |
| -------- | ----------------------------- | ------------ | ---------------------------------------------------- |
| `GET`    | `/courses/faculty`            | Yes          | Fetch all faculty members in the shared catalog      |
| `POST`   | `/courses/faculty`            | Yes, faculty | Create a faculty member in the shared catalog        |
| `PUT`    | `/courses/faculty/:facultyId` | Yes, faculty | Update a faculty member                              |
| `DELETE` | `/courses/faculty/:facultyId` | Yes, faculty | Delete a faculty member                              |
| `GET`    | `/courses/users`              | Yes, faculty | List faculty-role users for the optional faculty–user link |

**Create faculty request body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "dept": "Computer Science",
  "userId": 2
}
```

`userId` MAY be omitted or `null` when the faculty member has no login account. Do not send `id` on create.

**Update faculty request body:** same fields as create (no `id`). Sending `userId` `null` unlinks the user.

**Faculty success response** (`200` / `201`):

```json
{
  "id": 1,
  "firstName": "Jane",
  "lastName": "Doe",
  "dept": "Computer Science",
  "userId": 2,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

When the faculty member has no linked user, `userId` is `null`.

`GET /courses/faculty` returns an **array** of faculty objects in the success shape above, ordered by `lastName` then `firstName`.

`DELETE` returns `200` with `{ "message": "Faculty deleted." }`.

**User list success response** (`200` on `GET /courses/users`): an array of `{ "id", "universityId", "fName", "lName" }` for users whose `role` is `faculty`. Do **not** include `password`.

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.
**Not found:** `404` (do not use `403` for missing faculty id).

---

## Screen Requirements

### [View: Faculty] — route name `faculty` — path `/faculty` — `Faculty.vue`

- Heading: **Faculty**
- Primary action: **+ New faculty** (`oc-cta`) opens the **Add Faculty** `<v-dialog>`.
- **Add Faculty** fields (same set on **Edit Faculty**, edit pre-filled):
    - **First Name** (`v-text-field`)
    - **Last Name** (`v-text-field`)
    - **Department** (`v-text-field`)
    - **User** (`v-select` of existing Feature 1 users with role `faculty` from `GET /courses/users`, display `universityId`; **optional** — may be left empty)
- **Add Faculty** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **last name**, **first name**, **department**, and **user** (`universityId` when linked, empty when not); rows ordered by last name then first name (FR-006).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
    - **Edit faculty** — opens **Edit Faculty** `<v-dialog>` pre-filled with current data; **Save Faculty** (`oc-cta`) / **Cancel** (secondary)
    - **Delete faculty** — opens **Delete Faculty** confirmation `<v-dialog>` with copy **"Delete this faculty member?"**; **Delete Faculty** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request. **User** is not required.
- **Empty state:** **"No faculty yet. Create your first faculty member."** when the catalog has zero faculty members.
- **Loading state:** skeleton or progress indicator while faculty are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Faculty-only: **Faculty** menu item and `/faculty` are for signed-in faculty users. Other roles do not see the **Faculty** item. Unauthenticated navigation to `/faculty` redirects to `login`.
- Faculty CRUD dialogs live in `Faculty.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Faculty** (allowed role `faculty`; navigates to `/faculty`) to `MenuBar`. Keep the signed-in name and **Sign out** from Feature 1. Keep **Semesters** (Feature 2) and **Course** (Feature 3) if those features are already on `dev`.
- Students MUST NOT see **Faculty**.
- After login, the user remains on Feature 1 `home`. Selecting **Faculty** in the menu opens this feature's view.

---

## Key Entities

- **Faculty member**: shared catalog row (first name, last name, department). Not owned by a faculty user. May optionally link to one Feature 1 **User** whose role is `faculty`. Faculty users manage the catalog in this feature.
- **User**: Feature 1 login account. Unchanged except that this feature may reference `users.id` from `faculties.userId`, and `GET /courses/users` is restricted to faculty callers listing faculty-role users.

---

## Data Model Requirements

### `faculties` table

| Field       | Type        | Rules                                              |
| ----------- | ----------- | -------------------------------------------------- |
| `id`        | INTEGER PK  | Auto-increment                                     |
| `firstName` | STRING(50)  | Required; trimmed; at most 50 characters           |
| `lastName`  | STRING(50)  | Required; trimmed; at most 50 characters           |
| `dept`      | STRING(50)  | Required; trimmed; at most 50 characters           |
| `userId`    | INTEGER FK  | Optional; unique when present; references `users.id` |
| `createdAt` | DATE        | Sequelize timestamps                               |
| `updatedAt` | DATE        | Sequelize timestamps                               

### Associations (in `models/index.js`)

- `Faculty belongsTo User` (`userId`, optional, `onDelete: 'SET NULL'`)
- `User hasOne Faculty`

---

## Acceptance Criteria (Gherkin)

### US-4.1 — Select to work with Faculty

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `faculty`
- **When** I click **Faculty** in the `MenuBar`
- **Then** the faculty view is displayed

---

### US-4.2 — Create faculty member

#### Scenario: User creates a new faculty member without a linked user

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I click **+ New faculty**
- **And** I enter first name `Jane`, last name `Doe`, and department `Computer Science`
- **And** I leave **User** empty
- **And** I click **Create**
- **Then** the API returns `201` with a faculty object containing `id`, `firstName` `Jane`, `lastName` `Doe`, `dept` `Computer Science`, and `userId` `null`
- **And** `Doe` appears in the faculty view list
- **And** the add-faculty dialog closes

#### Scenario: User creates a new faculty member with a linked user

- **Given** I am signed in as a user with role `faculty`
- **And** a Feature 1 user with universityId `fa1111` and role `faculty` exists
- **And** I am viewing the faculty view
- **When** I click **+ New faculty**
- **And** I enter first name `Jane`, last name `Doe`, and department `Computer Science`
- **And** I select user `fa1111`
- **And** I click **Create**
- **Then** the API returns `201` with a faculty object whose `userId` is that user's id
- **And** `fa1111` appears in the user column for `Doe`
- **And** the add-faculty dialog closes

#### Scenario: User creates a faculty member with a missing required field

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I click **+ New faculty**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates a faculty member with a first name that is too long

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I click **+ New faculty**
- **And** I enter a first name longer than 50 characters with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"First name must be 50 characters or fewer."**

#### Scenario: User creates a faculty member with a last name that is too long

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I click **+ New faculty**
- **And** I enter a last name longer than 50 characters with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Last name must be 50 characters or fewer."**

#### Scenario: User creates a faculty member with a department that is too long

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I click **+ New faculty**
- **And** I enter a department longer than 50 characters with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Department must be 50 characters or fewer."**

#### Scenario: User creates a faculty member with a user that is already linked

- **Given** I am signed in as a user with role `faculty`
- **And** a Feature 1 user with universityId `fa1111` is already linked to a faculty member
- **And** I am viewing the faculty view
- **When** I click **+ New faculty**
- **And** I enter otherwise valid faculty data
- **And** I select user `fa1111`
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "User is already linked to a faculty member." }`
- **And** no second faculty member is linked to `fa1111`

#### Scenario: User creates a faculty member with an unknown user

- **Given** I am signed in as a user with role `faculty`
- **When** I send `POST /courses/faculty` with otherwise valid data and `userId` `999999`
- **Then** the API returns `400` with `{ "message": "User not found." }`
- **And** no faculty member is stored

#### Scenario: User creates a faculty member linked to a student user

- **Given** I am signed in as a user with role `faculty`
- **And** a Feature 1 user with role `student` exists
- **When** I send `POST /courses/faculty` with otherwise valid data and that student's `userId`
- **Then** the API returns `400` with `{ "message": "User must have role faculty." }`
- **And** no faculty member is stored

---

### US-4.3 — View faculty

#### Scenario: Faculty view loads with existing faculty

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **And** faculty members exist
- **When** I view the faculty list
- **Then** all the faculty members are displayed in the list

#### Scenario: User has no faculty

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **And** there are no faculty members
- **When** I view the faculty list
- **Then** I see **"No faculty yet. Create your first faculty member."**

---

### US-4.4 — Manage faculty rows

#### Scenario: faculty rows show edit and delete actions

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I view a faculty row
- **Then** the faculty row shows an **Edit faculty** icon action
- **And** the faculty row shows a **Delete faculty** icon action

---

### US-4.5 — Edit a faculty member

#### Scenario: User selects to edit a faculty member

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I click the edit icon on a faculty row
- **Then** the faculty edit dialog is displayed

#### Scenario: User edits a faculty member with valid values and saves

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **And** the faculty edit dialog is displayed
- **When** I update values in the fields with valid values
- **And** I click **Save Faculty**
- **Then** the faculty data is updated
- **And** the dialog is closed

#### Scenario: User edits a faculty member with invalid values and saves

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **And** the faculty edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Faculty**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed

#### Scenario: User edits a faculty member and cancels

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **And** the faculty edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the faculty data is not updated
- **And** the dialog is closed

---

### US-4.6 — Delete a faculty member

#### Scenario: User selects to delete a faculty member

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **When** I click the delete icon on a faculty row
- **Then** the faculty delete dialog is displayed

#### Scenario: User deletes a faculty member

- **Given** I am signed in as a user with role `faculty`
- **And** I am viewing the faculty view
- **And** the faculty delete dialog is displayed
- **When** I click **Delete Faculty**
- **Then** the faculty member is deleted
- **And** the dialog is closed
- **And** the faculty delete dialog is displayed
- **When** I click **Cancel**
- **Then** the faculty member is not deleted
- **And** the dialog is closed
- **And** the faculty member is still in the faculty list

---

### US-4.7 — Restrict faculty management to faculty users

#### Scenario: Student does not see Faculty in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Faculty** is not shown

#### Scenario: Student can list faculty via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /courses/faculty`
- **Then** the API returns `200` with an array of faculty objects

#### Scenario: Student cannot create a faculty member via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /courses/faculty` with a valid faculty body
- **Then** the API returns `403` with `{ "message": "Faculty role required." }`
- **And** no new faculty member is stored

#### Scenario: Student cannot list users via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /courses/users`
- **Then** the API returns `403` with `{ "message": "Faculty role required." }`

#### Scenario: Unauthenticated API request to faculty

- **Given** I have no valid session token
- **When** I request `GET /courses/faculty`
- **Then** the API returns `401` with `{ "message": "Unauthorized! No token provided." }`

#### Scenario: Unauthenticated user navigates to faculty

- **Given** I have no session in `localStorage`
- **When** I navigate to `/faculty`
- **Then** I am redirected to the login page

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story  | Scenario                                                        | Test file                                                         | Test name                                                        |
| ------ | --------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| US-4.1 | Menu Selection                                                  | `frontend/tests/MenuBar.test.js`, `frontend/tests/Faculty.test.js` | `Menu Selection`                                                 |
| US-4.2 | User creates a new faculty member without a linked user         | `backend/tests/faculty.test.js`, `frontend/tests/Faculty.test.js` | `User creates a new faculty member without a linked user`        |
| US-4.2 | User creates a new faculty member with a linked user            | `backend/tests/faculty.test.js`, `frontend/tests/Faculty.test.js` | `User creates a new faculty member with a linked user`           |
| US-4.2 | User creates a faculty member with a missing required field     | `frontend/tests/Faculty.test.js`                                  | `User creates a faculty member with a missing required field`    |
| US-4.2 | User creates a faculty member with a first name that is too long | `frontend/tests/Faculty.test.js`                                 | `User creates a faculty member with a first name that is too long` |
| US-4.2 | User creates a faculty member with a last name that is too long | `frontend/tests/Faculty.test.js`                                  | `User creates a faculty member with a last name that is too long` |
| US-4.2 | User creates a faculty member with a department that is too long | `frontend/tests/Faculty.test.js`                                 | `User creates a faculty member with a department that is too long` |
| US-4.2 | User creates a faculty member with a user that is already linked | `backend/tests/faculty.test.js`, `frontend/tests/Faculty.test.js` | `User creates a faculty member with a user that is already linked` |
| US-4.2 | User creates a faculty member with an unknown user              | `backend/tests/faculty.test.js`                                   | `User creates a faculty member with an unknown user`             |
| US-4.2 | User creates a faculty member linked to a student user          | `backend/tests/faculty.test.js`                                   | `User creates a faculty member linked to a student user`         |
| US-4.3 | Faculty view loads with existing faculty                        | `backend/tests/faculty.test.js`, `frontend/tests/Faculty.test.js` | `Faculty view loads with existing faculty`                       |
| US-4.3 | User has no faculty                                             | `frontend/tests/Faculty.test.js`                                  | `User has no faculty`                                            |
| US-4.4 | faculty rows show edit and delete actions                       | `frontend/tests/Faculty.test.js`                                  | `faculty rows show edit and delete actions`                      |
| US-4.5 | User selects to edit a faculty member                           | `frontend/tests/Faculty.test.js`                                  | `User selects to edit a faculty member`                          |
| US-4.5 | User edits a faculty member with valid values and saves         | `backend/tests/faculty.test.js`, `frontend/tests/Faculty.test.js` | `User edits a faculty member with valid values and saves`        |
| US-4.5 | User edits a faculty member with invalid values and saves       | `frontend/tests/Faculty.test.js`                                  | `User edits a faculty member with invalid values and saves`      |
| US-4.5 | User edits a faculty member and cancels                         | `frontend/tests/Faculty.test.js`                                  | `User edits a faculty member and cancels`                        |
| US-4.6 | User selects to delete a faculty member                         | `frontend/tests/Faculty.test.js`                                  | `User selects to delete a faculty member`                        |
| US-4.6 | User deletes a faculty member                                   | `backend/tests/faculty.test.js`, `frontend/tests/Faculty.test.js` | `User deletes a faculty member`                                  |
| US-4.6 | User deletes a faculty member who has a linked user             | `backend/tests/faculty.test.js`                                   | `User deletes a faculty member who has a linked user`            |
| US-4.6 | User cancels deleting a faculty member                          | `frontend/tests/Faculty.test.js`                                  | `User cancels deleting a faculty member`                         |
| US-4.7 | Student does not see Faculty in the menu                        | `frontend/tests/MenuBar.test.js`                                  | `Student does not see Faculty in the menu`                       |
| US-4.7 | Student can list faculty via the API                            | `backend/tests/faculty.test.js`                                   | `Student can list faculty via the API`                           |
| US-4.7 | Student cannot create a faculty member via the API              | `backend/tests/faculty.test.js`                                   | `Student cannot create a faculty member via the API`             |
| US-4.7 | Student cannot list users via the API                           | `backend/tests/faculty.test.js`                                   | `Student cannot list users via the API`                          |
| US-4.7 | Unauthenticated API request to faculty                          | `backend/tests/faculty.test.js`                                   | `Unauthenticated API request to faculty`                         |
| US-4.7 | Unauthenticated user navigates to faculty                       | `frontend/tests/router.test.js`                                   | `Unauthenticated user navigates to faculty`                      |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-faculty-management.md on branch `feature/4-faculty-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Commit one layer at a time (constitution Principle 4) so this branch can be pushed incrementally.
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

**Suggested commit order (do not implement until asked):**

1. `faculties` model + `User` association
2. `requireFaculty` + faculty routes/controller + `GET /courses/users` faculty guard
3. Backend tests (`backend/tests/faculty.test.js`)
4. Frontend service + `Faculty.vue` + `MenuBar` item + `/faculty` route
5. Frontend tests (`Faculty.test.js`, `MenuBar.test.js`, `router.test.js`)
6. Living reference (`api.md`, `data-model.md`, `behavior.md`)

---
