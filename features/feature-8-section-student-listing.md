# Feature: Section Student Listing
**Feature ID:** 8
**Branch pattern:** `feature/8-section-students`
**Status:** Ready
**Created:** 2026-09-22
**Input:** Signed-in admin users open a section from the Sections List. The Section Student View has a heading with Section Info, a list of that section's enrolled students, and an **Enroll Student** button that opens the enroll-student dialog with this section already selected.
**Depends on:** [Feature 1 — User Auth and Session Management](feature-1-user-auth-and-session-management.md), [Feature 5 — Section Management](feature-5-section-management.md), [Feature 6 — Enrollment Management](feature-6-enrollment-management.md)

---

## User Stories

### US-8.1: Open a section from the list
**As a** signed-in admin user
**I want** each section row to show a **view students** icon
**So that** I can open one section from the Sections List

**Priority:** P1  
**Independent test:** From the Sections List, click **View students**; the Section Student View appears  
**Acceptance scenarios:** see ### US-8.1 under Acceptance Criteria

### US-8.2: View Section Info and students
**As a** signed-in admin user
**I want** a Section Student View with a heading for Section Info and a list of that section's enrolled students
**So that** I can see the roster for one section

**Priority:** P1  
**Independent test:** Open a section that has enrolled students; heading shows Section Info and the students list shows those students  
**Acceptance scenarios:** see ### US-8.2 under Acceptance Criteria

### US-8.3: Enroll a student defaulted to this section
**As a** signed-in admin user
**I want** an **Enroll Student** button on the Section Student View that starts a new enrollment for this section
**So that** I do not have to pick the section again

**Priority:** P1  
**Independent test:** On the Section Student View, click **Enroll Student**; the enroll-student dialog opens with this section selected  
**Acceptance scenarios:** see ### US-8.3 under Acceptance Criteria

### US-8.4: Restrict the Section Student View to admins
**As the** application
**I want** `/sections/:sectionId/students` to follow the same admin-only UI rules as the Sections List
**So that** users with role `student` cannot open the section student manager

**Priority:** P1  
**Independent test:** Unauthenticated navigation to `/sections/1/students` redirects to `login`; users with role `student` do not see **Sections**  
**Acceptance scenarios:** see ### US-8.4 under Acceptance Criteria

### US-8.5: Edit an enrollment from the Section Student View
**As a** signed-in admin user
**I want** an edit icon on each student in the section student list
**So that** I can open the Feature 6 **Edit Enrollment** dialog without leaving the Section Student View

**Priority:** P1  
**Independent test:** On the Section Student View, click **Edit Enrollment**; the edit dialog opens with that enrollment's values  
**Acceptance scenarios:** see ### US-8.5 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: This feature adds a **Section Student View** in `SectionStudents.vue` at route name `section`, path `/sections/:sectionId/students`. The Sections List remains `SectionList.vue` at `/sections`.
- **FR-002**: The Sections List keeps Feature 5 create / edit / delete dialogs. Each section row adds a **View students** icon action that navigates to `/sections/:sectionId/students`. Section number stays plain text (not a link).
- **FR-003**: The Section Student View has a **heading area** with Section Info: section **number**, **course** (code and title), **semester**, **faculty** name, and **schedule** (`daysOfWeek` plus `startTime`–`endTime`).
- **FR-004**: The Section Student View lists **only enrolled students whose `sectionId` matches this section**. Columns: **name** (last name, first name), **university ID**, **email**, and **actions**. Rows stay ordered by last name, then first name. Each student row shows an **Edit Enrollment** icon (`mdi-pencil`, `aria-label="Edit Enrollment"`) that opens the Feature 6 **Edit Enrollment** dialog pre-filled with that enrollment.
- **FR-005**: The Section Student View shows **Enroll Student** (`oc-cta`). That button opens the Feature 6 **Enroll Student** dialog with `sectionId` already set to this section.
- **FR-006**: Creating an enrollment from the Section Student View MUST use `POST /academic/sections/:sectionId/students` and Feature 6 field rules (required fields, student not already enrolled in this section). After a successful create, the dialog closes and the new student appears in this section's student list.
- **FR-007**: Empty students list copy is **"No students enrolled yet. Enroll your first student."** Unknown `sectionId` shows **"Section with id=<id> not found."**
- **FR-008**: Unauthenticated navigation to `/sections/:sectionId/students` MUST redirect to `login`. Users with role `student` MUST NOT see **Sections** in `MenuBar` (Feature 5). This feature MUST NOT add a second `MenuBar` item.
- **FR-009**: This feature MUST NOT add a `students` table, new student fields, or new enrollment endpoints. Reuse Feature 6 `GET /academic/sections/:sectionId/students`, `POST /academic/sections/:sectionId/students`, `PUT /academic/enrollments/:enrollmentId`, Feature 5 `GET /academic/sections`, and Feature 1 `GET /academic/students`. Filter enrolled students on the client by `sectionId` when the list API is unscoped.
- **FR-010**: Feature 5 **Sections** catalog at `/sections` remains. Delete of enrollments stays on the Feature 6 catalog unless a later feature moves it.
- **FR-011**: Saving an edit from the Section Student View MUST use `PUT /academic/enrollments/:enrollmentId` and Feature 6 edit rules. After a successful save, the dialog closes and the section student list refreshes.

