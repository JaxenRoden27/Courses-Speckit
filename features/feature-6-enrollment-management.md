# Feature: Game Management

**Feature ID:** 6
**Branch pattern:** `feature/6-enrollment-management`
**Status:** Ready
**Created:** 2026-09-24
**Input:** Signed-in student user .
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Semester Management](feature-2-semester-management.md), [Feature 3 — Course Management](feature-3-course-management.md), [Feature 4 — faculty Management](feature-4-faculty-management.md), [Feature 5 — Section Management](feature-5-section-management.md)

---

## User Stories

### US-6.1: Select to work with Games

**As a** signed-in admin user  
**I want to** open the games view from the menu  
**So that** I can maintain games

**Priority:** P1  
**Independent test:** login, view Games on menubar; games view appears  
**Acceptance scenarios:** see ### US-6.1 under Acceptance Criteria

### US-6.2: Create game

**As a** signed-in admin user  
**I want to** create a game with a season, date, start time, location, home team, and visiting team  
**So that** teams have games

**Priority:** P1  
**Independent test:** Open add-game dialog, create a game for an existing season and two teams; it appears in the games view  
**Acceptance scenarios:** see ### US-6.2 under Acceptance Criteria

### US-6.3: View games

**As a** signed-in admin user  
**I want to** see all games on one screen  
**So that** I can see the game catalog

**Priority:** P1  
**Independent test:** Selecting Games loads a screen that displays all games  
**Acceptance scenarios:** see ### US-6.3 under Acceptance Criteria

### US-6.4: Manage game rows

**As a** signed-in admin user  
**I want** each game row to show **edit** and **delete** actions  
**So that** I can manage games without leaving the games view

**Priority:** P1  
**Independent test:** Each game row exposes edit and delete icon actions  
**Acceptance scenarios:** see ### US-6.4 under Acceptance Criteria

### US-6.5: Edit a game

**As a** signed-in admin user  
**I want to** edit game data including scores  
**So that** I can keep game data accurate

**Priority:** P2  
**Independent test:** Edit a game from row actions; games view updates  
**Acceptance scenarios:** see ### US-6.5 under Acceptance Criteria

### US-6.6: Delete a game

**As a** signed-in admin user  
**I want to** delete a game  
**So that** I can remove games that should not stay on the schedule

**Priority:** P2  
**Independent test:** Delete a game from row actions; games view updates  
**Acceptance scenarios:** see ### US-6.6 under Acceptance Criteria

### US-6.7: Restrict game management to admins

**As the** application  
**I want to** allow only users with role `admin` to manage the game catalog  
**So that** students cannot create, edit, or delete games

**Priority:** P1  
**Independent test:** Sign in as a student — **Games** is hidden; `POST /league/games` returns `403`  
**Acceptance scenarios:** see ### US-6.7 under Acceptance Criteria

### US-6.8: Block delete of a season or team that has a game

**As the** application  
**I want to** refuse delete of a season or team that still has games  
**So that** games are not left pointing at missing rows

