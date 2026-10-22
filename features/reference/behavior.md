# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev`.

Empty until Feature 1+ ships. See the OC CS Speckit repo’s `features/reference/behavior.md` for the intended shape (rule → enforcement → provenance).

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

---

## Feature 8: Section Student Listing

### Section Student View
- **Route**: `/sections/:sectionId/students` (route name: `sectionStudents` / `section`).
- **Access**: Signed-in admin / faculty users only. Unauthenticated access redirects to `/login`.
- **Header**: Displays section information (section number, course code & title, semester, faculty name, and schedule).
- **Roster Listing**: Displays enrolled students belonging to this section with columns: Name (Last, First), University ID, Email, and Actions. Rows sorted alphabetically by last name, then first name.
- **Empty State**: Displays `"No students enrolled yet. Enroll your first student."` if no students are enrolled in the section.
- **Error State**: Displays `"Section with id=<id> not found."` if the section does not exist.

### Enroll Student Dialog
- **Trigger**: Click **Enroll Student** CTA on the Section Student View.
- **Defaulting**: `sectionId` is pre-selected and locked to the current section.
- **Fields**: Admin selects the student from `GET /academic/students` (or users with student role).
- **Validation**: Requires student selection. Duplicate enrollment in the same section is rejected with `"Student is already enrolled in this section."`.
- **Submission**: Sends `POST /academic/sections/:sectionId/students`. On success, dialog closes and the roster refreshes.

### Edit Enrollment Dialog
- **Trigger**: Click **Edit Enrollment** (`mdi-pencil`, `aria-label="Edit Enrollment"`) action on a student row.
- **Form**: Pre-filled with current enrollment data (`sectionId`, `studentId`).
- **Submission**: Sends `PUT /academic/enrollments/:enrollmentId`. On success, dialog closes and roster refreshes.