---

## Assumptions

- Features 1–6 need to be on `dev` before this feature is implemented.
- A Section Student View is a parent-row drill-down: list row opens a dedicated page; mutations stay in dialogs.
- Section Info in the heading comes from the existing section object (including nested `course`, `semester`, and `faculty`).
- **Enroll Student** uses the existing `CourseEnrollmentForm` create fields. Section is pre-filled; the user still selects the student. University ID and email come from the selected student; they are not entered as enrollment fields.
- Students shown in the enroll-student dialog still come from `GET /academic/students`. Feature 6 server rules still reject a student who is already enrolled in this section.
- No `GET /academic/sections/:sectionId` is required. The view MAY load `GET /academic/sections` and `GET /academic/sections/:sectionId/students` and select the matching rows (same pattern as [Feature 7](feature-7-student-course-listing.md)).
- Feature 5 list edit / delete stay on the Sections List. **Edit Enrollment** is available on the Section Student View (US-8.5). Delete enrollment stays on Feature 6. **Edit Section** stays on the Sections List.

## Edge Cases

- Section with zero enrolled students → **"No students enrolled yet. Enroll your first student."**
- Unknown `sectionId` → **"Section with id=<id> not found."**
- **Enroll Student** with a missing required field → **"Required"**; no `POST`.
- Unauthenticated `/sections/:sectionId/students` → redirect to `login`.
- Student enrolled from this view for a different section (user changes the pre-filled section) → stored under that section; it does not stay on this section's list.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can open a section from the list and see Section Info plus that section's enrolled students.
- **SC-003**: **Enroll Student** on the Section Student View opens the enroll-student dialog with this section selected and can create an enrollment that appears on the list.
- **SC-004**: `npm test` passes for the section list icon and Section Student View behavior.

---

## Data Ownership & Isolation

No new table. Sections and enrollments stay shared catalogs (Features 5 and 6). Only role `admin` sees the sections list and Section Student View.

| Rule               | Requirement                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Read scope**     | Section Student View shows one section and the enrolled students with that `sectionId`.                       |
| **Write scope**    | Creating an enrollment from this view uses Feature 6 admin `POST /academic/sections/:sectionId/students`.     |
| **UI scope**       | `/sections` and `/sections/:sectionId/students` are admin-only.                                               |
| **Implementation** | Reuse Feature 1, Feature 5, and Feature 6 services. Do not add ownership `userId`.                             |

---

## API Requirements

No new endpoints.

| Method | Endpoint                                  | Auth       | Purpose in this feature                                                    |
| ------ | ----------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `GET`  | `/academic/sections`                      | Yes        | Load sections; pick the row for `:sectionId`                               |
| `GET`  | `/academic/sections/:sectionId/students`  | Yes        | Load enrolled students; keep rows whose `sectionId` matches the section    |
| `GET`  | `/academic/students`                      | Yes        | Populate the student select on **Enroll Student**                          |
| `POST` | `/academic/sections/:sectionId/students`  | Yes, admin | Create an enrollment; body is Feature 6 create body with `sectionId`       |
| `PUT`  | `/academic/enrollments/:enrollmentId`     | Yes, admin | Save an enrollment edit from this view                                     |

Request and error shapes stay as in [Feature 6](feature-6-enrollment-management.md).

---

## Screen Requirements

### [View: Sections] — route name `sections` — path `/sections` — `SectionList.vue`

Feature 5 list, with this change:

- Section number stays plain text (not a link).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **View students** — section icon (`mdi-account-group`) navigates to the **Section** view (`/sections/:sectionId/students`)
  - **Edit section** — Feature 5 edit dialog (unchanged)
  - **Delete section** — Feature 5 delete dialog (unchanged)

### [View: Section] — route name `section` — path `/sections/:sectionId/students` — `SectionStudents.vue`