**Priority:** P1  
**Independent test:** Create a game; `DELETE` of that season or either team returns `400` and the parent row remains  
**Acceptance scenarios:** see ### US-6.8 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: All game endpoints MUST require a valid session (`authenticate`). `GET` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` MUST require `req.user.role` equal to `admin`.
- **FR-002**: Games MUST be a **shared catalog**. The `games` table MUST NOT include `userId`. The API MUST ignore any client-supplied ownership `userId`.
- **FR-003**: Authenticated non-admin users (including `student`) MUST receive `403` with `{ "message": "Admin role required." }` on `POST`, `PUT`, and `DELETE`. `GET` MUST return `200` for any authenticated user. They MUST NOT see **Games** in `MenuBar`.
- **FR-004**: Required game fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`). Required fields are `seasonId`, `gameDate`, `startTime`, `homeTeamId`, and `visitingTeamId`. `location` is not required on create.
- **FR-005**: Unauthenticated game API requests MUST return `401`. Unauthenticated navigation to `/games` MUST redirect to `login`.
- **FR-006**: Games MUST be ordered by `gameDate`, then `startTime`, in API responses.
- **FR-007**: This feature MUST deliver admin game CRUD and a **single-view** game UI in `Games.vue` (dialog-based add/edit/delete). No sidebar/main split.
- **FR-008**: `seasonId` MUST be a required integer that exists in `seasons`. Missing season message: **"Season not found."** (HTTP `400`). A season MAY have many games.
- **FR-009**: `homeTeamId` and `visitingTeamId` MUST be required integers that exist in `teams`. Missing team messages: **"Home team not found."**, **"Visiting team not found."** (HTTP `400`). They MUST be different. Same-team message: **"Home team and visiting team must be different."** Both teams MUST belong to the same league as the selected season. League-mismatch message: **"Home team and visiting team must be in the season's league."** A team MAY have many games (as home or visiting).
- **FR-010**: `gameDate` MUST be a required date. `startTime` MUST be a required time.
- **FR-011**: On create, `location` MUST be set from the home team's `homeField` (Feature 5). The client MUST NOT be required to send `location` on create. The **Edit Game** dialog MUST show **Location** so an admin can set or clear it. When present on edit, `location` MUST be trimmed and at most 50 characters. Too-long message: **"Location must be 50 characters or fewer."** Empty or whitespace-only on edit MUST store `null`.
- **FR-012**: `homeTeamScore` and `visitingTeamScore` MAY be omitted or `null` (a scheduled game with no score yet). When present, each MUST be an integer from `0` through `999`. Invalid message: **"Score must be between 0 and 999."**
- **FR-013**: `DELETE` of a season MUST fail with `400` when any game references that season. `DELETE` of a team MUST fail with `400` when any game uses that team as home or visiting. Do **not** cascade-delete games when a season or team is deleted. Messages: **"Cannot delete season: games still exist."**, **"Cannot delete team: games still exist."** The parent row and its games MUST remain stored.

---

## Assumptions

- Features 1–5 (auth/`MenuBar`, seasons, leagues, people, teams) MUST be merged to `dev` before implementing this feature.
- A user with role `admin` exists (Feature 1 `role`; tests may seed an admin).
- Tests MAY seed at least one league, one season, and two teams in that season's league before creating a game.
- A game belongs to one **Season**. Home and visiting teams belong to one **League** each. The season's `leagueId` is the league both teams MUST use.
- A team MAY appear in many games (home or visiting). A team MAY be home in one game and visiting in another.
- Scores are optional so a game can be scheduled before it is played.
- Add/Edit dialogs load seasons from `GET /league/seasons` and teams from `GET /league/teams`.
- Foreign keys from `games.seasonId`, `games.homeTeamId`, and `games.visitingTeamId` MUST use **RESTRICT**.
- This feature updates Feature 2 and Feature 5 `DELETE` handlers for `/league/seasons/:seasonId` and `/league/teams/:teamId` to enforce FR-013.
- Games use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/league/…`. Use `/league/games`.

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- `location` longer than 50 characters (edit) → **"Location must be 50 characters or fewer."**
- Unknown `seasonId` → `400` with `{ "message": "Season not found." }`
- Unknown `homeTeamId` → `400` with `{ "message": "Home team not found." }`
- Unknown `visitingTeamId` → `400` with `{ "message": "Visiting team not found." }`
- `homeTeamId` equals `visitingTeamId` → `400` with `{ "message": "Home team and visiting team must be different." }`
- Home or visiting team is not in the season's league → `400` with `{ "message": "Home team and visiting team must be in the season's league." }`
- Score present but not an integer 0–999 → **"Score must be between 0 and 999."**
- Scores omitted or `null` → allowed.
- Unknown `gameId` on PUT/DELETE → `404` with `{ "message": "Game with id=<id> not found." }`
- `DELETE` season while games still reference it → `400`; season and games remain.
- `DELETE` team while games still reference it as home or visiting → `400`; team and games remain.
- Authenticated `student` (or any non-admin) on `POST` / `PUT` / `DELETE` → `403`.
- Authenticated `student` on `GET` → `200` with the shared catalog.
- Unauthenticated user on `/games` or `GET /league/games` → redirect or `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can create, view, edit, and delete the shared game catalog on one screen.
- **SC-003**: A signed-in student MAY `GET` the game catalog; they cannot open the games manager and cannot mutate games via the API.
- **SC-004**: An admin cannot delete a season or team that still has games.
- **SC-005**: `npm test` passes for game API and games view behavior.

---

## Data Ownership & Isolation

Games are a **shared catalog**. They are not owned by the signed-in admin. Only role `admin` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI.

| Rule               | Requirement                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Read scope**     | `GET /league/games` returns **all** games (with season, home team, and visiting team) to any authenticated user.        |
| **Write scope**    | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `admin`.                                            |
| **Create scope**   | New games have no owner. Ignore ownership `userId` if sent in the body.                                                  |
| **Missing game**   | Unknown `gameId` → `404` with `{ "message": "Game with id=<id> not found." }`. Never use ownership `404` to hide rows.   |
| **Non-admin**      | Authenticated non-admin `GET` → `200`. `POST` / `PUT` / `DELETE` → `403` with `{ "message": "Admin role required." }`.   |
| **UI scope**       | **Games** menu and `/games` are admin-only. Students do not see this manager.                                            |
| **Implementation** | Use `authenticate` on all endpoints. Use `requireAdmin` after `authenticate` on `POST`, `PUT`, and `DELETE` only.        |

---

## API Requirements

| Method   | Endpoint                   | Auth       | Purpose                                |
| -------- | -------------------------- | ---------- | -------------------------------------- |
| `GET`    | `/league/games`            | Yes        | Fetch all games with season and teams  |
| `POST`   | `/league/games`            | Yes, admin | Create a game                          |
| `PUT`    | `/league/games/:gameId`    | Yes, admin | Update a game                          |
| `DELETE` | `/league/games/:gameId`    | Yes, admin | Delete a game                          |

**Create game request body:**

```json
{
  "seasonId": 1,
  "gameDate": "2026-09-12",
  "startTime": "18:00",
  "location": "Memorial Field",
  "homeTeamId": 1,
  "visitingTeamId": 2,
  "homeTeamScore": null,
  "visitingTeamScore": null
}
```

Do not send `id` on create. Scores MAY be omitted.

**Update game request body:** same fields as create (no `id`).

**Game success response** (`200` / `201`):

```json
{
  "id": 1,
  "seasonId": 1,
  "gameDate": "2026-09-12",
  "startTime": "18:00:00",
  "location": "Memorial Field",
  "homeTeamId": 1,
  "visitingTeamId": 2,
  "homeTeamScore": null,
  "visitingTeamScore": null,
  "season": {
    "id": 1,
    "name": "2026 Fall",
    "leagueId": 1
  },
  "homeTeam": {
    "id": 1,
    "name": "OKC Strikers",
    "leagueId": 1
  },
  "visitingTeam": {
    "id": 2,
    "name": "Tulsa FC",
    "leagueId": 1
  },
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /league/games` returns an **array** of game objects in this shape.

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found:** `404` for unknown `gameId`.  
**Missing parent / validation:** `400` (FR-008 / FR-009 / FR-011 / FR-012).

This feature also changes Feature 2 and Feature 5 delete APIs (FR-013): `DELETE /league/seasons/:seasonId` and `DELETE /league/teams/:teamId` MUST return `400` with the quoted FR-013 message when games still reference that row.

---

## Screen Requirements

### [View: Games] — route name `games` — path `/games` — `Games.vue`

- Heading: **Games**
- Primary action: **+ New game** (`oc-cta`) opens the **Add Game** `<v-dialog>`.
- **Add Game** fields:
  - **Season** (`v-select` of existing seasons from `GET /league/seasons`, display season `name`)
  - **Date** (`v-text-field` type date)
  - **Start Time** (`v-text-field` type time)
  - **Home Team** (`v-select` of existing teams from `GET /league/teams`, display team `name`)
  - **Visiting Team** (`v-select` of existing teams, display team `name`)
  - **Home Team Score** (`v-text-field` type number; optional)
  - **Visiting Team Score** (`v-text-field` type number; optional)
- **Edit Game** uses the same fields plus **Location** (`v-text-field`, optional, max 50), pre-filled.
- **Add Game** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **date**, **start time**, **location**, **home team**, **visiting team**, **home score**, **visiting score**, and **season**; rows ordered by date then start time (FR-006).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Edit game** — opens **Edit Game** `<v-dialog>` pre-filled with current data; **Save Game** (`oc-cta`) / **Cancel** (secondary)
  - **Delete game** — opens **Delete Game** confirmation `<v-dialog>` with copy **"Delete this game?"**; **Delete Game** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state:** **"No games yet. Create your first game."** when the catalog has zero games.
- **Loading state:** skeleton or progress indicator while games are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Admin-only: **Games** menu item and `/games` are for signed-in admin users. Other roles do not see the **Games** item. Unauthenticated navigation to `/games` redirects to `login`.
- Game CRUD dialogs live in `Games.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Games** (allowed role `admin`; navigates to `/games`) to `MenuBar` after **Teams**. Menu order: **Leagues**, **Teams**, **Games**, **People**, **Seasons**.
- Students MUST NOT see **Games**.
- After login, the user remains on Feature 1 `home`. Selecting **Games** in the menu opens this feature's view.

---

## Key Entities

- **Game**: scheduled (and optionally scored) contest in one **Season** between a **home team** and a **visiting team**. Shared catalog row. Not owned by a user. A team may have many games.

---

## Data Model Requirements

### `games` table

| Field                | Type       | Rules                                                       |
| -------------------- | ---------- | ----------------------------------------------------------- |
| `id`                 | INTEGER PK | Auto-increment                                              |
| `seasonId`           | INTEGER FK | Required; references `seasons.id`                           |
| `gameDate`           | DATE       | Required                                                    |
| `startTime`          | TIME       | Required                                                    |
| `location`           | STRING(50) | Optional; trimmed; at most 50 characters; `null` when empty |
| `homeTeamId`         | INTEGER FK | Required; references `teams.id`                             |
| `visitingTeamId`     | INTEGER FK | Required; references `teams.id`                             |
| `homeTeamScore`      | INTEGER    | Optional; when present, integer 0–999                       |
| `visitingTeamScore`  | INTEGER    | Optional; when present, integer 0–999                       |
| `createdAt`          | DATE       | Sequelize timestamps                                        |
| `updatedAt`          | DATE       | Sequelize timestamps                                        |

`seasonId`, `homeTeamId`, and `visitingTeamId` use `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Game belongsTo Season` (`seasonId`, `onDelete: 'RESTRICT'`)
- `Season hasMany Game`
- `Game belongsTo Team` as `homeTeam` (`homeTeamId`, `onDelete: 'RESTRICT'`)
- `Game belongsTo Team` as `visitingTeam` (`visitingTeamId`, `onDelete: 'RESTRICT'`)
- `Team hasMany Game` as `homeGames` (`homeTeamId`)
- `Team hasMany Game` as `visitingGames` (`visitingTeamId`)

---

## Acceptance Criteria (Gherkin)

### US-6.1 — Select to work with Games

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `admin`
- **When** I click **Games** in the `MenuBar`
- **Then** the games view is displayed

### US-6.2 — Create game

#### Scenario: User creates a new game

- **Given** I am signed in as a user with role `admin`
- **And** a season `2026 Fall` exists
- **And** teams `OKC Strikers` and `Tulsa FC` exist in that season's league
- **And** I am viewing the games view
- **When** I click **+ New game**
- **And** I select season `2026 Fall`, date `2026-09-12`, start time `18:00`, home team `OKC Strikers`, and visiting team `Tulsa FC`
- **And** I click **Create**
- **Then** the API returns `201` with a game object containing `id`, nested `season.name` `2026 Fall`, `homeTeam.name` `OKC Strikers`, and `visitingTeam.name` `Tulsa FC`
- **And** `OKC Strikers` appears in the games view list
- **And** the add-game dialog closes

#### Scenario: User creates a game with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **When** I click **+ New game**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates a game with the same home and visiting team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **When** I send `POST /league/games` with the same `homeTeamId` and `visitingTeamId` and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Home team and visiting team must be different." }`
- **And** no game is stored

#### Scenario: User creates a game with an unknown season

- **Given** I am signed in as a user with role `admin`
- **When** I send `POST /league/games` with a `seasonId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Season not found." }`
- **And** no game is stored

#### Scenario: User creates a game with a team that is not in the season's league

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` belongs to league `OKC Youth Soccer`
- **And** team `Metro Sluggers` belongs to a different league
- **When** I send `POST /league/games` with that season and `Metro Sluggers` as a team
- **Then** the API returns `400` with `{ "message": "Home team and visiting team must be in the season's league." }`
- **And** no game is stored

---

### US-6.3 — View games

#### Scenario: Games view loads with existing games

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **And** games exist
- **When** I view the games list
- **Then** all the games are displayed in the list

#### Scenario: User has no games

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **And** there are no games
- **When** I view the games list
- **Then** I see **"No games yet. Create your first game."**

---

### US-6.4 — Manage game rows

#### Scenario: game rows show edit and delete actions

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **When** I view a game row
- **Then** the game row shows an **Edit game** icon action
- **And** the game row shows a **Delete game** icon action

---

### US-6.5 — Edit a game

#### Scenario: User selects to edit a game

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **When** I click the edit icon on a game row
- **Then** the game edit dialog is displayed

#### Scenario: User edits a game with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **And** the game edit dialog is displayed
- **When** I update values in the fields with valid values including location `North Field` and scores `2` and `1`
- **And** I click **Save Game**
- **Then** the game data is updated
- **And** the dialog is closed

#### Scenario: User edits a game with invalid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **And** the game edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Game**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed

#### Scenario: User edits a game and cancels

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **And** the game edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the game data is not updated
- **And** the dialog is closed

---

### US-6.6 — Delete a game

#### Scenario: User selects to delete a game

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **When** I click the delete icon on a game row
- **Then** the game delete dialog is displayed

#### Scenario: User deletes a game

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **And** the game delete dialog is displayed
- **When** I click **Delete Game**
- **Then** the game is deleted
- **And** the dialog is closed
- **And** the game is not in the games list

#### Scenario: User cancels deleting a game

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the games view
- **And** the game delete dialog is displayed
- **When** I click **Cancel**
- **Then** the game is not deleted
- **And** the dialog is closed
- **And** the game is still in the games list

---

### US-6.7 — Restrict game management to admins

#### Scenario: Student does not see Games in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Games** is not shown

#### Scenario: Student can list games via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /league/games`
- **Then** the API returns `200` with an array of game objects

#### Scenario: Student cannot create a game via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /league/games` with a valid game body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new game is stored

#### Scenario: Unauthenticated API request to games

- **Given** I have no valid session token
- **When** I request `GET /league/games`
- **Then** the API returns `401` with an unauthorized message

#### Scenario: Unauthenticated user navigates to games

- **Given** I have no session in `localStorage`
- **When** I navigate to `/games`
- **Then** I am redirected to the login page

---

### US-6.8 — Block delete of a season or team that has a game

#### Scenario: User cannot delete a season that has a game

- **Given** I am signed in as a user with role `admin`
- **And** a game exists in season `2026 Fall`
- **When** I send `DELETE /league/seasons/:seasonId` for that season
- **Then** the API returns `400` with `{ "message": "Cannot delete season: games still exist." }`
- **And** the season is still stored
- **And** the game is still stored

#### Scenario: User cannot delete a team that has a game

- **Given** I am signed in as a user with role `admin`
- **And** a game exists with home team `OKC Strikers`
- **When** I send `DELETE /league/teams/:teamId` for that team
- **Then** the API returns `400` with `{ "message": "Cannot delete team: games still exist." }`
- **And** the team is still stored
- **And** the game is still stored

---

## Test Coverage Map

| Story  | Scenario                                                      | Test file                                                          | Test name                                                       |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| US-6.1 | Menu Selection                                                | `frontend/tests/MenuBar.test.js`, `frontend/tests/Games.test.js`   | `Menu Selection`                                                |
| US-6.2 | User creates a new game                                       | `backend/tests/games.test.js`, `frontend/tests/Games.test.js`      | `User creates a new game`                                       |
| US-6.2 | User creates a game with a missing required field             | `frontend/tests/Games.test.js`                                     | `User creates a game with a missing required field`             |
| US-6.2 | User creates a game with the same home and visiting team      | `backend/tests/games.test.js`                                      | `User creates a game with the same home and visiting team`      |
| US-6.2 | User creates a game with an unknown season                    | `backend/tests/games.test.js`                                      | `User creates a game with an unknown season`                    |
| US-6.2 | User creates a game with a team that is not in the season's league | `backend/tests/games.test.js`                                 | `User creates a game with a team that is not in the season's league` |
| US-6.3 | Games view loads with existing games                          | `backend/tests/games.test.js`, `frontend/tests/Games.test.js`      | `Games view loads with existing games`                          |
| US-6.3 | User has no games                                             | `frontend/tests/Games.test.js`                                     | `User has no games`                                             |
| US-6.4 | game rows show edit and delete actions                        | `frontend/tests/Games.test.js`                                     | `game rows show edit and delete actions`                        |
| US-6.5 | User selects to edit a game                                   | `frontend/tests/Games.test.js`                                     | `User selects to edit a game`                                   |
| US-6.5 | User edits a game with valid values and saves                 | `backend/tests/games.test.js`, `frontend/tests/Games.test.js`      | `User edits a game with valid values and saves`                 |
| US-6.5 | User edits a game with invalid values and saves               | `frontend/tests/Games.test.js`                                     | `User edits a game with invalid values and saves`               |
| US-6.5 | User edits a game and cancels                                 | `frontend/tests/Games.test.js`                                     | `User edits a game and cancels`                                 |
| US-6.6 | User selects to delete a game                                 | `frontend/tests/Games.test.js`                                     | `User selects to delete a game`                                 |
| US-6.6 | User deletes a game                                           | `backend/tests/games.test.js`, `frontend/tests/Games.test.js`      | `User deletes a game`                                           |
| US-6.6 | User cancels deleting a game                                  | `frontend/tests/Games.test.js`                                     | `User cancels deleting a game`                                  |
| US-6.7 | Student does not see Games in the menu                        | `frontend/tests/MenuBar.test.js`                                   | `Student does not see Games in the menu`                        |
| US-6.7 | Student can list games via the API                            | `backend/tests/games.test.js`                                      | `Student can list games via the API`                            |
| US-6.7 | Student cannot create a game via the API                      | `backend/tests/games.test.js`                                      | `Student cannot create a game via the API`                      |
| US-6.7 | Unauthenticated API request to games                          | `backend/tests/games.test.js`                                      | `Unauthenticated API request to games`                          |
| US-6.7 | Unauthenticated user navigates to games                       | `frontend/tests/router.test.js`                                    | `Unauthenticated user navigates to games`                       |
| US-6.8 | User cannot delete a season that has a game                   | `backend/tests/seasons.test.js`, `backend/tests/games.test.js`     | `User cannot delete a season that has a game`                   |
| US-6.8 | User cannot delete a team that has a game                     | `backend/tests/teams.test.js`, `backend/tests/games.test.js`       | `User cannot delete a team that has a game`                     |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 6 from @features/feature-6-game-management.md on branch `feature/6-game-management`.

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

- Student-facing game or scoreboard UI (API `GET` is in this feature)
- Standings, playoffs, or automatic ranking
- Officials, weather, or recap notes
- Creating seasons or teams from the add-game dialog
- Non-admin game management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Games** for role `admin`)

---

## Delivered to later features

- `MenuBar` is Feature 1 chrome; Features 2–5 added **Seasons**, **Leagues**, **People**, and **Teams**; this feature added **Games** for `admin`.
- A later feature MUST add its nav item to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- The `games` table belongs to one season and two teams. A team has many games.
- [Feature 7](feature-7-season-view.md) lists a season's games on the season view and adds a game with that season already selected.