# Feature: Student Course Listing

**Feature ID:** 7
**Branch pattern:** `feature/7-student-courses`
**Status:** Ready
**Created:** 2026-09-22
**Input:** Signed-in admin users open a student from the Students List. The Student Course View has a heading with Student Info, a list of that student's enrolled courses, and an **Enroll Course** button that opens the enroll-course dialog with this student already selected.
**Depends on:** [Feature 1 — User Auth and Session Management](feature-1-user-auth-and-session-management.md), [Feature 2 — Course Management](feature-2-course-management.md), [Feature 6 — Enrollment Management](feature-6-enrollment-management.md)

---

## User Stories

### US-7.1: Open a student from the list
**As a** signed-in admin user
**I want** each student row to show a **view courses** icon
**So that** I can open one student from the Students List

**Priority:** P1  
**Independent test:** From the Students List, click **View courses**; the Student Course View appears  
**Acceptance scenarios:** see ### US-7.1 under Acceptance Criteria

### US-7.2: View Student Info and courses
**As a** signed-in admin user
**I want** a Student Course View with a heading for Student Info and a list of that student's enrolled courses
**So that** I can see the courses for one student

**Priority:** P1  
**Independent test:** Open a student that has enrolled courses; heading shows Student Info and the courses list shows those courses  
**Acceptance scenarios:** see ### US-7.2 under Acceptance Criteria

### US-7.3: Enroll a course defaulted to this student
**As a** signed-in admin user
**I want** an **Enroll Course** button on the Student Course View that starts a new enrollment for this student
**So that** I do not have to pick the student again

**Priority:** P1  
**Independent test:** On the Student Course View, click **Enroll Course**; the enroll-course dialog opens with this student selected  
**Acceptance scenarios:** see ### US-7.3 under Acceptance Criteria

### US-7.4: Restrict the Student Course View to admins
**As the** application
**I want** `/students/:studentId/courses` to follow the same admin-only UI rules as the Students List
**So that** users with role `student` cannot open the student course manager

**Priority:** P1  
**Independent test:** Unauthenticated navigation to `/students/1/courses` redirects to `login`; users with role `student` do not see **Students**  
**Acceptance scenarios:** see ### US-7.4 under Acceptance Criteria

### US-7.5: Edit an enrollment from the Student Course View
**As a** signed-in admin user
**I want** an edit icon on each course in the student course list
**So that** I can open the Feature 6 **Edit Enrollment** dialog without leaving the Student Course View

**Priority:** P1  
**Independent test:** On the Student Course View, click **Edit Enrollment**; the edit dialog opens with that enrollment's values  
**Acceptance scenarios:** see ### US-7.5 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: This feature adds a **Student Course View** in `StudentCourses.vue` at route name `student`, path `/students/:studentId/courses`. The Students List remains `StudentList.vue` at `/students`.
- **FR-002**: The Students List keeps Feature 1 create / edit / delete dialogs. Each student row adds a **View courses** icon action that navigates to `/students/:studentId/courses`. Student name stays plain text (not a link).
- **FR-003**: The Student Course View has a **heading area** with Student Info: student **name**, **program** name, **admission date**, and **expected graduation**.
- **FR-004**: The Student Course View lists **only enrolled courses whose `studentId` matches this student**. Columns: **term**, **schedule**, **room**, **course code**, **course title**, **credits**, **grade**, and **actions**. Rows stay ordered by `term`, then `schedule` (Feature 6 FR-006). Each course row shows an **Edit Enrollment** icon (`mdi-pencil`, `aria-label="Edit Enrollment"`) that opens the Feature 6 **Edit Enrollment** dialog pre-filled with that enrollment.
- **FR-005**: The Student Course View shows **Enroll Course** (`oc-cta`). That button opens the Feature 6 **Enroll Course** dialog with `studentId` already set to this student.
- **FR-006**: Creating an enrollment from the Student Course View MUST use `POST /academic/students/:studentId/courses` and Feature 6 field rules (required fields, course not already enrolled, prerequisites met). Room is not collected on create. After a successful create, the dialog closes and the new course appears in this student's course list.
- **FR-007**: Empty courses list copy is **"No courses enrolled yet. Enroll your first course."** Unknown `studentId` shows **"Student with id=<id> not found."**
- **FR-008**: Unauthenticated navigation to `/students/:studentId/courses` MUST redirect to `login`. Users with role `student` MUST NOT see **Students** in `MenuBar` (Feature 1). This feature MUST NOT add a second `MenuBar` item.
- **FR-009**: This feature MUST NOT add a `courses` table, new course fields, or new course endpoints. Reuse Feature 6 `GET /academic/students/:studentId/courses`, `POST /academic/students/:studentId/courses`, `PUT /academic/enrollments/:enrollmentId`, Feature 1 `GET /academic/students`, and Feature 2 `GET /academic/courses`. Filter enrolled courses on the client by `studentId` when the list API is unscoped.
- **FR-010**: Feature 6 **Courses** catalog at `/courses` remains. Delete of enrollments stays on that catalog unless a later feature moves it.
- **FR-011**: Saving an edit from the Student Course View MUST use `PUT /academic/enrollments/:enrollmentId` and Feature 6 edit rules, including optional **room**. After a successful save, the dialog closes and the student course list refreshes.