- **Heading area** shows Section Info: section **number**, **course** (code and title), **semester**, **faculty** name, and **schedule**.
- Heading action: **Enroll Student** (`oc-cta`) opens the **Enroll Student** `<v-dialog>` with `sectionId` set to this section.
- **Enroll Student** fields and validation are Feature 6 create fields (section, student). Section is pre-filled.
- **Enroll Student** actions: **Create** (`oc-cta`) / **Cancel** (secondary). After a successful create, the dialog closes and the students list refreshes.
- **Students list:** `v-table` (or `v-list`); columns **name**, **university ID**, **email**, **actions**. Do not repeat the section column. Rows ordered by last name then first name.
- Row action **Edit Enrollment** — `mdi-pencil`; opens **Edit Enrollment** `<v-dialog>` pre-filled with current data; **Save Enrollment** (`oc-cta`) / **Cancel** (secondary).
- **Empty students:** **"No students enrolled yet. Enroll your first student."**
- **Loading state:** skeleton or progress indicator while section and enrolled students are fetching.
- **Error state:** `<v-alert type="error">` for API failures. Unknown `sectionId` shows **"Section with id=<id> not found."**
- Admin-only: `/sections/:sectionId/students` is for signed-in admin users. Unauthenticated navigation redirects to `login`.
- Student enroll dialog lives in `SectionStudents.vue` (reuse `CourseEnrollmentForm.vue`). No sidebar/main split.
- This view does not add **Edit Section**. Feature 5 edit stays on the Sections List.
- This view does not add delete enrollment row actions. Feature 6 remains the catalog for delete.

**App chrome**

- Use the Feature 1 `MenuBar`. **Sections** still goes to `/sections`. Opening a section from that list shows this view.

---

## Key Entities

- **Section**: Feature 5 catalog row. This feature adds a view for one section.
- **Student**: Feature 6 enrollment row that belongs to one section. A section may have many enrolled students.

---

## Data Model Requirements

No schema change. Existing Feature 5 `sections` and Feature 6 enrollments (`enrollments.sectionId` → `sections.id`, `enrollments.studentId` → `students.id`) are enough.

---

## Acceptance Criteria (Gherkin)

### US-8.1 — Open a section from the list

#### Scenario: section rows show a view students action

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the sections view
* **When** I view a section row
* **Then** the section row shows a **View students** icon action

#### Scenario: User opens a section from the Sections List

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the sections view
* **And** a section `CS-101-01` exists
* **When** I click the **View students** icon on the `CS-101-01` row
* **Then** the Section Student View is displayed

---

### US-8.2 — View Section Info and students

#### Scenario: Section Student View shows Section Info

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01` in course `Intro to Programming`
* **Then** the heading area shows section number `CS-101-01`
* **And** the heading area shows course `Intro to Programming`
* **And** the heading area shows the section semester, faculty, and schedule
* **And** **Enroll Student** is shown

#### Scenario: Section Student View lists students for that section

* **Given** I am signed in as a user with role `admin`
* **And** `Jane Doe` is enrolled in section `CS-101-01`
* **And** I am viewing the Section Student View for `CS-101-01`
* **When** I view the students list
* **Then** `Jane Doe` is displayed in the list

#### Scenario: Section Student View does not list students from another section

* **Given** I am signed in as a user with role `admin`
* **And** `Jane Doe` is enrolled in a different section
* **And** I am viewing the Section Student View for `CS-101-01`
* **When** I view the students list
* **Then** `Jane Doe` is not displayed in the list

#### Scenario: Section has no enrolled students

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01`
* **And** that section has no enrolled students
* **When** I view the students list
* **Then** I see **"No students enrolled yet. Enroll your first student."**

---

### US-8.3 — Enroll a student defaulted to this section

#### Scenario: User selects to enroll a student from the Section Student View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01`
* **When** I click **Enroll Student**
* **Then** the enroll-student dialog is displayed
* **And** section `CS-101-01` is already selected

#### Scenario: User creates an enrollment from the Section Student View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01`
* **And** a student `Jane Doe` exists
* **When** I click **Enroll Student**
* **And** I select student `Jane Doe`
* **And** I click **Create**
* **Then** the API is called with `sectionId` for `CS-101-01`
* **And** `Jane Doe` appears in the section student list
* **And** the enroll-student dialog closes

