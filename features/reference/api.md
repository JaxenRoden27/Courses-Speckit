# API Reference

**Status:** empty starter — no application endpoints yet.

API mount path is `/course-t4` (see `backend/server.js`). Update this file when endpoints merge to `dev`.

## Endpoints

### Academic & Section Students (Features 7 & 8)
- `GET /course-t4/academic/sections` - Fetch sections with courses and faculty
- `GET /course-t4/academic/sections/:sectionId/students` - Fetch students enrolled in a specific section
- `POST /course-t4/academic/sections/:sectionId/students` - Enroll a student in a section
- `PUT /course-t4/academic/enrollments/:enrollmentId` - Update an enrollment

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>` (when Feature auth is implemented).