---

## Assumptions

- Features 1–6 need to be on `dev` before this feature is implemented.
- A Student Course View is a parent-row drill-down: list row opens a dedicated page; mutations stay in dialogs.
- Student Info in the heading comes from the existing student object (including nested `program`).
- **Enroll Course** uses the existing `CourseEnrollmentForm` create fields. Student is pre-filled; the user still enters term, schedule, course code, and course title. Room is not on create.
- Courses shown in the enroll-course dialog still come from `GET /academic/courses`. Feature 6 server rules still reject a course that is already enrolled or whose prerequisites are not met.
- No `GET /academic/students/:studentId` is required. The view MAY load `GET /academic/students` and `GET /academic/students/:studentId/courses` and select the matching rows (same pattern as a parent-detail view).
- Feature 1 list edit / delete stay on the Students List. **Edit Enrollment** is available on the Student Course View (US-7.5). Delete enrollment stays on Feature 6 `/courses`.

## Edge Cases

- Student with zero enrolled courses → **"No courses enrolled yet. Enroll your first course."**
- Unknown `studentId` → **"Student with id=<id> not found."**
- **Enroll Course** with a missing required field → **"Required"**; no `POST`.
- Unauthenticated `/students/:studentId/courses` → redirect to `login`.
- Course enrolled from this view for a different student (user changes the pre-filled student) → stored under that student; it does not stay on this student's list.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can open a student from the list and see Student Info plus that student's enrolled courses.
- **SC-003**: **Enroll Course** on the Student Course View opens the enroll-course dialog with this student selected and can create an enrollment that appears on the list.
- **SC-004**: `npm test` passes for the student list icon and Student Course View behavior.

---

## Data Ownership & Isolation

No new table. Students and enrollments stay shared catalogs (Features 1 and 6). Only role `admin` sees the students list and Student Course View.


| Rule               | Requirement                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Read scope**     | Student Course View shows one student and the enrolled courses with that `studentId`.                    |
| **Write scope**    | Creating an enrollment from this view uses Feature 6 admin `POST /academic/students/:studentId/courses`. |
| **UI scope**       | `/students` and `/students/:studentId/courses` are admin-only.                                           |
| **Implementation** | Reuse Feature 1, Feature 2, and Feature 6 services. Do not add ownership `userId`.                       |


---

## API Requirements

No new endpoints.


| Method | Endpoint                                | Auth       | Purpose in this feature                                                |
| ------ | --------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `GET`  | `/academic/students`                    | Yes        | Load students; pick the row for `:studentId`                           |
| `GET`  | `/academic/students/:studentId/courses` | Yes        | Load enrolled courses; keep rows whose `studentId` matches the student |
| `GET`  | `/academic/courses`                     | Yes        | Populate course code / course title selects on **Enroll Course**       |
| `POST` | `/academic/students/:studentId/courses` | Yes, admin | Create an enrollment; body is Feature 6 create body with `studentId`   |
| `PUT`  | `/academic/enrollments/:enrollmentId`   | Yes, admin | Save an enrollment edit from this view                                 |


Request and error shapes stay as in [Feature 6](feature-6-enrollment-management.md).

---

## Screen Requirements

### [View: Students] — route name `students` — path `/students` — `StudentList.vue`

Feature 1 list, with this change:

- Student name stays plain text (not a link).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **View courses** — student icon (`mdi-book-open-page-variant`) navigates to the **Student** view (`/students/:studentId/courses`)
  - **Edit student** — Feature 1 edit dialog (unchanged)
  - **Delete student** — Feature 1 delete dialog (unchanged)

### [View: Student] — route name `student` — path `/students/:studentId/courses` — `StudentCourses.vue`