#### Scenario: User creates an enrollment from the Section Student View with a missing required field

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01`
* **When** I click **Enroll Student**
* **And** I leave a required field empty
* **And** I click **Create**
* **Then** no API call is made
* **And** I see the message **"Required"**

#### Scenario: User enrolls a student who is already in the section

* **Given** I am signed in as a user with role `admin`
* **And** `Jane Doe` is already enrolled in section `CS-101-01`
* **And** I am viewing the Section Student View for `CS-101-01`
* **When** I click **Enroll Student**
* **And** I select student `Jane Doe`
* **And** I click **Create**
* **Then** the API returns `400` with `{ "message": "Student is already enrolled in this section." }`
* **And** no second enrollment for `Jane Doe` is stored in that section

---

### US-8.4 — Restrict the Section Student View to admins

#### Scenario: Unauthenticated user navigates to a section

* **Given** I have no session in `localStorage`
* **When** I navigate to `/sections/1/students`
* **Then** I am redirected to the login page

---

### US-8.5 — Edit an enrollment from the Section Student View

#### Scenario: Section Student View student rows show an edit action

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01`
* **And** that section has an enrolled student
* **Then** an **Edit Enrollment** action is shown on the student row

#### Scenario: User selects to edit an enrollment from the Section Student View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01`
* **And** that section has an enrolled student
* **When** I click **Edit Enrollment**
* **Then** the edit-enrollment dialog is displayed
* **And** the enrollment's current values are shown

#### Scenario: User edits an enrollment from the Section Student View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Section Student View for `CS-101-01`
* **And** that section has an enrolled student
* **And** the enrollment edit dialog is displayed
* **When** I update the student to `Jane Doe`
* **And** I click **Save Enrollment**
* **Then** the API updates that enrollment
* **And** `Jane Doe` appears in the section student list
* **And** the edit-enrollment dialog closes

---

## Test Coverage Map

| Story  | Scenario                                                                               | Test file                                | Test name                                                 |
| ------ | -------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| US-8.1 | section rows show a view students action                                               | `frontend/tests/SectionStudents.test.js` | `sections list rows include a view students icon`         |
| US-8.1 | User opens a section from the Sections List                                            | `frontend/tests/SectionStudents.test.js` | `view students icon opens the Section Student View`       |
| US-8.2 | Section Student View shows Section Info                                                | `frontend/tests/SectionStudents.test.js` | `shows section number and course in the heading`          |
| US-8.2 | Section Student View lists students for that section                                   | `frontend/tests/SectionStudents.test.js` | `lists enrolled students for the open section`            |
| US-8.2 | Section Student View does not list students from another section                       | `frontend/tests/SectionStudents.test.js` | `hides students that belong to another section`           |
| US-8.2 | Section has no enrolled students                                                       | `frontend/tests/SectionStudents.test.js` | `shows empty copy when the section has no students`       |
| US-8.3 | User selects to enroll a student from the Section Student View                         | `frontend/tests/SectionStudents.test.js` | `enroll student opens with this section selected`         |
| US-8.3 | User creates an enrollment from the Section Student View                               | `frontend/tests/SectionStudents.test.js` | `create from this view adds the student to the list`      |
| US-8.3 | User creates an enrollment from the Section Student View with a missing required field | `frontend/tests/SectionStudents.test.js` | `create with a blank required field stays on the dialog`  |
| US-8.3 | User enrolls a student who is already in the section                                   | `frontend/tests/SectionStudents.test.js` | `duplicate enrollment in the same section is rejected`    |
| US-8.4 | Unauthenticated user navigates to a section                                            | `frontend/tests/router.test.js`          | `unauthenticated section view redirects to login`         |
| US-8.5 | Section Student View student rows show an edit action                                  | `frontend/tests/SectionStudents.test.js` | `student rows include an edit enrollment icon`            |
| US-8.5 | User selects to edit an enrollment from the Section Student View                       | `frontend/tests/SectionStudents.test.js` | `edit enrollment opens with current values`               |
| US-8.5 | User edits an enrollment from the Section Student View                                 | `frontend/tests/SectionStudents.test.js` | `save enrollment refreshes the student list`              |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 8 from @features/feature-8-section-student-listing.md on branch `feature/8-section-students`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

Reference updates for this feature: `features/reference/behavior.md` (Section Student View + **Enroll Student** default). No data-model or API change unless implementation adds a route.

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

- New section fields or section endpoints (Feature 5)
- New enrollment endpoints (Feature 6)
- Delete enrollments from the Section Student View (Feature 6)
- Moving **Edit Section** onto the Section Student View
- Student-facing section or roster UI
- Creating students from the enroll-student dialog
- A second `MenuBar` item (Feature 5 already owns **Sections**)

---

## Delivered to later features

- The Sections List now opens `SectionStudents.vue`. A later feature MAY add **Edit Section** or extra enrollment row actions on that view.
- This view is the section-side roster. [Feature 7](feature-7-student-course-listing.md) remains the student-side course list. Both reuse Feature 6 enrollments.
