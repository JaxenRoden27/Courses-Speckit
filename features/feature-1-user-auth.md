# Feature: User Authentication & Session Management

**Feature ID:** 1
**Branch pattern:** `feature/1-user-auth`
**Status:** Ready
**Created:** 2026-09-23
**Input:** Multi-user authentication and session management so each user can sign in and access private role based data
**Related:** [ADR-0001 — Client–server multi-user architecture](../docs/adr/0001-client-server-multi-user-architecture.md), [ADR-0002 — Security architecture](../docs/adr/0002-security-architecture.md)

---

## User Stories

### US-1.1: Register an account

**As a** new user  
**I want to** create an account with my name, email, universityId, and password  
**So that** I can sign in and do the activities allowed for my role

**Priority:** P1  
**Independent test:** Submit valid registration and land on protected home with `user` with their role in `localStorage`  
**Acceptance scenarios:** see ### US-1.1 under Acceptance Criteria

### US-1.2: Sign in

**As a** registered user  
**I want to** sign in with my universityId and password  
**So that** I can access the application dashboard securely

**Priority:** P1  
**Independent test:** Sign in with known credentials and receive session token + redirect to home  
**Acceptance scenarios:** see ### US-1.2 under Acceptance Criteria

### US-1.3: Stay signed in across page loads

**As a** signed-in user  
**I want** my session to persist in the browser  
**So that** I do not have to sign in again every time I refresh the page

**Priority:** P1  
**Independent test:** Refresh or revisit protected route with valid `localStorage` session — no re-login  
**Acceptance scenarios:** see ### US-1.3 under Acceptance Criteria

### US-1.4: Sign out

**As a** signed-in user  
**I want to** sign out  
**So that** no one else can use my account on a shared device

**Priority:** P2  
**Independent test:** Sign out from `MenuBar` clears server session and `localStorage`; user lands on login  
**Acceptance scenarios:** see ### US-1.4 under Acceptance Criteria

### US-1.5: Block unauthenticated access

**As the** application  
**I want to** require a valid session for all non-auth screens  
**So that** protected screens and APIs are only available with a valid session

**Priority:** P1  
**Independent test:** Navigate to protected route without session → redirect to login; API without token → `401`  
**Acceptance scenarios:** see ### US-1.5 under Acceptance Criteria

### US-1.6: Role-based MenuBar

**As a** signed-in user  
**I want** the `MenuBar` to show **Sign out** and only the nav items allowed for my `role`  
**So that** I can leave the session and I do not see tools for other roles