- **Heading area** shows Student Info: student **name**, **program** name, **admission date**, and **expected graduation**.
- Heading action: **Enroll Course** (`oc-cta`) opens the **Enroll Course** `<v-dialog>` with `studentId` set to this student.
- **Enroll Course** fields and validation are Feature 6 create fields (student, term, schedule, course code, course title, optional credits and grade). Student is pre-filled. Room is set later on **Edit Enrollment** (Feature 6).
- **Enroll Course** actions: **Create** (`oc-cta`) / **Cancel** (secondary). After a successful create, the dialog closes and the courses list refreshes.
- **Courses list:** `v-table` (or `v-list`); columns **term**, **schedule**, **room**, **course code**, **course title**, **credits**, **grade**, **actions**. Do not repeat the student column. Rows ordered by term then schedule.
- Row action **Edit Enrollment** — `mdi-pencil`; opens **Edit Enrollment** `<v-dialog>` pre-filled with current data; **Save Enrollment** (`oc-cta`) / **Cancel** (secondary). **room** is shown on edit (Feature 6).
- **Empty courses:** **"No courses enrolled yet. Enroll your first course."**
- **Loading state:** skeleton or progress indicator while student and enrolled courses are fetching.
- **Error state:** `<v-alert type="error">` for API failures. Unknown `studentId` shows **"Student with id=<id> not found."**
- Admin-only: `/students/:studentId/courses` is for signed-in admin users. Unauthenticated navigation redirects to `login`.
- Course enroll dialog lives in `StudentCourses.vue` (reuse `CourseEnrollmentForm.vue`). No sidebar/main split.
- This view does not add **Edit Student**. Feature 1 edit stays on the Students List.
- This view does not add delete enrollment row actions. Feature 6 `/courses` remains the catalog for delete.

**App chrome**

- Use the Feature 1 `MenuBar`. **Students** still goes to `/students`. Opening a student from that list shows this view.

---

## Key Entities

- **Student**: Feature 1 catalog row. This feature adds a view for one student.
- **Course**: Feature 6 enrollment row that belongs to one student. A student may have many enrolled courses.

---

## Data Model Requirements

No schema change. Existing Feature 1 `students` and Feature 6 enrollments (`enrollments.studentId` → `students.id`) are enough.

---

## Acceptance Criteria

### US-7.1 — Open a student from the list

#### Scenario: student rows show a view courses action

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the students view
* **When** I view a student row
* **Then** the student row shows a **View courses** icon action

#### Scenario: User opens a student from the Students List

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the students view
* **And** a student `John Doe` exists
* **When** I click the **View courses** icon on the `John Doe` row
* **Then** the Student Course View is displayed

---

### US-7.2 — View Student Info and courses

#### Scenario: Student Course View shows Student Info

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing Student Course View for `John Doe` in the program `Computer Science`
* **Then** the heading area shows student name `John Doe`
* **And** the heading area shows program `Computer Science`
* **And** **Enroll Course** is shown

#### Scenario: Student Course View lists courses for that student

* **Given** I am signed in as a user with role `admin`
* **And** `John Doe` is enrolled in a course with room `PEC 231`
* **And** I am viewing the Student Course View for `John Doe`
* **When** I view the courses list
* **Then** `PEC 231` is displayed in the list

#### Scenario: Student Course View does not list courses from another student

* **Given** I am signed in as a user with role `admin`
* **And** a different student is enrolled in a course with room `PEC 231`
* **And** I am viewing the Student Course View for `John Doe`
* **When** I view the courses list
* **Then** `PEC 231` is not displayed in the list

#### Scenario: Student has no enrolled courses

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Student Course View for `John Doe`
* **And** that student has no enrolled courses
* **When** I view the courses list
* **Then** I see **"No courses enrolled yet. Enroll your first course."**

---

### US-7.3 — Enroll a course defaulted to this student

#### Scenario: User selects to enroll a course from the Student Course View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Student Course View for `John Doe`
* **When** I click **Enroll Course**
* **Then** the enroll-course dialog is displayed
* **And** student `John Doe` is already selected

#### Scenario: User creates an enrollment from the Student Course View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Student Course View for `John Doe`
* **And** courses `CS-101` and `Intro to Programming` exist in that student's program
* **When** I click **Enroll Course**
* **And** I enter term `2026 Fall`, schedule `MWF 10:00 AM`, course code `CS-101`, and course title `Intro to Programming`
* **And** I click **Create**
* **Then** the API is called with `studentId` for `John Doe`
* **And** `CS-101` appears in the student course list
* **And** the enroll-course dialog closes

#### Scenario: User creates an enrollment from the Student Course View with a missing required field

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Student Course View for `John Doe`
* **When** I click **Enroll Course**
* **And** I leave a required field empty
* **And** I click **Create**
* **Then** no API call is made
* **And** I see the message **"Required"**

---

### US-7.4 — Restrict the Student Course View to admins

#### Scenario: Unauthenticated user navigates to a student

* **Given** I have no session in `localStorage`
* **When** I navigate to `/students/1/courses`
* **Then** I am redirected to the login page

---

### US-7.5 — Edit an enrollment from the Student Course View

#### Scenario: Student Course View course rows show an edit action

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Student Course View for `John Doe`
* **And** that student has an enrolled course
* **Then** an **Edit Enrollment** action is shown on the course row

#### Scenario: User selects to edit an enrollment from the Student Course View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Student Course View for `John Doe`
* **And** that student has an enrolled course
* **When** I click **Edit Enrollment**
* **Then** the edit-enrollment dialog is displayed
* **And** the enrollment's current values are shown

#### Scenario: User edits an enrollment from the Student Course View

* **Given** I am signed in as a user with role `admin`
* **And** I am viewing the Student Course View for `John Doe`
* **And** that student has an enrolled course
* **And** the enrollment edit dialog is displayed
* **When** I update room to `PEC 231`
* **And** I click **Save Enrollment**
* **Then** the API updates that enrollment
* **And** `PEC 231` appears in the student course list
* **And** the edit-enrollment dialog closes

---

## Test Coverage Map


| Story  | Scenario                                                                              | Test file                               | Test name                                                    |
| ------ | ------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| US-7.1 | student rows show a view courses action                                               | `frontend/tests/StudentCourses.test.js` | `students list rows include a view courses icon`             |
| US-7.1 | User opens a student from the Students List                                           | `frontend/tests/StudentCourses.test.js` | `view courses icon opens the Student Course View`            |
| US-7.2 | Student Course View shows Student Info                                                | `frontend/tests/StudentCourses.test.js` | `shows student name and program in the heading`              |
| US-7.2 | Student Course View lists courses for that student                                    | `frontend/tests/StudentCourses.test.js` | `lists enrolled courses for the open student`                |
| US-7.2 | Student Course View does not list courses from another student                        | `frontend/tests/StudentCourses.test.js` | `hides courses that belong to another student`               |
| US-7.2 | Student has no enrolled courses                                                       | `frontend/tests/StudentCourses.test.js` | `shows empty copy when the student has no courses`           |
| US-7.3 | User selects to enroll a course from the Student Course View                          | `frontend/tests/StudentCourses.test.js` | `enroll course opens with this student selected`             |
| US-7.3 | User creates an enrollment from the Student Course View                               | `frontend/tests/StudentCourses.test.js` | `create from this view adds the course to the list`          |
| US-7.3 | User creates an enrollment from the Student Course View with a missing required field | `frontend/tests/StudentCourses.test.js` | `create with a blank required field stays on the dialog`     |
| US-7.4 | Unauthenticated user navigates to a student                                           | `frontend/tests/router.test.js`         | `unauthenticated course view redirects to login`             |
| US-7.5 | Student Course View course rows show an edit action                                   | `frontend/tests/StudentCourses.test.js` | `course rows include an edit enrollment icon`                |
| US-7.5 | User selects to edit an enrollment from the Student Course View                       | `frontend/tests/StudentCourses.test.js` | `edit enrollment opens with current values`                  |
| US-7.5 | User edits an enrollment from the Student Course View                                 | `frontend/tests/StudentCourses.test.js` | `save enrollment refreshes the course list`                  |


---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 7 from @features/feature-7-student-course-listing.md on branch `feature/7-student-courses`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

Reference updates for this feature: `features/reference/behavior.md` (Student Course View + **Enroll Course** default). No data-model or API change unless implementation adds a route.

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

- New course fields or course endpoints (Feature 6)
- Delete enrollments from the Student Course View (Feature 6 `/courses`)
- Moving **Edit Student** onto the Student Course View
- Student-facing course or schedule UI
- GPA calculation or filtering courses by department
- Creating courses from the enroll-course dialog
- A second `MenuBar` item

---

## Delivered to later features

- The Students List now opens `StudentCourses.vue`. A later feature MAY add **Edit Student** or extra enrollment row actions on that view.
- [Feature 8](feature-8-section-student-listing.md) is a separate listing (section roster).