**Priority:** P1  
**Independent test:** After login, `MenuBar` is visible with **Sign out**; a `student` does not see faculty-only items  
**Acceptance scenarios:** see ### US-1.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Users MUST authenticate with **universityId** + **password** (not email-only login). universityId MUST be trimmed and stored lowercase.
- **FR-002**: Registration MUST collect first name, last name, email, universityId, password, and confirm password. Confirm password MUST match password and MUST NOT be stored.
- **FR-003**: Passwords MUST be hashed with **bcrypt** (`SALT_ROUNDS = 10`) before persistence; hashes MUST never be returned by the API.
- **FR-004**: Sessions MUST use a **JWT + Session table** pattern: token stored server-side; client sends `Authorization: Bearer <token>`. Successful registration MUST create a session and return the same payload as login, with HTTP `201`.
- **FR-005**: Session lifetime MUST be **24 hours** from creation.
- **FR-006**: Login MUST reuse a non-expired session for the same user (`userId`) when one already exists.
- **FR-007**: Allowed roles are `student` and `faculty`. Registration MUST NOT accept a role from the client. New users MUST be stored with role `student`. This feature has no way to create a `faculty` user; tests that need one insert the row directly.
- **FR-008**: Every authenticated request MUST resolve to exactly one user via `req.user.id` from the session token (foundation for later features that need the signed-in user).
- **FR-009**: Registration MUST use shared `emailRules` from `frontend/src/config/validation.js` — required plus regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`); invalid format message: **"Enter a valid email address."** Required-field messages: **"First name is required."**, **"Last name is required."**, **"Email is required."**, **"University ID is required."**, **"Password is required."**
- **FR-010**: This feature MUST **introduce** `MenuBar` in `App.vue` (`<MenuBar />` above `<v-main>`). `MenuBar` MUST be visible on `login`, `register`, and `home`.
- **FR-011**: `MenuBar` MUST show **Sign out** when a session exists and the user is on a page they are allowed to stay on (`home`). When there is no session, **Sign out** MUST be hidden. A signed-in user who opens `login` MUST be redirected to `home`.
- **FR-012**: `MenuBar` nav items MUST be filtered by the signed-in user's `role` from the `users` table / `localStorage` `user` payload. An item is shown only when `user.role` is in that item's allowed roles. Feature 1 ships **Sign out** for every authenticated role and no catalog links.
- **FR-013**: Password length MUST be at least 8 characters. The client MUST block a shorter password with **"Password must be at least 8 characters."** The server MUST reject a shorter password with `400` and that same message.
- **FR-014**: Whitespace-only required fields MUST be rejected on the client and on the server.

---

## Assumptions

- Greenfield app — no existing users or external identity provider.
- Single browser `localStorage` session per device (no multi-tab sync beyond shared storage).
- Product roles are `student` and `faculty`. The starter role `worker` in ADR-0002 does not apply.
- A `faculty` user in US-1.6 is test data. Registration always stores `student`. Feature 4 manages Faculty records, not user accounts.
- Semester catalog UI is deferred to Feature 2; course catalog UI is deferred to Feature 3. Feature 1 delivers auth, a minimal protected home, and `MenuBar` (**Sign out** only).
- University IDs for students are in the form ST####, Faculty are FA#### and Admin are AD####

## Edge Cases

- Duplicate universityId or email on register → `400` with clear message.
- Unknown universityId or wrong password on login → `401` with `{ "message": "Invalid University ID or password." }`.
- Missing token on a protected API → `401` with `{ "message": "Unauthorized! No token provided." }`. Expired or revoked token → `401` with `{ "message": "Unauthorized! Invalid or expired token." }`. The frontend clears `localStorage` key `user` and redirects to login.
- Whitespace-only required fields → rejected (client and/or server).

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A new user can register, sign in, reach the protected home page, and sign out from `MenuBar` in one manual pass.
- **SC-003**: `npm test` passes with backend auth and frontend router/register/login/`MenuBar` coverage.
- **SC-004**: `MenuBar` is visible on the login page; **Sign out** appears after a session exists and is hidden when there is no session.

---

## Data Ownership & Isolation (foundation)

Feature 1 establishes identity. Later features decide which data a signed-in user may see or change.

- Every authenticated request resolves to exactly one user (`req.user.id`).
- No API in this feature returns another user's profile or session.
- This feature does not scope semesters, courses, or other catalog data. Those features define their own access rules.

---

## API Requirements

| Method | Endpoint            | Auth | Purpose                                 |
| ------ | ------------------- | ---- | --------------------------------------- |
| `POST` | `/courses/register` | No   | Create a user, start a session, return `201` |
| `POST` | `/courses/login`    | No   | Authenticate and return session payload |
| `POST` | `/courses/logout`   | Yes  | Invalidate current session token        |

**Login / register success response** (flat JSON, no envelope):

```json
{
  "userId": 1,
  "universityId": "ST1111",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "student",
  "token": "<jwt>"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.

---

## Screen Requirements

### [View: Login Page] — route name `login`

- Auth form with `MenuBar` visible (this feature introduces `MenuBar`; do not hide it on login).
- Fields: universityId, password.
- Primary action: **Sign in** (`v-btn`, shows `:loading` while request is in flight).
- Link or button to navigate to registration.
- Inline error via `<v-alert type="error">` on failed login.

### [View: Register Page] — route name `register`

- Auth form with `MenuBar` visible.
- Fields: first name, last name, email, universityId, password, confirm password.
- No role field. The server assigns `student`.
- Email field uses shared `emailRules` from `frontend/src/config/validation.js` (required + regex format).
- Primary action: **Create account**.
- Link or button to navigate to login.
- Client-side validation before API call; server errors shown via `<v-alert type="error">`.

### [View: Home placeholder] — route name `home`

- Minimal protected landing page shown after successful login or registration. This is **not** the semester list (`/semester` is Feature 2) or the courses list (`/course` is Feature 3).
- Displays **"Welcome, {first name}."** using the signed-in user's first name.
- No on-page **Sign out** button — sign-out is only in `MenuBar`.

**App chrome**

- **Introduce** `MenuBar` in this feature. Mount it in `App.vue` (`<MenuBar />` above `<v-main>`).
- `MenuBar` is visible on `login`, `register`, and `home`.
- No session: `MenuBar` shows with no catalog items and no **Sign out**.
- Session exists on `home`: `MenuBar` shows the signed-in user's name, **Sign out**, and only nav items allowed for `user.role`.
- Feature 1 catalog items: none. Later features add one item each: **Semester** (Feature 2, `student`), **Course** (Feature 3, `student`), **Faculty** (Feature 4, `faculty`), **Section** (Feature 5, `faculty`), **Enrollment** (Feature 6, `faculty`), **Student Course Listing** (Feature 7, `faculty`), **Section Student Listing** (Feature 8, `faculty`).

---

## Key Entities

- **User**: registered account (name, email, universityId, role).
- **Session**: server-side record tying a JWT token to a user; expires after 24 hours.

---

## Data Model Requirements

### `users` table

| Field         | Type        | Rules                              |
| ------------- | ----------- | ---------------------------------- |
| `id`          | INTEGER PK  | Auto-increment                     |
| `fName`       | STRING      | Required                           |
| `lName`       | STRING      | Required                           |
| `email`       | STRING      | Required, unique                   |
| `universityId` | STRING(6)   | Required, unique; trim and store lowercase |
| `password`    | STRING(255) | Required; bcrypt hash only         |
| `role`        | STRING(20)  | `student` or `faculty`; default `student`; registration ignores a client-supplied role |

### `sessions` table

| Field            | Type       | Rules                           |
| ---------------- | ---------- | ------------------------------- |
| `id`             | INTEGER PK | Auto-increment                  |
| `token`          | STRING     | Required                        |
| `email`          | STRING     | Required; copy of the user's email. Reuse looks up `userId`, not email |
| `expirationDate` | DATE       | Required                        |
| `userId`         | INTEGER FK | Required, references `users.id` |

---

## Acceptance Criteria (Gherkin)

### US-1.1 — Registration

#### Scenario: User registers with valid information

- **Given** I am on the registration page
- **When** I enter valid first name, last name, email, universityId, password, and matching confirm password
- **And** I submit the form
- **Then** the API returns `201` with a user payload including `userId`, `universityId`, `email`, `token`, and `role`
- **And** `role` is `student`
- **And** my user record is stored in the database with a bcrypt password hash
- **And** I am redirected to the home page
- **And** my session is stored in `localStorage` under the key `user`

#### Scenario: User submits registration with missing email

- **Given** I am on the registration page
- **When** I leave the email field empty
- **And** I submit the form
- **Then** inline validation blocks the request
- **And** I see the message **"Email is required."**
- **And** no API request is sent

#### Scenario: User submits registration with invalid email format

- **Given** I am on the registration page
- **When** I enter a value that is not a valid email address (e.g. `notanemail`)
- **And** I submit the form
- **Then** inline validation blocks the request
- **And** I see the message **"Enter a valid email address."**
- **And** no API request is sent

#### Scenario: User submits registration with missing universityId

- **Given** I am on the registration page
- **When** I leave the universityId field empty
- **And** I submit the form
- **Then** inline validation blocks the request
- **And** I see the message **"University ID is required."**
- **And** no API request is sent

#### Scenario: User submits registration with password too short

- **Given** I am on the registration page
- **When** I enter a password with fewer than 8 characters
- **And** I submit the form
- **Then** inline validation blocks the request
- **And** I see the message **"Password must be at least 8 characters."**
- **And** no API request is sent

#### Scenario: User submits registration with mismatched passwords

- **Given** I am on the registration page
- **When** password and confirm password do not match
- **And** I submit the form
- **Then** inline validation blocks the request
- **And** I see the message **"Passwords do not match."**
- **And** no API request is sent

#### Scenario: User registers with a duplicate universityId

- **Given** a user with universityId `ST1111` already exists
- **When** I submit registration with universityId `ST1111`
- **Then** the API returns `400` with `{ "message": "University ID is already in use." }`
- **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User registers with a duplicate email

- **Given** a user with email `jane@example.com` already exists
- **When** I submit registration with email `jane@example.com`
- **Then** the API returns `400` with `{ "message": "Email is already registered." }`
- **And** the error is displayed in a `<v-alert type="error">`

---

### US-1.2 — Sign in

#### Scenario: User signs in with valid credentials

- **Given** I am on the login page
- **And** a registered user exists with universityId `ST2222` and a known password
- **When** I enter universityId `ST2222` and the correct password
- **And** I click **Sign in**
- **Then** the API returns `200` with a payload containing `userId`, `universityId`, `token`, and `role`
- **And** a session row is created or reused in the database
- **And** I am redirected to the home page
- **And** my session is stored in `localStorage` under the key `user`

#### Scenario: User signs in with invalid password

- **Given** I am on the login page
- **And** a registered user exists with universityId `ST2222`
- **When** I enter universityId `ST2222` and an incorrect password
- **And** I click **Sign in**
- **Then** the API returns `401` with `{ "message": "Invalid University ID or password." }`
- **And** I remain on the login page
- **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User signs in with missing universityId

- **Given** I am on the login page
- **When** I leave the universityId field empty
- **And** I click **Sign in**
- **Then** inline validation blocks the request
- **And** I see the message **"University ID is required."**
- **And** no API request is sent

#### Scenario: User signs in with missing password

- **Given** I am on the login page
- **When** I leave the password field empty
- **And** I click **Sign in**
- **Then** inline validation blocks the request
- **And** I see the message **"Password is required."**
- **And** no API request is sent

---

### US-1.3 — Stay signed in across page loads

#### Scenario: Signed-in user visits login page

- **Given** I have a valid session in `localStorage`
- **When** I navigate to the login page
- **Then** I am redirected to the home page

#### Scenario: API request includes session token

- **Given** I am signed in as a user with role `student`
- **When** the frontend makes an authenticated API request
- **Then** the request includes header `Authorization: Bearer <token>`

#### Scenario: Expired or invalid session token

- **Given** I am signed in as a user with role `student`
- **And** my session token is expired or revoked
- **When** the frontend makes an authenticated API request
- **Then** the API returns `401` with `{ "message": "Unauthorized! Invalid or expired token." }`
- **And** `localStorage` key `user` is cleared
- **And** I am redirected to the login page

---

### US-1.4 — Sign out

#### Scenario: User signs out

- **Given** I am signed in as a user with role `student`
- **And** I am on the home page
- **When** I click **Sign out** in the `MenuBar`
- **Then** the API invalidates my session token on the server
- **And** `localStorage` key `user` is removed
- **And** I am redirected to the login page
- **And** `MenuBar` is still visible
- **And** **Sign out** is not shown

---

### US-1.5 — Block unauthenticated access

#### Scenario: Unauthenticated user accesses a protected route

- **Given** I have no session in `localStorage`
- **When** I navigate directly to the home page
- **Then** I am redirected to the login page
- **And** a protected API request with no token returns `401` with `{ "message": "Unauthorized! No token provided." }`

---

### US-1.6 — Role-based MenuBar

#### Scenario: MenuBar is visible on the login page

- **Given** I have no session in `localStorage`
- **When** I am on the login page
- **Then** the `MenuBar` is displayed
- **And** **Sign out** is not shown
- **And** **Semester** and **Course** are not shown

#### Scenario: Signed-in user sees Sign out in MenuBar

- **Given** I am signed in as a user with role `student`
- **When** I view the home page
- **Then** the `MenuBar` is displayed
- **And** **Sign out** is shown
- **And** the signed-in user's name is shown

#### Scenario: Student does not see faculty-only menu items

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Faculty** is not shown
- **And** **Section** is not shown
- **And** **Enrollment** is not shown
- **And** **Student Course Listing** is not shown
- **And** **Section Student Listing** is not shown

#### Scenario: Faculty MenuBar in Feature 1 has Sign out but no catalog links yet

- **Given** I am signed in as a user with role `faculty`
- **When** I view the `MenuBar`
- **Then** **Sign out** is shown
- **And** **Semester** is not shown
- **And** **Course** is not shown
- **And** **Faculty** is not shown
- **And** **Section** is not shown
- **And** **Enrollment** is not shown
- **And** **Student Course Listing** is not shown
- **And** **Section Student Listing** is not shown

#### Scenario: Signed-in student MenuBar has Sign out but no catalog links yet

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Sign out** is shown
- **And** **Semester** is not shown (added in Feature 2)
- **And** **Course** is not shown (added in Feature 3)

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story  | Scenario                                                         | Test file                                                             | Test name                                                          |
| ------ | ---------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| US-1.1 | User registers with valid information                            | `backend/tests/auth.test.js`                                          | `User registers with valid information`                            |
| US-1.1 | User submits registration with missing email                     | `backend/tests/auth.test.js`                                          | `User submits registration with missing email`                     |
| US-1.1 | User submits registration with invalid email format              | `frontend/tests/Register.test.js`                                     | `User submits registration with invalid email format`              |
| US-1.1 | User submits registration with missing universityId              | `frontend/tests/Register.test.js`                                     | `User submits registration with missing universityId`                  |
| US-1.1 | User submits registration with password too short                | `backend/tests/auth.test.js`, `frontend/tests/Register.test.js`       | `User submits registration with password too short`                |
| US-1.1 | User submits registration with mismatched passwords              | `frontend/tests/Register.test.js`                                     | `User submits registration with mismatched passwords`              |
| US-1.1 | User registers with a duplicate universityId                         | `backend/tests/auth.test.js`                                          | `User registers with a duplicate universityId`                         |
| US-1.1 | User registers with a duplicate email                            | `backend/tests/auth.test.js`                                          | `User registers with a duplicate email`                            |
| US-1.2 | User signs in with valid credentials                             | `backend/tests/auth.test.js`                                          | `User signs in with valid credentials`                             |
| US-1.2 | User signs in with invalid password                              | `backend/tests/auth.test.js`, `frontend/tests/Login.test.js`          | `User signs in with invalid password`                              |
| US-1.2 | User signs in with missing universityId                              | `backend/tests/auth.test.js`, `frontend/tests/Login.test.js`          | `User signs in with missing universityId`                              |
| US-1.2 | User signs in with missing password                              | `backend/tests/auth.test.js`, `frontend/tests/Login.test.js`          | `User signs in with missing password`                              |
| US-1.3 | Signed-in user visits login page                                 | `frontend/tests/router.test.js`                                       | `Signed-in user visits login page`                                 |
| US-1.3 | API request includes session token                               | `backend/tests/authenticate.test.js`                                  | `API request includes session token`                               |
| US-1.3 | Expired or invalid session token                                 | `backend/tests/authenticate.test.js`                                  | `Expired or invalid session token`                                 |
| US-1.4 | User signs out                                                   | `backend/tests/auth.test.js`, `frontend/tests/MenuBar.test.js`        | `User signs out`                                                   |
| US-1.5 | Unauthenticated user accesses a protected route                  | `backend/tests/authenticate.test.js`, `frontend/tests/router.test.js` | `Unauthenticated user accesses a protected route`                  |
| US-1.6 | MenuBar is visible on the login page                             | `frontend/tests/MenuBar.test.js`                                      | `MenuBar is visible on the login page`                             |
| US-1.6 | Signed-in user sees Sign out in MenuBar                          | `frontend/tests/MenuBar.test.js`                                      | `Signed-in user sees Sign out in MenuBar`                          |
| US-1.6 | Student does not see faculty-only menu items                     | `frontend/tests/MenuBar.test.js`                                      | `Student does not see faculty-only menu items`                     |
| US-1.6 | Faculty MenuBar in Feature 1 has Sign out but no catalog links yet | `frontend/tests/MenuBar.test.js`                                      | `Faculty MenuBar in Feature 1 has Sign out but no catalog links yet` |
| US-1.6 | Signed-in student MenuBar has Sign out but no catalog links yet | `frontend/tests/MenuBar.test.js`                                      | `Signed-in student MenuBar has Sign out but no catalog links yet` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 1 from @features/feature-1-user-auth.md on branch `feature/1-user-auth`.

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

- Password reset
- Email verification
- OAuth / social login
- Admin user management
- Semester CRUD / **Semester** nav item ([Feature 2](feature-2-semester-management.md))
- Course CRUD / **Course** nav item ([Feature 3](feature-3-course-management.md))
- Faculty CRUD / **Faculty** nav item ([Feature 4](feature-4-faculty-management.md))
- Section CRUD / **Section** nav item ([Feature 5](feature-5-section-management.md))
- Enrollment CRUD / **Enrollment** nav item ([Feature 6](feature-6-enrollment-management.md))
- Student course listing / **Student Course Listing** nav item ([Feature 7](feature-7-student-course-listing.md))
- Section student listing / **Section Student Listing** nav item ([Feature 8](feature-8-section-student-listing.md))

---

## Delivered to Feature 2

- `MenuBar` exists in `App.vue`, visible on `login` / `register` / `home`, with **Sign out** when a session exists and items filtered by `user.role`.
- Feature 2 adds **Semester** (allowed role `student`) to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- Feature 3 adds **Course** (allowed role `student`) to this `MenuBar`.
- Feature 4 adds **Faculty** (allowed role `faculty`) to this `MenuBar`.
- Feature 5 adds **Section** (allowed role `faculty`) to this `MenuBar`.
- Feature 6 adds **Enrollment** (allowed role `faculty`) to this `MenuBar`.
- Feature 7 adds **Student Course Listing** (allowed role `faculty`) to this `MenuBar`.
- Feature 8 adds **Section Student Listing** (allowed role `faculty`) to this `MenuBar`.